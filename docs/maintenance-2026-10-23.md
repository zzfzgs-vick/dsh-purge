# 1.1.72 同版本维护补充：2026-10-23

适配目标：Harness **0.2.1-rc.2**。本次继续使用 **1.1.72**，不新增版本号。此前的 1.1.72 内容尚未包含下列修复，应以本维护仓库最新 master 提交为准。

## 修复内容与根因

| 项目 | 根因及影响 | 本次修改 |
|---|---|---|
| 角色稿与会话隔离 | 角色读取依赖全局 `redteam/current`，面板切换靶标后可能读取其他会话的角色稿 | 新增 `lib/redteam/session-binding.js`，绑定工具与角色读取共用根会话、祖先链和绑定表；按会话绑定读取角色，支持重新绑定及自定义事实库目录 |
| 演练台更新 | 旧演练台独立使用 npm、tag 检查和自制重启流程，与维护仓库统一更新器不一致 | `lib/redteam/ui.js` 复用 `lib/update.js` 和宿主重启适配器；同版本维护按提交识别更新，当前维护内容选择 master，历史版本只选仓库实际 tag；删除旧 npm 更新路径 |
| 清洗与重启判定 | 补丁 40 的旧替换规则不匹配当前宿主，但状态仍可能显示已就绪；重启检查又不识别宿主原生必需上下文机制 | 删除失效补丁 40 及遗留替换常量；`lib/host-clean.js` 识别当前原生组装，`lib/desktop.js` 重启脚本复用相同检查函数；插件 assemble guard 继续处理注入 |
| 演练台运行数量与更新阻塞 | 页面和更新检查读取目录记录中不存在的 `kind`、`activity`，漏报驻留子会话 | 联合读取子会话目录与驻留 Session；页面正确计数，存在驻留子会话时阻止更新 |
| 清洗页目录规则 | 前端依赖过时的目录投影/初始路径，切换目录后可能操作旧位置 | `client.js` 发送当前选择的会话 ID，`lib/index.js` 调共享目录服务解析；离线会话重放目录变更并释放观察资源；无法解析时返回 409，手动指定目录仍优先 |
| fork 叶子约束 | 独立执行预设仅覆盖 spawn，fork 仍继承主指挥的委派工具 | 模板与已有用户预设的 fork 配置补齐 `maxDepth: 1`；红队子会话过滤委派工具 schema，并由宿主执行 guard 拒绝 subagent、workflow、ralph 再委派，覆盖继承组合和嵌套调用；主会话保留派活能力 |
| 执行角色职责 | 执行预设复制主指挥 persona，出现“自己不动手”与执行任务的冲突 | `lib/redteam/executor-preset.js` 提供独立执行 persona；`lib/identity.js` 同时重写 fork 子会话的执行职责，继续保留会话绑定的角色正文 |
| 当前模式环境检查 | 仅根据不可变创建头判断模式，standard 会话切换红队后首次检查被跳过 | 读取当前挂载/选择的模式；主红队会话首次检查生效，子会话不重复执行主会话前置检查 |
| 接口来源校验 | 演练台回环连接无条件放行任意 Origin，跨站 POST 可通过处理器 | 新增 `lib/request-origin.js`，演练台与清洗接口共用严格同源校验；拒绝跨站、null、畸形、协议或端口不符的 Origin；保留同源 Web 请求及官方桌面移除 Origin 后的本机转发 |

主预设启动迁移会保留用户 persona 正文与无关自定义项。执行角色继续保留任务与消息工具。宿主内置包、现有资产库、会话日志及用户角色文件未作为本次源码同步内容。

## 安装与验收

1. 保存工作，等待子任务结束。通过本维护仓库 master 安装或更新，参见[安装与升级](harness-0.2.1-rc.2.md#安装与升级)。版本保持 1.1.72，不能只比较版本号判断是否更新。
2. 从托盘完全退出 Harness 再打开，让新代码及预设迁移生效；需要完整退出时，演练台显示手动操作提示，不再错误地倒计时宣称已重启。
3. 检查主红队模式和红队执行角色均能加载；清洗状态与重启检查应一致。切换会话目录后检查目录规则，手动选择目录仍应有效。
4. 在两个本地测试会话绑定不同靶标；面板切换当前靶标后，各会话角色稿仍应来自各自绑定。会话绑定沿用原有进程内契约，重启后需要重新打开/绑定靶标。
5. 使用无副作用的小任务检查运行数量和名额释放；有驻留子任务时更新应被阻止。主会话仍能 spawn/fork，执行角色再次委派应被拒绝，消息回报应正常。
6. 在空白 standard 会话切换红队，检查首次环境提示；演练台和清洗接口应能接受正常同源及官方桌面请求。

## 已完成的验证及边界

- 本轮本地修复完成时，63 个 JavaScript 文件语法检查通过；客户端通过现有 `scripts/build-client.mjs` 重新生成。
- 使用已安装官方宿主的真实 Loader、base 组合、Web/桌面共享覆盖和预设注册表，执行插件启动流程；主预设、spawn 执行预设和继承组合的 fork 空闲 Agent 初始化通过。
- fork 模型工具 schema 不含委派入口；实际 `tools.execute` 拒绝 fork 的 subagent_fork、workflow、ralph，未执行工具正文；嵌套调用同样被拒绝，主会话 guard 正常放行。
- 角色绑定 A 时，不设置全局 current 或将其改为 B 均读取 A；重新绑定 C 后读取 C。验证自定义事实库目录及执行 persona 与主指挥职责分离。
- 真实 SystemPrompt 流水线验证 operator/complete 文本保留；关闭可选上下文时必需目录上下文仍存在。当前宿主清洗检查返回 true，桌面共用检查函数及生成脚本语法通过。
- 在线/离线目录解析、过期目录提示覆盖、手动目录保留、观察对象释放及不存在会话拒绝通过；前端请求携带所选会话 ID。
- 15 组来源校验场景通过；真实临时回环 HTTP 服务中，外部/null/cross-site POST 返回 403，同源 Web 及官方桌面式无 Origin 转发正常返回。
- 更新及重启使用模拟依赖验证：同版本更新识别、master/历史 tag 路由、驻留子任务阻塞、任意 URL 拒绝、响应发送后安排重启、完整退出提示及客户端分支均通过。

未新增测试源码；未调用模型 API、执行真实演练、下载升级或重启系统。当前文档不声明这一轮 GUI 手动验收已通过。其他操作系统、官方 Web 独立运行及其他 Harness 版本未完成端到端验证。

## English summary

This same-version **1.1.72** maintenance update targets Harness **0.2.1-rc.2**. It isolates role selection by session binding, unifies drill-panel updates with the maintenance updater, removes obsolete patch 40 and shares native-host restart checks, fixes resident-child counts and update blocking, resolves rule directories from the selected session, enforces fork leaf restrictions, separates executor persona duties, checks the currently selected mode, and validates request origins through one shared helper.

Existing installs must fetch the latest master content and fully restart. Session bindings remain process-local and must be restored after restart. Validation covered 63 JS syntax checks, actual host bootstrap/presets/idle Agents, fork execution guards, role and directory fixtures, real temporary loopback HTTP requests, and mocked updater/restart flows. No new test sources, model requests, live exercises, actual update downloads or system restart tests were performed. This does not claim completed manual GUI acceptance or cross-platform end-to-end validation.
