# HistoryLens

**Understand what the world looked like in any year.**

Enter a year. See what was happening simultaneously across Europe, Asia, the Americas, and Africa — not as a list of facts, but as a structured comparative analysis.

**Live Demo:** [historylens-psi.vercel.app](https://historylens-psi.vercel.app)

[![License: MIT](https://img.shields.io/badge/License-MIT-c9a84c.svg)](LICENSE)
![Version](https://img.shields.io/badge/version-1.1.0-16a085.svg)
![Status](https://img.shields.io/badge/status-active-green.svg)

---

## What it does

Most history tools give you a timeline. HistoryLens gives you a cross-section — a horizontal slice across the whole world at a single moment in time.

For any year from ancient history to the present, it produces:

- **Real-time streaming engine (v1.1.0)** — watch the analysis type out piece-by-piece. The "Hook" and "Era" appear instantly, followed by regional cards as the AI completes them.
- **Per-region analysis** — Europe, Asia, the Americas, and Africa, each with a thesis (not a summary), ranked events, notable figures, and a "why it matters" conclusion
- **Global signals** — a structured readout of war intensity, political fragmentation, economic pressure, trade activity, and ideological tension
- **Cross-regional contrast** — an analytical statement connecting the regions, with specific bilateral tension notes

---

## Getting started

### 1. Clone

```bash
git clone https://github.com/Qarait/historylens.git
cd historylens
```

### 2. Get an API key

HistoryLens uses the [Anthropic API](https://console.anthropic.com). Create an account and get a key — it's a credit-based model, and new accounts typically receive initial trial credits to get started.

### 3. Configure

HistoryLens is pre-configured to use a secure backend proxy (`/api/history`). You do **not** need to add your API key to the client-side JavaScript.

Instead, define your API key as an environment variable:
- **Local development (.env):** `ANTHROPIC_API_KEY=your_key_here`
- **Vercel deployment:** Add `ANTHROPIC_API_KEY` to your project's **Environment Variables** in the dashboard.

This ensures your key remains secure and is never exposed to the public browser.

### 4. Run

HistoryLens requires a backend proxy to execute the logic in `api/history.js`. To run locally with full functionality, you **must** use the Vercel CLI:

```bash
# Install Vercel CLI if you haven't (locally or globally)
npm install -g vercel

# Start the development server (runs both frontend and api)
vercel dev
```

Open `http://localhost:3000`.

> [!IMPORTANT]
> A standard static server (like `npx serve` or `python -m http.server`) will **not** work because it does not execute the Node.js functions in the `api/` directory.

---

## Project structure

```
historylens/
├── index.html          # HTML shell — structure only, no inline scripts or styles
├── src/
│   ├── styles.css      # All CSS — design tokens, components, responsive rules
│   └── app.js          # All JavaScript — config, state, API, rendering
├── README.md
├── CHANGELOG.md
└── LICENSE
```

The three-file split is intentional. See [Architecture decisions](#architecture-decisions).

---

## Architecture decisions

This section explains the non-obvious tradeoffs made during development. The goal is to give any contributor (or evaluator) enough context to understand *why* things are the way they are, not just *what* they are.

### Why Haiku instead of Sonnet or Opus

Claude Haiku is 3–5× faster than Sonnet for this use case and costs ~10× less per request. The output quality difference for structured historical JSON is negligible — the prompt does the analytical heavy lifting, not the model's raw capability. Using a faster, cheaper model also makes the free-tier usage limit stretch much further, which matters for a tool aimed at schools.

### Why the prompt bans specific words

The prompt contains an explicit blocklist (`ongoing`, `attempted`, `continued`, `experienced`, `saw`, etc.) and a required verb list (`triggered`, `consolidated`, `fractured`, `eclipsed`, etc.). This is the single most important quality lever in the system. Without it, LLMs default to passive, textbook-style prose that reads as AI-generated. The banned words force active, causal sentence structure. The required verbs force the model to commit to an analytical claim rather than describe a neutral sequence of events.

### Why events are ranked (primary / secondary)

The 1-primary + 2-secondary constraint is not just visual — it forces the model to make an editorial judgment about which event most determined the trajectory of that region in that year. Without this constraint, the model produces three equally-weighted events that feel like a list. The ranking creates the perception that selection happened, which is the core of what distinguishes analysis from retrieval.

### Why we use a custom-built streaming parser (v1.1.0)

To provide an instant experience, we don't wait for the full JSON block from the LLM. Instead, we use a custom "brace-counting" incremental parser in `app.js` that identifies when top-level objects (like regional cards) are complete and renders them to the grid one-by-one. This reduces the "perceived" wait time from ~10 seconds to ~2 seconds.

### Why `innerHTML` is not used for AI output

All AI-generated text enters the DOM exclusively through `textContent` or through `esc()` before any `innerHTML` insertion. The `boldNames()` function operates on pre-escaped strings and only injects `<strong>` tags around a fixed set of known proper nouns — it cannot execute arbitrary HTML. This prevents XSS if the API ever returns unexpected content. The only `innerHTML` assignments in the codebase use static, author-controlled template strings (the landing hook contrast sentences, toolbar SVGs, and skeleton elements).

### Why there's a client-side cache

The in-memory `Map` cache means that revisiting a year within the same session is instant. This matters for two classroom use cases: a teacher exploring multiple years during a lesson, and students using the "Compare" feature (which fetches two years in parallel but only calls the API for uncached years). The cache is not persisted to localStorage — sessions are cheap enough that re-fetching on page reload is fine, and stale history data has no place in a tool used for accuracy.

### Why the timeline uses localStorage

Unlike the API cache, the exploration timeline *should* persist. Returning users — especially students working on a project across multiple sessions — benefit from seeing their history. The localStorage writes are wrapped in try/catch so private-mode browsers and quota errors fail silently rather than breaking the UI.

### Why the page is structured "try first, understand later"

The hero and search box appear before the example, how-it-works, and manifesto sections. This is a deliberate product decision: the primary user arriving from a link or recommendation wants to *try the tool*, not read about it. The landing content exists for users who are evaluating whether to adopt it (teachers, curriculum coordinators) and is deliberately placed below the fold so it doesn't delay the primary use case.

### Why the prompt asks for a "thesis headline" instead of a "summary"

A summary describes what happened. A thesis makes a claim about what it meant. "Europe had many conflicts" is a summary. "Dynastic ambition fractured the continent's administrative coherence" is a thesis. The distinction forces the model to take an analytical stance rather than produce neutral recitation. This is the core of what makes the output feel authored rather than retrieved.

---

## Classroom use

HistoryLens is designed to complement, not replace, primary sources and textbooks.

**Suggested uses:**
- Project on screen during a lesson — explore a year the class is studying and compare regions
- Print the output as a one-page handout (Print → Save as PDF)
- Ask students to compare two years before and after a major event
- Use the "Curated Threads" as structured reading pathways through a historical theme

**Accuracy note:** AI-generated content is structured around consensus historical scholarship but should always be verified against textbooks, encyclopedias, and primary sources before use in assessed work.

---

## Contributing

Contributions are welcome. Before opening a PR, please read the architecture decisions above — particularly the sections on prompt design and XSS prevention, as these affect the core quality and security of the tool.

**Open issues worth tackling:**
- [x] Backend proxy for API key security (Vercel serverless implementation)
- [ ] Source citations alongside events
- [ ] Adaptive region lists based on historical relevance
- [ ] Print stylesheet refinements for 3+ region compare mode
- [ ] Offline mode with a pre-generated cache of the 50 most common years

---

## License

MIT. Free to use, fork, and deploy for educational purposes.

---

*Built with care for students and educators. If you use HistoryLens in a classroom, we'd love to hear about it — hello@historylens.app*
