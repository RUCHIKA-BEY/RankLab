export type PageNode = {
  id: string
  name: string
  x: number
  y: number
}

export type Link = {
  source: string
  target: string
}

export type Graph = {
  nodes: PageNode[]
  links: Link[]
}

export type IterationSnapshot = {
  iteration: number
  vector: number[]
  difference?: number
}

export type VerificationCheck = {
  label: string
  value: string
  pass: boolean
  detail: string
}

export type PageRankResult = {
  pageOrder: PageNode[]
  adjacency: number[][]
  transition: number[][]
  danglingColumns: number[]
  initialVector: number[]
  history: IterationSnapshot[]
  differences: number[]
  scores: number[]
  iterations: number
  finalDifference: number
  converged: boolean
  stoppedAtLimit: boolean
  damping: number
  tolerance: number
  maxIterations: number
  diagnostics: {
    scoreSum: number
    allFinite: boolean
    nonnegative: boolean
    columnSums: number[]
    columnSumsPass: boolean
    stationaryResidual: number
    rawResidual: number
    checks: VerificationCheck[]
  }
}

export type RunConfig = {
  damping: number
  tolerance: number
  maxIterations?: number
}

export type SortKey = 'rank' | 'name' | 'score' | 'incoming' | 'outgoing'

export type ExperimentRun = {
  label: string
  result: PageRankResult
}
