import { SpecterEngine, isValidAddress } from './specter.js';
import type { TrustPolicy, AeonContext, TrustCheckResult } from './types.js';

export class SpecterMiddleware {
  private readonly engine: SpecterEngine;
  private readonly policy: Required<Pick<TrustPolicy, 'minScore' | 'requireVerified' | 'dimensions'>>;

  constructor(policy: TrustPolicy = {}) {
    this.engine = new SpecterEngine({
      apiUrl: policy.apiUrl,
      apiKey: policy.apiKey,
      mock: policy.mock,
    });
    this.policy = {
      minScore: policy.minScore ?? 75,
      requireVerified: policy.requireVerified ?? false,
      dimensions: policy.dimensions ?? {},
    };
  }

  async check(ctx: AeonContext): Promise<TrustCheckResult> {
    const { agentAddress } = ctx;

    if (!agentAddress || !isValidAddress(agentAddress)) {
      return {
        allowed: false,
        score: 0,
        verdict: 'HIGH_RISK',
        reason: `Invalid agent address: "${agentAddress}"`,
        failReasons: [`Invalid agent address: "${agentAddress}"`],
        checked_at: new Date().toISOString(),
      };
    }

    const [scoreData, verifyData] = await Promise.all([
      this.engine.score(agentAddress),
      this.policy.requireVerified
        ? this.engine.verify(agentAddress)
        : Promise.resolve(null),
    ]);

    const failReasons: string[] = [];

    if (scoreData.score < this.policy.minScore) {
      failReasons.push(
        `Score ${scoreData.score} below policy minimum ${this.policy.minScore}`,
      );
    }

    if (this.policy.requireVerified && verifyData && !verifyData.verified) {
      failReasons.push('ERC-8004 identity not verified on Base');
    }

    for (const [dim, minVal] of Object.entries(this.policy.dimensions)) {
      const key = dim as keyof typeof scoreData.dimensions;
      const actual = scoreData.dimensions[key];
      if (actual < (minVal as number)) {
        failReasons.push(`${dim} score ${actual} below policy minimum ${minVal}`);
      }
    }

    const allowed = failReasons.length === 0;

    return {
      allowed,
      score: scoreData.score,
      verdict: scoreData.verdict,
      reason: allowed ? null : failReasons[0],
      failReasons,
      dimensions: scoreData.dimensions,
      verified: verifyData?.verified,
      checked_at: new Date().toISOString(),
    };
  }
}
