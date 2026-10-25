# RankLab Implementation Plan

## Product approach

RankLab will be a single-page React + TypeScript learning laboratory. The primary interaction is a split workspace: a compact navigation rail and project header frame a network canvas on the left and an inspector/results area on the right. Users can edit a directed graph, run PageRank, then move progressively deeper into rankings, convergence, mathematics, and experiments without losing the current network context.

The numerical engine will be completely separate from React state. It will construct the adjacency matrix using the required column-stochastic convention, replace dangling columns with uniform columns, iterate the damped update from a uniform vector, capture every vector and L1 difference, enforce a maximum iteration limit, and return diagnostics for normalization, finiteness, nonnegativity, column sums, the full damped residual, and the raw `||Pr-r||_1` diagnostic. All charts, tables, node styling, and explanations will consume these calculated results.

The default six-page network will be meaningful, cyclic, non-symmetric, and include Contact as a dangling page. Additional presets will include a compact three-page hand-work example, a hub-and-spoke pattern, and a disconnected-components pattern. Graph edits and parameter changes will mark results stale until the user runs again. Experiment runs will operate on cloned graph/parameter inputs and preserve the current working network.

## Project structure

- `src/main.tsx` — React entrypoint and global styles.
- `src/App.tsx` — application shell, state orchestration, section navigation, and interaction wiring.
- `src/engine/pagerank.ts` — pure PageRank implementation, matrix construction, iterations, and verification diagnostics.
- `src/engine/pagerank.test.ts` — unit tests for matrices, dangling pages, normalization, convergence, stationary residual, single-page and disconnected edge cases.
- `src/data/networks.ts` — typed graph presets and default graph factory.
- `src/types.ts` — shared graph, result, experiment, and UI types.
- `src/components/NetworkStudio.tsx` — editable SVG graph canvas with draggable nodes, directional links, selection, link creation/removal, and legend.
- `src/components/RankingPanel.tsx` — sortable ranking explorer and score comparison rows.
- `src/components/MathLab.tsx` — progressive-disclosure matrices, vectors, and plain-language explanations.
- `src/components/ConvergencePanel.tsx` — actual history chart, tolerance line, snapshots, and step-through controls.
- `src/components/ExperimentLab.tsx` — calculation-backed damping, tolerance, network-effect, dangling, and verification experiments.
- `src/components/ui.tsx` — reusable cards, pills, segmented controls, buttons, and compact data primitives.
- `public/manus-routes.json` — route manifest for the single `/` route.
- `README.md` — installation, architecture, mathematical conventions, limitations, and viva walkthrough.
- `VIVA_GUIDE.md` — short demo script for all five experiments.

## Design direction

### Style alternatives

- **Instrument-panel editorial** (0.07): dense but calm data instrumentation with luminous status markers and a magazine-like hierarchy.
- **Midnight observatory** (0.05): dark research-console surfaces, plotted trajectories, and restrained blue-violet signal lines.
- **Neo-academic atlas** (0.08): crisp paper-like data cards, spatial diagrams, and a more classroom-oriented rhythm.

### Chosen movement: Midnight observatory

**Core principles:** Make the graph feel alive but not gamified; keep math inspectable through progressive disclosure; use contrast to distinguish current state, verified state, and stale state; favor short explanatory copy over decorative density.

**Color philosophy:** A near-black navy foundation makes score bars and graph edges read like plotted signals. Electric indigo marks active controls and calculated state, while mint is reserved for verified/converged conditions and amber flags dangling or stale conditions. Warm off-white text prevents the experience from feeling like a developer console.

**Layout paradigm:** A persistent command rail on the left, a wide graph workspace as the visual anchor, and stacked analytical panels that appear beneath it. The interface should feel like one instrument with synchronized views rather than a grid of unrelated dashboard cards.

**Signature elements:** A small rank-lab mark made from three connected dots; thin violet “signal” rules under section headers; compact status chips that read like instrument readouts.

**Interaction philosophy:** Every graph edit should visibly communicate that the previous result is no longer current. Selecting a page should connect the canvas, ranking row, and mathematical highlights. Destructive edits require a lightweight confirmation; ordinary controls should be immediate.

**Animation:** Use short opacity/translate transitions for panel changes and status updates only. Keep node dragging and chart reading stable; do not animate data points continuously or obscure the convergence curve.

**Typography system:** Use a clean sans-serif UI stack with strong numeric tabular figures for scores and iteration counts. Large headlines are compact and slightly tracked; body copy stays readable at 14–16px with muted secondary text.

**Brand essence:** A transparent PageRank workbench for students who need to see both the result and the reasoning; precise, curious, demonstrable.

**Brand voice:** Headlines are direct and observant (“See the rank move.”). CTAs name the action and the proof (“Run the calculation”, “Inspect the residual”). Explanations avoid assuming advanced linear algebra knowledge.

**Wordmark & logo:** “RankLab” set beside a three-node mark where the final node is highlighted, suggesting a graph becoming a ranking.

**Signature brand color:** `#8B7CFF`, a clear violet signal used for active calculation state and score bars.

## Implementation details

- Use Vite, React, TypeScript, Tailwind CSS, Recharts, and Lucide React. Use SVG for the editable graph to keep the interaction dependable and lightweight.
- Keep graph coordinates in page state so dragging persists across runs and edits.
- Use a tabbed/sectioned single page with hash-free local state; only `/` is required and is declared in `public/manus-routes.json`.
- The step-through mode will use the stored iteration history from the latest run, never a separate or invented curve.
- Experiment 2 will run four fresh calculations on the same graph/tolerance for `d = 0.5, 0.7, 0.85, 0.95`.
- Experiment 3 will run three calculations for the specified tolerances plus a stricter `1e-12` reference calculation, then compare scores against that actual reference.
- Experiment 4 will use a cloned graph with a dangling page, show its corrected transition column, then add a concrete outgoing link and compare the resulting rankings.
- Verification pass/fail thresholds will be explicit and described in plain English; failures will remain visible instead of being normalized away.
- A responsive layout will collapse the rail into a top strip and stack canvas/panels for narrower widths.

## Build workflow

1. Create the Vite/TypeScript project files, install only the necessary dependencies, and configure Tailwind/PostCSS.
2. Add the pure engine and unit tests before UI wiring.
3. Add typed presets and the SVG Network Studio.
4. Add the result panels, charting, math disclosure, experiment runner, and guided/step-through controls.
5. Add README, viva guide, route manifest, favicon/logo metadata, and accessible responsive polish.
6. Run unit tests, TypeScript/build checks, start the configured preview service, verify `/manus-routes.json`, inspect the rendered app, and fix any errors.
7. Commit the finished project to the canonical main branch so the Webdev checkpoint is recorded.
