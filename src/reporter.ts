import type { TrustCheckResult, AeonHeartbeat, TrustPolicy } from './types.js';

export function formatCheckResult(result: TrustCheckResult, action?: string): string {
  const status = result.allowed ? '✓ ALLOWED' : '✗ BLOCKED';
  const lines = [
    `SPECTER Trust Gate — ${status}`,
    `  Score    : ${result.score}/100 (${result.verdict})`,
    `  Verified : ${result.verified ?? 'not checked'}`,
  ];

  if (action) lines.push(`  Action   : ${action}`);
  if (!result.allowed && result.failReasons.length > 0) {
    lines.push('  Reasons  :');
    result.failReasons.forEach(r => lines.push(`    · ${r}`));
  }

  lines.push(`  Checked  : ${result.checked_at}`);
  return lines.join('\n');
}

export function formatHeartbeat(hb: AeonHeartbeat): string {
  return [
    `SPECTER Heartbeat`,
    `  Agent    : ${hb.address}`,
    `  Score    : ${hb.score}/100 (${hb.verdict})`,
    `  Policy   : minScore=${hb.policy.minScore}, requireVerified=${hb.policy.requireVerified}`,
    `  Time     : ${hb.checked_at}`,
  ].join('\n');
}

export class AeonReporter {
  private readonly logs: Array<{ ts: string; result: TrustCheckResult; action?: string }> = [];

  record(result: TrustCheckResult, action?: string): void {
    this.logs.push({ ts: new Date().toISOString(), result, action });
  }

  summary(): string {
    const total = this.logs.length;
    const allowed = this.logs.filter(l => l.result.allowed).length;
    const blocked = total - allowed;
    const avgScore = total > 0
      ? Math.round(this.logs.reduce((s, l) => s + l.result.score, 0) / total)
      : 0;

    return [
      `SPECTER Session Report`,
      `  Total checks : ${total}`,
      `  Allowed      : ${allowed}`,
      `  Blocked      : ${blocked}`,
      `  Avg score    : ${avgScore}/100`,
    ].join('\n');
  }

  toJSON(): typeof this.logs {
    return this.logs;
  }
}
