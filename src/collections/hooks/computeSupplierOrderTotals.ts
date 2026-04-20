import type { CollectionBeforeChangeHook } from 'payload'

import { toNumber } from '../shared.js'

type LineItem = {
  unitCost?: number | null
  qtyOrdered?: number | null
  lineTotal?: number | null
  [key: string]: unknown
}

export const computeSupplierOrderTotals: CollectionBeforeChangeHook = ({ data }) => {
  const items = Array.isArray(data.lineItems) ? (data.lineItems as LineItem[]) : []
  let sum = 0
  const lineItems = items.map((item) => {
    const lineTotal = toNumber(item.unitCost) * toNumber(item.qtyOrdered)
    sum += lineTotal
    return { ...item, lineTotal }
  })
  return {
    ...data,
    lineItems,
    grandTotal: sum + toNumber(data.deliveryCost),
  }
}
