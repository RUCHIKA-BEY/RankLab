# RankLab — Interactive PageRank Laboratory

RankLab is an educational React and TypeScript application for exploring how hyperlink structure becomes a ranking. It is designed for a B.Tech Mathematics mini-project and for a live viva demonstration: the user can edit a directed graph, run PageRank, inspect the matrices and vectors, watch convergence, and compare controlled experiments without relying on hardcoded scores.

## Run locally

```bash
pnpm install
pnpm dev
```

The development server listens on port 3000. For a production build, use:

```bash
pnpm test
pnpm build
```

`pnpm test` runs the Vitest suite for the pure numerical engine. `pnpm build` runs the TypeScript project references and the Vite production build.

## Architecture

The application is intentionally split into a pure numerical layer and a presentation layer. `src/engine/pagerank.ts` owns adjacency and transition matrix construction, dangling-column correction, vector multiplication, L1 convergence, iteration history, and verification diagnostics. It has no React dependencies and can be tested independently.

`src/data/networks.ts` owns the demo, hand-work, hub-and-spoke, and disconnected graph presets. `src/types.ts` defines the shared graph, result, snapshot, verification, and experiment contracts. The React surface is divided into `NetworkStudio`, `RankingPanel`, `ConvergencePanel`, `MathLab`, and `ExperimentLab`; `App.tsx` coordinates graph edits, parameter changes, stale-result invalidation, and the selected page.

The network visual is a lightweight SVG editor rather than a prebuilt PageRank widget. Nodes retain draggable coordinates, links are directional SVG lines with arrow markers, and page selection is shared with ranking rows, step-through vectors, and matrix highlights. Recharts renders the actual convergence history returned by the engine.

## Mathematical convention

RankLab uses a column-stochastic convention throughout. If page `j` links to page `i`, then `A[i][j] = 1`. For each non-dangling column, the transition matrix is normalized as:

```text
P[i][j] = A[i][j] / sum_m A[m][j]
```

A dangling page has no outgoing links, so its zero transition column is replaced with a uniform column containing `1/N` in every row. The initial vector is uniform, `r(0) = (1/N) 1`, and every iteration uses:

```text
r(k+1) = d P r(k) + ((1 - d) / N) 1
```

The default damping factor is `d = 0.85`. Supported convergence tolerances are `1e-3`, `1e-6`, and `1e-8`, with `1e-6` as the default. The engine stops when `||r(k+1) - r(k)||1 < epsilon` or reports that the configured maximum of 10,000 iterations was reached.

The verification report checks the transition-column sums, the final score sum, finite and nonnegative scores, the stopping criterion, the full damped stationary residual

```text
|| d P r + ((1-d)/N) 1 - r ||1
```

and the raw transition diagnostic `||P r - r||1`. The raw diagnostic is shown deliberately: it is not expected to be zero when damping is active because the final vector is stationary for the full damped Google equation, not necessarily for the raw transition operator alone.

## Experiments

The Experiment Lab runs the algorithm afresh for every comparison. Network effect compares the last committed graph with the current graph. Damping runs `0.5`, `0.7`, `0.85`, and `0.95` with the current network and tolerance. Tolerance runs `1e-3`, `1e-6`, and `1e-8` plus a stricter `1e-12` iterative reference. The dangling-page tab creates or reuses a dangling page, displays its corrected column, then compares it with a version that has one outgoing link. The verification tab renders explicit pass/review checks from the latest result.

## Limitations and choices

This version is intentionally client-side and does not need a server or database. Graph edits live in the current browser session and are not persisted between reloads. Page names are expected to be unique enough for a readable classroom demonstration, while IDs are generated from names and duplicate directed links are prevented. The graph editor uses SVG so it remains inspectable and responsive without adding a heavier graph-layout dependency. The default visual result is calculated on load from the default graph; if a graph or parameter changes, the interface marks the last result stale until the user runs again.
