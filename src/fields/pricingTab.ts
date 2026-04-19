import type { FieldHook, NumberField, Tab } from 'payload'

const toNumber = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

const round2 = (n: number): number => Math.round(n * 100) / 100

const totalOf = (d: Record<string, unknown> | undefined): number =>
  toNumber(d?.unitCost) + toNumber(d?.labelCost) + toNumber(d?.packageCost)

const sellingPriceOf = (d: Record<string, unknown> | undefined): number | null => {
  const margin = toNumber(d?.marginPercent)
  if (margin >= 100) return null
  return totalOf(d) / (1 - margin / 100)
}

const computeTotalCost: FieldHook = ({ siblingData }) => round2(totalOf(siblingData))

const computeSellingPrice: FieldHook = ({ siblingData }) => {
  const price = sellingPriceOf(siblingData)
  return price === null ? null : round2(price)
}

const computeMarkupPercent: FieldHook = ({ siblingData }) => {
  const total = totalOf(siblingData)
  const price = sellingPriceOf(siblingData)
  if (total <= 0 || price === null) return null
  return round2(((price - total) / total) * 100)
}

type PriceComponents = NonNullable<NumberField['admin']>['components']

export type BuildPricingTabOptions = {
  priceComponents?: PriceComponents
}

const moneyAdmin = (
  overrides: NumberField['admin'],
  priceComponents?: PriceComponents,
): NumberField['admin'] =>
  priceComponents ? { ...overrides, components: priceComponents } : overrides

export const buildPricingTab = ({ priceComponents }: BuildPricingTabOptions = {}): Tab => ({
  name: 'pricing',
  label: 'Pricing',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'unitCost',
          type: 'number',
          admin: moneyAdmin({ step: 0.01, width: '50%' }, priceComponents),
          min: 0,
        },
        {
          name: 'labelCost',
          type: 'number',
          admin: moneyAdmin({ step: 0.01, width: '50%' }, priceComponents),
          min: 0,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'packageCost',
          type: 'number',
          admin: moneyAdmin({ step: 0.01, width: '50%' }, priceComponents),
          min: 0,
        },
        {
          name: 'marginPercent',
          type: 'number',
          admin: {
            description: 'Target margin as a percentage of selling price.',
            step: 0.1,
            width: '50%',
          },
          max: 99.99,
          min: 0,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'totalCost',
          type: 'number',
          admin: {
            description: 'unit + label + package',
            readOnly: true,
            step: 0.01,
            width: '33%',
          },
          hooks: { beforeChange: [computeTotalCost] },
        },
        {
          name: 'sellingPrice',
          type: 'number',
          admin: {
            description: 'totalCost / (1 - margin%/100)',
            readOnly: true,
            step: 0.01,
            width: '33%',
          },
          hooks: { beforeChange: [computeSellingPrice] },
        },
        {
          name: 'markupPercent',
          type: 'number',
          admin: {
            description: '(sellingPrice - totalCost) / totalCost * 100',
            readOnly: true,
            step: 0.01,
            width: '34%',
          },
          hooks: { beforeChange: [computeMarkupPercent] },
        },
      ],
    },
  ],
})

export const pricingTab: Tab = buildPricingTab()
