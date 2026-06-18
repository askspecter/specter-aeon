import { createHash } from 'node:crypto';
import type { ScoreVerdict, ScoreDimensions, ChainId } from './types.js';

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;
const DIMS: (keyof ScoreDimensions)[] = [
  'TX_VOLUME', 'COUNTERPARTY_DIV', 'ACCOUNT_AGE', 'REPAYMENT_HIST',
  'EXPLOIT_EXPOSURE', 'PROMPT_INTEGRITY', 'PEER_ENDORSEMENT',
];

export interface ScoreData {
  address: string;
  score: number;
  verdict: ScoreVerdict;
  dimensions: ScoreDimensions;
  passport: string;
  chain: ChainId;
  block: number;
  cached_at: string;
}

export interface VerifyData {
  address: string;
  verified: boolean;
  passport: string;
  registered_at: string | null;
  chain: ChainId;
  block: number;
}

function dimScore(address: string, key: string): number {
  const hex = createHash('sha256').update(`${address.toLowerCase()}-${key}`).digest('hex');
  return 55 + (parseInt(hex.slice(0, 8), 16) % 41);
}

function verdict(score: number): ScoreVerdict {
  if (score >= 85) return 'TRUSTED_AGENT';
  if (score >= 65) return 'REVIEW_ADVISED';
  return 'HIGH_RISK';
}

export class SpecterEngine {
  private readonly apiUrl: string;
  private readonly apiKey: string | undefined;
  private readonly mock: boolean;

  constructor(opts: { apiUrl?: string; apiKey?: string; mock?: boolean } = {}) {
    this.apiUrl = (opts.apiUrl ?? 'https://api.askspecter.xyz/v1').replace(/\/$/, '');
    this.apiKey = opts.apiKey;
    this.mock = opts.mock ?? false;
  }

  async score(address: string): Promise<ScoreData> {
    if (this.mock) return this.mockScore(address);
    return this.fetch<ScoreData>(`/score/${address}?chain=base`);
  }

  async verify(address: string): Promise<VerifyData> {
    if (this.mock) return this.mockVerify(address);
    return this.fetch<VerifyData>(`/verify/${address}?chain=base`);
  }

  private mockScore(address: string): ScoreData {
    const dimensions = Object.fromEntries(
      DIMS.map(d => [d, dimScore(address, d)]),
    ) as ScoreDimensions;
    const score = Math.round(Object.values(dimensions).reduce((a, b) => a + b, 0) / DIMS.length);
    return {
      address,
      score,
      verdict: verdict(score),
      dimensions,
      passport: `0x${createHash('sha256').update(address.toLowerCase()).digest('hex').slice(0, 40)}`,
      chain: 'base',
      block: 21_847_392,
      cached_at: new Date().toISOString(),
    };
  }

  private mockVerify(address: string): VerifyData {
    const hex = createHash('sha256').update(address.toLowerCase()).digest('hex');
    const verified = parseInt(hex.slice(0, 2), 16) > 64;
    return {
      address,
      verified,
      passport: `0x${hex.slice(0, 40)}`,
      registered_at: verified ? new Date(Date.now() - 30 * 86_400_000).toISOString() : null,
      chain: 'base',
      block: 21_847_392,
    };
  }

  private async fetch<T>(path: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': '@askspecter/aeon/1.0.0',
    };
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;

    const res = await globalThis.fetch(`${this.apiUrl}${path}`, { headers });
    if (!res.ok) {
      throw new Error(`SPECTER API error: HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  }
}

export function isValidAddress(address: string): boolean {
  return ADDRESS_RE.test(address);
}
