/** 0.2.1 原生组装由插件 assemble guard 接管注入，不能再要求旧补丁 40 标记。 */
export function hostPromptKeepsInject(text) {
  // ES5 and ASCII: reused verbatim by the WScript restart helper.
  var body = String(text || "");
  var identityMarked = body.indexOf("[dsh-purge] identity stripped") >= 0;
  var injectMarked = body.indexOf("[dsh-purge] complete prompt keeps waterfall inject") >= 0
    || body.indexOf("[dsh-purge] complete prompt keeps inject") >= 0;
  if (identityMarked && injectMarked) return true;
  // Missing or unrelated modules cannot pass the restart check.
  if (body.indexOf("system-prompt/assemble") < 0) return false;
  var identityLeft = body.indexOf("You are an AI agent powered by DeepSeek Harness.") >= 0;
  var dropsInject = body.indexOf("transformed.sections : [completeSection]") >= 0;
  var nativeRequiredContext = body.indexOf("const requiredContexts = new Set(") >= 0
    && body.indexOf("requiredContexts.has(entry.name)") >= 0;
  return !identityLeft && (!dropsInject || nativeRequiredContext);
}
