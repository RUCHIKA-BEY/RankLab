import type { Graph, IterationSnapshot, PageNode, PageRankResult, RunConfig } from '../types'

const EPSILON = 1e-10

export function multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
  return matrix.map((row) => row.reduce((sum, value, index) => sum + value * (vector[index] ?? 0), 0))
}

export function l1Difference(left: number[], right: number[]): number {
  return left.reduce((sum, value, index) => sum + Math.abs(value - (right[index] ?? 0)), 0)
}

export function buildMatrices(graph: Graph): { adjacency: number[][]; transition: number[][]; danglingColumns: number[] } {
  const size = graph.nodes.length
  const indexById = new Map(graph.nodes.map((page, index) => [page.id, index]))
  const adjacency = Array.from({ length: size }, () => Array(size).fill(0))

  graph.links.forEach(({ source, target }) => {
    const sourceIndex = indexById.get(source)
    const targetIndex = indexById.get(target)
    if (sourceIndex === undefined || targetIndex === undefined) return
    adjacency[targetIndex][sourceIndex] = 1
  })

  const transition = adjacency.map((row) => [...row])
  const danglingColumns: number[] = []
  for (let column = 0; column < size; column += 1) {
    const outDegree = adjacency.reduce((sum, row) => sum + row[column], 0)
    if (outDegree === 0) {
      danglingColumns.push(column)
      for (let row = 0; row < size; row += 1) transition[row][column] = size === 0 ? 0 : 1 / size
    } else {
      for (let row = 0; row < size; row += 1) transition[row][column] = adjacency[row][column] / outDegree
    }
  }

  return { adjacency, transition, danglingColumns }
}

function validateConfig({ damping, tolerance, maxIterations = 10000 }: RunConfig) {
  if (!Number.isFinite(damping) || damping < 0 || damping >= 1) throw new RangeError('Damping factor must satisfy 0 ≤ d < 1.')
  if (!Number.isFinite(tolerance) || tolerance <= 0) throw new RangeError('Tolerance must be a positive finite number.')
  if (!Number.isInteger(maxIterations) || maxIterations < 1) throw new RangeError('Maximum iterations must be a positive integer.')
  return { damping, tolerance, maxIterations }
}

export function runPageRank(graph: Graph, config: RunConfig): PageRankResult {
  const { damping, tolerance, maxIterations } = validateConfig(config)
  const pageOrder: PageNode[] = graph.nodes.map((page) => ({ ...page }))
  const size = pageOrder.length
  const { adjacency, transition, danglingColumns } = buildMatrices(graph)
  const initialVector = size === 0 ? [] : Array(size).fill(1 / size)
  const history: IterationSnapshot[] = [{ iteration: 0, vector: [...initialVector] }]
  const differences: number[] = []
  let current = [...initialVector]
  let converged = size === 0

  for (let iteration = 1; iteration <= maxIterations && size > 0; iteration += 1) {
    const walked = multiplyMatrixVector(transition, current)
    const next = walked.map((value) => damping * value + (1 - damping) / size)
    const difference = l1Difference(next, current)
    differences.push(difference)
    current = next
    history.push({ iteration, vector: [...next], difference })
    if (difference < tolerance) {
      converged = true
      break
    }
  }

  const scores = current
  const columnSums = transition.length === 0 ? [] : transition[0].map((_, column) => transition.reduce((sum, row) => sum + row[column], 0))
  const scoreSum = scores.reduce((sum, value) => sum + value, 0)
  const allFinite = scores.every(Number.isFinite)
  const nonnegative = scores.every((value) => value >= -EPSILON)
  const finalDifference = differences.at(-1) ?? 0
  const walkedFinal = multiplyMatrixVector(transition, scores)
  const stationaryTarget = walkedFinal.map((value) => damping * value + (1 - damping) / (size || 1))
  const stationaryResidual = size === 0 ? 0 : l1Difference(stationaryTarget, scores)
  const rawResidual = size === 0 ? 0 : l1Difference(walkedFinal, scores)
  const stoppedAtLimit = !converged && size > 0 && differences.length >= maxIterations
  const columnsPass = columnSums.every((sum) => Math.abs(sum - 1) < 1e-9)
  const scoreSumPass = size === 0 || Math.abs(scoreSum - 1) < 1e-9
  const stationaryPass = size === 0 || stationaryResidual < Math.max(tolerance * 1.5, 1e-9)
  const convergencePass = size === 0 || converged

  const checks = [
    { label: 'Transition columns', value: size === 0 ? 'n/a' : columnSums.map((value) => value.toFixed(3)).join(' · '), pass: size === 0 || columnsPass, detail: 'Every non-empty column of P sums to 1 after dangling correction.' },
    { label: 'Ranking sum', value: scoreSum.toFixed(8), pass: scoreSumPass, detail: 'The final ranking vector should preserve total probability mass.' },
    { label: 'Finite & nonnegative', value: allFinite && nonnegative ? 'Pass' : 'Review', pass: allFinite && nonnegative, detail: 'Scores must be finite and nonnegative within floating-point tolerance.' },
    { label: 'Stopping criterion', value: size === 0 ? 'Empty graph' : converged ? `Δ < ${tolerance}` : 'Limit reached', pass: convergencePass, detail: 'The run is successful only when the configured L1 tolerance is met.' },
    { label: 'Damped residual', value: stationaryResidual.toExponential(2), pass: stationaryPass, detail: '||dPr + ((1-d)/N)1 − r||₁ is the correct stationary check.' },
    { label: 'Raw transition diagnostic', value: rawResidual.toExponential(2), pass: true, detail: '||Pr − r||₁ is intentionally not expected to be zero when damping is active.' },
  ]

  return {
    pageOrder,
    adjacency,
    transition,
    danglingColumns,
    initialVector,
    history,
    differences,
    scores,
    iterations: differences.length,
    finalDifference,
    converged,
    stoppedAtLimit,
    damping,
    tolerance,
    maxIterations,
    diagnostics: { scoreSum, allFinite, nonnegative, columnSums, columnSumsPass: columnsPass, stationaryResidual, rawResidual, checks },
  }
}
