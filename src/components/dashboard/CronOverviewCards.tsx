/**
 * Cron 任务概览卡片组件
 */

import { useTranslation } from "react-i18next";
import { Clock, CheckCircle, XCircle, AlertCircle, Play } from "lucide-react";
import type { CronJob } from "@/types";

interface CronOverviewCardsProps {
  cronJobs: CronJob[] | null;
}

export default function CronOverviewCards({ cronJobs }: CronOverviewCardsProps) {
  const { t, i18n } = useTranslation();

  if (!cronJobs) return null;

  const totalJobs = cronJobs.length;
  const enabledJobs = cronJobs.filter((job) => job.enabled).length;
  const disabledJobs = totalJobs - enabledJobs;

  // 获取即将执行的任务（按 nextRunAtMs 排序，取前3个启用的任务）
  const upcomingJobs = cronJobs
    .filter((job) => job.enabled && job.state?.nextRunAtMs)
    .sort((a, b) => (a.state?.nextRunAtMs || 0) - (b.state?.nextRunAtMs || 0))
    .slice(0, 3);

  // 获取最近执行的任务（按 lastRunAtMs 排序，取最近3个）
  const recentJobs = cronJobs
    .filter((job) => job.state?.lastRunAtMs)
    .sort((a, b) => (b.state?.lastRunAtMs || 0) - (a.state?.lastRunAtMs || 0))
    .slice(0, 3);

  const formatTime = (timestamp: number | undefined) => {
    if (!timestamp) return "-";
    const date = new Date(timestamp);
    return date.toLocaleString(i18n.language === "zh-CN" ? "zh-CN" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-5 bg-white dark:bg-dark-bg-card rounded-xl border border-gray-200 dark:border-dark-border-subtle transition-colors duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-500" />
          <span className="text-base font-medium text-gray-700 dark:text-dark-text-primary">
            {t("dashboard.cronOverview")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-dark-text-muted">
            <CheckCircle className="w-3.5 h-3.5 text-green-500" />
            {enabledJobs}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-dark-text-muted">
            <XCircle className="w-3.5 h-3.5 text-gray-400" />
            {disabledJobs}
          </span>
          <span className="text-xs text-gray-400 dark:text-dark-text-muted">
            {t("dashboard.total", "Total")}: {totalJobs}
          </span>
        </div>
      </div>

      {totalJobs === 0 ? (
        <p className="text-sm text-gray-400 dark:text-dark-text-muted">
          {t("dashboard.noCronJobs")}
        </p>
      ) : (
        <div className="space-y-4">
          {/* 即将执行的任务 */}
          {upcomingJobs.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-dark-text-muted mb-2">
                {t("dashboard.upcomingExecutions")}
              </h4>
              <div className="space-y-2">
                {upcomingJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-bg-sidebar rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-cyan-500" />
                      <span className="text-sm text-gray-700 dark:text-dark-text-secondary truncate max-w-[120px]">
                        {job.name || job.id}
                      </span>
                    </div>
                    <span className="text-xs text-cyan-600 dark:text-cyan-400">
                      {formatTime(job.state?.nextRunAtMs)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 最近执行的任务 */}
          {recentJobs.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 dark:text-dark-text-muted mb-2">
                {t("dashboard.recentExecutions")}
              </h4>
              <div className="space-y-2">
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-bg-sidebar rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {job.state?.lastStatus === "success" ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : job.state?.lastStatus === "failed" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-700 dark:text-dark-text-secondary truncate max-w-[120px]">
                        {job.name || job.id}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-dark-text-muted">
                      {formatTime(job.state?.lastRunAtMs)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
