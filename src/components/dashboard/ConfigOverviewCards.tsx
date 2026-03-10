/**
 * 配置概览卡片组件
 */

import { useTranslation } from "react-i18next";
import { Server, Bot, MessageSquare } from "lucide-react";
import type { DashboardConfig } from "@/types/dashboard";

interface ConfigOverviewCardsProps {
  config: DashboardConfig | null;
}

export default function ConfigOverviewCards({ config }: ConfigOverviewCardsProps) {
  const { t } = useTranslation();

  if (!config) return null;

  const configuredProviders = config.providers
    ? Object.entries(config.providers).filter(
        ([_, provider]) => provider && provider.apiKey && String(provider.apiKey).trim() !== ""
      )
    : [];

  const enabledChannels = config.channels
    ? Object.entries(config.channels).filter(([_, channel]: [string, any]) => channel?.enabled)
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {/* LLM 配置 */}
      <div className="p-4 bg-white dark:bg-dark-bg-card rounded-xl border border-gray-200 dark:border-dark-border-subtle transition-colors duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-4.5 h-4.5 text-blue-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-dark-text-primary">{t("dashboard.llmProvider")}</span>
        </div>
        {configuredProviders.length > 0 ? (
          <div className="space-y-1.5">
            {configuredProviders.slice(0, 3).map(([providerKey]) => (
              <div key={providerKey} className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-600 dark:text-dark-text-secondary truncate">{providerKey}</span>
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[11px] rounded-full whitespace-nowrap">
                  {t("dashboard.configured")}
                </span>
              </div>
            ))}
            {configuredProviders.length > 3 && (
              <p className="text-xs text-gray-400 dark:text-dark-text-muted">
                +{configuredProviders.length - 3} {t("dashboard.more")}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-dark-text-muted">{t("dashboard.noConfiguration")}</p>
        )}
      </div>

      {/* Agent 配置 */}
      <div className="p-4 bg-white dark:bg-dark-bg-card rounded-xl border border-gray-200 dark:border-dark-border-subtle transition-colors duration-200">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="w-4.5 h-4.5 text-indigo-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-dark-text-primary">{t("dashboard.agentConfig")}</span>
        </div>
        {config.agents?.defaults ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-dark-text-muted">{t("dashboard.model")}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-dark-text-secondary truncate max-w-[120px] text-right" title={config.agents.defaults.model}>
                {config.agents.defaults.model || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-dark-text-muted">{t("dashboard.maxTokens")}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-dark-text-secondary">
                {config.agents.defaults.maxTokens || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-dark-text-muted">{t("dashboard.maxToolIterations")}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-dark-text-secondary">
                {config.agents.defaults.maxToolIterations || '-'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-dark-text-muted">{t("dashboard.temperature")}</span>
              <span className="text-xs font-medium text-gray-700 dark:text-dark-text-secondary">
                {config.agents.defaults.temperature || '-'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-dark-text-muted">{t("dashboard.noConfiguration")}</p>
        )}
      </div>

      {/* 消息渠道 */}
      <div className="p-4 bg-white dark:bg-dark-bg-card rounded-xl border border-gray-200 dark:border-dark-border-subtle transition-colors duration-200">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="w-4.5 h-4.5 text-purple-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-dark-text-primary">{t("dashboard.messageChannels")}</span>
        </div>
        {config.channels && Object.keys(config.channels).length > 0 ? (
          <div className="space-y-1.5">
            {enabledChannels
              .slice(0, 3)
              .map(([channelKey]) => (
                <div key={channelKey} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-gray-600 dark:text-dark-text-secondary capitalize truncate">{channelKey}</span>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] rounded-full whitespace-nowrap">
                    {t("config.enabled")}
                  </span>
                </div>
              ))}
            {enabledChannels.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-dark-text-muted">{t("dashboard.noEnabledChannels")}</p>
            )}
            {enabledChannels.length > 3 && (
              <p className="text-xs text-gray-400 dark:text-dark-text-muted">
                +{enabledChannels.length - 3} {t("dashboard.more")}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-dark-text-muted">{t("dashboard.noConfiguration")}</p>
        )}
      </div>
    </div>
  );
}
