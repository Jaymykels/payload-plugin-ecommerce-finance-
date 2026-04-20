import type { Access, Field, FieldHook, NumberField } from 'payload'

export type PriceComponents = NonNullable<NumberField['admin']>['components']

export const isAuthed: Access = ({ req }) => Boolean(req.user)

export const accessGate = (gate: Access) => ({
  create: gate,
  delete: gate,
  read: gate,
  update: gate,
})

export const toNumber = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export const toYearMonth = (value: unknown): string | null => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value as string)
  if (Number.isNaN(date.getTime())) return null
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const deriveMonth: FieldHook = ({ siblingData }) => toYearMonth(siblingData?.date)

const makeEntryNumberHook =
  (collectionSlug: string): FieldHook =>
  async ({ operation, req, value }) => {
    if (operation !== 'create') return value
    if (typeof value === 'number') return value
    const latest = await req.payload.find({
      collection: collectionSlug as never,
      depth: 0,
      limit: 1,
      sort: '-entryNumber',
    })
    const max = (latest.docs[0]?.entryNumber as number | undefined) ?? 0
    return max + 1
  }

export const entryNumberField = (collectionSlug: string): Field => ({
  name: 'entryNumber',
  type: 'number',
  admin: { position: 'sidebar', readOnly: true },
  hooks: { beforeChange: [makeEntryNumberHook(collectionSlug)] },
  index: true,
  unique: true,
})

const PO_NUMBER_PATTERN = /^PO-(\d+)$/
const PO_NUMBER_PAD_WIDTH = 4

const makePoNumberHook =
  (collectionSlug: string): FieldHook =>
  async ({ operation, req, value }) => {
    if (operation !== 'create') return value
    if (typeof value === 'string' && value.length > 0) return value
    const latest = await req.payload.find({
      collection: collectionSlug as never,
      depth: 0,
      limit: 1,
      select: { poNumber: true } as never,
      sort: '-poNumber',
    })
    const latestDoc = latest.docs[0] as { poNumber?: string } | undefined
    const latestValue = latestDoc?.poNumber
    const match = latestValue ? PO_NUMBER_PATTERN.exec(latestValue) : null
    const next = (match ? parseInt(match[1]!, 10) : 0) + 1
    return `PO-${String(next).padStart(PO_NUMBER_PAD_WIDTH, '0')}`
  }

export const poNumberField = (collectionSlug: string): Field => ({
  name: 'poNumber',
  type: 'text',
  admin: { position: 'sidebar', readOnly: true },
  hooks: { beforeChange: [makePoNumberHook(collectionSlug)] },
  index: true,
  unique: true,
})

export const dateField = (): Field => ({
  name: 'date',
  type: 'date',
  admin: { date: { pickerAppearance: 'dayOnly' }, width: '50%' },
  defaultValue: () => new Date(),
  required: true,
})

export const monthField = (): Field => ({
  name: 'month',
  type: 'text',
  admin: {
    description: 'Auto-extracted from date as YYYY-MM.',
    readOnly: true,
    width: '50%',
  },
  hooks: { beforeChange: [deriveMonth] },
  index: true,
})

export const amountField = (priceComponents?: PriceComponents): Field => ({
  name: 'amount',
  type: 'number',
  admin: priceComponents ? { components: priceComponents } : {},
  required: true,
  validate: (value: unknown) => {
    if (value == null) return 'Amount is required.'
    if (typeof value !== 'number' || value <= 0) return 'Amount must be greater than zero.'
    return true
  },
})
