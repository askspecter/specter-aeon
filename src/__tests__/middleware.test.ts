import { describe, it, expect } from 'vitest';
import { SpecterMiddleware } from '../middleware.js';

const ADDR = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
const INVALID = '0xinvalid';

describe('SpecterMiddleware (mock mode)', () => {
  const middleware = new SpecterMiddleware({ mock: true });

  it('returns a result for a valid address', async () => {
    const result = await middleware.check({ agentAddress: ADDR });
    expect(result.score).toBeGreaterThanOrEqual(55);
    expect(result.score).toBeLessThanOrEqual(95);
    expect(['TRUSTED_AGENT', 'REVIEW_ADVISED', 'HIGH_RISK']).toContain(result.verdict);
    expect(typeof result.allowed).toBe('boolean');
    expect(result.checked_at).toBeTruthy();
  });

  it('blocks invalid address immediately', async () => {
    const result = await middleware.check({ agentAddress: INVALID });
    expect(result.allowed).toBe(false);
    expect(result.score).toBe(0);
    expect(result.failReasons.length).toBeGreaterThan(0);
  });

  it('blocks agent below custom minScore', async () => {
    const strict = new SpecterMiddleware({ mock: true, minScore: 200 });
    const result = await strict.check({ agentAddress: ADDR });
    expect(result.allowed).toBe(false);
    expect(result.failReasons.some(r => r.includes('below policy minimum'))).toBe(true);
  });

  it('allows agent with minScore: 0', async () => {
    const open = new SpecterMiddleware({ mock: true, minScore: 0 });
    const result = await open.check({ agentAddress: ADDR });
    expect(result.allowed).toBe(true);
    expect(result.failReasons).toHaveLength(0);
  });

  it('blocks on dimension threshold', async () => {
    const strict = new SpecterMiddleware({
      mock: true,
      minScore: 0,
      dimensions: { TX_VOLUME: 999 },
    });
    const result = await strict.check({ agentAddress: ADDR });
    expect(result.allowed).toBe(false);
    expect(result.failReasons.some(r => r.includes('TX_VOLUME'))).toBe(true);
  });

  it('is deterministic', async () => {
    const a = await middleware.check({ agentAddress: ADDR });
    const b = await middleware.check({ agentAddress: ADDR });
    expect(a.score).toBe(b.score);
    expect(a.allowed).toBe(b.allowed);
  });

  it('requireVerified blocks unverified addresses', async () => {
    const withVerify = new SpecterMiddleware({ mock: true, minScore: 0, requireVerified: true });
    const result = await withVerify.check({ agentAddress: ADDR });
    // Result depends on deterministic mock — just verify the field exists
    expect(typeof result.verified).toBe('boolean');
    if (!result.verified) {
      expect(result.allowed).toBe(false);
      expect(result.failReasons.some(r => r.includes('ERC-8004'))).toBe(true);
    }
  });
});
