export type ScoreVerdict = 'TRUSTED_AGENT' | 'REVIEW_ADVISED' | 'HIGH_RISK';
export type ChainId = 'base' | 'ethereum' | 'arbitrum' | 'optimism';

export interface ScoreDimensions {
  TX_VOLUME: number;
  COUNTERPARTY_DIV: number;
  ACCOUNT_AGE: number;
  REPAYMENT_HIST: number;
  EXPLOIT_EXPOSURE: number;
  PROMPT_INTEGRITY: number;
  PEER_ENDORSEMENT: number;
}

export interface TrustPolicy {
  /** Minimum composite score. Defaults to 75 */
  minScore?: number;
  /** Require ERC-8004 verification. Defaults to false */
  requireVerified?: boolean;
  /** Per-dimension minimums */
  dimensions?: Partial<Record<keyof ScoreDimensions, number>>;
  /** SPECTER API base URL */
  apiUrl?: string;
  /** API key for higher rate limits */
  apiKey?: string;
  /** Use mock scoring (no network). Defaults to false */
  mock?: boolean;
}

export interface AeonContext {
  /** Ethereum address of the agent being evaluated */
  agentAddress: string;
  /** Optional action being requested */
  action?: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

export interface TrustCheckResult {
  /** Whether the agent is allowed to proceed */
  allowed: boolean;
  /** Composite reputation score */
  score: number;
  /** Score verdict */
  verdict: ScoreVerdict;
  /** Reason for blocking, null if allowed */
  reason: string | null;
  /** All reasons for blocking */
  failReasons: string[];
  /** Per-dimension scores */
  dimensions?: ScoreDimensions;
  /** ERC-8004 verification status */
  verified?: boolean;
  /** ISO timestamp */
  checked_at: string;
}

export interface AeonHeartbeat {
  address: string;
  score: number;
  verdict: ScoreVerdict;
  checked_at: string;
  policy: Pick<TrustPolicy, 'minScore' | 'requireVerified'>;
}
