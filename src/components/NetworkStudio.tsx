import { useMemo, useState } from 'react'
import { ArrowDownRight, Link2, Plus, RotateCcw, Trash2, WandSparkles } from 'lucide-react'
import type { Graph, PageRankResult } from '../types'
import { graphStats } from '../data/networks'
import { Badge, Button, Panel, PanelHeading } from './ui'

const NODE_RADIUS = 29

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function NetworkStudio({ graph, result, selectedId, dirty, onSelect, onGraphChange, onRun, onReset, onPreset, presets, damping, tolerance, onDampingChange, onToleranceChange }: {
  graph: Graph
  result: PageRankResult
  selectedId: string | null
  dirty: boolean
  onSelect: (id: string) => void
  onGraphChange: (graph: Graph) => void
  onRun: () => void
  onReset: () => void
  onPreset: (id: string) => void
  presets: Array<{ id: string; name: string; description: string }>
  damping: number
  tolerance: number
  onDampingChange: (value: number) => void
  onToleranceChange: (value: number) => void
}) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [newPageName, setNewPageName] = useState('')
  const [renameValue, setRenameValue] = useState('')
  const [source, setSource] = useState('')
  const [target, setTarget] = useState('')
  const stats = useMemo(() => graphStats(graph), [graph])
  const scoreById = useMemo(() => new Map(result.pageOrder.map((page, index) => [page.id, result.scores[index] ?? 0])), [result])
  const topId = result.pageOrder[result.scores.indexOf(Math.max(...result.scores, 0))]?.id
  const selected = graph.nodes.find((node) => node.id === selectedId)
  const incoming = selected ? graph.links.filter((link) => link.target === selected.id).map((link) => graph.nodes.find((node) => node.id === link.source)?.name).filter(Boolean) : []
  const outgoing = selected ? graph.links.filter((link) => link.source === selected.id).map((link) => graph.nodes.find((node) => node.id === link.target)?.name).filter(Boolean) : []

  function updateNodePosition(id: string, x: number, y: number) {
    onGraphChange({ ...graph, nodes: graph.nodes.map((node) => node.id === id ? { ...node, x: Math.max(45, Math.min(655, x)), y: Math.max(50, Math.min(455, y)) } : node) })
  }

  function addPage() {
    const name = newPageName.trim()
    if (!name) return
    const base = slugify(name) || `page-${graph.nodes.length + 1}`
    let id = base
    let suffix = 2
    while (graph.nodes.some((node) => node.id === id)) id = `${base}-${suffix++}`
    const angle = graph.nodes.length * 1.7
    onGraphChange({ ...graph, nodes: [...graph.nodes, { id, name, x: 350 + Math.cos(angle) * 220, y: 250 + Math.sin(angle) * 170 }] })
    setNewPageName('')
    onSelect(id)
  }

  function renamePage() {
    if (!selected || !renameValue.trim()) return
    onGraphChange({ ...graph, nodes: graph.nodes.map((node) => node.id === selected.id ? { ...node, name: renameValue.trim() } : node) })
    setRenameValue('')
  }

  function deletePage() {
    if (!selected || !window.confirm(`Delete ${selected.name} and all of its links?`)) return
    onGraphChange({ nodes: graph.nodes.filter((node) => node.id !== selected.id), links: graph.links.filter((link) => link.source !== selected.id && link.target !== selected.id) })
  }

  function addLink() {
    if (!source || !target || source === target || graph.links.some((link) => link.source === source && link.target === target)) return
    onGraphChange({ ...graph, links: [...graph.links, { source, target }] })
    setSource(''); setTarget('')
  }

  function removeLink(sourceId: string, targetId: string) {
    onGraphChange({ ...graph, links: graph.links.filter((link) => !(link.source === sourceId && link.target === targetId)) })
  }

  const rankLabel = topId === selectedId ? 'Top-ranked' : undefined
  return (
    <Panel id="studio" className="studio-panel">
      <PanelHeading eyebrow="01 / NETWORK STUDIO" title="Build the web you want to study" detail="Drag pages into place, shape the hyperlink structure, then run the actual calculation." icon={WandSparkles} action={<Badge tone={dirty ? 'amber' : 'mint'} dot>{dirty ? 'Results need a fresh run' : 'Calculation is current'}</Badge>} />
      <div className="studio-layout">
        <div className="network-canvas-wrap">
          <div className="canvas-toolbar">
            <div className="canvas-hint"><span className="signal-dot" /> Drag nodes · click to inspect · arrows show outgoing links</div>
            <div className="canvas-stats"><span>{graph.nodes.length} pages</span><span>{graph.links.length} links</span></div>
          </div>
          <svg className="network-canvas" viewBox="0 0 700 510" role="img" aria-label="Editable directed page network" onPointerMove={(event) => {
            if (!dragId) return
            const rect = event.currentTarget.getBoundingClientRect()
            updateNodePosition(dragId, ((event.clientX - rect.left) / rect.width) * 700, ((event.clientY - rect.top) / rect.height) * 510)
          }} onPointerUp={() => setDragId(null)} onPointerLeave={() => setDragId(null)}>
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto"><path d="M0,0 L8,3.5 L0,7 z" fill="#716d97" /></marker>
              <marker id="arrow-active" markerWidth="8" markerHeight="8" refX="7" refY="3.5" orient="auto"><path d="M0,0 L8,3.5 L0,7 z" fill="#8b7cff" /></marker>
            </defs>
            <g className="canvas-grid">{Array.from({ length: 9 }, (_, index) => <line key={`v-${index}`} x1={50 + index * 75} y1="25" x2={50 + index * 75} y2="485" />)}{Array.from({ length: 7 }, (_, index) => <line key={`h-${index}`} x1="25" y1={55 + index * 70} x2="675" y2={55 + index * 70} />)}</g>
            {graph.links.map((link) => {
              const from = graph.nodes.find((node) => node.id === link.source)
              const to = graph.nodes.find((node) => node.id === link.target)
              if (!from || !to) return null
              const active = link.source === selectedId || link.target === selectedId
              const dx = to.x - from.x; const dy = to.y - from.y; const distance = Math.sqrt(dx * dx + dy * dy) || 1
              const sx = from.x + (dx / distance) * NODE_RADIUS; const sy = from.y + (dy / distance) * NODE_RADIUS
              const tx = to.x - (dx / distance) * NODE_RADIUS; const ty = to.y - (dy / distance) * NODE_RADIUS
              return <line key={`${link.source}-${link.target}`} x1={sx} y1={sy} x2={tx} y2={ty} className={`network-link ${active ? 'active' : ''}`} markerEnd={`url(#${active ? 'arrow-active' : 'arrow'})`} />
            })}
            {graph.nodes.map((node) => {
              const isSelected = node.id === selectedId
              const dangling = (stats.outgoing.get(node.id) ?? 0) === 0
              const isTop = node.id === topId
              const score = scoreById.get(node.id) ?? 0
              return <g key={node.id} className={`network-node ${isSelected ? 'selected' : ''} ${isTop ? 'top' : ''} ${dangling ? 'dangling' : ''}`} transform={`translate(${node.x} ${node.y})`} onPointerDown={(event) => { event.stopPropagation(); setDragId(node.id); onSelect(node.id) }}>
                <circle r={NODE_RADIUS + (isSelected ? 5 : 0)} className="node-halo" />
                <circle r={NODE_RADIUS} className="node-circle" />
                <text className="node-initial" textAnchor="middle" y="5">{node.name.slice(0, 1).toUpperCase()}</text>
                <text className="node-name" textAnchor="middle" y="52">{node.name}</text>
                <text className="node-score" textAnchor="middle" y="67">{score.toFixed(3)}</text>
              </g>
            })}
          </svg>
          <div className="legend"><span><i className="legend-dot legend-top" /> top rank</span><span><i className="legend-dot legend-dangling" /> dangling</span><span><i className="legend-dot legend-selected" /> selected</span></div>
        </div>
        <aside className="studio-controls">
          <div className="control-block run-block">
            <div className="control-label">Calculation controls</div>
            <div className="param-grid">
              <label>Damping <input type="number" min="0" max="0.99" step="0.05" value={damping} onChange={(event) => onDampingChange(Number(event.target.value))} /></label>
              <label>Tolerance <select value={tolerance} onChange={(event) => onToleranceChange(Number(event.target.value))}><option value={1e-3}>1e-3</option><option value={1e-6}>1e-6</option><option value={1e-8}>1e-8</option></select></label>
            </div>
            <Button variant="primary" className="full-button" icon={ArrowDownRight} onClick={onRun}>Run PageRank</Button>
            <div className="micro-note">Column-stochastic P · uniform teleportation · max 10,000 iterations</div>
          </div>
          <div className="control-block">
            <div className="control-label">Load a structure</div>
            <div className="preset-list">{presets.map((preset) => <button key={preset.id} className="preset-button" onClick={() => onPreset(preset.id)}><span>{preset.name}</span><small>{preset.description}</small></button>)}</div>
            <Button variant="ghost" size="sm" icon={RotateCcw} onClick={onReset}>Reset to demo network</Button>
          </div>
          <div className="control-block">
            <div className="control-label">Add a page</div>
            <div className="inline-input"><input value={newPageName} onChange={(event) => setNewPageName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addPage()} placeholder="e.g. Glossary" /><Button size="sm" variant="secondary" icon={Plus} onClick={addPage}>Add</Button></div>
          </div>
          <div className="control-block">
            <div className="control-label">Add a directed link</div>
            <div className="link-inputs"><select value={source} onChange={(event) => setSource(event.target.value)}><option value="">From page…</option>{graph.nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select><span>→</span><select value={target} onChange={(event) => setTarget(event.target.value)}><option value="">To page…</option>{graph.nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select></div>
            <Button size="sm" variant="secondary" icon={Link2} onClick={addLink} disabled={!source || !target || source === target}>Create link</Button>
          </div>
        </aside>
      </div>
      <div className="studio-bottom">
        <div className="selected-inspector">
          <div className="inspector-kicker">Selected page</div>
          {selected ? <><div className="selected-name"><span className="selected-avatar">{selected.name.slice(0, 1)}</span><div><strong>{selected.name}</strong><span>{rankLabel ?? (stats.outgoing.get(selected.id) === 0 ? 'No outgoing links' : 'Active page')}</span></div></div><div className="inspector-stats"><span><b>{(scoreById.get(selected.id) ?? 0).toFixed(5)}</b><small>PageRank</small></span><span><b>{incoming.length}</b><small>Incoming</small></span><span><b>{outgoing.length}</b><small>Outgoing</small></span></div><div className="link-summary"><span>In: {incoming.length ? incoming.join(', ') : 'none'}</span><span>Out: {outgoing.length ? outgoing.join(', ') : 'none'}</span></div></> : <div className="muted-copy">Select a node to inspect its local neighbourhood.</div>}
        </div>
        <div className="edit-inspector">
          <div className="inspector-kicker">Edit selected page</div>
          <div className="inline-input"><input value={renameValue} onChange={(event) => setRenameValue(event.target.value)} placeholder={selected ? `Rename ${selected.name}` : 'Select a page first'} disabled={!selected} /><Button size="sm" variant="secondary" onClick={renamePage} disabled={!selected || !renameValue.trim()}>Rename</Button></div>
          {selected && <Button size="sm" variant="danger" icon={Trash2} onClick={deletePage}>Delete page</Button>}
        </div>
        <div className="link-inspector"><div className="inspector-kicker">Links · click to remove</div><div className="link-chip-list">{graph.links.length ? graph.links.map((link) => <button key={`${link.source}-${link.target}`} className="link-chip" onClick={() => removeLink(link.source, link.target)}>{graph.nodes.find((node) => node.id === link.source)?.name} <span>→</span> {graph.nodes.find((node) => node.id === link.target)?.name} <Trash2 size={12} /></button>) : <span className="muted-copy">No links yet.</span>}</div></div>
      </div>
    </Panel>
  )
}
