import type { AdminViewServerProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import LinkImport from 'next/link.js'
import React from 'react'

import { aggregate } from './aggregate.js'
import { Header } from './Header.js'
import { MonthStrip } from './MonthStrip.js'
import { KpiCards } from './KpiCards.js'
import { Waterfall } from './Waterfall.js'
import { CategoryBreakdown } from './CategoryBreakdown.js'
import { BiggestShifts } from './BiggestShifts.js'
import { GLOBAL_STYLES, ROOT_CLASS, TOKENS } from './tokens.js'
import { FINANCE_PERMISSION_SLUG } from './constants.js'
import { getFinanceCurrency } from '../../index.js'
import { unwrapDefault } from '../../utils/esm.js'

const Link = unwrapDefault<any>(LinkImport)

type Params = AdminViewServerProps['params']

const readParam = (params: Params, key: string): string | undefined => {
  if (!params) return undefined
  const raw = params[key]
  if (Array.isArray(raw)) return raw[0]
  return raw
}

const parseYearMonth = (params: Params): { year: number; monthIndex: number } | null => {
  if (!params) return null
  const segments = Array.isArray(params.segments) ? params.segments : []
  const financeIdx = segments.indexOf('finance')
  const rawYear = readParam(params, 'year') ?? (financeIdx >= 0 ? segments[financeIdx + 1] : undefined)
  const rawMonth = readParam(params, 'month') ?? (financeIdx >= 0 ? segments[financeIdx + 2] : undefined)
  if (!rawYear || !rawMonth) return null
  const year = Number(rawYear)
  const month = Number(rawMonth)
  if (!Number.isInteger(year) || year < 1970 || year > 2100) return null
  if (!Number.isInteger(month) || month < 1 || month > 12) return null
  return { year, monthIndex: month - 1 }
}

const rootStyle: React.CSSProperties = {
  padding: '0px 60px 32px',
  fontFamily: TOKENS.uiFont,
  color: TOKENS.fg,
}

const panelStyle: React.CSSProperties = {
  background: TOKENS.panel,
  border: `1px solid ${TOKENS.border}`,
  borderRadius: 10,
  padding: 18,
  marginBottom: 14,
}

const primaryBtnStyle: React.CSSProperties = {
  padding: '7px 13px',
  fontSize: 12,
  borderRadius: 6,
  border: `1px solid ${TOKENS.accent}`,
  background: TOKENS.accent,
  color: '#fff',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  marginTop: 12,
}

const templateProps = (props: AdminViewServerProps) => {
  const { initPageResult, params, searchParams } = props
  const { req, permissions, visibleEntities, locale } = initPageResult
  return {
    i18n: req.i18n,
    locale,
    params,
    payload: req.payload,
    permissions,
    req,
    searchParams,
    user: req.user || undefined,
    viewActions: [],
    visibleEntities: {
      collections: visibleEntities?.collections,
      globals: visibleEntities?.globals,
    },
  }
}

export const Shell: React.FC<React.PropsWithChildren<{ props: AdminViewServerProps }>> = ({ props, children }) => (
  <DefaultTemplate {...templateProps(props)}>
    <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
    <div className={ROOT_CLASS} style={rootStyle}>
      {children}
    </div>
  </DefaultTemplate>
)

export default async function FinanceMonthDetail(props: AdminViewServerProps) {
  const { initPageResult } = props
  const { req, permissions } = initPageResult
  const { payload, user } = req
  const adminRoute = payload.config.routes.admin

  const canRead = Boolean(user) && Boolean(permissions?.collections?.[FINANCE_PERMISSION_SLUG]?.read)

  if (!canRead) {
    return (
      <Shell props={props}>
        <h2>Sign in required</h2>
        <p style={{ color: TOKENS.fgSoft }}>You need an account with access to the Finance collections to view this page.</p>
        <Link href={`${adminRoute}/login`} style={primaryBtnStyle}>Go to login</Link>
      </Shell>
    )
  }

  const parsed = parseYearMonth(props.params)
  if (!parsed) {
    const now = new Date()
    const targetYear = now.getUTCFullYear()
    const targetMonth = now.getUTCMonth() + 1
    return (
      <Shell props={props}>
        <h2>Invalid finance URL</h2>
        <p style={{ color: TOKENS.fgSoft }}>Expected <code>/admin/finance/YYYY/M</code>.</p>
        <Link href={`${adminRoute}/finance/${targetYear}/${targetMonth}`} style={primaryBtnStyle}>
          Go to {targetYear}/{targetMonth}
        </Link>
      </Shell>
    )
  }
  const { year, monthIndex } = parsed

  const currency = getFinanceCurrency(payload)

  const snapshot = await aggregate(payload, req, year)

  const opening = snapshot.openingBalance[monthIndex]!
  const closing = snapshot.closingBalance[monthIndex]!
  const inflowsTotal = snapshot.totalInflows[monthIndex]!
  const outflowsTotal = snapshot.totalOutflows[monthIndex]!
  const inflowCategoryCount = snapshot.inflowRows.filter((r) => r.values[monthIndex]! > 0).length
  const outflowCategoryCount = snapshot.outflowRows.filter((r) => r.values[monthIndex]! > 0).length

  const inflowsForWaterfall = snapshot.inflowRows.map((r) => ({ label: r.label, value: r.values[monthIndex]! }))
  const outflowsForWaterfall = snapshot.outflowRows.map((r) => ({ label: r.label, value: r.values[monthIndex]! }))

  const categories = [
    ...snapshot.inflowRows.map((r) => ({ label: r.label, value: r.values[monthIndex]!, src: r.src, dir: 'in' as const })),
    ...snapshot.outflowRows.map((r) => ({ label: r.label, value: r.values[monthIndex]!, src: r.src, dir: 'out' as const })),
  ]

  const prevMonthIndex = monthIndex > 0 ? monthIndex - 1 : null
  const allRows = [...snapshot.inflowRows, ...snapshot.outflowRows]
  const diffs = prevMonthIndex === null
    ? []
    : allRows
      .map((r) => {
        const cur = r.values[monthIndex]!
        const prev = r.values[prevMonthIndex]!
        return {
          label: r.label,
          cur,
          prev,
          delta: cur - prev,
          pct: prev ? ((cur - prev) / prev) * 100 : 0,
        }
      })
      .filter((d) => d.cur > 0 || d.prev > 0)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 5)

  return (
    <Shell props={props}>
      <Header
        year={year}
        monthIndex={monthIndex}
        status={snapshot.status[monthIndex]!}
        adminRoute={adminRoute}
      />
      <MonthStrip
        year={year}
        monthIndex={monthIndex}
        closingBalance={snapshot.closingBalance}
        openingBalance={snapshot.openingBalance}
        status={snapshot.status}
        adminRoute={adminRoute}
        currency={currency}
      />
      <KpiCards
        opening={opening}
        inflows={inflowsTotal}
        outflows={outflowsTotal}
        closing={closing}
        inflowCategoryCount={inflowCategoryCount}
        outflowCategoryCount={outflowCategoryCount}
        netCashFlow={snapshot.netCashFlow[monthIndex]!}
        currency={currency}
      />
      <div style={panelStyle}>
        <Waterfall
          monthIndex={monthIndex}
          opening={opening}
          closing={closing}
          inflows={inflowsForWaterfall}
          outflows={outflowsForWaterfall}
          currency={currency}
        />
      </div>
      <div className="fd-two-col" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
        <CategoryBreakdown categories={categories} currency={currency} />
        <BiggestShifts
          prevMonthIndex={prevMonthIndex}
          diffs={diffs}
          breakEven={snapshot.breakEven[monthIndex]!}
          ratio={snapshot.ratio[monthIndex]!}
          shortfall={outflowsTotal - inflowsTotal}
          currency={currency}
        />
      </div>
    </Shell>
  )
}
