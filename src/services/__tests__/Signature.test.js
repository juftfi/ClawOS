const SignatureService = require('../x402/SignatureService');

describe('Signature Service', () => {
    describe('decodeSignature', () => {
        it('should decode signature components', () => {
            const sig = '0x' + 'r'.repeat(64) + 's'.repeat(64) + 'v'.repeat(2);
            const result = SignatureService.decodeSignature(sig);

            expect(result).toHaveProperty('r');
            expect(result).toHaveProperty('s');
            expect(result).toHaveProperty('v');
            expect(typeof result.v).toBe('number');
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

        it('should return false for current time', () => {
            const payload = { expires: Math.floor(Date.now() / 1000) };
            expect(SignatureService.verifyExpiration(payload)).toBe(false);
        });
    });

    describe('verifyNonce', () => {
        it('should verify positive nonce', () => {
            expect(SignatureService.verifyNonce('user1', 123)).toBe(true);
            expect(SignatureService.verifyNonce('user1', 1)).toBe(true);
        });

        it('should reject zero or negative nonce', () => {
            expect(SignatureService.verifyNonce('user1', 0)).toBe(false);
            expect(SignatureService.verifyNonce('user1', -1)).toBe(false);
            expect(SignatureService.verifyNonce('user1', -100)).toBe(false);
        });
    });
});
