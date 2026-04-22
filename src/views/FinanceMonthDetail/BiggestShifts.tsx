import React from 'react'
import { MONTH_LONG, makeMoneyFormatters, type ResolvedCurrency } from './format.js'
import { TOKENS } from './tokens.js'

type Diff = {
  label: string
  cur: number
  prev: number
  delta: number
  pct: number
}

type Props = {
  prevMonthIndex: number | null
  diffs: Diff[]
  breakEven: boolean
  ratio: number
  shortfall: number
  currency: ResolvedCurrency
}

const panelStyle: React.CSSProperties = {
  background: TOKENS.panel,
  border: `1px solid ${TOKENS.border}`,
  borderRadius: 10,
  padding: 18,
}
const emptyStyle: React.CSSProperties = {
  padding: 24,
  textAlign: 'center',
  color: TOKENS.fgSoft,
  fontSize: 13,
}
const rowStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: `1px solid ${TOKENS.border}`,
  borderRadius: 7,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
}

export function BiggestShifts({ prevMonthIndex, diffs, breakEven, ratio, shortfall, currency }: Props) {
  const { fmt } = makeMoneyFormatters(currency)
  const prevLabel = prevMonthIndex !== null ? MONTH_LONG[prevMonthIndex].slice(0, 3) : '—'

  return (
    <div style={panelStyle}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Biggest shifts vs {prevLabel}</div>
      {diffs.length === 0 ? (
        <div style={emptyStyle}>No prior-month comparison available.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {diffs.map((d, i) => {
            const up = d.delta > 0
            const arrow = up ? '▲' : '▼'
            const color = up ? TOKENS.good : TOKENS.bad
            const sign = up ? '+' : ''
            return (
              <div key={i} style={rowStyle}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.label}</div>
                  <div style={{ fontSize: 11, color: TOKENS.fgSoft, fontFamily: TOKENS.monoFont, marginTop: 2 }}>
                    {fmt(d.prev)} → {fmt(d.cur)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: TOKENS.monoFont, color }}>
                    {arrow} {sign}{fmt(d.delta)}
                  </div>
                  <div style={{ fontSize: 10.5, color: TOKENS.fgFaint, fontFamily: TOKENS.monoFont }}>
                    {sign}{d.pct.toFixed(1)}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div style={{ marginTop: 14, padding: '12px 14px', background: TOKENS.panel2, border: `1px solid ${TOKENS.borderSoft}`, borderRadius: 7 }}>
        <div style={{ fontSize: 11, color: TOKENS.fgSoft, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Break-even</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: breakEven ? TOKENS.good : TOKENS.bad }}>
          {breakEven ? 'Yes' : 'No'} · ratio {ratio.toFixed(2)}×
        </div>
        <div style={{ fontSize: 11, color: TOKENS.fgFaint, marginTop: 2 }}>
          {breakEven
            ? 'Inflows cover outflows this month.'
            : shortfall > 0
              ? `Short by ${fmt(shortfall)}.`
              : 'No outflows recorded yet.'}
        </div>
      </div>
    </div>
  )
}
