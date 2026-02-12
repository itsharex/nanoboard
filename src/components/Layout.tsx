import { ReactNode, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard,
  Settings,
  FileText,
  ScrollText,
  Play,
  Square,
  RefreshCw,
  Languages,
} from "lucide-react";
import { processApi } from "../lib/tauri";
import { useToast } from "../contexts/ToastContext";

interface LayoutProps {
  children: ReactNode;
}

interface Status {
  running: boolean;
  port?: number;
  uptime?: string;
}

export default function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<Status>({ running: false });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const navItems = [
    { path: "/", label: t("nav.dashboard"), icon: LayoutDashboard },
    { path: "/logs", label: t("nav.logs"), icon: ScrollText },
    { path: "/sessions", label: t("nav.sessions"), icon: FileText },
    { path: "/config", label: t("nav.config"), icon: Settings },
  ];

  useEffect(() => {
    loadStatus();
    // 定时刷新状态（每2秒）
    const interval = setInterval(loadStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  async function loadStatus() {
    try {
      const result = await processApi.getStatus();
      setStatus(result);
    } catch (error) {
      console.error("获取状态失败:", error);
    }
  }

  async function handleToggle() {
    if (status.running) {
      await handleStop();
    } else {
      await handleStart();
    }
  }

  async function handleStart() {
    setLoading(true);
    try {
      const configCheck = await processApi.checkConfig();
      if (!configCheck.valid) {
        toast.showWarning(configCheck.message || t("toast.configCheckFailed"));
        if (configCheck.issue === "api_key_missing") {
          toast.showInfo(t("toast.addApiKey"));
        }
        setLoading(false);
        return;
      }

      const result = await processApi.start(18790);
      if (result.status === "started") {
        await loadStatus();
        localStorage.setItem("autoStartLogMonitor", "true");
        toast.showSuccess(t("layout.nanobotStartSuccess"));
      } else if (result.status === "already_running") {
        await loadStatus();
        localStorage.setItem("autoStartLogMonitor", "true");
        toast.showInfo(t("layout.nanobotAlreadyRunning"));
      } else if (result.status === "failed") {
        await loadStatus();
        toast.showError(result.message || t("layout.nanobotStartFailed"));
      }
    } catch (error) {
      toast.showError(t("layout.nanobotStartFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleStop() {
    setLoading(true);
    try {
      await processApi.stop();
      await loadStatus();
      toast.showSuccess(t("layout.nanobotStopSuccess"));
    } catch (error) {
      toast.showError(t("layout.nanobotStopFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleRestart() {
    if (!status.running) {
      toast.showInfo(t("layout.nanobotNotRunning"));
      return;
    }

    setLoading(true);
    try {
      await processApi.stop();
      toast.showInfo(t("layout.restarting"));
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = await processApi.start(18790);
      if (result.status === "started") {
        await loadStatus();
        toast.showSuccess(t("layout.nanobotRestartSuccess"));
      } else if (result.status === "failed") {
        await loadStatus();
        toast.showError(result.message || t("layout.nanobotRestartFailed"));
      }
    } catch (error) {
      toast.showError(t("layout.nanobotRestartFailed"));
      await loadStatus();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900">
      {/* 主体内容 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <aside className="w-56 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Logo 区域 */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col items-center gap-3">
              <img
                src="/assets/logo.png"
                alt={t("layout.logoAlt")}
                className="w-12 h-12 rounded-lg"
              />
              <h1 className="text-lg font-semibold text-gray-900">
                {t("app.name")}
              </h1>
              {/* 语言切换标志 */}
              <button
                onClick={() => {
                  const newLang = i18n.language === 'zh-CN' ? 'en-US' : 'zh-CN';
                  i18n.changeLanguage(newLang);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all text-xs font-medium"
                title={t("language.switch")}
              >
                <Languages className="w-3 h-3" />
                <span>{i18n.language === 'zh-CN' ? '中文' : 'EN'}</span>
              </button>
            </div>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* 控制按钮 */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={handleToggle}
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all font-medium text-sm ${
                status.running
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-green-50 text-green-600 hover:bg-green-100"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={status.running ? t("layout.stopNanobot") : t("layout.startNanobot")}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : status.running ? (
                <Square className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{status.running ? t("layout.stop") : t("layout.start")}</span>
            </button>

            <button
              onClick={handleRestart}
              disabled={loading || !status.running}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={t("layout.restartNanobot")}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{t("layout.restart")}</span>
            </button>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
