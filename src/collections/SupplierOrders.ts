import type { Access, CollectionConfig } from 'payload'

import {
  accessGate,
  dateField,
  isAuthed,
  monthField,
  poNumberField,
  type PriceComponents,
} from './shared.js'
import { computeSupplierOrderTotals } from './hooks/computeSupplierOrderTotals.js'
import { supplierOrderEffects } from './hooks/supplierOrderEffects.js'

export type BuildSupplierOrdersCollectionOptions = {
  access?: Access
  priceComponents?: PriceComponents
}

const STATUSES = [
  { label: 'Ordered', value: 'ordered' },
  { label: 'In Transit', value: 'in-transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Invoiced', value: 'invoiced' },
  { label: 'Paid', value: 'paid' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

export const buildSupplierOrdersCollection = (
  { access, priceComponents }: BuildSupplierOrdersCollectionOptions = {},
): CollectionConfig => {
  const priceAdmin = priceComponents ? { components: priceComponents } : {}

  return {
    slug: 'supplier-orders',
    access: accessGate(access ?? isAuthed),
    admin: {
      defaultColumns: ['poNumber', 'date', 'supplierName', 'status', 'grandTotal'],
      group: 'Finance',
      listSearchableFields: ['poNumber', 'supplierName'],
      useAsTitle: 'poNumber',
    },
    hooks: {
      afterChange: [supplierOrderEffects],
      beforeChange: [computeSupplierOrderTotals],
    },
    fields: [
      poNumberField('supplier-orders'),
      {
        name: 'status',
        type: 'select',
        admin: { position: 'sidebar' },
        defaultValue: 'ordered',
        options: [...STATUSES],
        required: true,
      },
      { type: 'row', fields: [dateField(), monthField()] },
      {
        name: 'supplierName',
        type: 'text',
        admin: { description: 'Free-text supplier name.' },
        required: true,
      },
      {
        name: 'lineItems',
        type: 'array',
        admin: { description: 'Products purchased on this order.' },
        minRows: 1,
        required: true,
        fields: [
          {
            name: 'product',
            type: 'relationship',
            relationTo: 'products',
            required: true,
          },
          {
            type: 'row',
            fields: [
              {
                name: 'unitCost',
                type: 'number',
                admin: { ...priceAdmin, width: '50%' },
                min: 0,
                required: true,
              },
              {
                name: 'qtyOrdered',
                type: 'number',
                admin: { width: '50%' },
                min: 1,
                required: true,
              },
            ],
          },
          {
            type: 'row',
            fields: [
              {
                name: 'qtyReceived',
                type: 'number',
                admin: {
                  description: 'May be less, equal to, or greater than Qty Ordered.',
                  width: '50%',
                },
                min: 0,
              },
              {
                name: 'lineTotal',
                type: 'number',
                admin: {
                  ...priceAdmin,
                  description: 'Unit Cost × Qty Ordered.',
                  readOnly: true,
                  width: '50%',
                },
              },
            ],
          },
        ],
      },
      {
        type: 'row',
        fields: [
          {
            name: 'deliveryCost',
            type: 'number',
            admin: { ...priceAdmin, width: '50%' },
            defaultValue: 0,
            min: 0,
            required: true,
          },
          {
            name: 'grandTotal',
            type: 'number',
            admin: {
              ...priceAdmin,
              description: 'Sum of line totals + delivery cost.',
              readOnly: true,
              width: '50%',
            },
          },
        ],
      },
      { name: 'notes', type: 'textarea' },
      {
        name: 'inventoryApplied',
        type: 'checkbox',
        admin: {
          description: 'Set automatically once the Delivered inventory bump has run.',
          position: 'sidebar',
          readOnly: true,
        },
        defaultValue: false,
      },
      {
        name: 'generatedExpense',
        type: 'relationship',
        admin: {
          description: 'Expense record auto-created when status moved to Paid.',
          position: 'sidebar',
          readOnly: true,
        },
        relationTo: 'expenses',
      },
    ],
  }
}
