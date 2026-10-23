export const REDTEAM_EXECUTOR_PRESET_ID = 'redteam-executor'
export const EXECUTOR_PERSONA = '你是红队执行角色。只完成当前分配的角色任务，遵循对应角色稿和会话范围；如实报告结果、证据与缺少的资源。你是叶子节点，不再委派子智能体，不启动 workflow 或 ralph；通过消息工具向主会话汇报。'

export function isDelegationTool(name) {
  return /^subagent(?:_|$)/.test(String(name)) || name === 'workflow' || name === 'ralph'
}

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
    row.group === true ? { ...row, config: filter(row.config) }
      : row.name === '@deepseek-ai/dsh-persona' ? { ...row, config: { ...row.config, prefix: EXECUTOR_PERSONA } }
        : { ...row }
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

/** 就地迁移 spawn/fork 行，保留角色正文、注释及无关用户配置。 */
export function migrateSubagentPreset(text) {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n')
  let changed = false
  for (let start = 0; start < lines.length; start += 1) {
    const match = /^( *)- id: (tool-subagent(?:-fork)?)\s*(?:#.*)?$/.exec(lines[start])
    if (!match) continue
    const indent = match[1].length
    let end = start + 1
    while (end < lines.length && (!lines[end].trim() || lines[end].trimStart().startsWith('#')
      || lines[end].search(/\S/) > indent)) end += 1
    const block = lines.slice(start, end)
    const fork = match[2] === 'tool-subagent-fork'
    const provider = fork ? /^\s*provider:\s*fork\s*(?:#.*)?$/ : /^\s*provider:\s*spawn\s*(?:#.*)?$/
    if (!block.some((line) => provider.test(line))) continue
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
    if (fork) {
      const depthAt = block.findIndex((line) => line.search(/\S/) === fieldIndent && /^\s*maxDepth:/.test(line))
      const depth = ' '.repeat(fieldIndent) + 'maxDepth: 1'
      if (depthAt < 0) { block.splice(configAt + 1, 0, depth); changed = true }
      else if (!/^\s*maxDepth:\s*1\s*(?:#.*)?$/.test(block[depthAt])) { block[depthAt] = depth; changed = true }
    } else if (!block.some((line) => line.search(/\S/) === fieldIndent && /^\s*agentPreset:/.test(line))) {
      block.splice(configAt + 1, 0, ' '.repeat(fieldIndent) + 'agentPreset: ' + REDTEAM_EXECUTOR_PRESET_ID)
      changed = true
    }
    lines.splice(start, end - start, ...block)
    start += block.length - 1
  }
  return { text: changed ? lines.join('\n') : text, changed }
}
