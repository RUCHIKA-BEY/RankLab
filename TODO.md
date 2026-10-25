# RankLab Delivery Outcomes

## Outcome 1 — Mathematical engine and correctness
- Implement PageRank explicitly with a column-stochastic adjacency/transition convention where `A[i][j] = 1` means page `j` links to page `i`.
- Replace every dangling transition column with a uniform `1/N` column before iteration.
- Start from a uniform ranking vector and use `r(next) = d P r + ((1-d)/N) 1`.
- Support damping `0 <= d < 1`, tolerances `1e-3`, `1e-6`, `1e-8`, default tolerance `1e-6`, and a maximum of 10,000 iterations.
- Record actual ranking vectors and L1 differences, stop only when the configured criterion is met, and report non-convergence at the iteration limit.
- Verify normalization, finite/nonnegative scores, column sums, the full damped stationary residual, and the raw `||Pr-r||_1` diagnostic.
- Handle zero pages, one page, dangling pages, disconnected components, cycles, self-links, invalid parameters, and iteration limits.

## Outcome 2 — Network Studio
- Provide the six-page non-symmetric default network with a cycle and dangling page, plus a three-page hand-work preset and additional presets.
- Let users add, rename, delete, and drag pages; add/remove directed links; prevent duplicate links; remove incident links on deletion; reset and switch presets.
- Show selected-page incoming/outgoing links, degree, dangling status, and calculated score.
- Run PageRank from the visible studio, mark edited/parameter-changed results stale, and visually distinguish top-ranked, dangling, selected, and significantly changed pages.

## Outcome 3 — Ranking Explorer and convergence
- Show the actual descending ranking with rank, name, score, percent of total, incoming/outgoing counts, and horizontal score bars.
- Support sorting and selection/highlighting, plus rank and score comparisons after a changed run.
- Show the actual L1-vs-iteration line chart, tolerance threshold, stop iteration, snapshots, page score inspection, convergence status, and step-through iteration mode.

## Outcome 4 — Mathematics Lab
- Provide progressive-disclosure views for adjacency, transition, dangling correction, damped formulation, initial vector, intermediate vectors, convergence differences, and final stationary verification.
- Keep page ordering consistent, highlight the selected page where applicable, and explain each object in beginner-friendly language.

## Outcome 5 — Calculation-backed experiments
- Network effect: compare original and modified graph rankings, score/rank deltas, iterations, convergence, and a comparison chart.
- Damping: run the same network for `0.5`, `0.7`, `0.85`, `0.95`, reporting scores, order, iterations, final L1, status, and a comparison visualization.
- Tolerance: run `1e-3`, `1e-6`, `1e-8` plus a stricter reference; report iterations, scores, final L1, status, and differences from that reference.
- Dangling pages: show the dangling page, corrected transition column, resulting ranking, and a comparison after adding an outgoing link.
- Verification: show column sums, score sum, nonnegativity/finiteness, final L1, full residual, raw diagnostic, iteration limit, status, and explicit pass/fail explanations.
- Preserve the working graph while allowing experiment reset and comparison.

## Outcome 6 — Product polish and delivery docs
- Provide a dark navy/charcoal, blue-violet, refined data-science visual system with readable contrast, focus states, responsive layouts, concise tooltips/help, meaningful empty/loading/error states, and destructive-action confirmation.
- Include optional guided walkthrough copy and a viva demonstration guide covering the five experiments.
- Include installation/run instructions, architecture, mathematical conventions, limitations, and test commands in README.
- Add unit tests covering matrix construction, dangling handling, normalization, convergence, stationary equation, single dangling page, and disconnected components.
- Run the available tests and production build; fix reported errors before delivery.
