import { useMemo, memo } from "react";
import { useTranslation } from "react-i18next";
import { Bug, Info, AlertTriangle, AlertCircle } from "lucide-react";

interface LogItemProps {
  log: string;
}

// 日志级别匹配模式
const LOG_LEVEL_PATTERNS = {
  debug: /\|\s*DEBUG\s*\|/i,
  info: /\|\s*INFO\s*\|/i,
  warn: /\|\s*WARNING\s*\|/i,
  error: /\|\s*ERROR\s*\|/i,
} as const;

const LogItem = memo(function LogItem({ log }: LogItemProps) {
  const { t } = useTranslation();

  const iconConfig = useMemo(() => {
    if (LOG_LEVEL_PATTERNS.debug.test(log)) {
      return { icon: Bug, color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" };
    } else if (LOG_LEVEL_PATTERNS.info.test(log)) {
      return { icon: Info, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30" };
    } else if (LOG_LEVEL_PATTERNS.warn.test(log)) {
      return { icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30" };
    } else if (LOG_LEVEL_PATTERNS.error.test(log)) {
      return { icon: AlertCircle, color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30" };
    }
    return { icon: Info, color: "text-gray-700 dark:text-dark-text-secondary", bg: "bg-gray-100 dark:bg-gray-800" };
  }, [log]);

  const Icon = iconConfig.icon;

  // 提取时间戳 (如果有的话)
  const timeMatch = log.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?/);
  const timestamp = timeMatch ? timeMatch[0] : "";
  const logContent = timestamp ? log.slice(timestamp.length).trim() : log;

  return (
    <div className="group flex items-start gap-3 px-2 py-1.5 rounded hover:bg-white dark:hover:bg-dark-bg-card border border-transparent hover:border-gray-200 dark:hover:border-dark-border-subtle transition-colors duration-200">
      <div className={`flex-shrink-0 p-1 rounded ${iconConfig.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${iconConfig.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        {timestamp && (
          <span className="text-xs text-gray-400 dark:text-dark-text-muted font-mono mr-2">
            {timestamp}
          </span>
        )}
        <span className={`text-sm whitespace-pre-wrap break-words ${iconConfig.color}`}>
          {logContent}
        </span>
      </div>
    </div>
  );
});

export default LogItem;
