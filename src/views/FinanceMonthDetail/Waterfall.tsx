'use client'

import React from 'react'
import { MONTH_LONG, fmtUSDk } from './format.js'
import { TOKENS } from './tokens.js'

type Step = {
  label: string
  value: number
  type: 'start' | 'flow' | 'end'
}

type Props = {
  monthIndex: number
  opening: number
  closing: number
  inflows: { label: string; value: number }[]
  outflows: { label: string; value: number }[]
}

const headStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  marginBottom: 6,
  gap: 12,
  flexWrap: 'wrap',
}

export function Waterfall({ monthIndex, opening, closing, inflows, outflows }: Props) {
  const steps: Step[] = [
    { label: `Opening (${MONTH_LONG[monthIndex].slice(0, 3)})`, value: opening, type: 'start' },
    ...inflows.filter((i) => i.value !== 0).map((i) => ({ label: i.label, value: i.value, type: 'flow' as const })),
    ...outflows.filter((o) => o.value !== 0).map((o) => ({ label: o.label, value: -o.value, type: 'flow' as const })),
    { label: `Closing (${MONTH_LONG[monthIndex].slice(0, 3)})`, value: closing, type: 'end' },
  ]

  const W = 900
  const H = 320
  const padL = 60
  const padR = 24
  const padT = 20
  const padB = 82

  const allVals: number[] = [opening, closing, 0]
  let run = opening
  for (const s of steps.slice(1, -1)) {
    run += s.value
    allVals.push(run)
  }
  const max = Math.max(...allVals) * 1.1 || 1
  const min = Math.min(...allVals, 0) * 0.95
  const range = max - min || 1
  const y = (v: number) => padT + (1 - (v - min) / range) * (H - padT - padB)
  const slotW = (W - padL - padR) / Math.max(steps.length, 1)
  const barW = Math.max(8, slotW - 6)

  const ticks = [min, (min + max) / 2, max]
  let running = opening

  return (
    <div>
      <div style={headStyle}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>How cash moved in {MONTH_LONG[monthIndex]}</div>
          <div style={{ fontSize: 11, color: TOKENS.fgSoft, marginTop: 2 }}>Waterfall: opening → inflows → outflows → closing</div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, color: TOKENS.fgSoft }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 1.5, background: TOKENS.accent, display: 'inline-block' }} />
            Balance
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 1.5, background: TOKENS.good, display: 'inline-block' }} />
            Inflow
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 1.5, background: TOKENS.bad, display: 'inline-block' }} />
            Outflow
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(t)}
              y2={y(t)}
              stroke={TOKENS.borderSoft}
              strokeDasharray={i === 0 ? '0' : '2 3'}
            />
            <text
              x={padL - 8}
              y={y(t) + 3}
              textAnchor="end"
              fontSize="10"
              fill={TOKENS.fgFaint}
              fontFamily={TOKENS.uiFont}
            >
              {fmtUSDk(t)}
            </text>
          </g>
        ))}
        {steps.map((s, i) => {
          const cx = padL + i * slotW + 3
          let top: number
          let bot: number
          let fill: string
          if (s.type === 'start' || s.type === 'end') {
            top = y(Math.max(s.value, 0))
            bot = y(Math.min(s.value, 0))
            fill = TOKENS.accent
          } else if (s.value >= 0) {
            top = y(running + s.value)
            bot = y(running)
            fill = TOKENS.good
            running += s.value
          } else {
            top = y(running)
            bot = y(running + s.value)
            fill = TOKENS.bad
            running += s.value
          }
          const barHt = Math.max(1.5, bot - top)
          const isBig = s.type === 'start' || s.type === 'end'
          const labelPrefix = s.type === 'flow' && s.value >= 0 ? '+' : ''
          const shortLabel = s.label.length > 22 ? s.label.slice(0, 20) + '…' : s.label

          return (
            <g key={i}>
              <rect x={cx} y={top} width={barW} height={barHt} fill={fill} rx="1.5" opacity={isBig ? 1 : 0.88} />
              <text
                x={cx + barW / 2}
                y={top - 5}
                fontSize="10"
                fill={TOKENS.fg}
                textAnchor="middle"
                fontFamily={TOKENS.monoFont}
                fontWeight={500}
              >
                {labelPrefix}{fmtUSDk(s.value)}
              </text>
              {i < steps.length - 1 && (
                <line
                  x1={cx + barW}
                  x2={cx + barW + 6}
                  y1={s.value >= 0 ? top : bot}
                  y2={s.value >= 0 ? top : bot}
                  stroke={TOKENS.border}
                  strokeDasharray="2 2"
                />
              )}
              <text
                x={cx + barW / 2}
                y={H - padB + 16}
                fontSize="10"
                fill={TOKENS.fgSoft}
                textAnchor="end"
                fontFamily={TOKENS.uiFont}
                transform={`rotate(-35 ${cx + barW / 2} ${H - padB + 16})`}
              >
                {shortLabel}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
