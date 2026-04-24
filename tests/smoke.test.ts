import { describe, expect, it } from 'vitest'
import type { Config } from 'payload'

import { ecommerceFinancePlugin } from '../src/index.js'

const baseConfig = (): Config =>
  ({
    collections: [
      {
        slug: 'products',
        fields: [
          {
            type: 'tabs',
            tabs: [{ label: 'General', fields: [{ name: 'title', type: 'text' }] }],
          },
        ],
      },
    ],
  }) as unknown as Config

describe('ecommerceFinancePlugin', () => {
  it('returns a config transform function', () => {
    expect(typeof ecommerceFinancePlugin()).toBe('function')
  })

  it('is a no-op when disabled', () => {
    const input = baseConfig()
    const output = ecommerceFinancePlugin({ disabled: true })(input)
    expect(output).toBe(input)
  })

  it('adds the three finance collections', () => {
    const output = ecommerceFinancePlugin()(baseConfig())
    const slugs = (output.collections ?? []).map((c) => c.slug)
    expect(slugs).toContain('expenses')
    expect(slugs).toContain('investments')
    expect(slugs).toContain('supplier-orders')
  })

  it('registers dashboard views and nav link under scoped package references', () => {
    const output = ecommerceFinancePlugin()(baseConfig())
    const components = output.admin?.components
    const navLinks = Array.isArray(components?.afterNavLinks)
      ? components?.afterNavLinks
      : []
    const navRef = navLinks[navLinks.length - 1]
    expect(navRef).toBe('@jaymykels/payload-plugin-ecommerce-finance/client#FinanceNavLink')

    const views = components?.views as Record<string, { Component?: unknown }> | undefined
    expect(views?.financeMonthDetail?.Component).toBe(
      '@jaymykels/payload-plugin-ecommerce-finance/rsc#FinanceMonthDetail',
    )
    expect(views?.financeRedirect?.Component).toBe(
      '@jaymykels/payload-plugin-ecommerce-finance/rsc#FinanceMonthDetailRedirect',
    )
  })

  it('omits the dashboard when dashboardDisabled', () => {
    const output = ecommerceFinancePlugin({ dashboardDisabled: true })(baseConfig())
    const views = output.admin?.components?.views
    expect(views?.financeMonthDetail).toBeUndefined()
  })

  it('writes the resolved currency onto config.custom', () => {
    const output = ecommerceFinancePlugin({
      currency: { code: 'GBP', symbol: '£', locale: 'en-GB' },
    })(baseConfig())
    const currency = (output.custom as { ecommerceFinance?: { currency?: unknown } })
      ?.ecommerceFinance?.currency
    expect(currency).toEqual({ code: 'GBP', symbol: '£', locale: 'en-GB', decimals: 2 })
  })
})
