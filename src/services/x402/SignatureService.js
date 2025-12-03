const blockchainService = require('../blockchain/BlockchainService');
const logger = require('../../utils/logger');

class SignatureService {
    constructor() {
        this.web3 = blockchainService.getWeb3();
    }

    /**
     * Generate payment signature (x402)
     * @param {Object} paymentDetails - Payment details
     * @returns {Promise<Object>} Signature object
     */
    async generatePaymentSignature(paymentDetails) {
        try {
            const account = blockchainService.getAccount();

            // Create payload
            const payload = {
                user: paymentDetails.user,
                agent: paymentDetails.agent || account.address,
                action: paymentDetails.action,
                amount: paymentDetails.amount,
                recipient: paymentDetails.recipient,
                nonce: paymentDetails.nonce,
                timestamp: paymentDetails.timestamp || Math.floor(Date.now() / 1000),
                expires: paymentDetails.expires || Math.floor(Date.now() / 1000) + 3600
            };

            // Create message hash
            const message = this.createPaymentMessage(payload);
            const messageHash = this.web3.utils.keccak256(message);

            // Sign message
            const signature = await this.web3.eth.accounts.sign(
                messageHash,
                account.privateKey
            );

            logger.info('Payment signature generated', {
                user: payload.user,
                action: payload.action
            });

            return {
                signature: signature.signature,
                payload,
                message_hash: messageHash
            };
        } catch (error) {
            logger.error('Generate payment signature error:', error.message);
            throw new Error(`Failed to generate payment signature: ${error.message}`);
        }
    }

    /**
     * Verify signature
     * @param {string} signature - Signature to verify
     * @param {Object} paymentDetails - Payment details
     * @returns {Promise<boolean>} Verification result
     */
    async verifySignature(signature, paymentDetails) {
        try {
            // Recreate message
            const message = this.createPaymentMessage(paymentDetails);
            const messageHash = this.web3.utils.keccak256(message);

            // Recover signer address
            const recoveredAddress = await this.web3.eth.accounts.recover(
                messageHash,
                signature
            );

            // Verify signer is the agent
            const account = blockchainService.getAccount();
            const isValid = recoveredAddress.toLowerCase() === account.address.toLowerCase();

            logger.info('Signature verified', {
                isValid,
                recoveredAddress,
                expectedAddress: account.address
            });

            return isValid;
        } catch (error) {
            logger.error('Verify signature error:', error.message);
            return false;
        }
    }

    /**
     * Create single transaction signature for multiple actions
     * @param {Array} actions - Array of actions
     * @returns {Promise<Object>} Multi-action signature
     */
    async createSingleTxSignature(actions) {
        try {
            const account = blockchainService.getAccount();

            // Create combined payload
            const payload = {
                agent: account.address,
                actions: actions.map(action => ({
                    type: action.type,
                    target: action.target,
                    value: action.value || '0',
                    data: action.data || '0x'
                })),
                nonce: Math.floor(Math.random() * 1000000),
                timestamp: Math.floor(Date.now() / 1000),
                expires: Math.floor(Date.now() / 1000) + 3600
            };

            // Create message
            const message = this.createMultiActionMessage(payload);
            const messageHash = this.web3.utils.keccak256(message);

            // Sign
            const signature = await this.web3.eth.accounts.sign(
                messageHash,
                account.privateKey
            );

            logger.info('Multi-action signature created', {
                actionCount: actions.length
            });

            return {
                signature: signature.signature,
                payload,
                message_hash: messageHash
            };
        } catch (error) {
            logger.error('Create single tx signature error:', error.message);
            throw new Error(`Failed to create multi-action signature: ${error.message}`);
        }
    }

    /**
     * Sign contract call
     * @param {string} contractAddress - Contract address
     * @param {string} method - Method name
     * @param {Array} params - Method parameters
     * @returns {Promise<Object>} Signed contract call
     */
    async signContractCall(contractAddress, method, params) {
        try {
            const account = blockchainService.getAccount();

            const payload = {
                agent: account.address,
                contract: contractAddress,
                method,
                params,
                nonce: Math.floor(Math.random() * 1000000),
                timestamp: Math.floor(Date.now() / 1000),
                expires: Math.floor(Date.now() / 1000) + 3600
            };

            // Create message
            const message = this.createContractCallMessage(payload);
            const messageHash = this.web3.utils.keccak256(message);

            // Sign
            const signature = await this.web3.eth.accounts.sign(
                messageHash,
                account.privateKey
            );

            logger.info('Contract call signed', {
                contract: contractAddress,
                method
            });

            return {
                signature: signature.signature,
                payload,
                message_hash: messageHash
            };
        } catch (error) {
            logger.error('Sign contract call error:', error.message);
            throw new Error(`Failed to sign contract call: ${error.message}`);
        }
    }

    /**
     * Create payment message for signing
     * @param {Object} payload - Payment payload
     * @returns {string} Message string
     */
    createPaymentMessage(payload) {
        return this.web3.utils.encodePacked(
            { value: payload.user, type: 'address' },
            { value: payload.agent, type: 'address' },
            { value: payload.action, type: 'string' },
            { value: payload.amount, type: 'string' },
            { value: payload.recipient, type: 'address' },
            { value: payload.nonce, type: 'uint256' },
            { value: payload.timestamp, type: 'uint256' },
            { value: payload.expires, type: 'uint256' }
        );
    }

    /**
     * Create multi-action message for signing
     * @param {Object} payload - Multi-action payload
     * @returns {string} Message string
     */
    createMultiActionMessage(payload) {
        const actionStrings = payload.actions.map(action =>
            `${action.type}:${action.target}:${action.value}:${action.data}`
        ).join('|');

        return this.web3.utils.encodePacked(
            { value: payload.agent, type: 'address' },
            { value: actionStrings, type: 'string' },
            { value: payload.nonce, type: 'uint256' },
            { value: payload.timestamp, type: 'uint256' },
            { value: payload.expires, type: 'uint256' }
        );
    }

    /**
     * Create contract call message for signing
     * @param {Object} payload - Contract call payload
     * @returns {string} Message string
     */
    createContractCallMessage(payload) {
        const paramsString = JSON.stringify(payload.params);

        return this.web3.utils.encodePacked(
            { value: payload.agent, type: 'address' },
            { value: payload.contract, type: 'address' },
            { value: payload.method, type: 'string' },
            { value: paramsString, type: 'string' },
            { value: payload.nonce, type: 'uint256' },
            { value: payload.timestamp, type: 'uint256' },
            { value: payload.expires, type: 'uint256' }
        );
    }

    /**
     * Decode signature
     * @param {string} signature - Signature to decode
     * @returns {Object} Decoded signature components
     */
    decodeSignature(signature) {
        try {
            const r = signature.slice(0, 66);
            const s = '0x' + signature.slice(66, 130);
            const v = '0x' + signature.slice(130, 132);

            return {
                r,
                s,
                v: parseInt(v, 16)
            };
        } catch (error) {
            logger.error('Decode signature error:', error.message);
            throw new Error(`Failed to decode signature: ${error.message}`);
        }
    }

    /**
     * Verify signature expiration
     * @param {Object} payload - Signature payload
     * @returns {boolean} True if not expired
     */
    verifyExpiration(payload) {
        const now = Math.floor(Date.now() / 1000);
        return payload.expires > now;
    }

    /**
     * Verify nonce
     * @param {string} userId - User identifier
     * @param {number} nonce - Nonce to verify
     * @returns {boolean} True if valid
     */
    verifyNonce(userId, nonce) {
        // In production, check against stored nonces to prevent replay
        // For now, just verify it's a positive number
        return nonce > 0;
    }

    /**
     * Create EIP-712 typed data signature
     * @param {Object} data - Data to sign
     * @param {string} domain - Domain name
     * @returns {Promise<Object>} EIP-712 signature
     */
    async createEIP712Signature(data, domain = 'AgentOS') {
        try {
            const account = blockchainService.getAccount();

            const typedData = {
                types: {
                    EIP712Domain: [
                        { name: 'name', type: 'string' },
                        { name: 'version', type: 'string' },
                        { name: 'chainId', type: 'uint256' }
                    ],
                    Payment: [
                        { name: 'user', type: 'address' },
                        { name: 'agent', type: 'address' },
                        { name: 'action', type: 'string' },
                        { name: 'amount', type: 'string' },
                        { name: 'recipient', type: 'address' },
                        { name: 'nonce', type: 'uint256' },
                        { name: 'timestamp', type: 'uint256' },
                        { name: 'expires', type: 'uint256' }
                    ]
                },
                primaryType: 'Payment',
                domain: {
                    name: domain,
                    version: '1',
                    chainId: blockchainService.chainId
                },
                message: data
            };

            const signature = await account.signTypedData(typedData);

            logger.info('EIP-712 signature created');

            return {
                signature,
                typed_data: typedData
            };
        } catch (error) {
            logger.error('Create EIP-712 signature error:', error.message);
            throw new Error(`Failed to create EIP-712 signature: ${error.message}`);
        }
    }
}

module.exports = new SignatureService();
