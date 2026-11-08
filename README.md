# dsh-purge：DeepSeek Harness 0.2.2-rc.1 适配版

基于本机保存的 **dsh-purge 1.1.90** 源码维护，适配 **DeepSeek Harness 0.2.2-rc.1**。这是本地维护副本，不是 DeepSeek 官方项目，也不是原作者发布的新版本。

## 下载

安装包见 [Releases](https://github.com/zzfzgs-vick/dsh-purge/releases)。下载 `.tgz` 后按本地插件安装流程使用；同一 Release 提供 SHA-256 校验文件。

软件包版号仍为 `1.1.90`，适配目标在 `package.json` 的 `dshTarget` / `dshTargets` 中标明。仅验证了 Harness `0.2.2-rc.1`，不声明支持其他版本。

## 本次适配

- 更新新版代码形状及迁移后的模块位置，修复相关补丁失配。
- 完整提示词预设保留插件提示词、工具定义及必需运行上下文。
- 修复重复应用时重复注册退出监听的问题。
- 修复演练台预设对已合并 `list-agents` 子模块的旧引用；`list_agents` 功能仍由主模块提供。
- 保留原有规则、技能、界面、演练台及运行期功能代码。

本地验证中，当前适用补丁 **70/70 就绪**，待应用和失配均为 **0**；演练台预设正常注册。验证范围包括启动、提示词组装、规则和技能读写、接口以及 Office 文档转换，没有触发真实模型请求或外部演练操作。

详细变更见 [LOCAL-REPAIR.md](LOCAL-REPAIR.md)。

## 原项目文档与署名

原作者：**HunYiSage / dsh-purge maintainers**。原始说明保存在 [README.upstream.md](README.upstream.md)，中文文档见 [README.zh-CN.md](README.zh-CN.md)。这些文档中的旧兼容版本和上游下载地址仅作为历史参考，以本页和本地适配说明为准。

保留原有 [LICENSE](LICENSE)、[NOTICE](NOTICE) 和第三方许可声明；沿用 Apache-2.0 许可。修改记录见 [LOCAL-REPAIR.md](LOCAL-REPAIR.md)。

仓库和安装包不包含本机凭据、私人提示词、会话、诊断日志或演练台业务数据。
