const SignatureService = require('../x402/SignatureService');
const BlockchainService = require('../blockchain/BlockchainService');

jest.mock('../blockchain/BlockchainService');

describe('Signature Service', () => {
    let mockWeb3;
    let mockAccount;

    beforeEach(() => {
        jest.clearAllMocks();

        mockAccount = {
            address: '0xagent',
            privateKey: '0xkey',
            signTypedData: jest.fn()
        };

        mockWeb3 = {
            utils: {
                keccak256: jest.fn(val => '0xhash'),
                encodePacked: jest.fn(val => '0xencoded')
            },
            eth: {
                accounts: {
                    sign: jest.fn().mockResolvedValue({
                        signature: '0xsig'
                    }),
                    recover: jest.fn().mockResolvedValue('0xagent')
                }
            }
        };

        BlockchainService.getWeb3.mockReturnValue(mockWeb3);
        BlockchainService.getAccount.mockReturnValue(mockAccount);
        BlockchainService.chainId = 56;

        // Inject mockWeb3 into the singleton instance
        SignatureService.web3 = mockWeb3;
    });

    describe('generatePaymentSignature', () => {
        it('should generate payment signature', async () => {
            const payment = {
                user: 'user1',
                amount: '1.0',
                recipient: '0xrecipient',
                action: 'transfer',
                nonce: 1
            };

            const result = await SignatureService.generatePaymentSignature(payment);

            expect(result.signature).toBe('0xsig');
            expect(result.payload.user).toBe('user1');
            expect(mockWeb3.eth.accounts.sign).toHaveBeenCalled();
        });
    });

    describe('verifySignature', () => {
        it('should verify valid signature', async () => {
            const payment = {
                user: 'user1',
                amount: '1.0'
            };

            const isValid = await SignatureService.verifySignature('0xsig', payment);

            expect(isValid).toBe(true);
            expect(mockWeb3.eth.accounts.recover).toHaveBeenCalled();
        });

        it('should reject invalid signature', async () => {
            mockWeb3.eth.accounts.recover.mockResolvedValue('0xother');

            const isValid = await SignatureService.verifySignature('0xsig', {});

            expect(isValid).toBe(false);
        });
    });

    describe('createSingleTxSignature', () => {
        it('should create multi-action signature', async () => {
            const actions = [
                { type: 'transfer', target: '0x1', value: '100' },
                { type: 'call', target: '0x2', data: '0x' }
            ];

            const result = await SignatureService.createSingleTxSignature(actions);

            expect(result.signature).toBe('0xsig');
            expect(result.payload.actions).toHaveLength(2);
        });
    });

    describe('signContractCall', () => {
        it('should sign contract call', async () => {
            const result = await SignatureService.signContractCall('0xcontract', 'method', ['arg1']);

            expect(result.signature).toBe('0xsig');
            expect(result.payload.contract).toBe('0xcontract');
            expect(result.payload.method).toBe('method');
        });
    });

    describe('createEIP712Signature', () => {
        it('should create EIP-712 signature', async () => {
            mockAccount.signTypedData.mockResolvedValue('0xeip712sig');

            const result = await SignatureService.createEIP712Signature({ foo: 'bar' });

            expect(result.signature).toBe('0xeip712sig');
            expect(result.typed_data.domain.chainId).toBe(56);
        });
    });

    describe('decodeSignature', () => {
        it('should decode signature components', () => {
            const sig = '0x' + 'r'.repeat(64) + 's'.repeat(64) + '1b'; // 1b = 27
            const result = SignatureService.decodeSignature(sig);

            expect(result).toHaveProperty('r');
            expect(result).toHaveProperty('s');
            expect(result.v).toBe(27);
        });
    });

    describe('verifyExpiration', () => {
        it('should return true for future expiration', () => {
            const payload = { expires: Math.floor(Date.now() / 1000) + 1000 };
            expect(SignatureService.verifyExpiration(payload)).toBe(true);
        });

        it('should return false for past expiration', () => {
            const payload = { expires: Math.floor(Date.now() / 1000) - 1000 };
            expect(SignatureService.verifyExpiration(payload)).toBe(false);
        });
    });

    describe('verifyNonce', () => {
        it('should verify positive nonce', () => {
            expect(SignatureService.verifyNonce('user1', 123)).toBe(true);
        });

        it('should reject zero or negative nonce', () => {
            expect(SignatureService.verifyNonce('user1', 0)).toBe(false);
            expect(SignatureService.verifyNonce('user1', -1)).toBe(false);
        });
    });
});
