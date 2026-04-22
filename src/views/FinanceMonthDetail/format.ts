export const fmtUSD = (v: number, opts: { paren?: boolean } = {}): string => {
  const neg = v < 0
  const abs = Math.abs(v)
  const str = '$' + abs.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (opts.paren && neg) return '(' + str + ')'
  return neg ? '-' + str : str
}

export const fmtUSDk = (v: number): string => {
  const neg = v < 0
  const abs = Math.abs(v)
  const s = abs >= 1000 ? '$' + (abs / 1000).toFixed(abs >= 10000 ? 0 : 1) + 'k' : '$' + abs.toFixed(0)
  return neg ? '-' + s : s
}

export const fmtPct = (v: number): string => (v * 100).toFixed(1) + '%'

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

export const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const
