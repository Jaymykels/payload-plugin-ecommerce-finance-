import type { AdminViewServerProps } from 'payload'
import LinkImport from 'next/link.js'
import React from 'react'

import { TOKENS } from './tokens.js'
import { Shell } from './index.js'
import { FINANCE_PERMISSION_SLUG } from './constants.js'
import { unwrapDefault } from '../../utils/esm.js'

const Link = unwrapDefault<any>(LinkImport)

const primaryBtnStyle: React.CSSProperties = {
  padding: '7px 13px',
  fontSize: 12,
  borderRadius: 6,
  border: `1px solid ${TOKENS.accent}`,
  background: TOKENS.accent,
  color: '#fff',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  marginTop: 12,
}

export default async function RedirectToCurrent(props: AdminViewServerProps) {
  const { initPageResult } = props
  const { req, permissions } = initPageResult
  const { payload, user } = req
  const adminRoute = payload.config.routes.admin

  const canRead = Boolean(user) && Boolean(permissions?.collections?.[FINANCE_PERMISSION_SLUG]?.read)

  if (!canRead) {
    return (
      <Shell props={props}>
        <h2>Sign in required</h2>
        <p style={{ color: TOKENS.fgSoft }}>You need an account with access to the Finance collections to view this page.</p>
        <Link href={`${adminRoute}/login`} style={primaryBtnStyle}>Go to login</Link>
      </Shell>
    )
  }

  const now = new Date()
  const target = `${adminRoute}/finance/${now.getUTCFullYear()}/${now.getUTCMonth() + 1}`

  return (
    <Shell props={props}>
      <meta httpEquiv="refresh" content={`0;url=${target}`} />
      <h2>Loading finance dashboard…</h2>
      <p style={{ color: TOKENS.fgSoft }}>If you are not redirected, <Link href={target}>continue here</Link>.</p>
    </Shell>
  )
}
