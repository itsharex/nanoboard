/**
 * 历史记录面板组件
 */

import { useTranslation } from "react-i18next";
import { History, RotateCcw, Trash2, Inbox } from "lucide-react";
import EmptyState from "../EmptyState";
import type { ConfigHistoryVersion } from "@/config/types";
import { formatTimestamp, formatSize } from "@/utils/format";

interface HistoryPanelProps {
  isOpen: boolean;
  loading: boolean;
  versions: ConfigHistoryVersion[];
  onClose: () => void;
  onRestore: (version: ConfigHistoryVersion) => void;
  onDelete: (version: ConfigHistoryVersion) => void;
}

export default function HistoryPanel({
  isOpen,
  loading,
  versions,
  onClose,
  onRestore,
  onDelete,
}: HistoryPanelProps) {
  const { t, i18n } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-bg-card rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col transition-colors duration-200">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200 dark:border-dark-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                <History className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">
                {t("config.configHistory")}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg-hover rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500 dark:text-dark-text-muted text-sm">
              {t("config.loading")}
            </div>
          ) : versions.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title={t("config.noHistory")}
              description={t("config.noHistoryDesc")}
            />
          ) : (
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.filename}
                  className="group p-4 rounded-lg bg-gray-50 dark:bg-dark-bg-sidebar border border-gray-200 dark:border-dark-border-subtle hover:border-blue-200 dark:hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">
                          {formatTimestamp(version.timestamp, i18n.language)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-dark-text-muted">
                          {formatSize(version.size)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRestore(version)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <RotateCcw className="w-4 h-4" />
                        {t("config.restore")}
                      </button>
                      <button
                        onClick={() => onDelete(version)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title={t("config.delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
