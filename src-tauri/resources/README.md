# Tauri Resources

此目录包含应用程序运行时需要的资源文件。

## macOS Gatekeeper "已损坏"警告解决方案

### 问题说明

从 GitHub Actions 或其他来源下载的 macOS 应用如果未经苹果签名，首次打开时会显示"已损坏"的警告。这是 macOS Gatekeeper 的正常安全机制。

### ✅ 推荐解决方案（最简单）

**右键点击应用**：
1. 在 Finder 中右键点击 `nanoboard.app`
2. 选择"打开"
3. 在弹出对话框中点击"打开"

应用会被记住，以后就不会再显示警告。

### 🔧 命令行解决方案

如果你想通过命令行移除隔离属性：

```bash
# 移除隔离标志
xattr -cr com.apple.quarantine /Applications/nanoboard.app

# 移除来源元数据
xattr -cr com.apple.metadata:kMDItemWhereFroms /Applications/nanoboard.app
```

### 📦 项目配置说明

项目已配置以下设置以优化 macOS 体验：

1. **Info.plist** (`resources/Info.plist`)
   - 设置应用标识符：`com.nanoboard.app`
   - 配置安全设置和权限
   - 设置最低系统版本：10.13
   - 添加 hardened runtime 标志

2. **tauri.conf.json**
   - 使用自定义 Info.plist 文件
   - 启用 hardened runtime
   - 配置正确的 macOS 打包选项

### 🍎 正式发布建议

要完全避免此警告，正式发布时应：

1. **代码签名**：
   ```bash
   codesign --deep --force --verify --verbose \
     --sign "Developer ID Application: Your Name (YOUR_ID)" \
     build/macos/nanoboard.app
   ```

2. **公证应用**：
   ```bash
   xcrun notarytool submit \
     --apple-id "YOUR_APPLE_ID" \
     --password "@keychain:altool" \
     --wait \
     build/nanoboard.app.dmg
   ```

3. **创建签名的 DMG**：
   ```bash
   hdiutil create -volname "nanoboard" \
     -srcfolder build/macos \
     -ov -format UDZO
   ```

### 📚 当前状态

✅ **项目配置**：已添加 Info.plist 和 tauri.conf.json 的 macOS 优化
📝 **开发构建**：未签名是正常的，使用右键"打开"即可
🔒 **生产发布**：需要代码签名和公证（需要 Apple Developer 账户）

## 其他资源

如需添加其他平台特定的资源文件，请在此目录中创建。

