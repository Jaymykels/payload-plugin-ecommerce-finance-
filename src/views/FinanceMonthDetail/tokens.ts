export const TOKENS = {
  bg: 'var(--theme-bg, #ffffff)',
  panel: 'var(--theme-elevation-0, #ffffff)',
  panel2: 'var(--theme-elevation-50, #fafaf9)',
  border: 'var(--theme-elevation-150, #e7e5e4)',
  borderSoft: 'var(--theme-elevation-100, #f0efed)',
  fg: 'var(--theme-text, #0c0a09)',
  fgSoft: 'var(--theme-elevation-800, #57534e)',
  fgFaint: 'var(--theme-elevation-500, #a8a29e)',
  good: 'var(--finance-good, #15803d)',
  goodBg: 'var(--finance-good-bg, #dcfce7)',
  bad: 'var(--finance-bad, #b91c1c)',
  badBg: 'var(--finance-bad-bg, #fee2e2)',
  accent: 'var(--finance-accent, #6366f1)',
  accentBg: 'var(--finance-accent-bg, rgba(99,102,241,0.06))',
  monoFont: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
  uiFont: 'var(--font-body, Inter, -apple-system, system-ui, sans-serif)',
} as const

export const ROOT_CLASS = 'finance-dashboard-root'

export const GLOBAL_STYLES = `
.${ROOT_CLASS} {
  --finance-good: #15803d;
  --finance-good-bg: #dcfce7;
  --finance-bad: #b91c1c;
  --finance-bad-bg: #fee2e2;
  --finance-accent: #6366f1;
  --finance-accent-bg: rgba(99, 102, 241, 0.06);
  padding: 26px 32px 32px;
  font-family: var(--font-body, Inter, -apple-system, system-ui, sans-serif);
  color: var(--theme-text, #0c0a09);
}
[data-theme='dark'] .${ROOT_CLASS} {
  --finance-good: #4ade80;
  --finance-good-bg: rgba(34, 197, 94, 0.12);
  --finance-bad: #f87171;
  --finance-bad-bg: rgba(239, 68, 68, 0.12);
  --finance-accent-bg: rgba(99, 102, 241, 0.12);
}
.${ROOT_CLASS} .fd-month-cell:hover:not(.fd-month-cell--selected) {
  background: var(--theme-elevation-100, #f0efed);
}
.${ROOT_CLASS} .fd-ghost-btn:hover {
  background: var(--theme-elevation-100, #f0efed);
}
.${ROOT_CLASS} .fd-primary-btn:hover {
  filter: brightness(1.08);
}
@media (max-width: 980px) {
  .${ROOT_CLASS} .fd-two-col { grid-template-columns: 1fr !important; }
  .${ROOT_CLASS} .fd-kpi-row { grid-template-columns: repeat(2, 1fr) !important; }
}
`
