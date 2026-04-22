export const unwrapDefault = <T>(mod: T): T => {
  if (mod && typeof mod === 'object' && 'default' in (mod as Record<string, unknown>)) {
    return (mod as unknown as { default: T }).default
  }
  return mod
}
