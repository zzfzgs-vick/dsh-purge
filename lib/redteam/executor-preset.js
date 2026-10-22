export const REDTEAM_EXECUTOR_PRESET_ID = 'redteam-executor'

const DELEGATION_PLUGINS = new Set([
  '@deepseek-ai/dsh-tool-subagent',
  '@deepseek-ai/dsh-tool-workflow',
  '@deepseek-ai/dsh-tool-ralph',
  '@deepseek-ai/dsh-workflow-ptc',
  '@deepseek-ai/dsh-workflow-worker-thread',
])

/** 使用主预设的工具与角色配置，但执行角色不挂载任何委派入口。 */
export function executorPresetOf(definition) {
  const filter = (rows) => rows.filter((row) => !DELEGATION_PLUGINS.has(row.name)).map((row) => (
    row.group === true ? { ...row, config: filter(row.config) } : { ...row }
  ))
  return {
    ...definition,
    id: REDTEAM_EXECUTOR_PRESET_ID,
    name: '红队执行角色（子智能体）',
    description: '供红队主会话派生的执行角色使用，不提供再次委派、workflow 或 ralph 工具。',
    order: (definition.order ?? 10) + 1,
    plugins: filter(definition.plugins),
  }
}

/** 就地迁移 spawn 行，保留角色正文、注释及无关用户配置。 */
export function migrateSubagentPreset(text) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n')
  let changed = false
  for (let start = 0; start < lines.length; start += 1) {
    const match = /^( *)- id: tool-subagent\s*(?:#.*)?$/.exec(lines[start])
    if (!match) continue
    const indent = match[1].length
    let end = start + 1
    while (end < lines.length && (!lines[end].trim() || lines[end].trimStart().startsWith('#')
      || lines[end].search(/\S/) > indent)) end += 1
    const block = lines.slice(start, end)
    if (!block.some((line) => /^\s*provider:\s*spawn\s*(?:#.*)?$/.test(line))) continue
    const configAt = block.findIndex((line) => /^\s*config:\s*$/.test(line))
    if (configAt < 0) continue
    const fieldIndent = block[configAt].search(/\S/) + 2
    for (let at = configAt + 1; at < block.length; at += 1) {
      if (block[at].search(/\S/) !== fieldIndent || !/^\s*toolFilter:/.test(block[at])) continue
      let stop = at + 1
      while (stop < block.length && (!block[stop].trim() || block[stop].search(/\S/) > fieldIndent)) stop += 1
      block.splice(at, stop - at)
      changed = true
      break
    }
    if (!block.some((line) => line.search(/\S/) === fieldIndent && /^\s*agentPreset:/.test(line))) {
      block.splice(configAt + 1, 0, ' '.repeat(fieldIndent) + 'agentPreset: ' + REDTEAM_EXECUTOR_PRESET_ID)
      changed = true
    }
    lines.splice(start, end - start, ...block)
    start += block.length - 1
  }
  return { text: changed ? lines.join('\n') : text, changed }
}
