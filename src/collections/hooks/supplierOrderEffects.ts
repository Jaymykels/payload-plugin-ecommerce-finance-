import type { CollectionAfterChangeHook } from 'payload'

import { toNumber } from '../shared.js'

// Reversal (delivered/paid → cancelled) is intentionally not handled.

type LineItem = {
  product?: unknown
  qtyOrdered?: number | null
  qtyReceived?: number | null
}

type SupplierOrder = {
  id: string | number
  status?: string | null
  poNumber?: string | null
  supplierName?: string | null
  date?: string | Date | null
  grandTotal?: number | null
  deliveryCost?: number | null
  inventoryApplied?: boolean | null
  generatedExpense?: unknown
  lineItems?: LineItem[] | null
}

const extractId = (value: unknown): string | number | null => {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number') return value
  if (typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    const id = (value as Record<string, unknown>).id
    if (typeof id === 'string' || typeof id === 'number') return id
  }
  return null
}

export const supplierOrderEffects: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const typedDoc = doc as SupplierOrder
  const typedPrev = (previousDoc ?? {}) as SupplierOrder

  if (req.context?.skipSupplierOrderEffects) return doc
  if (typedDoc.status === typedPrev.status) return doc

  const { payload } = req

  if (typedDoc.status === 'delivered' && !typedDoc.inventoryApplied) {
    const lineItems = Array.isArray(typedDoc.lineItems) ? typedDoc.lineItems : []
    const qtyByProduct = new Map<string | number, number>()
    for (const line of lineItems) {
      const productId = extractId(line.product)
      if (productId == null) continue
      const qty = toNumber(line.qtyReceived ?? line.qtyOrdered)
      if (qty <= 0) continue
      qtyByProduct.set(productId, (qtyByProduct.get(productId) ?? 0) + qty)
    }

    await Promise.all(
      Array.from(qtyByProduct, async ([productId, qty]) => {
        const product = (await payload.findByID({
          collection: 'products',
          id: productId,
          depth: 0,
          select: { inventory: true },
          req,
        })) as { inventory?: number | null }
        await payload.update({
          collection: 'products',
          id: productId,
          data: { inventory: toNumber(product?.inventory) + qty },
          depth: 0,
          overrideAccess: true,
          req,
        })
      }),
    )

    await payload.update({
      collection: 'supplier-orders' as never,
      id: typedDoc.id,
      data: { inventoryApplied: true } as never,
      context: { skipSupplierOrderEffects: true },
      overrideAccess: true,
      req,
    })
  }

  if (typedDoc.status === 'paid' && !extractId(typedDoc.generatedExpense)) {
    const expense = await payload.create({
      collection: 'expenses' as never,
      data: {
        date: typedDoc.date ?? new Date(),
        category: 'miscellaneous',
        paymentMethod: 'bank-transfer',
        frequency: 'one-off',
        amount: toNumber(typedDoc.grandTotal),
        description: `Supplier order ${typedDoc.poNumber ?? ''} — ${typedDoc.supplierName ?? ''}`.trim(),
      } as never,
      overrideAccess: true,
      req,
    })

    await payload.update({
      collection: 'supplier-orders' as never,
      id: typedDoc.id,
      data: { generatedExpense: (expense as { id: string | number }).id } as never,
      context: { skipSupplierOrderEffects: true },
      overrideAccess: true,
      req,
    })
  }

  return doc
}
