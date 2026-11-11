import { useEffect, useMemo, useState } from 'react'
import { Activity, ChevronLeft, ChevronRight, Crosshair, Pause, Play } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Graph, PageRankResult } from '../types'
import { Badge, Button, Metric, Panel, PanelHeading } from './ui'

export function ConvergencePanel({ result, graph, selectedId, onSelect, stepIndex, onStepIndex }: { result: PageRankResult; graph: Graph; selectedId: string | null; onSelect: (id: string) => void; stepIndex: number; onStepIndex: (index: number) => void }) {
  const chartData = result.history.slice(1).map((snapshot) => ({ iteration: snapshot.iteration, difference: snapshot.difference ?? 0 }))
  const activeSnapshot = result.history[Math.min(stepIndex, result.history.length - 1)]
  const selectedIndex = result.pageOrder.findIndex((node) => node.id === selectedId)
  const selectedName = selectedIndex >= 0 ? result.pageOrder[selectedIndex].name : 'a page'
  const selectedSeries = useMemo(() => result.history.map((snapshot) => ({ iteration: snapshot.iteration, score: snapshot.vector[selectedIndex] ?? 0 })), [result, selectedIndex])
  const hasHistory = result.history.length > 1
  const lastIndex = result.history.length - 1
  const [playing, setPlaying] = useState(false)
  const peakScore = useMemo(() => Math.max(...result.history.flatMap((snapshot) => snapshot.vector), 1e-9), [result])
  const seriesPeak = Math.max(...selectedSeries.map((point) => point.score), 1e-9)
  // Show the whole trace: sample evenly when there are more snapshots than bars.
  const traceBars = useMemo(() => {
    const limit = 28
    if (selectedSeries.length <= limit) return selectedSeries
    return Array.from({ length: limit }, (_, index) => selectedSeries[Math.round((index / (limit - 1)) * (selectedSeries.length - 1))])
  }, [selectedSeries])

  useEffect(() => { setPlaying(false) }, [result])
  useEffect(() => {
    if (!playing) return
    if (stepIndex >= lastIndex) { setPlaying(false); return }
    const timer = window.setTimeout(() => onStepIndex(Math.min(lastIndex, stepIndex + Math.max(1, Math.ceil(lastIndex / 60)))), 320)
    return () => window.clearTimeout(timer)
  }, [playing, stepIndex, lastIndex, onStepIndex])

  function togglePlay() {
    if (playing) { setPlaying(false); return }
    if (stepIndex >= lastIndex) onStepIndex(0)
    setPlaying(true)
  }
  return <Panel id="convergence" className="convergence-panel"><PanelHeading eyebrow="03 / CONVERGENCE OBSERVATORY" title="Watch the vector settle" detail="Every point comes from an actual iteration. A falling L1 difference means successive score vectors are becoming harder to distinguish." icon={Activity} action={<Badge tone={result.converged ? 'mint' : 'amber'} dot>{result.converged ? `Converged in ${result.iterations}` : 'Iteration limit reached'}</Badge>} />
    <div className="convergence-grid"><div className="chart-card"><div className="chart-card-head"><div><strong>L1 difference · Δₖ</strong><span>lower is closer to a stable ranking</span></div><span className="chart-pill">ε = {result.tolerance.toExponential(0)}</span></div>{hasHistory ? <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 14, right: 18, left: 0, bottom: 4 }}><CartesianGrid stroke="#242a44" strokeDasharray="3 4" vertical={false} /><XAxis dataKey="iteration" tick={{ fill: '#7f86a9', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis scale="log" domain={[(dataMin: number) => Math.min(dataMin, result.tolerance) * 0.5, 'auto']} allowDataOverflow tick={{ fill: '#7f86a9', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => Number(value).toExponential(0)} width={48} /><Tooltip contentStyle={{ background: '#151a2d', border: '1px solid #323957', borderRadius: 10, color: '#f6f7ff' }} labelStyle={{ color: '#a2a7c3' }} formatter={(value) => [Number(value).toExponential(4), 'L1 difference']} /><ReferenceLine y={result.tolerance} stroke="#c89752" strokeDasharray="5 5" label={{ value: `tolerance ε = ${result.tolerance.toExponential(0)}`, fill: '#d7a866', fontSize: 11, position: 'insideBottomLeft' }} />{activeSnapshot && activeSnapshot.iteration > 0 && <ReferenceLine x={activeSnapshot.iteration} stroke="#8b7cff" strokeOpacity={0.45} />}<Line type="monotone" dataKey="difference" stroke="#8b7cff" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#8b7cff' }} /></LineChart></ResponsiveContainer></div> : <div className="chart-empty"><Crosshair size={22} /><strong>Run a graph with at least one iteration</strong><span>The first run will populate the actual error curve.</span></div>}<div className="chart-foot"><span>start Δ₀ → {chartData[0]?.difference.toExponential(2) ?? '—'}</span><span>stop Δₖ → {result.finalDifference.toExponential(2)}</span></div></div>
      <div className="step-card"><div className="chart-card-head"><div><strong>Step-through mode</strong><span>advance through stored vectors</span></div><Badge tone="violet">k = {activeSnapshot?.iteration ?? 0}</Badge></div><div className="step-vector">{result.pageOrder.map((node, index) => <button key={node.id} className={selectedId === node.id ? 'active' : ''} onClick={() => onSelect(node.id)}><span>{node.name}</span><strong>{(activeSnapshot?.vector[index] ?? 0).toFixed(5)}</strong><i style={{ width: `${Math.min(((activeSnapshot?.vector[index] ?? 0) / peakScore) * 100, 100)}%` }} /></button>)}</div><div className="step-controls"><Button size="sm" variant="primary" icon={playing ? Pause : Play} onClick={togglePlay} disabled={!hasHistory}>{playing ? 'Pause' : stepIndex >= lastIndex ? 'Replay' : 'Play'}</Button><Button size="sm" variant="secondary" icon={ChevronLeft} aria-label="Previous iteration" onClick={() => { setPlaying(false); onStepIndex(Math.max(0, stepIndex - 1)) }} disabled={stepIndex <= 0}>Prev</Button><div className="step-progress"><span>k = {activeSnapshot?.iteration ?? 0} of {result.iterations}</span><div><i style={{ width: `${((stepIndex + 1) / Math.max(result.history.length, 1)) * 100}%` }} /></div></div><Button size="sm" variant="secondary" icon={ChevronRight} aria-label="Next iteration" onClick={() => { setPlaying(false); onStepIndex(Math.min(result.history.length - 1, stepIndex + 1)) }} disabled={stepIndex >= result.history.length - 1}>Next</Button></div><div className="selected-series"><div className="series-head"><span>Score trace for <b>{selectedName}</b></span><span>k = 0 → {result.iterations}</span></div><div className="series-bars">{traceBars.map((point) => <div key={point.iteration} className={point.iteration === activeSnapshot?.iteration ? 'current' : ''} title={`k=${point.iteration}: ${point.score.toFixed(5)}`}><i style={{ height: `${Math.max(4, (point.score / seriesPeak) * 100)}%` }} /></div>)}</div></div></div></div>
    <div className="convergence-summary"><Metric label="Stop condition" value={result.converged ? 'Satisfied' : 'Not met'} detail={result.converged ? `Δ < ${result.tolerance.toExponential(0)}` : `max ${result.maxIterations} iterations`} tone={result.converged ? 'mint' : 'amber'} /><Metric label="Iterations" value={result.iterations} detail="actual vector updates" /><Metric label="Final L1" value={result.finalDifference.toExponential(3)} detail="successive-vector difference" /><Metric label="Why smaller ε?" value="More precision" detail="usually means more computation" tone="violet" /></div>
  </Panel>
}
