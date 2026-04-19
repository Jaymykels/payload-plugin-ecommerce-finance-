import type { Access, Field, FieldHook, NumberField } from 'payload'

export type PriceComponents = NonNullable<NumberField['admin']>['components']

export const isAuthed: Access = ({ req }) => Boolean(req.user)

export const accessGate = (gate: Access) => ({
  create: gate,
  delete: gate,
  read: gate,
  update: gate,
})

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
