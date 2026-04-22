import type { Payload, PayloadRequest, Where } from 'payload'

import {
  EXPENSES_SLUG,
  INVESTMENTS_SLUG,
  ORDERS_SLUG,
  SUPPLIER_ORDERS_SLUG,
} from './constants.js'

export type MonthStatus = 'actual' | 'forecast'

export type CategoryRow = {
  key: string
  label: string
  src: string
  values: number[]
}

export type Snapshot = {
  year: number
  months: readonly string[]
  status: MonthStatus[]
  inflowRows: CategoryRow[]
  outflowRows: CategoryRow[]
  totalInflows: number[]
  totalOutflows: number[]
  netCashFlow: number[]
  openingBalance: number[]
  closingBalance: number[]
  ratio: number[]
  breakEven: boolean[]
}

type ExpenseDoc = {
  id: number | string
  date?: string | Date | null
  amount?: number | null
  category?: string | null
}

type InvestmentDoc = {
  id: number | string
  date?: string | Date | null
  amount?: number | null
}

type SupplierOrderDoc = {
  id: number | string
  date?: string | Date | null
  status?: string | null
  grandTotal?: number | null
  generatedExpense?: number | string | { id: number | string } | null
}

type OrderDoc = {
  id: number | string
  createdAt?: string | Date | null
  amount?: number | null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

const OUTFLOW_BUCKETS: { key: string; label: string; categories: string[] }[] = [
  { key: 'deliveryTransport', label: 'Delivery & Transport', categories: ['delivery-transport'] },
  { key: 'labelsPackaging', label: 'Labels & Packaging', categories: ['labels-packaging'] },
  { key: 'marketing', label: 'Marketing & Advertising', categories: ['marketing-ads'] },
  { key: 'wages', label: 'Wages & Labour', categories: ['wages-labour'] },
  { key: 'rentStorage', label: 'Rent & Storage', categories: ['rent', 'storage-warehouse'] },
  { key: 'utilities', label: 'Utilities & Internet', categories: ['utilities', 'internet-phone'] },
  { key: 'loan', label: 'Loan Repayments', categories: ['loan-repayment'] },
  { key: 'otherOps', label: 'Other Operating Expenses', categories: ['platform-tech', 'insurance', 'assets', 'miscellaneous'] },
]

const emptyMonths = (): number[] => Array.from({ length: 12 }, () => 0)

const monthIndexFromDate = (value: string | Date | null | undefined, year: number): number | null => {
  if (!value) return null
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return null
  if (d.getUTCFullYear() !== year) return null
  return d.getUTCMonth()
}

const yearRange = (year: number) => ({
  start: new Date(Date.UTC(year, 0, 1)).toISOString(),
  end: new Date(Date.UTC(year + 1, 0, 1)).toISOString(),
})

const idOfMaybeRelation = (value: unknown): number | string | null => {
  if (value == null) return null
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in (value as { id?: unknown })) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }
  return null
}

// Consumers may register finance collections under different type-safe slug
// unions, so we cast at this one seam and treat the results as the loose
// shapes we actually read.
const findDocs = async <T>(
  payload: Payload,
  req: PayloadRequest,
  collection: string,
  where: Where,
  select?: Record<string, true>,
): Promise<T[]> => {
  const res = await payload.find({
    collection: collection as never,
    where,
    depth: 0,
    limit: 100000,
    pagination: false,
    overrideAccess: false,
    req,
    ...(select ? { select: select as never } : {}),
  })
  return res.docs as unknown as T[]
}

export async function aggregate(
  payload: Payload,
  req: PayloadRequest,
  year: number,
): Promise<Snapshot> {
  const { start, end } = yearRange(year)

  const inYear: Where = { date: { greater_than_equal: start, less_than: end } }
  const beforeYear: Where = { date: { less_than: start } }
  const ordersInYear: Where = {
    and: [
      { status: { equals: 'completed' } },
      { createdAt: { greater_than_equal: start, less_than: end } },
    ],
  }
  const ordersBeforeYear: Where = {
    and: [
      { status: { equals: 'completed' } },
      { createdAt: { less_than: start } },
    ],
  }

  const priorSelect: Record<string, true> = { amount: true, grandTotal: true, status: true, generatedExpense: true }

  const [
    expenses,
    investments,
    supplierOrders,
    orders,
    priorExpenses,
    priorInvestments,
    priorSupplierOrders,
    priorOrders,
  ] = await Promise.all([
    findDocs<ExpenseDoc>(payload, req, EXPENSES_SLUG, inYear),
    findDocs<InvestmentDoc>(payload, req, INVESTMENTS_SLUG, inYear),
    findDocs<SupplierOrderDoc>(payload, req, SUPPLIER_ORDERS_SLUG, inYear),
    findDocs<OrderDoc>(payload, req, ORDERS_SLUG, ordersInYear),
    findDocs<ExpenseDoc>(payload, req, EXPENSES_SLUG, beforeYear, priorSelect),
    findDocs<InvestmentDoc>(payload, req, INVESTMENTS_SLUG, beforeYear, priorSelect),
    findDocs<SupplierOrderDoc>(payload, req, SUPPLIER_ORDERS_SLUG, beforeYear, priorSelect),
    findDocs<OrderDoc>(payload, req, ORDERS_SLUG, ordersBeforeYear, priorSelect),
  ])

  const excludedExpenseIds = new Set<number | string>(
    supplierOrders
      .map((so) => idOfMaybeRelation(so.generatedExpense))
      .filter((id): id is number | string => id !== null),
  )

  const salesValues = emptyMonths()
  for (const o of orders) {
    const i = monthIndexFromDate(o.createdAt, year)
    if (i === null) continue
    salesValues[i] += o.amount ?? 0
  }

  const capitalValues = emptyMonths()
  for (const inv of investments) {
    const i = monthIndexFromDate(inv.date, year)
    if (i === null) continue
    capitalValues[i] += inv.amount ?? 0
  }

  const inventoryValues = emptyMonths()
  for (const so of supplierOrders) {
    if (so.status !== 'paid') continue
    const i = monthIndexFromDate(so.date, year)
    if (i === null) continue
    inventoryValues[i] += so.grandTotal ?? 0
  }

  const bucketValues: Record<string, number[]> = Object.fromEntries(
    OUTFLOW_BUCKETS.map((b) => [b.key, emptyMonths()]),
  )

  for (const exp of expenses) {
    if (excludedExpenseIds.has(exp.id)) continue
    const i = monthIndexFromDate(exp.date, year)
    if (i === null) continue
    const cat = exp.category ?? ''
    const bucket = OUTFLOW_BUCKETS.find((b) => b.categories.includes(cat))
    if (!bucket) continue
    bucketValues[bucket.key][i] += exp.amount ?? 0
  }

  const inflowRows: CategoryRow[] = [
    { key: 'sales', label: 'Sales Revenue', src: 'Orders', values: salesValues },
    { key: 'capital', label: 'Capital & Funding', src: 'Investments', values: capitalValues },
  ]

  const outflowRows: CategoryRow[] = [
    { key: 'inventory', label: 'Inventory Purchases', src: 'Supplier Orders', values: inventoryValues },
    ...OUTFLOW_BUCKETS.map((b) => ({
      key: b.key,
      label: b.label,
      src: 'Expenses',
      values: bucketValues[b.key]!,
    })),
  ]

  const totalInflows = MONTHS.map((_, i) => inflowRows.reduce((s, r) => s + r.values[i]!, 0))
  const totalOutflows = MONTHS.map((_, i) => outflowRows.reduce((s, r) => s + r.values[i]!, 0))
  const netCashFlow = totalInflows.map((v, i) => v - totalOutflows[i]!)

  const priorOpening = computePriorBalance({
    expenses: priorExpenses,
    investments: priorInvestments,
    supplierOrders: priorSupplierOrders,
    orders: priorOrders,
  })

  const openingBalance: number[] = []
  const closingBalance: number[] = []
  let running = priorOpening
  for (let i = 0; i < 12; i++) {
    openingBalance.push(running)
    running = running + netCashFlow[i]!
    closingBalance.push(running)
  }

  const ratio = totalInflows.map((v, i) => (totalOutflows[i] ? v / totalOutflows[i]! : 0))
  const breakEven = ratio.map((r) => r >= 1)

  const now = new Date()
  const status: MonthStatus[] = MONTHS.map((_, i) => {
    if (year < now.getUTCFullYear()) return 'actual'
    if (year > now.getUTCFullYear()) return 'forecast'
    return i <= now.getUTCMonth() ? 'actual' : 'forecast'
  })

  return {
    year,
    months: MONTHS,
    status,
    inflowRows,
    outflowRows,
    totalInflows,
    totalOutflows,
    netCashFlow,
    openingBalance,
    closingBalance,
    ratio,
    breakEven,
  }
}

// Walks the entire pre-year history to compute opening balance. Acceptable
// at demo scale; at >100k historical docs, swap to a cached per-year snapshot.
function computePriorBalance(args: {
  expenses: ExpenseDoc[]
  investments: InvestmentDoc[]
  supplierOrders: SupplierOrderDoc[]
  orders: OrderDoc[]
}): number {
  const { expenses, investments, supplierOrders, orders } = args

  const excludedIds = new Set<number | string>(
    supplierOrders
      .map((so) => idOfMaybeRelation(so.generatedExpense))
      .filter((id): id is number | string => id !== null),
  )

  let inflows = 0
  for (const o of orders) inflows += o.amount ?? 0
  for (const inv of investments) inflows += inv.amount ?? 0

  let outflows = 0
  for (const so of supplierOrders) {
    if (so.status === 'paid') outflows += so.grandTotal ?? 0
  }
  for (const exp of expenses) {
    if (excludedIds.has(exp.id)) continue
    outflows += exp.amount ?? 0
  }

  return inflows - outflows
}
