import { describe, expect, it } from 'vitest'
import { buildMatrices, runPageRank } from './pagerank'
import type { Graph } from '../types'

const single: Graph = { nodes: [{ id: 'a', name: 'A', x: 0, y: 0 }], links: [] }
const chain: Graph = {
  nodes: [
    { id: 'a', name: 'A', x: 0, y: 0 },
    { id: 'b', name: 'B', x: 1, y: 1 },
    { id: 'c', name: 'C', x: 2, y: 2 },
  ],
  links: [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }],
}
const disconnected: Graph = {
  nodes: [
    { id: 'a', name: 'A', x: 0, y: 0 },
    { id: 'b', name: 'B', x: 1, y: 1 },
    { id: 'c', name: 'C', x: 2, y: 2 },
    { id: 'd', name: 'D', x: 3, y: 3 },
  ],
  links: [{ source: 'a', target: 'b' }, { source: 'b', target: 'a' }, { source: 'c', target: 'd' }, { source: 'd', target: 'c' }],
}
const empty: Graph = { nodes: [], links: [] }
const selfLink: Graph = { nodes: [{ id: 'a', name: 'A', x: 0, y: 0 }, { id: 'b', name: 'B', x: 1, y: 1 }], links: [{ source: 'a', target: 'a' }] }

describe('PageRank engine', () => {
  it('uses a column-stochastic convention and corrects dangling columns', () => {
    const result = buildMatrices(chain)
    expect(result.adjacency[1][0]).toBe(1)
    expect(result.adjacency[0][1]).toBe(0)
    expect(result.danglingColumns).toEqual([2])
    expect(result.transition.map((row) => row[2])).toEqual([1 / 3, 1 / 3, 1 / 3])
    expect(result.transition[0][0] + result.transition[1][0] + result.transition[2][0]).toBe(1)
  })

  it('normalizes scores and converges for a single dangling page', () => {
    const result = runPageRank(single, { damping: 0.85, tolerance: 1e-8 })
    expect(result.converged).toBe(true)
    expect(result.scores[0]).toBeCloseTo(1, 10)
    expect(result.diagnostics.scoreSum).toBeCloseTo(1, 10)
    expect(result.diagnostics.stationaryResidual).toBeLessThan(1e-8)
  })

  it('converges on disconnected components with a unique damped solution', () => {
    const result = runPageRank(disconnected, { damping: 0.85, tolerance: 1e-8 })
    expect(result.converged).toBe(true)
    expect(result.scores.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10)
    expect(result.diagnostics.columnSums.every((sum) => Math.abs(sum - 1) < 1e-9)).toBe(true)
    expect(result.diagnostics.stationaryResidual).toBeLessThan(1e-8)
    expect(result.diagnostics.rawResidual).toBeGreaterThanOrEqual(0)
  })

  it('rejects invalid damping and tolerance values', () => {
    expect(() => runPageRank(single, { damping: 1, tolerance: 1e-6 })).toThrow()
    expect(() => runPageRank(single, { damping: -0.1, tolerance: 1e-6 })).toThrow()
    expect(() => runPageRank(single, { damping: 0.85, tolerance: 0 })).toThrow()
  })

  it('handles an empty graph without producing invalid numbers', () => {
    const result = runPageRank(empty, { damping: 0.85, tolerance: 1e-6 })
    expect(result.scores).toEqual([])
    expect(result.converged).toBe(true)
    expect(result.diagnostics.allFinite).toBe(true)
    expect(result.diagnostics.scoreSum).toBe(0)
  })

  it('reports a limit instead of claiming convergence when the budget is exhausted', () => {
    const result = runPageRank(chain, { damping: 0.85, tolerance: 1e-15, maxIterations: 1 })
    expect(result.converged).toBe(false)
    expect(result.stoppedAtLimit).toBe(true)
    expect(result.iterations).toBe(1)
  })

  it('keeps self-links in the source column without breaking stochasticity', () => {
    const result = buildMatrices(selfLink)
    expect(result.adjacency[0][0]).toBe(1)
    expect(result.transition[0][0]).toBe(1)
    expect(result.transition[0][0] + result.transition[1][0]).toBe(1)
    expect(result.danglingColumns).toEqual([1])
  })
})
