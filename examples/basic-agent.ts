import { SpecterMiddleware, AeonReporter, formatCheckResult } from '../src/index.js';

const middleware = new SpecterMiddleware({
  mock: true, // swap to false + add apiKey for production
  minScore: 75,
  requireVerified: false,
  dimensions: {
    PROMPT_INTEGRITY: 70,
    EXPLOIT_EXPOSURE: 65,
  },
});

const reporter = new AeonReporter();

async function executeAgentAction(agentAddress: string, action: string): Promise<void> {
  const ctx = { agentAddress, action };
  const result = await middleware.check(ctx);

  reporter.record(result, action);
  console.log(formatCheckResult(result, action));
  console.log('');

  if (!result.allowed) {
    throw new Error(`Trust gate blocked: ${result.reason}`);
  }

  console.log(`Executing: ${action}`);
}

async function main() {
  const agents = [
    { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', action: 'transfer 0.1 ETH' },
    { address: '0xAbCdEf0123456789AbCdEf0123456789AbCdEf01', action: 'delegate portfolio' },
    { address: '0x0000000000000000000000000000000000000001', action: 'execute swap' },
  ];

  for (const { address, action } of agents) {
    try {
      await executeAgentAction(address, action);
    } catch (err) {
      console.error(`  → ${(err as Error).message}\n`);
    }
  }

  console.log('─'.repeat(50));
  console.log(reporter.summary());
}

main().catch(console.error);
