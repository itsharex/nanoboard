import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  className?: string;
  compact?: boolean;
}

export default function LoadingState({
  message,
  className = "",
  compact = false,
}: LoadingStateProps) {
  const spinnerSizeClass = compact ? "h-10 w-10" : "h-14 w-14";
  const iconSizeClass = compact ? "w-4 h-4" : "w-5 h-5";

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`.trim()}>
      <div className="relative flex items-center justify-center">
        <div className={`${spinnerSizeClass} rounded-full bg-blue-100/70 dark:bg-blue-500/10 animate-pulse`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-full w-full items-center justify-center rounded-full border border-blue-200/80 bg-white/90 shadow-sm dark:border-blue-500/20 dark:bg-dark-bg-card/90">
            <Loader2 className={`${iconSizeClass} animate-spin text-blue-600 dark:text-blue-400`} />
          </div>
        </div>
      </div>
      {message && (
        <p className="text-sm text-gray-500 dark:text-dark-text-muted">{message}</p>
      )}
    </div>
  );
}