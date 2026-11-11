import { useEffect, useMemo, useState } from 'react'
import { Activity, Beaker, BookOpen, Check, ChevronRight, CircleHelp, Gauge, GitBranch, Info, Layers3, Play, RotateCcw, Sparkles, Target, Workflow, X } from 'lucide-react'
import { cloneGraph, DEFAULT_GRAPH, PRESETS } from './data/networks'
import { runPageRank } from './engine/pagerank'
import type { Graph, PageRankResult } from './types'
import { Badge, Button, Metric, MiniSpark } from './components/ui'
import { NetworkStudio } from './components/NetworkStudio'
import { RankingPanel } from './components/RankingPanel'
import { ConvergencePanel } from './components/ConvergencePanel'
import { MathLab } from './components/MathLab'
import { ExperimentLab } from './components/ExperimentLab'
import './styles.css'

const DEFAULT_DAMPING = 0.85
const DEFAULT_TOLERANCE = 1e-6
const initialGraph = cloneGraph(DEFAULT_GRAPH)
const initialResult = runPageRank(initialGraph, { damping: DEFAULT_DAMPING, tolerance: DEFAULT_TOLERANCE })

// Only names and links affect the calculation; dragging a node must not invalidate results.
const structureKey = (graph: Graph) => JSON.stringify([graph.nodes.map((node) => [node.id, node.name]), graph.links.map((link) => [link.source, link.target])])

const navItems = [
  { id: 'overview', label: 'Overview', icon: Layers3 },
  { id: 'studio', label: 'Network Studio', icon: GitBranch },
  { id: 'ranking', label: 'Ranking Explorer', icon: Target },
  { id: 'convergence', label: 'Convergence', icon: Activity },
  { id: 'math', label: 'Mathematics Lab', icon: BookOpen },
  { id: 'experiments', label: 'Experiment Lab', icon: Beaker },
]

function App() {
  const [graph, setGraph] = useState<Graph>(initialGraph)
  const [baselineGraph, setBaselineGraph] = useState<Graph>(cloneGraph(initialGraph))
  const [committedGraph, setCommittedGraph] = useState<Graph>(cloneGraph(initialGraph))
  const [result, setResult] = useState<PageRankResult>(initialResult)
  const [baselineResult, setBaselineResult] = useState<PageRankResult>(initialResult)
  const [damping, setDamping] = useState(DEFAULT_DAMPING)
  const [tolerance, setTolerance] = useState(DEFAULT_TOLERANCE)
  const [selectedId, setSelectedId] = useState<string | null>('research')
  const [dirty, setDirty] = useState(false)
  const [comparisonAvailable, setComparisonAvailable] = useState(false)
  const [activeNav, setActiveNav] = useState('overview')
  const [stepIndex, setStepIndex] = useState(initialResult.history.length - 1)
  const [walkthrough, setWalkthrough] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const topIndex = result.scores.indexOf(Math.max(...result.scores, 0))
  const topPage = result.pageOrder[topIndex]
  const danglingCount = result.danglingColumns.length
  const sectionCount = graph.nodes.length
  const presetSummary = useMemo(() => PRESETS.map(({ id, name, description }) => ({ id, name, description })), [])

  useEffect(() => {
    // Keep the navigation highlight in sync with the section currently being read.
    const sections = navItems.map(({ id }) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null)
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visible) setActiveNav(visible.target.id)
    }, { rootMargin: '-15% 0px -70% 0px' })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  function scrollTo(id: string) {
    setActiveNav(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function markGraphChanged(next: Graph) {
    setGraph(next)
    if (structureKey(next) !== structureKey(graph)) setDirty(true)
    setError(null)
    if (selectedId && !next.nodes.some((node) => node.id === selectedId)) setSelectedId(next.nodes[0]?.id ?? null)
  }

  function handleRun() {
    try {
      const next = runPageRank(graph, { damping, tolerance })
      if (dirty) {
        // The previous committed run becomes the "before" side of every comparison.
        setBaselineGraph(committedGraph)
        setBaselineResult(result)
        setCommittedGraph(cloneGraph(graph))
        setComparisonAvailable(true)
      }
      setResult(next)
      setDirty(false)
      setStepIndex(next.history.length - 1)
      setError(null)
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Unable to run PageRank.')
    }
  }

  function handlePreset(id: string) {
    const preset = PRESETS.find((item) => item.id === id)
    if (!preset) return
    const next = cloneGraph(preset.graph)
    setGraph(next)
    setSelectedId(next.nodes[0]?.id ?? null)
    try {
      // A preset is a fresh starting point: calculate it immediately so every panel describes the visible graph.
      const nextResult = runPageRank(next, { damping, tolerance })
      setBaselineGraph(cloneGraph(next)); setCommittedGraph(cloneGraph(next)); setResult(nextResult); setBaselineResult(nextResult)
      setComparisonAvailable(false); setStepIndex(nextResult.history.length - 1); setDirty(false); setError(null)
    } catch (runError) {
      setDirty(true)
      setError(runError instanceof Error ? runError.message : 'Unable to run PageRank.')
    }
  }

  function handleReset() {
    const nextGraph = cloneGraph(DEFAULT_GRAPH)
    const nextResult = runPageRank(nextGraph, { damping: DEFAULT_DAMPING, tolerance: DEFAULT_TOLERANCE })
    setGraph(nextGraph); setBaselineGraph(cloneGraph(nextGraph)); setCommittedGraph(cloneGraph(nextGraph)); setResult(nextResult); setBaselineResult(nextResult)
    setDamping(DEFAULT_DAMPING); setTolerance(DEFAULT_TOLERANCE); setSelectedId('research'); setDirty(false); setComparisonAvailable(false); setStepIndex(nextResult.history.length - 1); setError(null)
  }

  function updateDamping(value: number) {
    if (!Number.isFinite(value)) return
    setDamping(Math.max(0, Math.min(0.99, value)))
    setDirty(true)
  }

  function updateTolerance(value: number) {
    setTolerance(value)
    setDirty(true)
  }

  return <div className="app-shell">
    <aside className="side-rail">
      <button className="brand-mark" onClick={() => scrollTo('overview')} aria-label="Go to RankLab overview"><span><i /><i /><i /></span><strong>Rank<span>Lab</span></strong></button>
      <div className="rail-rule" />
      <div className="rail-label">WORKSPACE</div>
      <nav className="rail-nav" aria-label="Sections">{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={activeNav === id ? 'active' : ''} aria-current={activeNav === id ? 'true' : undefined} aria-label={label} title={label} onClick={() => scrollTo(id)}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{activeNav === id && <i className="nav-active" />}</button>)}</nav>
      <div className="rail-bottom"><button className="rail-help" onClick={() => setWalkthrough((value) => !value)}><CircleHelp size={17} /><span>Guided walkthrough</span></button><div className="rail-version"><span className="status-pulse" /> local calculation engine <small>v0.1 · no black boxes</small></div></div>
    </aside>
    <main className="main-shell">
      <header className="topbar"><div className="topbar-title"><span className="mobile-brand"><i /><i /><i /></span><div><span>RANKLAB / PAGE RANK LABORATORY</span><strong>Explore how links become authority.</strong></div></div><div className="topbar-actions"><Badge tone={dirty ? 'amber' : 'mint'} dot>{dirty ? 'Results out of date' : 'Model is current'}</Badge><button className="icon-button" onClick={() => setWalkthrough((value) => !value)} aria-label="Toggle walkthrough"><CircleHelp size={18} /></button></div></header>
      <div className="page-content">
        {error && <div className="error-banner"><Info size={17} /><span>{error}</span><button onClick={() => setError(null)} aria-label="Dismiss error"><X size={15} /></button></div>}
        {walkthrough && <div className="walkthrough"><div className="walkthrough-mark"><Sparkles size={16} /></div><div><strong>A clean viva path</strong><p>Start at the network studio, run the model, click a page to connect the graph with its score, then open convergence and the math lab. Finish in Experiment Lab to show one controlled change at a time.</p></div><button onClick={() => setWalkthrough(false)} aria-label="Close walkthrough"><X size={15} /></button></div>}
        <section id="overview" className="hero-section">
          <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> interactive mathematics / 01</div><h1>See the <em>rank</em><br />move.</h1><p className="hero-lede">RankLab turns hyperlink structure into a transparent experiment. Shape a network, run the damped random walk, and inspect every step between adjacency and authority.</p><div className="hero-actions"><Button variant="primary" icon={Play} onClick={() => scrollTo('studio')}>Start exploring</Button><Button variant="ghost" icon={BookOpen} onClick={() => scrollTo('math')}>Read the model</Button></div><div className="hero-note"><span className="signal-dot" /> Built for explanation, not just output <span className="note-divider" /> <span>column-stochastic convention</span></div></div>
          <div className="hero-instrument"><div className="instrument-head"><div><span className="eyebrow">LIVE MODEL / DEMO NETWORK</span><strong>Convergence signal</strong></div><Badge tone={result.converged ? 'mint' : 'amber'} dot>{result.converged ? 'stable' : 'needs review'}</Badge></div><div className="hero-chart"><MiniSpark values={result.differences.length ? result.differences : [0.2, 0.08, 0.03, 0.01]} /><div className="chart-axis"><span>k = 0</span><span>iteration {result.iterations}</span></div></div><div className="instrument-readout"><div><span>top page</span><strong>{topPage?.name ?? '—'}</strong></div><div><span>final Δ</span><strong>{result.finalDifference.toExponential(2)}</strong></div><div><span>pages / links</span><strong>{graph.nodes.length} / {graph.links.length}</strong></div></div></div>
          <div className="hero-metrics"><Metric label="Current top rank" value={topPage?.name ?? '—'} detail={topPage ? `${(result.scores[topIndex] * 100).toFixed(2)}% of total weight` : 'run a graph'} tone="violet" /><Metric label="Damping factor" value={damping.toFixed(2)} detail="probability of following P" /><Metric label="Tolerance" value={tolerance.toExponential(0)} detail={`${result.iterations} iterations last run`} /><Metric label="Dangling pages" value={danglingCount} detail={danglingCount ? 'uniform columns corrected' : 'none detected'} tone={danglingCount ? 'amber' : 'mint'} /></div>
        </section>
        <section className="configuration-strip"><div className="config-copy"><Gauge size={17} /><div><strong>Current run configuration</strong><span>Change a parameter to invalidate the visible result, then rerun to make the evidence current.</span></div></div><div className="config-controls"><label>damping <input aria-label="Damping factor" type="number" min="0" max="0.99" step="0.05" value={damping} onChange={(event) => updateDamping(Number(event.target.value))} /></label><label>tolerance <select aria-label="Convergence tolerance" value={tolerance} onChange={(event) => updateTolerance(Number(event.target.value))}><option value={1e-3}>1e-3</option><option value={1e-6}>1e-6</option><option value={1e-8}>1e-8</option></select></label><Button size="sm" variant="primary" icon={Workflow} onClick={handleRun}>Run current model</Button></div></section>
        {dirty && <div className="stale-banner"><Info size={15} /><span><strong>Last run is shown below.</strong> The graph or parameters changed; run the current model before treating rankings, matrices, convergence, or verification as evidence for this configuration.</span><Button size="sm" variant="primary" onClick={handleRun}>Refresh evidence</Button></div>}
        <NetworkStudio graph={graph} result={result} selectedId={selectedId} dirty={dirty} onSelect={setSelectedId} onGraphChange={markGraphChanged} onRun={handleRun} onReset={handleReset} onPreset={handlePreset} presets={presetSummary} damping={damping} tolerance={tolerance} onDampingChange={updateDamping} onToleranceChange={updateTolerance} />
        <RankingPanel graph={graph} result={result} selectedId={selectedId} onSelect={setSelectedId} comparisonResult={comparisonAvailable ? baselineResult : undefined} />
        <ConvergencePanel graph={graph} result={result} selectedId={selectedId} onSelect={setSelectedId} stepIndex={stepIndex} onStepIndex={setStepIndex} />
        <MathLab result={result} selectedId={selectedId} />
        <ExperimentLab graph={graph} baselineGraph={baselineGraph} currentResult={result} damping={damping} tolerance={tolerance} onReset={() => setComparisonAvailable(false)} />
        <footer className="page-footer"><div><span className="brand-footer">Rank<span>Lab</span></span><span>an interactive PageRank laboratory for transparent mathematical exploration</span></div><div><span>React + TypeScript</span><span>explicit matrix engine</span><span>finite, nonnegative, verifiable</span></div></footer>
      </div>
    </main>
  </div>
}

export default App
