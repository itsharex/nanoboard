/**
 * MCP Servers 状态卡片组件
 */

import { useTranslation } from "react-i18next";
import { Server, CheckCircle, XCircle, Globe, Terminal } from "lucide-react";
import type { McpServer } from "@/types";

interface McpServersCardProps {
  mcpServers: Record<string, McpServer> | null;
}

export default function McpServersCard({ mcpServers }: McpServersCardProps) {
  const { t } = useTranslation();

  if (!mcpServers || Object.keys(mcpServers).length === 0) {
    return (
      <div className="p-4 bg-white dark:bg-dark-bg-card rounded-xl border border-gray-200 dark:border-dark-border-subtle transition-colors duration-200">
        <div className="flex items-center gap-2 mb-2.5">
          <Server className="w-4.5 h-4.5 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-dark-text-primary">
            {t("dashboard.mcpServers")}
          </span>
        </div>
        <p className="text-sm text-gray-400 dark:text-dark-text-muted">
          {t("dashboard.noMcpServers")}
        </p>
      </div>
    );
  }

  const servers = Object.entries(mcpServers);
  const totalServers = servers.length;

  // MCP Server 类型判断
  const getServerType = (server: McpServer) => {
    if (server.url) return "http";
    if (server.command) return "stdio";
    return "unknown";
  };

  return (
    <div className="p-4 bg-white dark:bg-dark-bg-card rounded-xl border border-gray-200 dark:border-dark-border-subtle transition-colors duration-200">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Server className="w-4.5 h-4.5 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-dark-text-primary">
            {t("dashboard.mcpServers")}
          </span>
        </div>
        <span className="text-xs text-gray-400 dark:text-dark-text-muted">
          {t("dashboard.total", "Total")}: {totalServers}
        </span>
      </div>

      <div className="space-y-1.5 max-h-[148px] overflow-y-auto scrollbar-thin">
        {servers.slice(0, 4).map(([name, server]) => {
          const serverType = getServerType(server);
          return (
            <div
              key={name}
              className="flex items-center justify-between gap-2 p-2 bg-gray-50 dark:bg-dark-bg-sidebar rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-hover transition-colors"
            >
              <div className="flex items-center gap-2">
                {serverType === "http" ? (
                  <Globe className="w-4 h-4 text-blue-500" />
                ) : (
                  <Terminal className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary truncate max-w-[140px]">
                  {name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-dark-text-muted">
                  {serverType === "http" ? "HTTP" : "STDIO"}
                </span>
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
              </div>
            </div>
          );
        })}
        {servers.length > 4 && (
          <p className="text-xs text-gray-400 dark:text-dark-text-muted text-center pt-1">
            +{servers.length - 4} {t("dashboard.more")}
          </p>
        )}
      </div>
    </div>
  );
}
