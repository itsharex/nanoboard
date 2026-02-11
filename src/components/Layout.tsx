import { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Settings,
  FileText,
  ScrollText,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: "/", label: "仪表盘", icon: LayoutDashboard },
  { path: "/logs", label: "日志监控", icon: ScrollText },
  { path: "/sessions", label: "文件管理", icon: FileText },
  { path: "/config", label: "编辑配置", icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
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
                alt="Nanoboard Logo"
                className="w-12 h-12 rounded-lg"
              />
              <h1 className="text-lg font-semibold text-gray-900">
                nanoboard
              </h1>
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
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}
