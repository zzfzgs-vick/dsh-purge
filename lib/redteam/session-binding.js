/** 工具与角色稿共用的进程内会话绑定，不依赖面板的全局当前靶标。 */
export const bindings = new Map()
const setBinding = bindings.set.bind(bindings)
bindings.set = (key, value) => {
  if (!bindings.has(key) && bindings.size >= 500) bindings.delete(bindings.keys().next().value)
  return setBinding(key, value)
}

export function sessionInfoOf(context) {
  const session = context?.agent?.session || context?.session
  if (!session) return {}
  const id = session.id ?? session.header?.id
  const parentId = session.header?.parentSession
  return { session, id: id == null ? undefined : String(id), parentId: parentId == null ? undefined : String(parentId) }
}

export function bindingKeyOf(context) {
  const info = sessionInfoOf(context)
  if (info.id === undefined) return { rootId: undefined, sessionId: undefined, chain: [] }
  let sessions
  try { sessions = (context?.agent?.ctx || context?.ctx)?.get('sessions') } catch { /* 会话可能尚未发布 */ }
  const chain = []
  const seen = new Set()
  let current = info.session
  while (current && chain.length < 64) {
    const entry = sessionInfoOf({ session: current })
    if (entry.id === undefined || seen.has(entry.id)) break
    seen.add(entry.id)
    chain.push(entry.id)
    if (!entry.parentId) break
    const parent = sessions?.get(entry.parentId)
    if (!parent) {
      if (!seen.has(entry.parentId)) chain.push(entry.parentId)
      break
    }
    current = parent
  }
  return { rootId: chain.at(-1) ?? info.id, sessionId: info.id, chain }
}

export function bindKeysOf(context) {
  const { rootId, sessionId, chain } = bindingKeyOf(context)
  return [...new Set([rootId, sessionId, ...chain].filter(Boolean))]
}

export function boundEngagementOf(context) {
  for (const key of bindKeysOf(context)) {
    const id = bindings.get(key)
    if (typeof id === 'string' && id) return id
  }
  return ''
}
