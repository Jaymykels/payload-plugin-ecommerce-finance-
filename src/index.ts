import type { Config, Field, Plugin } from 'payload'

import type { EcommerceExtraOptions } from './types.js'
import type { PriceComponents } from './collections/shared.js'
import { buildExpensesCollection } from './collections/Expenses.js'
import { buildInvestmentsCollection } from './collections/Investments.js'
import { buildSupplierOrdersCollection } from './collections/SupplierOrders.js'
import { buildPricingTab } from './fields/pricingTab.js'

export type { EcommerceExtraOptions } from './types.js'
export { buildExpensesCollection } from './collections/Expenses.js'
export { buildInvestmentsCollection } from './collections/Investments.js'
export { buildSupplierOrdersCollection } from './collections/SupplierOrders.js'
export { buildPricingTab, pricingTab } from './fields/pricingTab.js'

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

    const existingCollections = incomingConfig.collections ?? []
    const products = existingCollections.find((c) => c.slug === 'products')
    const priceComponents = products ? findPriceComponents(products.fields) : undefined

    const collections = [
      ...existingCollections.map((collection) =>
        collection.slug === 'products'
          ? { ...collection, fields: injectPricingTab(collection.fields, priceComponents) }
          : collection,
      ),
      buildExpensesCollection({ access: options.expenses?.access, priceComponents }),
      buildInvestmentsCollection({
        access: options.investments?.access,
        priceComponents,
      }),
      buildSupplierOrdersCollection({
        access: options.supplierOrders?.access,
        priceComponents,
      }),
    ]

    return {
      ...incomingConfig,
      collections,
      onInit: async (payload) => {
        if (incomingConfig.onInit) await incomingConfig.onInit(payload)
      },
    }
  }
