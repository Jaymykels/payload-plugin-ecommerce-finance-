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

export function FinanceNavLink() {
  const { user, permissions } = useAuth()
  const { config } = useConfig()
  const pathname = usePathname()
  const [container, setContainer] = useState<HTMLElement | null>(null)

  const allowed = Boolean(user) && Boolean(permissions?.collections?.[FINANCE_PERMISSION_SLUG]?.read)

  useEffect(() => {
    if (!allowed) {
      setContainer(null)
      return
    }
    const existing = findFinanceGroupContent()
    if (existing) {
      setContainer(existing)
      return
    }
    const observer = new MutationObserver(() => {
      const el = findFinanceGroupContent()
      if (el) {
        setContainer(el)
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [allowed])

  if (!allowed || !container) return null

  const href = `${config.routes.admin}/finance`
  const isActive = pathname?.startsWith(href) ?? false

  return createPortal(
    <Link className="nav__link" href={href} id="nav-finance-dashboard" prefetch={false}>
      {isActive && <div className="nav__link-indicator" />}
      <span className="nav__link-label">Finance Dashboard</span>
    </Link>,
    container,
  )
}

export default FinanceNavLink
