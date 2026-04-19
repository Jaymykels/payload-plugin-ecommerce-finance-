import type { Config, Field, NumberField, Plugin } from 'payload'

import type { EcommerceExtraOptions } from './types.js'
import { buildPricingTab } from './fields/pricingTab.js'

export type { EcommerceExtraOptions } from './types.js'
export { buildPricingTab, pricingTab } from './fields/pricingTab.js'

type PriceComponents = NonNullable<NumberField['admin']>['components']

const getPriceInputComponents = (field: Field): PriceComponents | undefined => {
  if (field.type !== 'number') return undefined
  const components = field.admin?.components
  const fieldComponent = components?.Field
  const path =
    typeof fieldComponent === 'object' && fieldComponent && 'path' in fieldComponent
      ? fieldComponent.path
      : undefined
  if (typeof path === 'string' && path.includes('PriceInput')) return components
  return undefined
}

const findPriceComponents = (fields: Field[]): PriceComponents | undefined => {
  for (const field of fields) {
    const match = getPriceInputComponents(field)
    if (match) return match

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const found = findPriceComponents(tab.fields)
        if (found) return found
      }
    } else if (
      field.type === 'row' ||
      field.type === 'collapsible' ||
      field.type === 'group' ||
      field.type === 'array'
    ) {
      const found = findPriceComponents(field.fields)
      if (found) return found
    }
  }
  return undefined
}

const injectPricingTab = (
  fields: Field[],
  priceComponents: PriceComponents | undefined,
): Field[] =>
  fields.map((field) =>
    field.type === 'tabs'
      ? { ...field, tabs: [...field.tabs, buildPricingTab({ priceComponents })] }
      : field,
  )

export const ecommerceExtraPlugin =
  (options: EcommerceExtraOptions = {}): Plugin =>
  (incomingConfig: Config): Config => {
    if (options.disabled) return incomingConfig

    const collections = (incomingConfig.collections ?? []).map((collection) => {
      if (collection.slug !== 'products') return collection
      const priceComponents = findPriceComponents(collection.fields)
      return {
        ...collection,
        fields: injectPricingTab(collection.fields, priceComponents),
      }
    })

    return {
      ...incomingConfig,
      collections,
      onInit: async (payload) => {
        if (incomingConfig.onInit) await incomingConfig.onInit(payload)
      },
    }
  }
