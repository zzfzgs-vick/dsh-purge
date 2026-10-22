/** 当前宿主目录服务优先；离线会话从持久目录变更记录恢复。 */
export function sessionWorkingDirectory(ctx, session, events) {
  if (!session) return "";
  if (events === undefined) {
    try {
      const id = session.id ?? session.header?.id;
      const owner = ctx?.get?.("agents")?.get(id)?.ctx || ctx;
      const directory = owner?.get?.("workingDirectory")?.get(session);
      if (typeof directory === "string" && directory.trim()) return directory;
    } catch { /* 服务尚未挂载时，读取已提交的目录记录。 */ }
  }
  const history = events ?? session.snapshotEvents?.() ?? [];
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const event = history[i];
    if (event?.type === "working-directory/change" && typeof event.data?.cwd === "string") {
      return event.data.cwd;
    }
  }
  return typeof session.header?.cwd === "string" ? session.header.cwd : "";
}
