export type ResolvedCurrency = {
  code: string
  symbol: string
  locale: string
  decimals: number
}

export const DEFAULT_CURRENCY: ResolvedCurrency = {
  code: 'USD',
  symbol: '$',
  locale: 'en-US',
  decimals: 0,
}

export type MoneyFormatters = {
  fmt: (v: number, opts?: { paren?: boolean }) => string
  fmtK: (v: number) => string
}

export const makeMoneyFormatters = (cfg: ResolvedCurrency): MoneyFormatters => {
  const { symbol, locale, decimals } = cfg
  return {
    fmt: (v, opts = {}) => {
      const neg = v < 0
      const abs = Math.abs(v)
      const str = symbol + abs.toLocaleString(locale, {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      })
      if (opts.paren && neg) return '(' + str + ')'
      return neg ? '-' + str : str
    },
    fmtK: (v) => {
      const neg = v < 0
      const abs = Math.abs(v)
      let s: string
      if (abs >= 1_000_000_000) {
        s = symbol + (abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1) + 'B'
      } else if (abs >= 1_000_000) {
        s = symbol + (abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + 'M'
      } else if (abs >= 1000) {
        s = symbol + (abs / 1000).toFixed(abs >= 10_000 ? 0 : 1) + 'k'
      } else {
        s = symbol + abs.toFixed(0)
      }
      return neg ? '-' + s : s
    },
  }
}

export const fmtPct = (v: number): string => (v * 100).toFixed(1) + '%'

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

export const MONTH_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const
