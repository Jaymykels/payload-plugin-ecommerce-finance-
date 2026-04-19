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

export type BuildInvestmentsCollectionOptions = {
  access?: Access
  priceComponents?: PriceComponents
}

const INVESTMENT_TYPES = [
  { label: 'Owner Capital', value: 'owner-capital' },
  { label: 'Loan Received', value: 'loan-received' },
  { label: 'Grant', value: 'grant' },
] as const

export const buildInvestmentsCollection = (
  { access, priceComponents }: BuildInvestmentsCollectionOptions = {},
): CollectionConfig => {
  return {
    slug: 'investments',
    access: accessGate(access ?? isAuthed),
    admin: {
      defaultColumns: ['entryNumber', 'date', 'type', 'amount', 'isRecurring', 'description'],
      group: 'Finance',
      listSearchableFields: ['description', 'type'],
      useAsTitle: 'description',
    },
    fields: [
      entryNumberField('investments'),
      { type: 'row', fields: [dateField(), monthField()] },
      {
        type: 'row',
        fields: [
          {
            name: 'type',
            type: 'select',
            admin: { width: '50%' },
            options: [...INVESTMENT_TYPES],
            required: true,
          },
          {
            name: 'isRecurring',
            type: 'checkbox',
            admin: {
              description: 'Check if this repeats on a schedule (leave unchecked for one-off).',
              width: '50%',
            },
            defaultValue: false,
          },
        ],
      },
      amountField(priceComponents),
      { name: 'description', type: 'textarea', required: true },
    ],
  }
}
