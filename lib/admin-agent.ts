const DEFAULT_ADMIN_AGENT_URL = "http://host.docker.internal:3999";

export function getAdminAgentUrl(path = ""): string {
  const baseUrl =
    process.env.ADMIN_AGENT_URL?.replace(/\/+$/, "") ??
    DEFAULT_ADMIN_AGENT_URL;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}
