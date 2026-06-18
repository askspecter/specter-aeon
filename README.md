# @askspecter/aeon

SPECTER × Aeon integration — trust-gated autonomous actions with on-chain reputation scoring.

Gate every agent action through a SPECTER trust check. Block `HIGH_RISK` agents before they can execute transfers, delegation, or any sensitive operation.

---

## Install

```bash
npm install github:askspecter/specter-aeon
```

---

## Quick Start

```typescript
import { SpecterMiddleware } from '@askspecter/aeon';

const middleware = new SpecterMiddleware({
  minScore: 75,
  requireVerified: false,
});

// Before any agent action:
const result = await middleware.check({
  agentAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  action: 'transfer 0.5 ETH',
});

if (!result.allowed) {
  throw new Error(`Blocked: ${result.reason}`);
}

// Safe to proceed
```

---

## API

### `new SpecterMiddleware(policy?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minScore` | `number` | `75` | Minimum composite score |
| `requireVerified` | `boolean` | `false` | Require ERC-8004 verification |
| `dimensions` | `object` | `{}` | Per-dimension minimums |
| `apiUrl` | `string` | SPECTER API | Custom API endpoint |
| `apiKey` | `string` | — | API key for rate limits |
| `mock` | `boolean` | `false` | Use mock scoring (no network) |

### `middleware.check(ctx)`

```typescript
const result = await middleware.check({
  agentAddress: '0x...',
  action: 'optional action description',
});

// result.allowed      — boolean
// result.score        — 0–100
// result.verdict      — 'TRUSTED_AGENT' | 'REVIEW_ADVISED' | 'HIGH_RISK'
// result.failReasons  — string[]
// result.dimensions   — per-dimension scores
```

---

## Session Reporting

Track all trust checks and get a summary:

```typescript
import { SpecterMiddleware, AeonReporter, formatCheckResult } from '@askspecter/aeon';

const reporter = new AeonReporter();

const result = await middleware.check({ agentAddress: '0x...' });
reporter.record(result, 'transfer 0.1 ETH');

console.log(formatCheckResult(result));
console.log(reporter.summary());
```

---

## GitHub Actions Integration

Use SPECTER in CI/CD to block deployments or agent releases with low trust scores:

```yaml
- name: SPECTER Trust Check
  env:
    SPECTER_API_KEY: ${{ secrets.SPECTER_API_KEY }}
  run: |
    node --input-type=module <<'EOF'
    import { SpecterMiddleware } from '@askspecter/aeon';
    const middleware = new SpecterMiddleware({ minScore: 80 });
    const result = await middleware.check({ agentAddress: process.env.AGENT_ADDRESS });
    if (!result.allowed) { console.error(result.failReasons); process.exit(1); }
    EOF
```

See [`.github/workflows/aeon-check.yml`](.github/workflows/aeon-check.yml) for the full reusable workflow.

---

## Testing (No Network)

```typescript
const middleware = new SpecterMiddleware({ mock: true, minScore: 75 });
const result = await middleware.check({ agentAddress: '0x...' });
```

```bash
npm test   # all tests use mock mode
```

---

## License

MIT © [SPECTER Protocol](https://askspecter.lol)
