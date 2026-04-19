import type { Access, CollectionConfig } from 'payload'

import {
  accessGate,
  amountField,
  dateField,
  entryNumberField,
  isAuthed,
  monthField,
  type PriceComponents,
} from './shared.js'

export type BuildExpensesCollectionOptions = {
  access?: Access
  priceComponents?: PriceComponents
}

const EXPENSE_CATEGORIES = [
  { label: 'Delivery & Transport', value: 'delivery-transport' },
  { label: 'Labels & Packaging', value: 'labels-packaging' },
  { label: 'Marketing & Ads', value: 'marketing-ads' },
  { label: 'Platform & Tech', value: 'platform-tech' },
  { label: 'Insurance', value: 'insurance' },
  { label: 'Assets (Equipment)', value: 'assets' },
  { label: 'Miscellaneous', value: 'miscellaneous' },
] as const

const PAYMENT_METHODS = [
  { label: 'Bank Transfer', value: 'bank-transfer' },
  { label: 'POS', value: 'pos' },
  { label: 'Cash', value: 'cash' },
  { label: 'Mobile Money', value: 'mobile-money' },
  { label: 'Direct Debit', value: 'direct-debit' },
] as const

export const buildExpensesCollection = (
  { access, priceComponents }: BuildExpensesCollectionOptions = {},
): CollectionConfig => {
  return {
    slug: 'expenses',
    access: accessGate(access ?? isAuthed),
    admin: {
      defaultColumns: ['entryNumber', 'date', 'category', 'amount', 'paymentMethod', 'description'],
      group: 'Finance',
      listSearchableFields: ['description', 'category', 'paymentMethod'],
      useAsTitle: 'description',
    },
    fields: [
      entryNumberField('expenses'),
      { type: 'row', fields: [dateField(), monthField()] },
      {
        type: 'row',
        fields: [
          {
            name: 'category',
            type: 'select',
            admin: { width: '50%' },
            options: [...EXPENSE_CATEGORIES],
            required: true,
          },
          {
            name: 'paymentMethod',
            type: 'select',
            admin: { width: '50%' },
            options: [...PAYMENT_METHODS],
            required: true,
          },
        ],
      },
      amountField(priceComponents),
      { name: 'description', type: 'textarea' },
    ],
  }
}
