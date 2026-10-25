import type { Graph, Link, PageNode } from '../types'

const node = (id: string, name: string, x: number, y: number): PageNode => ({ id, name, x, y })
const link = (source: string, target: string): Link => ({ source, target })

export const DEFAULT_GRAPH: Graph = {
  nodes: [
    node('home', 'Home', 130, 160),
    node('research', 'Research', 350, 88),
    node('tutorials', 'Tutorials', 565, 150),
    node('projects', 'Projects', 565, 325),
    node('resources', 'Resources', 330, 390),
    node('contact', 'Contact', 115, 370),
  ],
  links: [
    link('home', 'research'),
    link('home', 'tutorials'),
    link('research', 'tutorials'),
    link('research', 'resources'),
    link('tutorials', 'projects'),
    link('tutorials', 'research'),
    link('projects', 'resources'),
    link('projects', 'home'),
    link('resources', 'home'),
    link('resources', 'contact'),
  ],
}

export const HANDWORK_GRAPH: Graph = {
  nodes: [
    node('alpha', 'Alpha', 150, 220),
    node('beta', 'Beta', 380, 115),
    node('gamma', 'Gamma', 610, 220),
  ],
  links: [link('alpha', 'beta'), link('beta', 'gamma'), link('gamma', 'alpha'), link('alpha', 'gamma')],
}

export const HUB_GRAPH: Graph = {
  nodes: [
    node('hub', 'Hub', 375, 220),
    node('one', 'Article A', 110, 105),
    node('two', 'Article B', 640, 105),
    node('three', 'Article C', 110, 385),
    node('four', 'Article D', 640, 385),
    node('quiet', 'Archive', 375, 455),
  ],
  links: [
    link('one', 'hub'), link('two', 'hub'), link('three', 'hub'), link('four', 'hub'),
    link('hub', 'one'), link('hub', 'two'), link('hub', 'three'), link('hub', 'four'),
    link('quiet', 'hub'),
  ],
}

export const DISCONNECTED_GRAPH: Graph = {
  nodes: [
    node('left', 'Left', 155, 170),
    node('left2', 'Left 2', 275, 290),
    node('right', 'Right', 535, 170),
    node('right2', 'Right 2', 655, 290),
    node('island', 'Island', 405, 430),
  ],
  links: [link('left', 'left2'), link('left2', 'left'), link('right', 'right2'), link('right2', 'right')],
}

export const PRESETS: Array<{ id: string; name: string; description: string; graph: Graph }> = [
  { id: 'demo', name: 'Demo network', description: 'Six pages, a cycle, and one dangling page', graph: DEFAULT_GRAPH },
  { id: 'handwork', name: 'Hand-work example', description: 'Three pages for explaining the matrices by hand', graph: HANDWORK_GRAPH },
  { id: 'hub', name: 'Hub and spoke', description: 'A concentrated authority pattern', graph: HUB_GRAPH },
  { id: 'disconnected', name: 'Disconnected islands', description: 'Two cyclic components and an isolated page', graph: DISCONNECTED_GRAPH },
]

export function cloneGraph(graph: Graph): Graph {
  return {
    nodes: graph.nodes.map((item) => ({ ...item })),
    links: graph.links.map((item) => ({ ...item })),
  }
}

export function graphStats(graph: Graph) {
  const outgoing = new Map<string, number>()
  const incoming = new Map<string, number>()
  graph.nodes.forEach((item) => { outgoing.set(item.id, 0); incoming.set(item.id, 0) })
  graph.links.forEach(({ source, target }) => {
    outgoing.set(source, (outgoing.get(source) ?? 0) + 1)
    incoming.set(target, (incoming.get(target) ?? 0) + 1)
  })
  return { outgoing, incoming }
}
