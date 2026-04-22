import type { CollectionConfig, Config, Field, Payload, Plugin } from 'payload'

import type { CurrencyOption, EcommerceFinanceOptions } from './types.js'
import type { PriceComponents } from './collections/shared.js'
import { buildExpensesCollection } from './collections/Expenses.js'
import { buildInvestmentsCollection } from './collections/Investments.js'
import { buildSupplierOrdersCollection } from './collections/SupplierOrders.js'
import { buildPricingTab } from './fields/pricingTab.js'
import { DEFAULT_CURRENCY, type ResolvedCurrency } from './views/FinanceMonthDetail/format.js'

export type { CurrencyOption, EcommerceFinanceOptions } from './types.js'
export { buildExpensesCollection } from './collections/Expenses.js'
export { buildInvestmentsCollection } from './collections/Investments.js'
export { buildSupplierOrdersCollection } from './collections/SupplierOrders.js'
export { buildPricingTab, pricingTab } from './fields/pricingTab.js'

export const getFinanceCurrency = (payload: Payload): ResolvedCurrency =>
  (payload.config.custom?.ecommerceFinance?.currency as ResolvedCurrency | undefined) ??
  DEFAULT_CURRENCY

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

export const ecommerceFinancePlugin =
  (options: EcommerceFinanceOptions = {}): Plugin =>
  (incomingConfig: Config): Config => {
    if (options.disabled) return incomingConfig

    const existingCollections = incomingConfig.collections ?? []
    const products = existingCollections.find((c) => c.slug === 'products')
    const priceComponents = products ? findPriceComponents(products.fields) : undefined

    const mapped = existingCollections.map((collection) =>
      collection.slug === 'products'
        ? { ...collection, fields: injectPricingTab(collection.fields, priceComponents) }
        : collection,
    )

    const financeCollections = [
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

    // Place finance collections immediately before the first ecommerce collection
    // so the sidebar renders Finance above Ecommerce. Assumes @payloadcms/plugin-ecommerce
    // collections are contiguous in the config; interleaved non-ecommerce collections
    // between them would be shifted below Finance.
    const firstEcomIdx = mapped.findIndex(isEcommerceCollection)
    const collections = firstEcomIdx === -1
      ? [...mapped, ...financeCollections]
      : [...mapped.slice(0, firstEcomIdx), ...financeCollections, ...mapped.slice(firstEcomIdx)]

    const admin = options.dashboardDisabled
      ? incomingConfig.admin
      : mergeAdminWithDashboard(incomingConfig.admin)

    const currency = resolveCurrency(options.currency)

    return {
      ...incomingConfig,
      admin,
      collections,
      custom: {
        ...(incomingConfig.custom ?? {}),
        ecommerceFinance: {
          ...((incomingConfig.custom?.ecommerceFinance ?? {}) as Record<string, unknown>),
          currency,
        },
      },
      onInit: async (payload) => {
        if (incomingConfig.onInit) await incomingConfig.onInit(payload)
      },
    }
  }

const resolveCurrency = (option: CurrencyOption | undefined): ResolvedCurrency => {
  if (!option) return DEFAULT_CURRENCY
  return {
    code: option.code,
    symbol: option.symbol,
    locale: option.locale,
    decimals: option.decimals ?? 2,
  }
}

// Matches the literal group label used by @payloadcms/plugin-ecommerce. Breaks
// silently if upstream renames the group or switches to a translation key.
const isEcommerceCollection = (c: CollectionConfig): boolean => {
  const group = c.admin?.group
  if (typeof group === 'string') return group === 'Ecommerce'
  if (group && typeof group === 'object') return Object.values(group).some((v) => v === 'Ecommerce')
  return false
}

const FINANCE_VIEW_COMPONENT = 'payload-plugin-ecommerce-finance/rsc#FinanceMonthDetail'
const FINANCE_REDIRECT_COMPONENT =
  'payload-plugin-ecommerce-finance/rsc#FinanceMonthDetailRedirect'
const FINANCE_NAV_LINK_COMPONENT =
  'payload-plugin-ecommerce-finance/client#FinanceNavLink'

const mergeAdminWithDashboard = (admin: Config['admin']): Config['admin'] => {
  const existing = admin ?? {}
  const existingComponents = existing.components ?? {}
  const existingAfterNavLinks = Array.isArray(existingComponents.afterNavLinks)
    ? existingComponents.afterNavLinks
    : existingComponents.afterNavLinks
      ? [existingComponents.afterNavLinks]
      : []

  return {
    ...existing,
    components: {
      ...existingComponents,
      afterNavLinks: [...existingAfterNavLinks, FINANCE_NAV_LINK_COMPONENT],
      views: {
        ...existingComponents.views,
        financeMonthDetail: {
          Component: FINANCE_VIEW_COMPONENT,
          meta: { title: 'Finance' },
          path: '/finance/:year/:month',
        },
        financeRedirect: {
          Component: FINANCE_REDIRECT_COMPONENT,
          exact: true,
          meta: { title: 'Finance' },
          path: '/finance',
        },
      },
    },
  }
}
