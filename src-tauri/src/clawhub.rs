/**
 * ClawHub API 代理模块
 * 用于代理 ClawHub Skills 市场 API 请求，避免 CORS 问题
 */

use serde::{Deserialize, Serialize};
use tauri::command;
use std::process::Command;

use crate::process::{get_custom_node_path_internal, get_custom_npm_path_internal};

const CLAWHUB_API_BASE: &str = "https://clawhub.ai";

/// 获取 npx 命令
/// 如果用户配置了自定义 Node 路径，则使用自定义路径下的 npx
/// 如果用户只配置了 NPM 路径，则尝试从 NPM 路径推断 npx 路径
fn get_npx_command() -> (String, Vec<String>) {
    // 检查是否有自定义 Node 路径
    if let Some(node_path) = get_custom_node_path_internal() {
        if !node_path.is_empty() {
            // 从 node 路径推断 npx 路径
            // 例如: /Users/legendol/.nvm/versions/node/v24.13.0/bin/node
            // 对应的 npx: /Users/legendol/.nvm/versions/node/v24.13.0/bin/npx
            let node_path_obj = std::path::Path::new(&node_path);
            if let Some(parent) = node_path_obj.parent() {
                let npx_path = parent.join("npx");
                if npx_path.exists() {
                    return (npx_path.to_string_lossy().to_string(), vec![]);
                }
            }
            // 如果找不到 npx，尝试使用 node 执行 npx-cli.js
            let node_dir = std::path::Path::new(&node_path).parent();
            if let Some(dir) = node_dir {
                let npx_cli = dir.join("..").join("lib").join("node_modules").join("npm").join("bin").join("npx-cli.js");
                if npx_cli.exists() {
                    return (node_path, vec![npx_cli.to_string_lossy().to_string()]);
                }
            }
        }
    }

    // 如果没有配置 Node 路径，检查是否有自定义 NPM 路径
    // 从 npm 路径推断 npx 路径（它们通常在同一个目录）
    if let Some(npm_path) = get_custom_npm_path_internal() {
        if !npm_path.is_empty() {
            let npm_path_obj = std::path::Path::new(&npm_path);
            if let Some(parent) = npm_path_obj.parent() {
                let npx_path = parent.join("npx");
                if npx_path.exists() {
                    return (npx_path.to_string_lossy().to_string(), vec![]);
                }
            }
        }
    }

    // 默认使用系统 npx
    ("npx".to_string(), vec![])
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClawHubSearchResult {
    pub score: f64,
    pub slug: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub summary: String,
    pub version: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClawHubSearchResponse {
    pub results: Vec<ClawHubSearchResult>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillStats {
    #[serde(rename = "downloads", skip_serializing_if = "Option::is_none")]
    pub downloads: Option<i64>,
    #[serde(rename = "stars", skip_serializing_if = "Option::is_none")]
    pub stars: Option<i64>,
    #[serde(rename = "installsCurrent", skip_serializing_if = "Option::is_none")]
    pub installs_current: Option<i64>,
    #[serde(rename = "installsAllTime", skip_serializing_if = "Option::is_none")]
    pub installs_all_time: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillVersion {
    pub version: String,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "changelog", skip_serializing_if = "Option::is_none")]
    pub changelog: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillListItem {
    pub slug: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub summary: String,
    pub tags: std::collections::HashMap<String, String>,
    pub stats: SkillStats,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
    #[serde(rename = "latestVersion", skip_serializing_if = "Option::is_none")]
    pub latest_version: Option<SkillVersion>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClawHubSkillsResponse {
    pub items: Vec<SkillListItem>,
    #[serde(rename = "nextCursor", skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillOwner {
    pub handle: String,
    #[serde(rename = "displayName")]
    pub display_name: Option<String>,
    pub image: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillInfo {
    pub slug: String,
    #[serde(rename = "displayName")]
    pub display_name: String,
    pub summary: String,
    pub tags: std::collections::HashMap<String, String>,
    pub stats: SkillStats,
    #[serde(rename = "createdAt")]
    pub created_at: i64,
    #[serde(rename = "updatedAt")]
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SkillDetailResponse {
    pub skill: SkillInfo,
    #[serde(rename = "latestVersion")]
    pub latest_version: SkillVersion,
    pub owner: SkillOwner,
}

/// 搜索 ClawHub Skills
#[command]
pub async fn search_clawhub_skills(
    query: String,
    limit: Option<i32>,
) -> Result<ClawHubSearchResponse, String> {
    let limit = limit.unwrap_or(20);
    let url = format!(
        "{}/api/v1/search?q={}&limit={}",
        CLAWHUB_API_BASE,
        urlencoding::encode(&query),
        limit
    );

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Accept", "application/json")
        .header("User-Agent", "Nanoboard/1.0")
        .send()
        .await
        .map_err(|e| format!("请求失败：{}", e))?;

    if !response.status().is_success() {
        return Err(format!("API 返回错误状态：{}", response.status()));
    }

    let data = response
        .json::<ClawHubSearchResponse>()
        .await
        .map_err(|e| format!("解析响应失败：{}", e))?;

    Ok(data)
}

/// 获取 ClawHub Skills 列表
#[command]
pub async fn get_clawhub_skills(
    sort: Option<String>,
    limit: Option<i32>,
    cursor: Option<String>,
) -> Result<ClawHubSkillsResponse, String> {
    let sort = sort.unwrap_or_else(|| "trending".to_string());
    let limit = limit.unwrap_or(20);
    let mut url = format!(
        "{}/api/v1/skills?sort={}&limit={}",
        CLAWHUB_API_BASE, sort, limit
    );

    if let Some(c) = cursor {
        url.push_str(&format!("&cursor={}", urlencoding::encode(&c)));
    }

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Accept", "application/json")
        .header("User-Agent", "Nanoboard/1.0")
        .send()
        .await
        .map_err(|e| format!("请求失败：{}", e))?;

    if !response.status().is_success() {
        return Err(format!("API 返回错误状态：{}", response.status()));
    }

    let data = response
        .json::<ClawHubSkillsResponse>()
        .await
        .map_err(|e| format!("解析响应失败：{}", e))?;

    Ok(data)
}

/// 获取 ClawHub Skill 详情
#[command]
pub async fn get_clawhub_skill_detail(slug: String) -> Result<SkillDetailResponse, String> {
    let url = format!("{}/api/v1/skills/{}", CLAWHUB_API_BASE, slug);

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Accept", "application/json")
        .header("User-Agent", "Nanoboard/1.0")
        .send()
        .await
        .map_err(|e| format!("请求失败：{}", e))?;

    if !response.status().is_success() {
        return Err(format!("API 返回错误状态：{}", response.status()));
    }

    let data = response
        .json::<SkillDetailResponse>()
        .await
        .map_err(|e| format!("解析响应失败：{}", e))?;

    Ok(data)
}

/// 获取 ClawHub Skill 文件内容
#[command]
pub async fn get_clawhub_skill_file(
    slug: String,
    path: String,
    version: Option<String>,
) -> Result<String, String> {
    let mut url = format!(
        "{}/api/v1/skills/{}/file?path={}",
        CLAWHUB_API_BASE,
        slug,
        urlencoding::encode(&path)
    );

    if let Some(v) = version {
        url.push_str(&format!("&version={}", v));
    }

    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Accept", "text/plain")
        .header("User-Agent", "Nanoboard/1.0")
        .send()
        .await
        .map_err(|e| format!("请求失败：{}", e))?;

    if !response.status().is_success() {
        return Err(format!("API 返回错误状态：{}", response.status()));
    }

    let content = response
        .text()
        .await
        .map_err(|e| format!("读取响应失败：{}", e))?;

    Ok(content)
}

/// 安装 ClawHub Skill
#[command]
pub async fn install_clawhub_skill(slug: String) -> Result<serde_json::Value, String> {
    use std::fs;

    // 获取用户主目录
    let home = dirs::home_dir()
        .ok_or_else(|| "无法找到用户主目录".to_string())?;

    let nanobot_workspace = home.join(".nanobot").join("workspace");
    let target_dir = nanobot_workspace.join("skills").join(&slug);
    
    // 首先检查是否已安装在 workspace，如果已存在则先删除
    if target_dir.exists() {
        if let Err(e) = fs::remove_dir_all(&target_dir) {
            return Err(format!("删除旧技能目录失败：{}", e));
        }
    }

    // 构建命令，使用 --force 参数强制重新安装
    // 注意：ClawHub 默认安装到 ~/skills/ 或 ~/.clawhub/skills/
    let (npx_cmd, npx_prefix) = get_npx_command();
    let mut args = npx_prefix;
    args.extend_from_slice(&["clawhub@latest".to_string(), "install".to_string(), slug.clone(), "--force".to_string()]);

    let output = Command::new(&npx_cmd)
        .args(&args)
        .current_dir(&home)
        .output()
        .map_err(|e| format!("执行安装命令失败：{}. 请确保已安装 Node.js 和 npm。当前使用的命令: {}", e, npx_cmd))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        // 确保目标目录存在
        if let Err(e) = fs::create_dir_all(&nanobot_workspace.join("skills")) {
            return Err(format!("创建目标目录失败：{}", e));
        }

        // ClawHub 可能安装到多个位置，需要检查所有可能的位置
        let possible_source_dirs = vec![
            home.join("skills").join(&slug),
            home.join(".clawhub").join("skills").join(&slug),
            home.join(".local").join("skills").join(&slug),
        ];

        let mut moved = false;
        for source_dir in &possible_source_dirs {
            if source_dir.exists() {
                // 如果目标已存在，先删除
                if target_dir.exists() {
                    if let Err(e) = fs::remove_dir_all(&target_dir) {
                        return Err(format!("删除旧技能目录失败：{}", e));
                    }
                }

                // 移动技能目录
                if let Err(e) = fs::rename(source_dir, &target_dir) {
                    // 如果 rename 失败（可能是跨文件系统），尝试复制
                    if let Err(copy_e) = copy_dir_recursive(source_dir, &target_dir) {
                        return Err(format!("移动技能目录失败：{}，复制也失败：{}", e, copy_e));
                    }
                    // 复制成功后删除源目录
                    let _ = fs::remove_dir_all(source_dir);
                }
                moved = true;
                break;
            }
        }

        if !moved {
            return Err(format!("技能已安装但找不到源目录，请手动检查 ~/skills/ 或 ~/.clawhub/skills/"));
        }

        Ok(serde_json::json!({
            "success": true,
            "message": format!("技能 {} 安装成功", slug),
            "output": stdout,
            "slug": slug
        }))
    } else {
        Err(format!("安装失败：{}{}", stdout, stderr))
    }
}

/// 递归复制目录
fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
    use std::fs;

    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_recursive(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}

/// 获取已安装的 ClawHub Skills
#[command]
pub async fn get_installed_clawhub_skills() -> Result<Vec<String>, String> {
    use std::fs;

    // 获取用户主目录
    let home = dirs::home_dir()
        .ok_or_else(|| "无法找到用户主目录".to_string())?;

    let nanobot_workspace = home.join(".nanobot").join("workspace");
    let skills_dir = nanobot_workspace.join("skills");

    if !skills_dir.exists() {
        return Ok(vec![]);
    }

    let mut installed = vec![];
    if let Ok(entries) = fs::read_dir(&skills_dir) {
        for entry in entries.flatten() {
            if let Ok(file_type) = entry.file_type() {
                if file_type.is_dir() {
                    if let Some(name) = entry.file_name().to_str() {
                        installed.push(name.to_string());
                    }
                }
            }
        }
    }

    Ok(installed)
}

/// 卸载 ClawHub Skill
#[command]
pub async fn uninstall_clawhub_skill(slug: String) -> Result<serde_json::Value, String> {
    use std::fs;

    // 获取用户主目录
    let home = dirs::home_dir()
        .ok_or_else(|| "无法找到用户主目录".to_string())?;

    // 首先尝试从 nanobot workspace 删除
    let nanobot_workspace = home.join(".nanobot").join("workspace");
    let target_dir = nanobot_workspace.join("skills").join(&slug);

    if target_dir.exists() {
        if let Err(e) = fs::remove_dir_all(&target_dir) {
            return Err(format!("删除技能目录失败：{}", e));
        }
    }

    // 然后调用 clawhub CLI 卸载（清理 ~/skills/ 中的残留）
    let (npx_cmd, npx_prefix) = get_npx_command();
    let mut args = npx_prefix;
    args.extend_from_slice(&["clawhub@latest".to_string(), "uninstall".to_string(), slug.clone()]);

    let output = Command::new(&npx_cmd)
        .args(&args)
        .current_dir(&home)
        .output()
        .map_err(|e| format!("执行卸载命令失败：{}. 请确保已安装 Node.js 和 npm。当前使用的命令: {}", e, npx_cmd))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(serde_json::json!({
            "success": true,
            "message": format!("技能 {} 卸载成功", slug),
            "output": stdout,
            "slug": slug
        }))
    } else {
        // 即使 clawhub CLI 失败，只要我们从 workspace 删除了也视为成功
        if !target_dir.exists() {
            Ok(serde_json::json!({
                "success": true,
                "message": format!("技能 {} 已从 workspace 移除", slug),
                "output": stdout,
                "slug": slug
            }))
        } else {
            Err(format!("卸载失败：{}{}", stdout, stderr))
        }
    }
}
