import type { Access } from 'payload'
import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

export type CurrencyOption = {
  code: string
  symbol: string
  locale: string
  decimals?: number
}

export type EcommerceFinanceOptions = {
  /**
   * Display currency for finance dashboard amounts. Defaults to USD.
   */
  currency?: CurrencyOption
  /**
   * Set to `true` to skip mounting the Finance Dashboard view and sidebar link.
   * Defaults to `false` (dashboard is enabled).
   */
  dashboardDisabled?: boolean
  disabled?: boolean
  expenses?: {
    access?: Access
  }
  investments?: {
    access?: Access
  }
  orders?: {
    collectionOverride?: CollectionOverride
  }
  products?: {
    collectionOverride?: CollectionOverride
  }
  supplierOrders?: {
    access?: Access
  }
}
