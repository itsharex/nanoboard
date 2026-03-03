import { useTranslation } from "react-i18next";
import { CalendarClock, Timer, MessageSquare, Clock, CheckCircle, XCircle, Power, PowerOff, Pencil, Trash2, Play } from "lucide-react";
import EmptyState from "../EmptyState";
import type { CronJob } from "../../types";

interface CronListProps {
  jobs: CronJob[];
  isLoading: boolean;
  onToggle: (job: CronJob) => void;
  onEdit: (job: CronJob) => void;
  onRemove: (job: CronJob) => void;
  onRun?: (job: CronJob) => void;
  describeSchedule: (schedule: any) => string;
  describeCron: (expr: string) => string;
  describeIntervalMs: (ms: number) => string;
  formatCronTimestamp: (ms: number | null) => string;
  formatCronRelativeTime: (ms: number | null) => string;
}

export default function CronList({
  jobs,
  isLoading,
  onToggle,
  onEdit,
  onRemove,
  onRun,
  describeSchedule,
  describeCron,
  describeIntervalMs,
  formatCronTimestamp,
  formatCronRelativeTime,
}: CronListProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <p className="text-sm text-gray-500 dark:text-dark-text-muted">{t("workspace.loading")}</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState 
        icon={CalendarClock} 
        title={t("workspace.noCronJobs")} 
        description={t("workspace.noCronJobsDesc")} 
      />
    );
  }

  return (
    <div className="space-y-2">
      {jobs.map((job, idx) => {
        const isEnabled = job.enabled;
        const scheduleDesc = describeSchedule(job.schedule);
        const nextRunRelative = formatCronRelativeTime(job.state?.nextRunAtMs || null);
        const lastRun = formatCronTimestamp(job.state?.lastRunAtMs || null);
        const lastStatus = job.state?.lastStatus;
        const lastError = job.state?.lastError;

        return (
          <div
            key={job.id || idx}
            className={`group rounded-xl border transition-all duration-200 hover:shadow-lg ${
              isEnabled
                ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/10 border-green-200/60 dark:border-green-500/40"
                : "bg-white dark:bg-dark-bg-card border-gray-200/60 dark:border-dark-border-subtle hover:border-gray-300 dark:hover:border-dark-border-default opacity-75 hover:opacity-100"
            }`}
          >
            <div className="p-3.5">
              {/* 上部：图标 + 名称 + 状态 */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className={`p-2 rounded-xl flex-shrink-0 transition-colors ${
                    isEnabled 
                      ? "bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-800/50 dark:to-emerald-800/30" 
                      : "bg-gray-100 dark:bg-dark-bg-hover"
                  }`}>
                    <CalendarClock className={`w-4.5 h-4.5 ${
                      isEnabled 
                        ? "text-green-600 dark:text-green-400" 
                        : "text-gray-500 dark:text-dark-text-muted"
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary text-sm truncate">
                        {job.name || job.id}
                      </h3>
                      {isEnabled ? (
                        <span className="px-2 py-0.5 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/30 text-green-700 dark:text-green-300 text-[10px] rounded-full flex-shrink-0 font-medium shadow-sm">
                          {t("workspace.enabled")}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-dark-bg-hover text-gray-600 dark:text-dark-text-muted text-[10px] rounded-full flex-shrink-0 font-medium">
                          {t("workspace.disabled")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* 操作按钮 */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 ml-2 flex-shrink-0">
                  {onRun && (
                    <button
                      onClick={() => onRun(job)}
                      className="p-1.5 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                      title={t("cron.runJob")}
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onToggle(job)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isEnabled
                        ? "text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30"
                        : "text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg-hover"
                    }`}
                    title={isEnabled ? t("workspace.disable") : t("workspace.enable")}
                  >
                    {isEnabled ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onEdit(job)}
                    className="p-1.5 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                    title={t("workspace.cronEditJob")}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemove(job)}
                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title={t("workspace.cronRemoveJob")}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 调度信息 */}
              <div className="flex items-center gap-2 mb-2">
                <Timer className={`w-3.5 h-3.5 flex-shrink-0 ${
                  isEnabled 
                    ? "text-green-500 dark:text-green-400" 
                    : "text-gray-400 dark:text-dark-text-muted"
                }`} />
                <span className={`text-xs font-medium truncate flex-1 ${
                  isEnabled 
                    ? "text-green-700 dark:text-green-300" 
                    : "text-gray-600 dark:text-dark-text-secondary"
                }`}>
                  {scheduleDesc}
                </span>
                {job.schedule?.kind === "cron" && job.schedule.expr && (
                  <code className="text-[9px] text-gray-400 dark:text-dark-text-muted font-mono flex-shrink-0 bg-gray-100 dark:bg-dark-bg-hover px-1.5 py-0.5 rounded">
                    {job.schedule.expr}
                  </code>
                )}
              </div>

              {/* 消息内容 */}
              {job.payload?.message && (
                <div className="flex items-start gap-2 mb-2">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400 dark:text-dark-text-muted flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-gray-600 dark:text-dark-text-secondary break-words line-clamp-2 leading-relaxed bg-white/50 dark:bg-dark-bg-sidebar/50 px-2 py-1.5 rounded-lg border border-gray-100 dark:border-dark-border-subtle">
                    {job.payload.message}
                  </p>
                </div>
              )}

              {/* 底部元信息 */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] text-gray-500 dark:text-dark-text-muted pt-2 border-t border-gray-200/50 dark:border-dark-border-subtle/50">
                {job.state?.nextRunAtMs && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span className="font-medium">{t("workspace.cronNextRun")}:</span>
                    <span className={nextRunRelative.includes("Soon") || nextRunRelative.includes("即将") ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}>
                      {nextRunRelative}
                    </span>
                  </div>
                )}
                {lastRun !== "-" && (
                  <div className="flex items-center gap-1.5">
                    {lastStatus === "success" ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : lastStatus === "failed" ? (
                      <XCircle className="w-3 h-3 text-red-500" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    <span className="font-medium">{t("workspace.cronLastRun")}:</span>
                    <span>{lastRun}</span>
                  </div>
                )}
              </div>

              {/* 错误信息 */}
              {lastError && (
                <div className="mt-2 px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg">
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-medium">{lastError}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
