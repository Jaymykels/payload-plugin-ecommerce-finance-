'use client'

import React from 'react'
import LinkImport from 'next/link.js'
import { MONTH_LONG } from './format.js'
import { TOKENS } from './tokens.js'
import { unwrapDefault } from '../../utils/esm.js'
import type { MonthStatus } from './aggregate.js'

const Link = unwrapDefault<any>(LinkImport)

type Props = {
  year: number
  monthIndex: number
  status: MonthStatus
  adminRoute: string
}

const kickerStyle: React.CSSProperties = {
  fontSize: 11,
  color: TOKENS.fgSoft,
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  marginBottom: 6,
  fontWeight: 500,
}
const h1Style: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 600,
  letterSpacing: -0.3,
  display: 'flex',
  alignItems: 'center',
  gap: 14,
}
const subtitleStyle: React.CSSProperties = {
  fontSize: 13,
  color: TOKENS.fgSoft,
  marginTop: 6,
}
const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  alignItems: 'center',
}
const ghostBtnStyle: React.CSSProperties = {
  padding: '7px 12px',
  fontSize: 12,
  borderRadius: 6,
  border: `1px solid ${TOKENS.border}`,
  background: 'transparent',
  color: TOKENS.fg,
  cursor: 'pointer',
  fontFamily: 'inherit',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
}
const primaryBtnStyle: React.CSSProperties = {
  padding: '7px 13px',
  fontSize: 12,
  borderRadius: 6,
  border: `1px solid ${TOKENS.accent}`,
  background: TOKENS.accent,
  color: '#fff',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
}
const pillBase: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 0.8,
  fontWeight: 600,
  padding: '4px 10px',
  borderRadius: 5,
  verticalAlign: 'middle',
}

export function Header({ year, monthIndex, status, adminRoute }: Props) {
  const prevMonth = monthIndex === 0 ? 12 : monthIndex
  const prevYear = monthIndex === 0 ? year - 1 : year
  const nextMonth = monthIndex === 11 ? 1 : monthIndex + 2
  const nextYear = monthIndex === 11 ? year + 1 : year

  const prevHref = `${adminRoute}/finance/${prevYear}/${prevMonth}`
  const nextHref = `${adminRoute}/finance/${nextYear}/${nextMonth}`

  const pillStyle: React.CSSProperties = {
    ...pillBase,
    background: status === 'actual' ? TOKENS.goodBg : TOKENS.accentBg,
    color: status === 'actual' ? TOKENS.good : TOKENS.accent,
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, gap: 16, flexWrap: 'wrap' }}>
      <div>
        <div style={kickerStyle}>Finance · Month detail</div>
        <h1 style={h1Style}>
          {MONTH_LONG[monthIndex]} {year}
          <span style={pillStyle}>{status === 'actual' ? 'ACTUAL' : 'FORECAST'}</span>
        </h1>
        <div style={subtitleStyle}>Drill into a single month. Click any bar to jump.</div>
      </div>
      <div style={actionsStyle}>
        <Link href={prevHref} className="fd-ghost-btn" style={ghostBtnStyle}>← Prev</Link>
        <Link href={nextHref} className="fd-ghost-btn" style={ghostBtnStyle}>Next →</Link>
        <Link href={`${adminRoute}/collections/expenses/create`} className="fd-primary-btn" style={primaryBtnStyle}>
          New entry
        </Link>
      </div>
    </div>
  )
}
