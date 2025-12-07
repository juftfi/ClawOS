const { Web3 } = require('web3');
const { createWalletClient, createPublicClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const logger = require('../../utils/logger');

// Define chain configurations manually
const baseSepolia = {
    id: 84532,
    name: 'Base Sepolia',
    network: 'base-sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://sepolia.base.org'] },
        public: { http: ['https://sepolia.base.org'] }
    }
};

const bscTestnet = {
    id: 97,
    name: 'BNB Smart Chain Testnet',
    network: 'bnb-testnet',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: {
        default: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] },
        public: { http: ['https://data-seed-prebsc-1-s1.binance.org:8545'] }
    }
};

class MultiNetworkBlockchainService {
    constructor() {
        this.networks = {
            'base-sepolia': {
                name: 'Base Sepolia Testnet',
                chainId: 84532,
                rpc: process.env.BASE_TESTNET_RPC || 'https://sepolia.base.org',
                chain: baseSepolia,
                privateKey: process.env.BASE_PRIVATE_KEY,
                walletAddress: process.env.BASE_WALLET_ADDRESS
            },
            'bnb-testnet': {
                name: 'BNB Smart Chain Testnet',
                chainId: 97,
                rpc: process.env.BNB_TESTNET_RPC || 'https://data-seed-prebsc-1-s1.binance.org:8545',
                chain: bscTestnet,
                privateKey: process.env.BNB_PRIVATE_KEY,
                walletAddress: process.env.BNB_WALLET_ADDRESS
            }
        };

        this.defaultNetwork = process.env.DEFAULT_NETWORK || 'bnb-testnet';
        this.activeNetwork = this.defaultNetwork;

        // Initialize Web3 instances for each network
        this.web3Instances = {};
        this.viemClients = {};

        this.initializeNetworks();
    }

    /**
     * Initialize Web3 and Viem clients for all networks
     */
    initializeNetworks() {
        for (const [networkKey, config] of Object.entries(this.networks)) {
            try {
                // Web3 instance
                this.web3Instances[networkKey] = new Web3(config.rpc);

                if (config.privateKey) {
                    const account = this.web3Instances[networkKey].eth.accounts.privateKeyToAccount(config.privateKey);
                    this.web3Instances[networkKey].eth.accounts.wallet.add(account);
                }

                // Viem clients
                const account = privateKeyToAccount(config.privateKey);

                this.viemClients[networkKey] = {
                    wallet: createWalletClient({
                        account,
                        chain: config.chain,
                        transport: http(config.rpc)
                    }),
                    public: createPublicClient({
                        chain: config.chain,
                        transport: http(config.rpc)
                    })
                };

                logger.info(`Initialized ${config.name}`, {
                    network: networkKey,
                    wallet: config.walletAddress
                });
            } catch (error) {
                logger.error(`Failed to initialize ${networkKey}:`, error.message);
            }
        }
    }

    /**
     * Switch active network
     * @param {string} networkKey - Network identifier
     */
    switchNetwork(networkKey) {
        if (!this.networks[networkKey]) {
            throw new Error(`Unsupported network: ${networkKey}`);
        }
        this.activeNetwork = networkKey;
        logger.info(`Switched to network: ${this.networks[networkKey].name}`);
    }

    /**
     * Get Web3 instance for network
     * @param {string} networkKey - Network identifier (optional, uses active if not provided)
     * @returns {Web3} Web3 instance
     */
    getWeb3(networkKey = null) {
        const network = networkKey || this.activeNetwork;
        if (!this.web3Instances[network]) {
            throw new Error(`Web3 instance not found for network: ${network}`);
        }
        return this.web3Instances[network];
    }

    /**
     * Get Viem clients for network
     * @param {string} networkKey - Network identifier (optional, uses active if not provided)
     * @returns {Object} Viem wallet and public clients
     */
    getViemClients(networkKey = null) {
        const network = networkKey || this.activeNetwork;
        if (!this.viemClients[network]) {
            throw new Error(`Viem clients not found for network: ${network}`);
        }
        return this.viemClients[network];
    }

    /**
     * Get network configuration
     * @param {string} networkKey - Network identifier (optional, uses active if not provided)
     * @returns {Object} Network configuration
     */
    getNetworkConfig(networkKey = null) {
        const network = networkKey || this.activeNetwork;
        if (!this.networks[network]) {
            throw new Error(`Network configuration not found: ${network}`);
        }
        return this.networks[network];
    }

    /**
     * Get active network
     * @returns {string} Active network key
     */
    getActiveNetwork() {
        return this.activeNetwork;
    }

    /**
     * Get all supported networks
     * @returns {Array} List of supported networks
     */
    getSupportedNetworks() {
        return Object.keys(this.networks).map(key => ({
            key,
            name: this.networks[key].name,
            chainId: this.networks[key].chainId,
            isActive: key === this.activeNetwork
        }));
    }

    /**
     * Get balance for address on network
     * @param {string} address - Wallet address
     * @param {string} networkKey - Network identifier (optional)
     * @returns {Promise<Object>} Balance information
     */
    async getBalance(address, networkKey = null) {
        const network = networkKey || this.activeNetwork;
        const web3 = this.getWeb3(network);

        try {
            const balanceWei = await web3.eth.getBalance(address);
            const balanceEth = web3.utils.fromWei(balanceWei, 'ether');

            return {
                network: this.networks[network].name,
                address,
                balance_wei: balanceWei.toString(),
                balance_eth: balanceEth,
                balance_formatted: `${parseFloat(balanceEth).toFixed(6)} ${network === 'base-sepolia' ? 'ETH' : 'BNB'}`
            };
        } catch (error) {
            logger.error(`Get balance error on ${network}:`, error.message);
            throw new Error(`Failed to get balance: ${error.message}`);
        }
    }

    /**
     * Validate address format
     * @param {string} address - Address to validate
     * @returns {boolean} True if valid
     */
    validateAddress(address) {
        const web3 = this.getWeb3();
        return web3.utils.isAddress(address);
    }

    /**
     * Get network information
     * @param {string} networkKey - Network identifier (optional)
     * @returns {Promise<Object>} Network info
     */
    async getNetworkInfo(networkKey = null) {
        const network = networkKey || this.activeNetwork;
        const web3 = this.getWeb3(network);
        const config = this.getNetworkConfig(network);

        try {
            const [chainId, blockNumber, gasPrice] = await Promise.all([
                web3.eth.getChainId(),
                web3.eth.getBlockNumber(),
                web3.eth.getGasPrice()
            ]);

            return {
                network: config.name,
                network_key: network,
                chain_id: Number(chainId),
                block_number: Number(blockNumber),
                gas_price_gwei: web3.utils.fromWei(gasPrice, 'gwei'),
                rpc_url: config.rpc,
                wallet_address: config.walletAddress
            };
        } catch (error) {
            logger.error(`Get network info error on ${network}:`, error.message);
            throw new Error(`Failed to get network info: ${error.message}`);
        }
    }
}

module.exports = new MultiNetworkBlockchainService();
