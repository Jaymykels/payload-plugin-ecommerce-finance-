import React from 'react'
import { fmtUSD } from './format.js'
import { TOKENS } from './tokens.js'

type Props = {
  opening: number
  inflows: number
  outflows: number
  closing: number
  inflowCategoryCount: number
  outflowCategoryCount: number
  netCashFlow: number
}

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 10,
  marginBottom: 14,
}
const cardStyle: React.CSSProperties = {
  border: `1px solid ${TOKENS.border}`,
  borderRadius: 10,
  padding: '14px 18px',
  background: TOKENS.panel,
}
const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: TOKENS.fgSoft,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: 0.6,
}
const hintStyle: React.CSSProperties = {
  fontSize: 11,
  color: TOKENS.fgFaint,
  marginTop: 2,
}

export function KpiCards({
  opening,
  inflows,
  outflows,
  closing,
  inflowCategoryCount,
  outflowCategoryCount,
  netCashFlow,
}: Props) {
  const netLabel = `${netCashFlow >= 0 ? '+' : ''}${fmtUSD(netCashFlow)} net`
  return (
    <div className="fd-kpi-row" style={rowStyle}>
      <Card label="Opening" value={fmtUSD(opening)} />
      <Card
        label="Inflows"
        value={fmtUSD(inflows)}
        tone="good"
        hint={`${inflowCategoryCount} categor${inflowCategoryCount === 1 ? 'y' : 'ies'}`}
      />
      <Card
        label="Outflows"
        value={fmtUSD(outflows)}
        tone="bad"
        hint={`${outflowCategoryCount} categor${outflowCategoryCount === 1 ? 'y' : 'ies'}`}
      />
      <Card label="Closing" value={fmtUSD(closing)} tone="accent" hint={netLabel} />
    </div>
  )
}

function Card({
  label,
  value,
  hint,
  tone,
}: {
  label: string
  value: string
  hint?: string
  tone?: 'good' | 'bad' | 'accent'
}) {
  const color =
    tone === 'good' ? TOKENS.good
      : tone === 'bad' ? TOKENS.bad
        : tone === 'accent' ? TOKENS.accent
          : TOKENS.fg
  return (
    <div style={cardStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, marginTop: 6, fontFamily: TOKENS.monoFont, letterSpacing: -0.5, color }}>
        {value}
      </div>
      {hint && <div style={hintStyle}>{hint}</div>}
    </div>
  )
}
