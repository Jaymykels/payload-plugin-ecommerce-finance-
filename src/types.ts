import type { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

export type EcommerceExtraOptions = {
  disabled?: boolean
  products?: {
    collectionOverride?: CollectionOverride
  }
  orders?: {
    collectionOverride?: CollectionOverride
  }
}
