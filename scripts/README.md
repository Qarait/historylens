# HistoryLens Benchmarks

This directory contains benchmarking scripts to compare model performance, speed, and schema reliability.

## Models Tested
* `claude-haiku-4-5-20251001` (Anthropic) - Current Production Model
* `gemini-3-flash-preview` (Google) - Target Evaluation Model

## How to Run

1. Ensure you have Node.js v18+ installed (for native `fetch` support).
2. Set your API keys in your environment:

\`\`\`bash
export ANTHROPIC_API_KEY="sk-ant-..."
export GEMINI_API_KEY="AIza..."
\`\`\`

3. Run the benchmark script from the root of the repository:

\`\`\`bash
node scripts/benchmark.js
\`\`\`

## What it tests
The script will sequentially request the complex 4-region HistoryLens JSON schema across 9 diverse historical years.

It tracks:
1. **Time To First Token (TTFT)**: Startup latency via Server-Sent Events (SSE).
2. **Total Latency**: How long the entire prompt takes to stream in and complete.
3. **Schema Success Rate**: Evaluates whether the LLM hallucinated markdown, violated the JSON spec, or missed the strict formatting required for 4 active regions (each exactly 3 events).

Results are printed to the console and serialized to `benchmark_results.json` in the root working directory.
