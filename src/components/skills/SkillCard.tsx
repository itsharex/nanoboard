import { useTranslation } from "react-i18next";
import { Wrench, Download, Loader2 } from "lucide-react";
import type { ClawHubSearchResult, SkillListItem } from "../../types/clawhub";

interface SkillCardProps {
  skill: ClawHubSearchResult | SkillListItem;
  isInstalled: boolean;
  isInstalling?: boolean;
  onInstall: (skill: ClawHubSearchResult | SkillListItem) => void;
  onUninstall: (skill: ClawHubSearchResult | SkillListItem) => void;
  onViewDetails: (skill: ClawHubSearchResult | SkillListItem) => void;
}

export default function SkillCard({
  skill,
  isInstalled,
  isInstalling = false,
  onInstall,
  onUninstall,
  onViewDetails,
}: SkillCardProps) {
  const { t } = useTranslation();

  // 统一的属性访问（使用 any 绕过类型检查）
  const skillAny = skill as any;
  const displayName = skillAny.displayName || skillAny.title || skillAny.slug;
  const summary = skillAny.summary || skillAny.description || '';
  const category = skillAny.tags?.category || '';
  const stats = skillAny.stats || null;

  return (
    <div className="group bg-white dark:bg-dark-bg-card rounded-lg border border-gray-200 dark:border-dark-border-subtle hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-lg transition-all duration-200 overflow-hidden">
      <div className="p-4">
        {/* 头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
              <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary truncate text-sm">
                {displayName}
              </h3>
              {category && (
                <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">
                  {category}
                </p>
              )}
            </div>
          </div>
          {isInstalled && (
            <Download className="w-5 h-5 text-green-500 dark:text-green-400 flex-shrink-0" />
          )}
        </div>

        {/* 描述 */}
        {summary && (
          <p className="text-sm text-gray-600 dark:text-dark-text-secondary mb-4 line-clamp-2 leading-relaxed">
            {summary}
          </p>
        )}

        {/* 元信息 */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-dark-text-muted mb-4">
          {stats && (
            <>
              {stats.installsCurrent !== undefined && (
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {stats.installsCurrent >= 1000 
                    ? `${(stats.installsCurrent / 1000).toFixed(1)}K` 
                    : stats.installsCurrent}
                </span>
              )}
              {stats.stars !== undefined && (
                <span className="flex items-center gap-1">
                  <span>⭐</span>
                  {stats.stars >= 1000 
                    ? `${(stats.stars / 1000).toFixed(1)}K` 
                    : stats.stars}
                </span>
              )}
            </>
          )}
          {'updatedAt' in skill && skill.updatedAt && (
            <span className="ml-auto">
              {new Date(skill.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {isInstalled ? (
            <>
              <button
                onClick={() => onUninstall(skill)}
                disabled={isInstalling}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInstalling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 rotate-180" />
                )}
                {isInstalling ? t("skills.uninstalling") : t("skills.uninstall")}
              </button>
              <button
                onClick={() => onViewDetails(skill)}
                className="px-3 py-2 text-sm text-gray-600 dark:text-dark-text-secondary hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors font-medium"
              >
                {t("skills.viewDetails")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onInstall(skill)}
                disabled={isInstalling}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isInstalling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isInstalling ? t("skills.installing") : t("skills.install")}
              </button>
              <button
                onClick={() => onViewDetails(skill)}
                className="px-3 py-2 text-sm text-gray-600 dark:text-dark-text-secondary hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors font-medium"
              >
                {t("skills.viewDetails")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
