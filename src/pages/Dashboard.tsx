import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { processApi, networkApi, cronApi, configApi } from "../lib/tauri";

// 导入类型
import type {
  Status,
  SystemInfo,
  NanobotVersion,
  LogStatistics,
  NetworkData,
  DashboardConfig,
} from "@/types/dashboard";
import type { CronJob } from "@/types";
import type { Config } from "@/types/config";

// 导入组件
import StatusCards from "@/components/dashboard/StatusCards";
import ConfigOverviewCards from "@/components/dashboard/ConfigOverviewCards";
import SystemResourceCards from "@/components/dashboard/SystemResourceCards";
import CronOverviewCards from "@/components/dashboard/CronOverviewCards";
import McpServersCard from "@/components/dashboard/McpServersCard";

export default function Dashboard() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>({ running: false });
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [nanobotVersion, setNanobotVersion] = useState<NanobotVersion | null>(null);
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [logStatistics, setLogStatistics] = useState<LogStatistics | null>(null);
  const [networkData, setNetworkData] = useState<NetworkData[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJob[] | null>(null);
  const [mcpServers, setMcpServers] = useState<Record<string, any> | null>(null);

  // 使用合并 API 刷新所有状态
  async function refreshAll() {
    try {
      const data = await processApi.getDashboardData();

      // 更新各项状态
      if (data.status) {
        setStatus(data.status);
      }
      if (data.systemInfo) {
        setSystemInfo(data.systemInfo);
      }
      if (data.config && !data.config.error) {
        setConfig(data.config);
      }
      if (data.logStatistics) {
        setLogStatistics(data.logStatistics);
      }

      // 更新网络数据（带平滑处理）
      if (data.networkStats) {
        setNetworkData(prev => {
          const lastData = prev[prev.length - 1];
          const stats = data.networkStats;

          let smoothUpload = stats.upload_speed || 0;
          let smoothDownload = stats.download_speed || 0;

          if (smoothUpload === 0 && lastData && lastData.upload > 0) {
            smoothUpload = lastData.upload * 0.5;
          }
          if (smoothDownload === 0 && lastData && lastData.download > 0) {
            smoothDownload = lastData.download * 0.5;
          }

          const displayUpload = smoothUpload > 0 && smoothUpload < 0.1 ? 0.1 : smoothUpload;
          const displayDownload = smoothDownload > 0 && smoothDownload < 0.1 ? 0.1 : smoothDownload;

          return [...prev.slice(-59), {
            timestamp: Date.now(),
            upload: displayUpload,
            download: displayDownload,
          }];
        });
      }
    } catch (error) {
      console.error(t("dashboard.fetchStatusFailed"), error);
    }
  }

  // 加载 Cron 任务
  async function loadCronJobs() {
    try {
      const result = await cronApi.list();
      if (result.success !== false) {
        setCronJobs(result.jobs || []);
      }
    } catch (error) {
      console.error("Failed to load cron jobs:", error);
    }
  }

  // 加载 MCP Servers
  async function loadMcpServers() {
    try {
      const fullConfig = await configApi.load() as Config;
      if (fullConfig?.tools?.mcpServers) {
        setMcpServers(fullConfig.tools.mcpServers);
      } else {
        setMcpServers({});
      }
    } catch (error) {
      console.error("Failed to load MCP servers:", error);
    }
  }

  useEffect(() => {
    // 初始加载
    refreshAll();
    loadNanobotVersion();
    loadCronJobs();
    loadMcpServers();

    // 初始化网络监控
    networkApi.initMonitor().catch(console.error);

    // 初始化网络数据（60秒历史）
    const initialData: NetworkData[] = [];
    const now = Date.now();
    for (let i = 60; i >= 0; i--) {
      initialData.push({
        timestamp: now - i * 1000,
        upload: 0,
        download: 0,
      });
    }
    setNetworkData(initialData);

    // 定时刷新（每1秒）
    const interval = setInterval(() => {
      refreshAll();
    }, 1000);

    // 页面可见性变化时立即刷新
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshAll();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 页面获得焦点时也刷新
    const handleFocus = () => {
      refreshAll();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  async function loadNanobotVersion() {
    try {
      const result = await processApi.getVersion();
      setNanobotVersion(result);
    } catch (error) {
      console.error(t("dashboard.fetchVersionFailed"), error);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-white dark:bg-dark-bg-base transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* 状态卡片 */}
        <StatusCards status={status} nanobotVersion={nanobotVersion} />

        {/* 配置概览 */}
        <ConfigOverviewCards config={config} />

        {/* 系统资源监控 */}
        <SystemResourceCards
          systemInfo={systemInfo}
          logStatistics={logStatistics}
          networkData={networkData}
        />

        {/* Cron 任务概览和 MCP Servers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CronOverviewCards cronJobs={cronJobs} />
          <McpServersCard mcpServers={mcpServers} />
        </div>
      </div>
    </div>
  );
}
