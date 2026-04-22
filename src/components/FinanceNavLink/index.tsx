'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import LinkImport from 'next/link.js'
import { usePathname } from 'next/navigation.js'
import { useAuth, useConfig } from '@payloadcms/ui'
import { unwrapDefault } from '../../utils/esm.js'
import { FINANCE_PERMISSION_SLUG } from '../../views/FinanceMonthDetail/constants.js'

const Link = unwrapDefault<any>(LinkImport)

const findFinanceGroupContent = (): HTMLElement | null => {
  const group = document.getElementById('nav-group-Finance')
  if (!group) return null
  return group.querySelector<HTMLElement>('.nav-group__content')
}

// Mount a display:contents slot as the first child of the Finance group's
// content so React's portal renders the Dashboard link ahead of the
// framework-rendered collection links.
const mountTopSlot = (content: HTMLElement): HTMLElement => {
  const slot = document.createElement('div')
  slot.style.display = 'contents'
  slot.setAttribute('data-finance-dashboard-slot', '')
  content.insertBefore(slot, content.firstChild)
  return slot
}

export function FinanceNavLink() {
  const { user, permissions } = useAuth()
  const { config } = useConfig()
  const pathname = usePathname()
  const [slot, setSlot] = useState<HTMLElement | null>(null)

  const allowed = Boolean(user) && Boolean(permissions?.collections?.[FINANCE_PERMISSION_SLUG]?.read)

  useEffect(() => {
    if (!allowed) {
      setSlot(null)
      return
    }

    let mounted: HTMLElement | null = null
    let observer: MutationObserver | null = null

    const attach = (content: HTMLElement) => {
      const existing = content.querySelector<HTMLElement>('[data-finance-dashboard-slot]')
      mounted = existing ?? mountTopSlot(content)
      setSlot(mounted)
    }

    const initial = findFinanceGroupContent()
    if (initial) {
      attach(initial)
    } else {
      observer = new MutationObserver(() => {
        const el = findFinanceGroupContent()
        if (el) {
          attach(el)
          observer?.disconnect()
        }
      })
      observer.observe(document.body, { childList: true, subtree: true })
    }

    return () => {
      observer?.disconnect()
      mounted?.remove()
    }
  }, [allowed])

  if (!allowed || !slot) return null

  const href = `${config.routes.admin}/finance`
  const isActive = pathname?.startsWith(href) ?? false

  return createPortal(
    <Link className="nav__link" href={href} id="nav-finance-dashboard" prefetch={false}>
      {isActive && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Dashboard</span>
    </Link>,
    slot,
  )
}

export default FinanceNavLink
