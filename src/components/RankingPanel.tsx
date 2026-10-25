import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import type { Graph, PageRankResult, SortKey } from '../types'
import { graphStats } from '../data/networks'
import { Badge, Panel, PanelHeading } from './ui'

export function RankingPanel({ graph, result, selectedId, onSelect, comparisonResult }: { graph: Graph; result: PageRankResult; selectedId: string | null; onSelect: (id: string) => void; comparisonResult?: PageRankResult }) {
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [descending, setDescending] = useState(true)
  const stats = useMemo(() => graphStats(graph), [graph])
  const rankById = useMemo(() => new Map(result.pageOrder.map((page, index) => [page.id, index + 1])), [result])
  const oldScoreById = useMemo(() => new Map((comparisonResult?.pageOrder ?? []).map((page, index) => [page.id, comparisonResult?.scores[index] ?? 0])), [comparisonResult])
  const oldRankById = useMemo(() => new Map((comparisonResult?.pageOrder ?? []).map((page, index) => [page.id, index + 1])), [comparisonResult])
  const rows = useMemo(() => result.pageOrder.map((page, index) => ({ page, score: result.scores[index] ?? 0 })).sort((a, b) => {
    let diff = 0
    if (sortKey === 'name') diff = a.page.name.localeCompare(b.page.name)
    else if (sortKey === 'incoming') diff = (stats.incoming.get(a.page.id) ?? 0) - (stats.incoming.get(b.page.id) ?? 0)
    else if (sortKey === 'outgoing') diff = (stats.outgoing.get(a.page.id) ?? 0) - (stats.outgoing.get(b.page.id) ?? 0)
    else diff = a.score - b.score
    return descending ? -diff : diff
  }), [result, sortKey, descending, stats])
  const maxScore = Math.max(...result.scores, 0.0001)

  function changeSort(key: SortKey) {
    if (sortKey === key) setDescending((value) => !value)
    else { setSortKey(key); setDescending(key !== 'name') }
  }

  return <Panel id="ranking" className="ranking-panel"><PanelHeading eyebrow="02 / RANKING EXPLORER" title="Who gets the signal?" detail="The scores below are the final vector returned by the current PageRank run." icon={BarChart3} action={<Badge tone="violet">Σ scores = {result.diagnostics.scoreSum.toFixed(5)}</Badge>} />
    <div className="table-toolbar"><span className="table-caption">{result.pageOrder.length} pages ranked · {result.iterations} iterations</span><div className="sort-controls">{(['score', 'name', 'incoming', 'outgoing'] as SortKey[]).map((key) => <button key={key} className={sortKey === key ? 'active' : ''} onClick={() => changeSort(key)}>{key === 'score' ? 'Score' : key[0].toUpperCase() + key.slice(1)} {sortKey === key && (descending ? <ChevronDown size={13} /> : <ChevronUp size={13} />)}</button>)}</div></div>
    <div className="ranking-table"><div className="ranking-header"><span>#</span><span>Page</span><span>Score / weight</span><span>Links</span><span>Movement</span></div>{rows.map(({ page, score }) => { const rank = rankById.get(page.id) ?? 0; const oldScore = oldScoreById.get(page.id); const scoreDelta = oldScore === undefined ? undefined : score - oldScore; const rankDelta = oldRankById.get(page.id) === undefined ? undefined : (oldRankById.get(page.id) ?? rank) - rank; const max = maxScore ? (score / maxScore) * 100 : 0; return <button key={page.id} className={`ranking-row ${selectedId === page.id ? 'selected' : ''}`} onClick={() => onSelect(page.id)}><span className={`rank-number ${rank === 1 ? 'first' : ''}`}>{String(rank).padStart(2, '0')}</span><span className="page-cell"><span className="table-avatar">{page.name.slice(0, 1)}</span><span><strong>{page.name}</strong><small>{rank === 1 ? 'highest current score' : 'select to highlight'}</small></span></span><span className="score-cell"><strong>{score.toFixed(5)}</strong><span className="score-bar"><i style={{ width: `${max}%` }} /></span><small>{(score * 100).toFixed(2)}% of total</small></span><span className="link-counts"><span>↗ {stats.outgoing.get(page.id) ?? 0}</span><span>↙ {stats.incoming.get(page.id) ?? 0}</span></span><span className="movement-cell">{scoreDelta === undefined ? <Badge tone="neutral">baseline</Badge> : <><span className={scoreDelta >= 0 ? 'delta-up' : 'delta-down'}>{scoreDelta >= 0 ? <ArrowUp size={13} /> : <ArrowDown size={13} />}{Math.abs(scoreDelta).toFixed(4)}</span><small>{rankDelta === 0 ? 'same rank' : rankDelta && rankDelta > 0 ? `up ${rankDelta}` : `down ${Math.abs(rankDelta ?? 0)}`}</small></>}</span></button> })}</div>
  </Panel>
}
