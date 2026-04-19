import type { Access } from 'payload'
import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

export type EcommerceExtraOptions = {
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
}
