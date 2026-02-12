import { useEffect } from "react";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  handler: () => void;
  descriptionKey?: string;  // 使用翻译 key
  description?: string;     // 兼容旧版本
}

export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
        const altMatch = shortcut.altKey === undefined || event.altKey === shortcut.altKey;
        const metaMatch = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}

// 快捷键定义（使用翻译 key）
export const SHORTCUTS = {
  SAVE: { key: "s", ctrlKey: true, descriptionKey: "keyboardShortcuts.save" },
  REFRESH: { key: "r", ctrlKey: true, descriptionKey: "keyboardShortcuts.refresh" },
  SEARCH: { key: "k", ctrlKey: true, descriptionKey: "keyboardShortcuts.search" },
  NEW_TAB: { key: "t", ctrlKey: true, descriptionKey: "keyboardShortcuts.newTab" },
  CLOSE_TAB: { key: "w", ctrlKey: true, descriptionKey: "keyboardShortcuts.closeTab" },
  DASHBOARD: { key: "1", altKey: true, descriptionKey: "keyboardShortcuts.dashboard" },
  CONFIG: { key: "2", altKey: true, descriptionKey: "keyboardShortcuts.config" },
  LOGS: { key: "3", altKey: true, descriptionKey: "keyboardShortcuts.logs" },
  SESSIONS: { key: "4", altKey: true, descriptionKey: "keyboardShortcuts.sessions" },
};
