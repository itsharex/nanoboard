/**
 * 代码编辑器视图组件
 */

import { useTranslation } from "react-i18next";
import { Code, Save } from "lucide-react";

interface CodeEditorViewProps {
  code: string;
  codeError: string | null;
  savingCode: boolean;
  hasChanges: boolean;
  onCodeChange: (code: string) => void;
  onFormat: () => void;
  onSave: () => void;
}

export default function CodeEditorView({
  code,
  codeError,
  savingCode,
  hasChanges,
  onCodeChange,
  onFormat,
  onSave,
}: CodeEditorViewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex-1 overflow-hidden bg-white dark:bg-dark-bg-base transition-colors duration-200">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* 代码编辑器工具栏 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {hasChanges && (
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/50 text-sm font-medium transition-colors duration-200">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  <span>{t("config.unsaved")}</span>
                </div>
              )}
              {codeError && (
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-500/50 text-sm font-medium transition-colors duration-200">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  <span>{codeError}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={onFormat}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-dark-bg-hover hover:bg-gray-200 dark:hover:bg-dark-bg-active rounded-lg font-medium text-gray-700 dark:text-dark-text-primary transition-colors text-sm"
              >
                <Code className="w-4 h-4" />
                {t("config.formatCode")}
              </button>
              <button
                onClick={onSave}
                disabled={savingCode || !hasChanges || !!codeError}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-dark-bg-active disabled:cursor-not-allowed rounded-lg font-medium text-white transition-colors text-sm"
              >
                <Save className="w-4 h-4" />
                {savingCode ? t("config.saving") : t("config.saveConfig")}
              </button>
            </div>
          </div>

          {/* 代码编辑器 */}
          <textarea
            value={code}
            onChange={(e) => {
              onCodeChange(e.target.value);
            }}
            className={`w-full h-[calc(100vh-200px)] font-mono text-sm p-6 rounded-lg focus:outline-none resize-none transition-colors duration-200 ${
              codeError
                ? "bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-500/50 text-red-900 dark:text-red-300"
                : "bg-gray-900 dark:bg-dark-bg-sidebar text-gray-100 dark:text-dark-text-primary"
            }`}
            placeholder={t("config.editJsonPlaceholder")}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}
