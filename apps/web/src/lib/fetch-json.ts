export async function readJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      response.ok
        ? "服务返回了空响应，请稍后重试"
        : `服务异常（${response.status}），请稍后重试`,
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const preview = text.replace(/\s+/g, " ").slice(0, 80);
    if (response.status === 502 || response.status === 504) {
      throw new Error("服务暂时不可用，请稍后重试或刷新页面");
    }
    if (preview.startsWith("An error")) {
      throw new Error("分析服务暂时不可用，请检查部署环境或稍后重试");
    }
    throw new Error(
      response.ok
        ? "服务返回了无效数据，请稍后重试"
        : `请求失败（${response.status}），请稍后重试`,
    );
  }
}
