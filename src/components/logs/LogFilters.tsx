import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, Filter, X } from "lucide-react";
import { Virtuoso } from "react-virtuoso";

interface LogEntry {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  source: string;
  message: string;
}

interface LogFiltersProps {
  filters: {
    search: string;
    levels: Set<string>;
    sources: Set<string>;
  };
  onSearchChange: (search: string) => void;
  onLevelToggle: (level: string) => void;
  onSourceToggle: (source: string) => void;
  onClearFilters: () => void;
  availableLevels: string[];
  availableSources: string[];
}

export default function LogFilters({
  filters,
  onSearchChange,
  onLevelToggle,
  onSourceToggle,
  onClearFilters,
  availableLevels,
  availableSources,
}: LogFiltersProps) {
  const { t } = useTranslation();

  const hasActiveFilters = filters.search || filters.levels.size > 0 || filters.sources.size > 0;

  return (
    <div className="space-y-3">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-dark-text-muted" />
        <input
          type="text"
          placeholder={t("logs.searchPlaceholder")}
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-dark-bg-sidebar border border-gray-200 dark:border-dark-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* 级别筛选 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {t("logs.levelFilter")}
          </label>
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              {t("logs.clearFilters")}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {availableLevels.map((level) => {
            const isActive = filters.levels.has(level);
            const colors: Record<string, string> = {
              debug: isActive ? "bg-gray-600 text-white" : "bg-gray-100 dark:bg-dark-bg-hover text-gray-600 dark:text-dark-text-muted",
              info: isActive ? "bg-blue-600 text-white" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
              warn: isActive ? "bg-amber-600 text-white" : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
              error: isActive ? "bg-red-600 text-white" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
            };

            return (
              <button
                key={level}
                onClick={() => onLevelToggle(level)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${colors[level] || colors.info}`}
              >
                {level.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* 来源筛选 */}
      {availableSources.length > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2 block">
            {t("logs.sourceFilter")}
          </label>
          <div className="flex flex-wrap gap-2">
            {availableSources.map((source) => {
              const isActive = filters.sources.has(source);
              return (
                <button
                  key={source}
                  onClick={() => onSourceToggle(source)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  }`}
                >
                  {source}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
