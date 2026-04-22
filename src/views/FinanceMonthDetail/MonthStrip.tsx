'use client'

import React from 'react'
import { useRouter } from 'next/navigation.js'
import { MONTHS, fmtUSDk } from './format.js'
import { TOKENS } from './tokens.js'
import type { MonthStatus } from './aggregate.js'

type Props = {
  year: number
  monthIndex: number
  closingBalance: number[]
  openingBalance: number[]
  status: MonthStatus[]
  adminRoute: string
}

const stripStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: 4,
  marginBottom: 14,
}

export function MonthStrip({ year, monthIndex, closingBalance, openingBalance, status, adminRoute }: Props) {
  const router = useRouter()

  const maxBal = Math.max(...closingBalance, ...openingBalance, 1)
  const minBal = Math.min(...closingBalance, ...openingBalance, 0)
  const range = Math.max(maxBal - minBal, 1)
  const pct = (v: number) => (v - minBal) / range

  return (
    <div style={stripStyle}>
      {MONTHS.map((m, i) => {
        const selected = monthIndex === i
        const isActual = status[i] === 'actual'
        const v = closingBalance[i] ?? 0
        const height = Math.max(6, pct(v) * 46 + 6)
        const href = `${adminRoute}/finance/${year}/${i + 1}`

        const cellStyle: React.CSSProperties = {
          background: selected ? TOKENS.accent : TOKENS.panel2,
          border: `1px solid ${selected ? TOKENS.accent : TOKENS.border}`,
          borderRadius: 8,
          padding: '10px 8px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          color: selected ? '#fff' : TOKENS.fg,
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minWidth: 0,
          transition: 'background 0.12s, border-color 0.12s',
        }

        const barStyle: React.CSSProperties = {
          width: '100%',
          height: `${height}px`,
          background: selected ? 'rgba(255,255,255,0.35)' : TOKENS.accent,
          opacity: selected ? 1 : isActual ? 0.9 : 0.45,
          borderRadius: 2,
        }

        return (
          <button
            key={i}
            type="button"
            className={`fd-month-cell${selected ? ' fd-month-cell--selected' : ''}`}
            style={cellStyle}
            onClick={() => router.push(href)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{m}</span>
              <span style={{ fontSize: 9, letterSpacing: 0.6, fontWeight: 600, opacity: selected ? 0.9 : 0.55 }}>
                {isActual ? 'ACT' : 'FCT'}
              </span>
            </div>
            <div style={{ height: 52, display: 'flex', alignItems: 'flex-end' }}>
              <div style={barStyle} />
            </div>
            <div style={{ fontSize: 10.5, fontFamily: TOKENS.monoFont, opacity: 0.9, fontWeight: 500 }}>
              {fmtUSDk(v)}
            </div>
          </button>
        )
      })}
    </div>
  )
}
