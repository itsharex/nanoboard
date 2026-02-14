use anyhow::Context;
use serde_json::json;
use std::process::Command;
use crate::process;

/// 执行 nanobot cron 子命令并返回 stdout/stderr
fn run_nanobot_cron(args: &[&str]) -> Result<String, String> {
    let nanobot_cmd = process::find_command("nanobot")
        .ok_or_else(|| "未找到 nanobot 命令，请先安装 nanobot-ai".to_string())?;

    let output = process::apply_hidden_window(Command::new(&nanobot_cmd))
        .arg("cron")
        .args(args)
        .env("PYTHONUTF8", "1")
        .env("PYTHONIOENCODING", "utf-8")
        .output()
        .context("执行 nanobot cron 命令失败")
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        let msg = if stderr.trim().is_empty() { &stdout } else { &stderr };
        Err(format!("命令执行失败: {}", msg.trim()))
    }
}

/// 列出所有定时任务
#[tauri::command]
pub async fn cron_list() -> Result<serde_json::Value, String> {
    match run_nanobot_cron(&["list", "--all"]) {
        Ok(output) => {
            let trimmed = output.trim();
            if trimmed.is_empty() || trimmed.contains("No scheduled jobs") {
                return Ok(json!({
                    "success": true,
                    "jobs": []
                }));
            }
            let jobs = parse_rich_table(trimmed);
            Ok(json!({
                "success": true,
                "jobs": jobs
            }))
        }
        Err(e) => Ok(json!({
            "success": false,
            "jobs": [],
            "message": e
        }))
    }
}

/// 解析 Rich 库表格输出
/// 格式示例:
/// ┃ ID       ┃ Name     ┃ Schedule    ┃ Status  ┃ Next Run         ┃
/// │ 6660533f │ test-job │ every 3600s │ enabled │ 2026-02-14 15:33 │
fn parse_rich_table(text: &str) -> Vec<serde_json::Value> {
    let mut jobs = Vec::new();
    let mut headers: Vec<String> = Vec::new();

    for line in text.lines() {
        let line = line.trim();

        // 跳过空行和边框行
        if line.is_empty()
            || line.starts_with("┏") || line.starts_with("┗")
            || line.starts_with("┡") || line.starts_with("└")
            || line.starts_with("━") || line.starts_with("─")
            || line.starts_with("Scheduled")
        {
            continue;
        }

        // 按 ┃ 或 │ 分隔单元格，保留空单元格（只去掉首尾分隔符产生的空项）
        let raw_cells: Vec<String> = line
            .split(|c| c == '┃' || c == '│')
            .map(|s| s.trim().to_string())
            .collect();

        // 去掉首尾的空字符串（由分隔符开头/结尾产生），保留中间的空值
        let cells: Vec<String> = raw_cells
            .iter()
            .enumerate()
            .filter(|(i, s)| {
                // 跳过第一个和最后一个如果是空的
                if *i == 0 && s.is_empty() { return false; }
                if *i == raw_cells.len() - 1 && s.is_empty() { return false; }
                true
            })
            .map(|(_, s)| s.clone())
            .collect();

        if cells.is_empty() {
            continue;
        }

        // 第一次遇到多列的行 → 当作表头
        if headers.is_empty() && cells.len() >= 3 {
            headers = cells.iter().map(|c| c.to_lowercase()).collect();
            continue;
        }

        // 数据行：列数必须与表头一致
        if !headers.is_empty() && cells.len() == headers.len() {
            let mut job = serde_json::Map::new();
            for (i, header) in headers.iter().enumerate() {
                let key = match header.as_str() {
                    "id" => "id",
                    "name" => "name",
                    "schedule" => "schedule",
                    "status" => "status",
                    "next run" | "next_run" | "nextrun" => "next_run",
                    "message" => "message",
                    other => other,
                };
                job.insert(
                    key.to_string(),
                    serde_json::Value::String(cells.get(i).cloned().unwrap_or_default()),
                );
            }
            // 确保必要字段存在
            if !job.contains_key("id") {
                job.insert("id".to_string(), serde_json::Value::String(String::new()));
            }
            if !job.contains_key("name") {
                job.insert("name".to_string(), serde_json::Value::String(String::new()));
            }
            jobs.push(serde_json::Value::Object(job));
        }
    }

    jobs
}

/// 添加定时任务
#[tauri::command]
pub async fn cron_add(
    name: String,
    message: String,
    schedule_type: String,
    schedule_value: String,
    deliver: Option<bool>,
    to: Option<String>,
    channel: Option<String>,
) -> Result<serde_json::Value, String> {
    if name.trim().is_empty() {
        return Ok(json!({
            "success": false,
            "message": "任务名称不能为空"
        }));
    }
    if message.trim().is_empty() {
        return Ok(json!({
            "success": false,
            "message": "消息内容不能为空"
        }));
    }

    let mut args: Vec<String> = vec![
        "add".to_string(),
        "--name".to_string(),
        name.clone(),
        "--message".to_string(),
        message.clone(),
    ];

    match schedule_type.as_str() {
        "cron" => {
            args.push("--cron".to_string());
            args.push(schedule_value.clone());
        }
        "every" => {
            args.push("--every".to_string());
            args.push(schedule_value.clone());
        }
        "at" => {
            args.push("--at".to_string());
            args.push(schedule_value.clone());
        }
        _ => {
            return Ok(json!({
                "success": false,
                "message": format!("未知的调度类型: {}", schedule_type)
            }));
        }
    }

    if deliver.unwrap_or(false) {
        args.push("--deliver".to_string());
    }
    if let Some(ref to_val) = to {
        if !to_val.trim().is_empty() {
            args.push("--to".to_string());
            args.push(to_val.clone());
        }
    }
    if let Some(ref ch) = channel {
        if !ch.trim().is_empty() {
            args.push("--channel".to_string());
            args.push(ch.clone());
        }
    }

    let arg_refs: Vec<&str> = args.iter().map(|s| s.as_str()).collect();

    match run_nanobot_cron(&arg_refs) {
        Ok(output) => Ok(json!({
            "success": true,
            "message": output.trim()
        })),
        Err(e) => Ok(json!({
            "success": false,
            "message": e
        }))
    }
}

/// 删除定时任务
#[tauri::command]
pub async fn cron_remove(job_id: String) -> Result<serde_json::Value, String> {
    if job_id.trim().is_empty() {
        return Ok(json!({
            "success": false,
            "message": "任务 ID 不能为空"
        }));
    }

    match run_nanobot_cron(&["remove", &job_id]) {
        Ok(output) => Ok(json!({
            "success": true,
            "message": output.trim()
        })),
        Err(e) => Ok(json!({
            "success": false,
            "message": e
        }))
    }
}

/// 启用或禁用定时任务
#[tauri::command]
pub async fn cron_enable(job_id: String, disable: bool) -> Result<serde_json::Value, String> {
    if job_id.trim().is_empty() {
        return Ok(json!({
            "success": false,
            "message": "任务 ID 不能为空"
        }));
    }

    let mut args = vec!["enable", &job_id];
    if disable {
        args.push("--disable");
    }

    match run_nanobot_cron(&args) {
        Ok(output) => Ok(json!({
            "success": true,
            "message": output.trim()
        })),
        Err(e) => Ok(json!({
            "success": false,
            "message": e
        }))
    }
}

/// 手动运行定时任务
#[tauri::command]
pub async fn cron_run(job_id: String) -> Result<serde_json::Value, String> {
    if job_id.trim().is_empty() {
        return Ok(json!({
            "success": false,
            "message": "任务 ID 不能为空"
        }));
    }

    match run_nanobot_cron(&["run", "--force", &job_id]) {
        Ok(output) => Ok(json!({
            "success": true,
            "message": output.trim()
        })),
        Err(e) => Ok(json!({
            "success": false,
            "message": e
        }))
    }
}
