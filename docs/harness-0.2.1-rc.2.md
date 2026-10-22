# Harness 0.2.1-rc.2 适配说明（1.1.72）

更新日期：2026-10-22。维护仓库：[zzfzgs-vick/dsh-purge](https://github.com/zzfzgs-vick/dsh-purge)。

本次修改基于 1.1.71，保留原作者小杨（YuJunZhiXue）的署名、[上游来源](https://github.com/YuJunZhiXue/dsh-purge)及现有许可文件。1.1.72 是本维护分支的版本号，不代表上游已发布同名版本。本文说明以本次源码提交为准；源码归档可用不代表已经创建 Git tag、GitHub Release 或 npm 发布。

## 修复内容

| 功能 | 旧行为与原因 | 1.1.72 的行为 |
|---|---|---|
| 首轮提示词组装 | 配置与运行时重新补入 `Your working directory is {{cwd}}.`，宿主不再注册 `cwd` 提示变量，导致 `unknown prompt variable` | 清空旧配置，停止补入该后缀，清理 persona 中的旧目录语句；必需目录上下文继续由宿主提供 |
| 红队模式加载 | 模板和已生成的用户预设保留旧 `toolFilter`，宿主加载 `tool-subagent` 时直接拒绝；原安装迁移没有处理它 | 使用独立 `redteam-executor` 预设及 `agentPreset` 选择，自动迁移旧 spawn 行，保留用户角色正文；执行角色不挂载委派入口 |
| 子智能体并发统计 | `listChildren()` 返回目录记录，旧逻辑读取不存在的 `kind`、`activity`，导致计数为 0 | 联合读取子会话目录和驻留 Session，采用当前宿主的活动判定；已启动预留只计一次，未启动预留仍占名额 |
| 子智能体名额释放 | `subagent/end` 监听器依赖不存在的第二个 `parent` 参数 | 从事件 carrier 读取父智能体，在 start 时将预留关联到 runId、childId，end 仅释放对应运行；无预留子会话结束不会误删其他预留 |
| 自动续跑 | 将布尔属性 `inbox.hasPending` 当函数检查，忽略已排队消息 | 按布尔属性判断；有待处理消息时不追加“继续”，默认关闭自动续跑的行为保持不变 |
| 当前目录与回退 | 从不变的 `session.header.cwd` 读取目录，忽略运行中切换 | 在线优先使用 `workingDirectory` 服务，离线会话从 `working-directory/change` 历史恢复；没有变更时使用初始目录 |
| ZIP 更新资源 | 复制清单缺少 `presets`、`skills`，代码与资源版本可能不一致 | 两个目录与代码一同完整替换，移除过期资源；不修改插件目录外的用户技能及会话数据 |
| 更新前的运行检查 | 演练台更新面板重复使用旧子会话字段，可能漏报仍驻留的子智能体 | 使用相同的当前宿主判定，存在驻留子会话时提示先结束，避免更新重启打断任务 |
| 本维护分支的安装与更新来源 | 安装元数据、说明及更新器指向上游，更新可能覆盖维护分支修复 | 安装归档、元数据、更新器及演练台仓库默认值指向 `zzfzgs-vick/dsh-purge`；上游署名、许可和历史版本链接保留 |

新增共享模块 `lib/working-directory.js`，由提示词组装、目录捕获和回退功能共用。`dshTarget` 更新为 `0.2.1-rc.2`。

## 同版本补充修复：红队模式加载失败

本补丁继续使用 **1.1.72 维护分支更新**，`package.json` 版本号不变。此前提交的 1.1.72 中还存在本问题，因此需要按 master 最新提交区分内容，不能把“已安装 1.1.72”作为已经包含此修复的证据。

失败记录位于 `$DSH_HOME/redteam/preset-declare.json`，原始原因是：

```text
tool-subagent: toolFilter is no longer supported;
configure persona and tool plugins in an Agent Preset
and select it with agentPreset (spawn only)
```

### 修改路径

- `presets/redteam/agent.cordis.yml`：删除废弃 `toolFilter`，以 `agentPreset: redteam-executor` 选择执行角色，保留绝对委派深度上限 `maxDepth: 1`。
- `lib/redteam/executor-preset.js`：从当前红队定义派生执行角色，保留角色配置、任务工具和消息控制，排除 subagent、workflow、ralph 等委派插件；对已有用户预设中的 spawn 行作最小字段迁移。
- `lib/redteam/index.js`：启动时迁移 `$DSH_HOME/.agent-presets/redteam/agent.cordis.yml`，先声明执行角色再声明主红队预设；释放时清理两项声明。不会整份覆盖用户角色正文或无关配置。
- `lib/identity.js`：识别执行角色的预设 ID，维持红队角色提示词处理路径。
- `lib/preset-default.js`：停用或卸载时，也清理指向执行角色的默认预设选择。

执行角色会在预设列表显示为“红队执行角色（子智能体）”，供主红队模式派生子智能体使用。日常选择主“红队模式”即可。执行角色仍保留消息工具，但不提供再次委派、workflow 或 ralph；主红队模式保留派活入口。

### 对已有安装的影响

更新到本分支最新 master 内容后，从托盘完全退出再重新打开 Harness。启动迁移会清理旧字段并保留已有角色正文，不需要删除整个用户预设或设置 `REDTEAM_PRESET_REFRESH=1` 强制覆盖。

如果版本号仍显示 1.1.72，这是本次同版本维护的预期行为。需要重新获取 master 最新源码内容，不能只核对版本号。验证时查看新启动产生的 `preset-declare.json`，应为 `ok: true`、`phase: registered` 且没有有效 `broken`；不要手动将旧状态文件改成成功。

## 安装与升级

先保存正在进行的工作，等待子智能体结束。桌面端使用 `desktop` profile：

```sh
dsh plugin --profile desktop add https://github.com/zzfzgs-vick/dsh-purge/archive/refs/heads/master.tar.gz
```

只在确实使用官方 Web 时单独安装 Web profile：

```sh
dsh plugin --profile web add https://github.com/zzfzgs-vick/dsh-purge/archive/refs/heads/master.tar.gz
```

1. 安装后从托盘完全退出桌面端再打开；Web 则退出并重新启动 `dsh web`。
2. 在插件面板核对版本为 `1.1.72`，并确认更新来源为本维护仓库。
3. 已经应用过 1.1.71 补丁的本地安装，本次 JavaScript 和配置修复在重新加载后生效。首次安装或宿主刚升级时，按原安装流程在对应宿主的“清洗”页点“应用”，等待成功重启。
4. 新开一轮提问，确认不再出现 `unknown prompt variable "{{cwd}}"`。涉及并发、目录切换或自动续跑时，可按下节场景复核。

不要只复制现有文件而漏掉新增的 `lib/working-directory.js` 或 `lib/redteam/executor-preset.js`。手动同步时还需同步 `presets`、`skills` 目录。npm 上没有本插件，不能使用 `pnpm add dsh-purge` 安装。

## 验证证据及边界

验证环境是 Windows 上已安装的官方 Harness `0.2.1-rc.2`，使用该安装随附的 Cordis、SystemPrompt、作用域和工具定义接口。

- 全部 56 个运行时、CLI 和客户端 JavaScript 文件通过 `node --check`；部署与预设 YAML 解析通过。
- 56 个工具定义使用当前宿主 `defineTool` 成功注册。
- 在内存场景中验证并发上限、驻留与非驻留子会话、未启动预留、去重计数、重复事件、乱序结束、无预留任务结束、多根会话隔离、嵌套父链、手动释放和同时申请。
- 验证队列非空时不自动续跑，清空后发送一次；实时目录、持久目录变更、初始目录、变更捕获、在线和离线回退、观察资源释放均通过。
- ZIP 覆盖逻辑使用本地模拟归档验证了两个目标目录同步、过期资源移除、其他文件保留以及重复目标去重；没有执行真实远端更新。
- 使用真实 SystemPrompt 组装流水线和插件 guard 验证旧 cwd 错误消除、必需目录上下文以及路径中字面 `{{…}}` 保留。
- 红队加载补充验证：在临时隔离目录内，使用已安装宿主的 base 组合、Web/桌面共享覆盖项、真实 Cordis Loader 和预设注册表，运行插件自己的 redteam 启动入口。带旧字段的预设自动迁移，两项完整预设均没有 `broken`，启动状态为 `ok: true`。实际创建空闲 Agent 并挂载对应预设，确认主预设拥有 subagent，执行角色拥有任务及消息工具但没有 subagent、subagent_fork、workflow、ralph。迁移重复执行不再产生修改，原 persona 正文保持一致。
- 此前的语法与工具注册验证没有覆盖完整红队预设挂载，本次补充该验证路径；临时配置、数据和链接均已清理，未新增测试源码。
- 本地使用者已确认首轮 cwd 修复后的基础对话正常。整套适配没有通过真实模型 API 或真实演练任务作端到端验证，也没有实际执行更新后的重启流程。

本轮不新增测试源码。官方 Web、其他操作系统及其他 Harness 版本未完成本次运行验证；不要把共享代码的本地接口验证当成这些环境的完整兼容性保证。

## English summary

Version 1.1.72 is the `zzfzgs-vick/dsh-purge` maintenance branch adaptation for Harness 0.2.1-rc.2. It removes the obsolete cwd template, corrects child concurrency and reservation lifecycle handling, reads the boolean inbox flag, shares current-directory resolution with rewind, synchronizes presets and skills during ZIP updates, and fixes the update preflight's child-state check. A same-version follow-up replaces the rejected redteam `toolFilter` with a separate executor preset, migrates existing configuration without replacing user persona text, and preserves leaf-agent restrictions. Install and update URLs point to this maintenance repository; original attribution and licensing remain intact. Existing 1.1.72 installs must fetch the latest master content and fully restart the host to receive this follow-up.

Validation used the installed Windows host: 56 JavaScript syntax checks, 56 tool definitions, actual Cordis/SystemPrompt interfaces, in-memory lifecycle and directory scenarios, and local update fixtures. The redteam follow-up additionally executes the real bootstrap and registry in an isolated directory, migrates a legacy preset, mounts both complete presets and initializes idle Agents to verify executor tool separation. No new test sources, model API calls, real remote updates or restart tests were performed. Web, other operating systems and other Harness versions were not runtime-validated for this change.
