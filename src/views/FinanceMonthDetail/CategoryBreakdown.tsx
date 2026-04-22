import React from 'react'
import { fmtUSD } from './format.js'
import { TOKENS } from './tokens.js'

type Cat = { label: string; value: number; src: string; dir: 'in' | 'out' }

type Props = {
  categories: Cat[]
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

export function CategoryBreakdown({ categories }: Props) {
  const visible = categories.filter((c) => c.value > 0).sort((a, b) => b.value - a.value)
  const max = Math.max(...visible.map((c) => c.value), 1)

  return (
    <div style={panelStyle}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Category breakdown</div>
      {visible.length === 0 ? (
        <div style={emptyStyle}>No activity in this month yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visible.map((cat, i) => {
            const pct = (cat.value / max) * 100
            const fill = cat.dir === 'in' ? TOKENS.accent : TOKENS.fgFaint
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 100px', gap: 12, alignItems: 'center', fontSize: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{cat.label}</span>
                  <span style={{ fontSize: 10, color: TOKENS.fgFaint }}>{cat.src}</span>
                </div>
                <div style={{ height: 16, background: TOKENS.borderSoft, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: fill, borderRadius: 3, transition: 'width 0.3s' }} />
                </div>
                <div style={{ textAlign: 'right', fontFamily: TOKENS.monoFont, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                  {fmtUSD(cat.value)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
