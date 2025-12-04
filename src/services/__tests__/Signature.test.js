const SignatureService = require('../x402/SignatureService');
const BlockchainService = require('../blockchain/BlockchainService');

// Mock BlockchainService
jest.mock('../blockchain/BlockchainService');

describe('Signature Service', () => {
    const mockAccount = {
        address: '0x1234567890123456789012345678901234567890',
        privateKey: '0xprivatekey'
    };

    const mockWeb3 = {
        utils: {
            keccak256: jest.fn().mockReturnValue('0xhash'),
            encodePacked: jest.fn().mockReturnValue('0xencoded')
        },
        eth: {
            accounts: {
                sign: jest.fn().mockResolvedValue({ signature: '0xsignature' }),
                recover: jest.fn().mockResolvedValue(mockAccount.address)
            }
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        BlockchainService.getAccount.mockReturnValue(mockAccount);
        BlockchainService.getWeb3.mockReturnValue(mockWeb3);
        SignatureService.web3 = mockWeb3;
    });

    describe('decodeSignature', () => {
        it('should decode signature components', () => {
            const sig = '0x' + 'r'.repeat(64) + 's'.repeat(64) + 'v'.repeat(2);
            const result = SignatureService.decodeSignature(sig);

            expect(result).toHaveProperty('r');
            expect(result).toHaveProperty('s');
            expect(result).toHaveProperty('v');
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
