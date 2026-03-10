import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useTranslation } from "react-i18next";
import { Search, ExternalLink, RefreshCw, X } from "lucide-react";
import { clawhubApi } from "@/lib/tauri";
import { useToast } from "@/contexts/ToastContext";
import EmptyState from "@/components/EmptyState";
import LoadingState from "@/components/common/LoadingState";
import { SkillCard } from "@/components/skills";
import type { ClawHubSearchResult, SkillListItem, SkillDetailResponse, SkillSortOption } from "@/types/clawhub";
import { SKILL_SORT_OPTIONS as sortOptions } from "@/types/clawhub";

const SKILLS_PAGE_SIZE = 30;

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default memo(function SkillsMarket() {
  const { t } = useTranslation();
  const toast = useToast();
  const { showError, showSuccess } = toast;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ClawHubSearchResult[]>([]);
  const [skills, setSkills] = useState<SkillListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchMode, setSearchMode] = useState(false);
  const [sortBy, setSortBy] = useState<SkillSortOption>("trending");
  const [selectedSkill, setSelectedSkill] = useState<SkillDetailResponse | null>(null);
  const [skillFileContent, setSkillFileContent] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [loadingSkillSlug, setLoadingSkillSlug] = useState<string | null>(null);
  const [installedSkills, setInstalledSkills] = useState<Set<string>>(new Set());
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [requestedLimit, setRequestedLimit] = useState(SKILLS_PAGE_SIZE);
  const [hasMoreSkills, setHasMoreSkills] = useState(true);

  const skillsCountRef = useRef(0);
  const failedAutoLoadCursorRef = useRef<string | null>(null);

  useEffect(() => {
    skillsCountRef.current = skills.length;
  }, [skills.length]);

  const loadInstalledSkills = useCallback(async () => {
    try {
      const slugs = await clawhubApi.getInstalledSkills();
      setInstalledSkills(prev => {
        const newSet = new Set(slugs);
        // 只有当内容真正变化时才更新
        if (prev.size === newSet.size && [...prev].every(slug => newSet.has(slug))) {
          return prev;
        }
        return newSet;
      });
    } catch (error) {
      console.error("Failed to load installed skills:", error);
    }
  }, []);

  const mergeSkills = useCallback((previous: SkillListItem[], incoming: SkillListItem[]) => {
    if (previous.length === 0) {
      return incoming;
    }

    const nextItems = [...previous];
    const existingSlugs = new Set(previous.map((skill) => skill.slug));

    for (const skill of incoming) {
      if (!existingSlugs.has(skill.slug)) {
        nextItems.push(skill);
        existingSlugs.add(skill.slug);
      }
    }

    return nextItems;
  }, []);

  const loadSkills = useCallback(async ({
    append = false,
    cursor = null,
    limit = SKILLS_PAGE_SIZE,
    incremental = false,
  }: {
    append?: boolean;
    cursor?: string | null;
    limit?: number;
    incremental?: boolean;
  } = {}) => {
    if (append && !cursor) {
      return;
    }

    if (append || incremental) {
      setLoadingMore(true);
    } else {
      failedAutoLoadCursorRef.current = null;
      setLoading(true);
    }

    try {
      const response = await clawhubApi.getSkills(sortBy, limit, append ? cursor ?? undefined : undefined);
      const incomingItems = response.items || [];
      const previousCount = skillsCountRef.current;

      setSkills((previous) => ((append || incremental) ? mergeSkills(previous, incomingItems) : incomingItems));
      setNextCursor(response.nextCursor || null);
      setRequestedLimit(limit);
      if (response.nextCursor) {
        setHasMoreSkills(true);
      } else if (append) {
        setHasMoreSkills(incomingItems.length > 0);
      } else if (incremental || limit > previousCount) {
        setHasMoreSkills(incomingItems.length > previousCount);
      } else {
        setHasMoreSkills(true);
      }
      failedAutoLoadCursorRef.current = null;

      // 加载已安装技能状态
      await loadInstalledSkills();
    } catch {
      if (append || incremental) {
        failedAutoLoadCursorRef.current = cursor;
      }
      showError(t("skills.loadFailed"));
    } finally {
      if (append || incremental) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, [sortBy, t, showError, loadInstalledSkills, mergeSkills]);

  useEffect(() => {
    if (!searchMode) {
      setRequestedLimit(SKILLS_PAGE_SIZE);
      setHasMoreSkills(true);
      setNextCursor(null);
      setSkills([]);
      loadSkills({ limit: SKILLS_PAGE_SIZE });
    }
  }, [sortBy, searchMode, loadSkills]);

  const handleLoadMore = useCallback(() => {
    if (searchMode || loading || loadingMore || !hasMoreSkills) {
      return;
    }

    if (nextCursor && failedAutoLoadCursorRef.current === nextCursor) {
      failedAutoLoadCursorRef.current = null;
    }

    if (nextCursor) {
      loadSkills({ append: true, cursor: nextCursor });
      return;
    }

    loadSkills({ limit: requestedLimit + SKILLS_PAGE_SIZE, incremental: true });
  }, [searchMode, nextCursor, loading, loadingMore, hasMoreSkills, loadSkills, requestedLimit]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchMode(false);
      setSearchResults([]);
      return;
    }
    setLoading(true); setSearchMode(true);
    try {
      const response = await clawhubApi.search(searchQuery, 30);
      setSearchResults(response.results || []);
    } catch {
      showError(t("skills.searchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => { setSearchQuery(""); setSearchResults([]); setSearchMode(false); };

  const viewSkillDetail = async (skill: ClawHubSearchResult | SkillListItem) => {
    const slug = (skill as any).slug;
    setLoadingSkillSlug(slug);
    setLoadingDetail(true);
    try {
      const detail = await clawhubApi.getSkillDetail(slug);
      setSelectedSkill(detail);
    } catch (error) {
      console.error("Failed to load skill detail:", error);
      showError(t("skills.loadDetailFailed"));
      setLoadingSkillSlug(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const loadSkillFile = async (path: string) => {
    if (!selectedSkill) return;
    setLoadingFile(true);
    try {
      const content = await clawhubApi.getSkillFile(selectedSkill.skill.slug, path);
      setSkillFileContent(content);
    } catch {
      showError(t("skills.loadFileFailed"));
    } finally {
      setLoadingFile(false);
    }
  };

  const closeDetail = () => { setSelectedSkill(null); setSkillFileContent(null); setLoadingSkillSlug(null); };

  const getInstallCommand = useCallback((slug: string) => `npx clawhub@latest install ${slug}`, []);

  const copyInstallCommand = useCallback((slug: string) => {
    navigator.clipboard.writeText(getInstallCommand(slug));
    showSuccess(t("skills.commandCopied"));
  }, [getInstallCommand, t, showSuccess]);

  const handleInstall = useCallback(async (skill: ClawHubSearchResult | SkillListItem) => {
    const slug = (skill as any).slug;
    setInstallingSlug(slug);
    try {
      const result = await clawhubApi.installSkill(slug);
      if (result.success) {
        showSuccess(result.message);
        // 只更新 Set，避免触发不必要的重新渲染
        setInstalledSkills(prev => new Set([...prev, slug]));
      } else {
        showError(result.message);
      }
    } catch (error) {
      showError(`${t("skills.installFailed")}: ${error}`);
    } finally {
      setInstallingSlug(null);
    }
  }, [t, showError, showSuccess]);

  const handleUninstall = useCallback(async (skill: ClawHubSearchResult | SkillListItem) => {
    const slug = (skill as any).slug;
    setInstallingSlug(slug);
    try {
      const result = await clawhubApi.uninstallSkill(slug);
      if (result.success) {
        showSuccess(result.message);
        // 只更新 Set，避免触发不必要的重新渲染
        setInstalledSkills(prev => {
          const newSet = new Set(prev);
          newSet.delete(slug);
          return newSet;
        });
      } else {
        showError(result.message);
      }
    } catch (error) {
      showError(`${t("skills.uninstallFailed")}: ${error}`);
    } finally {
      setInstallingSlug(null);
    }
  }, [t, showError, showSuccess]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-dark-bg-base transition-colors duration-200">
      {/* 头部 */}
      <div className="bg-white dark:bg-dark-bg-card border-b border-gray-200 dark:border-dark-border-subtle p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text-primary">{t("skills.title")}</h1>
            </div>
            <a href="https://clawhub.ai" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">
              {t("skills.visitClawHub")}<ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-dark-text-muted" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder={t("skills.searchPlaceholder")}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-dark-bg-sidebar border border-gray-200 dark:border-dark-border-subtle rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-dark-text-primary placeholder-gray-400 dark:placeholder-dark-text-muted" />
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <button onClick={handleSearch} disabled={loading}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
              {loading ? t("skills.searching") : t("skills.search")}
            </button>
          </div>

          {!searchMode && (
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm text-gray-500 dark:text-dark-text-secondary">{t("skills.sortBy")}:</span>
              <div className="flex gap-1">
                {sortOptions.map((option) => (
                  <button key={option.value} onClick={() => setSortBy(option.value)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      sortBy === option.value ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                      : "bg-gray-100 dark:bg-dark-bg-hover text-gray-600 dark:text-dark-text-secondary hover:bg-gray-200"}`}>
                    {t(option.labelKey)}
                  </button>
                ))}
              </div>
              <button onClick={() => loadSkills()} disabled={loading} className="ml-auto p-2 text-gray-500 hover:text-gray-700" title={t("skills.refresh")}>
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-4">
          {searchMode && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                {t("skills.searchResults", { count: searchResults.length, query: searchQuery })}
              </p>
              <button onClick={clearSearch} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                {t("skills.clearSearch")}
              </button>
            </div>
          )}

          {loading ? (
            <LoadingState className="h-64" message={t("skills.loading")} />
          ) : searchMode ? (
            searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((skill) => (
                  <SkillCard
                    key={skill.slug}
                    skill={skill}
                    isInstalled={installedSkills.has(skill.slug)}
                    isInstalling={installingSlug === skill.slug}
                    onInstall={handleInstall}
                    onUninstall={handleUninstall}
                    onViewDetails={(item) => viewSkillDetail(item)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon={Search} title={t("skills.noResults")} description={t("skills.noResultsDesc")} />
            )
          ) : skills.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((skill) => (
                  <SkillCard
                    key={skill.slug}
                    skill={skill}
                    isInstalled={installedSkills.has(skill.slug)}
                    isInstalling={installingSlug === skill.slug}
                    onInstall={handleInstall}
                    onUninstall={handleUninstall}
                    onViewDetails={(item) => viewSkillDetail(item)}
                  />
                ))}
              </div>

              <div className="flex min-h-16 justify-center py-6">
                {loadingMore ? (
                  <LoadingState compact message={t("skills.loading")} />
                ) : hasMoreSkills ? (
                  <button
                    onClick={handleLoadMore}
                    className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 dark:border-blue-500/30 dark:bg-dark-bg-card dark:text-blue-400 dark:hover:bg-blue-500/10"
                  >
                    {t("skills.loadMore")}
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <EmptyState icon={Search} title={t("skills.noSkills")} description={t("skills.noSkillsDesc")} />
          )}
        </div>
      </div>

      {/* 技能详情侧边栏 */}
      {(loadingSkillSlug || selectedSkill) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeDetail}>
          <div className="bg-white dark:bg-dark-bg-card rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {loadingDetail && !selectedSkill ? (
              <div className="p-4 flex flex-col items-center justify-center h-48 text-gray-500 dark:text-dark-text-secondary">
                <LoadingState message={t("skills.loadingDetail")} />
                <p className="text-xs text-gray-400 dark:text-dark-text-muted mt-1">{loadingSkillSlug}</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-200 dark:border-dark-border-subtle flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary truncate">{selectedSkill?.skill.displayName}</h2>
                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary truncate">{selectedSkill?.skill.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => selectedSkill && copyInstallCommand(selectedSkill.skill.slug)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
                      {t("skills.copyInstallCommand")}
                    </button>
                    <button onClick={closeDetail} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg-hover rounded-lg transition-colors" title={t("common.close")}>
                      <X className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 dark:bg-dark-bg-sidebar rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-dark-text-muted">{t("skills.owner")}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{selectedSkill?.owner.handle}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-dark-bg-sidebar rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-dark-text-muted">{t("skills.version")}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{selectedSkill?.latestVersion.version}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-dark-bg-sidebar rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-dark-text-muted">{t("skills.downloads")}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{formatNumber(selectedSkill?.skill.stats?.installsCurrent || 0)}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-dark-bg-sidebar rounded-lg p-3">
                        <p className="text-xs text-gray-500 dark:text-dark-text-muted">{t("skills.stars")}</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-dark-text-primary">{formatNumber(selectedSkill?.skill.stats?.stars || 0)}</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">{t("skills.description")}</h3>
                      <p className="text-sm text-gray-600 dark:text-dark-text-primary bg-gray-50 dark:bg-dark-bg-sidebar rounded-lg p-3">
                        {selectedSkill?.skill.summary || t("skills.noDescription")}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">{t("skills.installCommand")}</h3>
                      <div className="bg-gray-900 dark:bg-dark-bg-sidebar rounded-lg p-3 font-mono text-sm text-green-400">
                        {selectedSkill && getInstallCommand(selectedSkill.skill.slug)}
                      </div>
                    </div>

                    {selectedSkill?.latestVersion.changelog && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">{t("skills.changelog")}</h3>
                        <p className="text-sm text-gray-600 dark:text-dark-text-primary bg-gray-50 dark:bg-dark-bg-sidebar rounded-lg p-3">
                          {selectedSkill.latestVersion.changelog}
                        </p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-2">{t("skills.skillFile")}</h3>
                      <button onClick={() => selectedSkill && loadSkillFile("SKILL.md")} disabled={loadingFile}
                        className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:underline">
                        <ExternalLink className="w-4 h-4" />
                        {loadingFile ? t("skills.loadingFile") : t("skills.viewSkillMd")}
                      </button>
                      {skillFileContent && (
                        <pre className="mt-3 bg-gray-900 dark:bg-dark-bg-sidebar rounded-lg p-4 text-sm text-gray-300 overflow-auto max-h-64">
                          {skillFileContent}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
