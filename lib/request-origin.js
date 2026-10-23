function header(request, name) {
  const value = request.headers?.[name]
  return typeof value === 'string' ? value.trim() : ''
}

/** 官方桌面转发会去掉 Origin/Sec-Fetch-Site；浏览器请求必须严格同源。 */
export function isTrustedPluginRequest(request) {
  if (request.headers?.origin !== undefined
    && (typeof request.headers.origin !== 'string' || !request.headers.origin.trim())) return false
  const site = header(request, 'sec-fetch-site').toLowerCase()
  if (site === 'cross-site') return false
  const host = header(request, 'host')
  let target
  try {
    target = new URL((request.socket?.encrypted ? 'https://' : 'http://') + host)
    if (!host || target.username || target.password || target.pathname !== '/' || target.search || target.hash) return false
  } catch { return false }
  const origin = header(request, 'origin')
  if (!origin) {
    if (site === 'same-origin') return true
    const remote = String(request.socket?.remoteAddress || '').replace(/^::ffff:/i, '')
    const local = /^127(?:\.\d{1,3}){3}$/.test(remote) || remote === '::1'
    return local && /^(localhost|127(?:\.\d{1,3}){3}|\[::1\])(?::\d+)?$/i.test(host)
      && (!site || site === 'none')
  }
  try {
    const source = new URL(origin)
    return !source.username && !source.password && source.pathname === '/' && !source.search && !source.hash
      && (source.protocol === 'http:' || source.protocol === 'https:') && source.origin === target.origin
  } catch { return false }
}
