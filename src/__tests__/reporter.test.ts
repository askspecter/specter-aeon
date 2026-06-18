import { describe, it, expect } from 'vitest';
import { AeonReporter, formatCheckResult } from '../reporter.js';
import type { TrustCheckResult } from '../types.js';

const mockResult = (allowed: boolean, score = 82): TrustCheckResult => ({
  allowed,
  score,
  verdict: score >= 85 ? 'TRUSTED_AGENT' : score >= 65 ? 'REVIEW_ADVISED' : 'HIGH_RISK',
  reason: allowed ? null : `Score ${score} below minimum 75`,
  failReasons: allowed ? [] : [`Score ${score} below minimum 75`],
  checked_at: new Date().toISOString(),
});

describe('formatCheckResult()', () => {
  it('contains ALLOWED for passing result', () => {
    const out = formatCheckResult(mockResult(true));
    expect(out).toContain('ALLOWED');
    expect(out).toContain('82');
  });

  it('contains BLOCKED and reasons for failing result', () => {
    const out = formatCheckResult(mockResult(false, 50));
    expect(out).toContain('BLOCKED');
    expect(out).toContain('below minimum');
  });
});

describe('AeonReporter', () => {
  it('records and summarises checks', () => {
    const reporter = new AeonReporter();
    reporter.record(mockResult(true, 90));
    reporter.record(mockResult(false, 40));
    reporter.record(mockResult(true, 80));

    const summary = reporter.summary();
    expect(summary).toContain('Total checks : 3');
    expect(summary).toContain('Allowed      : 2');
    expect(summary).toContain('Blocked      : 1');
  });

  it('toJSON returns all log entries', () => {
    const reporter = new AeonReporter();
    reporter.record(mockResult(true));
    expect(reporter.toJSON()).toHaveLength(1);
  });
});
