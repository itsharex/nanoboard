/**
 * Channel 配置数据
 * 消息渠道配置信息
 */

import type { ChannelInfo } from "./types";

// 消息渠道配置列表
export const CHANNELS_CONFIG: ChannelInfo[] = [
  {
    key: "telegram",
    nameKey: "channels.telegram",
    colorClass: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    fields: [
      { name: "token", labelKey: "config.apiKey", type: "password", placeholderKey: "channels.telegram.tokenPlaceholder" },
      { name: "allowFrom", labelKey: "config.channels.telegram.allowFromPlaceholder", type: "text", placeholderKey: "channels.telegram.allowFromPlaceholder" },
    ],
  },
  {
    key: "discord",
    nameKey: "channels.discord",
    colorClass: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    fields: [
      { name: "token", labelKey: "config.apiKey", type: "password", placeholderKey: "channels.discord.tokenPlaceholder" },
      { name: "allowFrom", labelKey: "config.channels.discord.allowFromPlaceholder", type: "text", placeholderKey: "channels.discord.allowFromPlaceholder" },
    ],
  },
  {
    key: "whatsapp",
    nameKey: "channels.whatsapp",
    colorClass: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400",
    fields: [
      { name: "allowFrom", labelKey: "config.channels.whatsapp.allowFromPlaceholder", type: "text", placeholderKey: "channels.whatsapp.allowFromPlaceholder" },
    ],
  },
  {
    key: "feishu",
    nameKey: "channels.feishu",
    colorClass: "bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400",
    fields: [
      { name: "appId", labelKey: "config.apiKey", type: "text", placeholderKey: "channels.feishu.appIdPlaceholder" },
      { name: "appSecret", labelKey: "config.apiKey", type: "password", placeholderKey: "channels.feishu.appSecretPlaceholder" },
      { name: "encryptKey", labelKey: "channels.feishu.encryptKeyLabel", type: "text", placeholderKey: "channels.feishu.encryptKeyPlaceholder" },
      { name: "verificationToken", labelKey: "channels.feishu.verificationTokenLabel", type: "text", placeholderKey: "channels.feishu.verificationTokenPlaceholder" },
      { name: "allowFrom", labelKey: "config.channels.feishu.allowFromPlaceholder", type: "text", placeholderKey: "channels.feishu.allowFromPlaceholder" },
    ],
  },
  {
    key: "dingtalk",
    nameKey: "channels.dingtalk",
    colorClass: "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400",
    fields: [
      { name: "clientId", labelKey: "channels.dingtalk.clientIdLabel", type: "text", placeholderKey: "channels.dingtalk.clientIdPlaceholder" },
      { name: "clientSecret", labelKey: "channels.dingtalk.clientSecretLabel", type: "password", placeholderKey: "channels.dingtalk.clientSecretPlaceholder" },
      { name: "allowFrom", labelKey: "config.channels.dingtalk.allowFromPlaceholder", type: "text", placeholderKey: "channels.dingtalk.allowFromPlaceholder" },
    ],
  },
  {
    key: "slack",
    nameKey: "channels.slack",
    colorClass: "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    fields: [
      { name: "botToken", labelKey: "config.apiKey", type: "password", placeholderKey: "channels.slack.botTokenPlaceholder" },
      { name: "appToken", labelKey: "config.apiKey", type: "password", placeholderKey: "channels.slack.appTokenPlaceholder" },
      { name: "groupPolicy", labelKey: "channels.slack.groupPolicyLabel", type: "select", options: ["mention", "open", "allowlist"], default: "mention" },
      { name: "allowFrom", labelKey: "channels.slack.allowFromLabel", type: "text", placeholderKey: "channels.slack.allowFromPlaceholder" },
    ],
  },
  {
    key: "qq",
    nameKey: "channels.qq",
    colorClass: "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400",
    fields: [
      { name: "appId", labelKey: "config.apiKey", type: "text", placeholderKey: "channels.qq.appIdPlaceholder" },
      { name: "secret", labelKey: "channels.qq.secretLabel", type: "password", placeholderKey: "channels.qq.secretPlaceholder" },
      { name: "allowFrom", labelKey: "config.channels.qq.allowFromPlaceholder", type: "text", placeholderKey: "channels.qq.allowFromPlaceholder" },
    ],
  },
  {
    key: "email",
    nameKey: "channels.email",
    colorClass: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
    fields: [
      { name: "imapHost", labelKey: "channels.email.imapServerLabel", type: "text", placeholderKey: "channels.email.imapServerPlaceholder" },
      { name: "imapPort", labelKey: "channels.email.imapPortLabel", type: "number", default: 993 },
      { name: "imapUsername", labelKey: "channels.email.imapUsernameLabel", type: "text", placeholderKey: "channels.email.imapUsernamePlaceholder" },
      { name: "imapPassword", labelKey: "channels.email.imapPasswordLabel", type: "password", placeholderKey: "channels.email.imapPasswordPlaceholder" },
      { name: "smtpHost", labelKey: "channels.email.smtpServerLabel", type: "text", placeholderKey: "channels.email.smtpServerPlaceholder" },
      { name: "smtpPort", labelKey: "channels.email.smtpPortLabel", type: "number", default: 587 },
      { name: "smtpUsername", labelKey: "channels.email.smtpUsernameLabel", type: "text", placeholderKey: "channels.email.smtpUsernamePlaceholder" },
      { name: "smtpPassword", labelKey: "channels.email.smtpPasswordLabel", type: "password", placeholderKey: "channels.email.smtpPasswordPlaceholder" },
      { name: "fromAddress", labelKey: "channels.email.fromAddressLabel", type: "text", placeholderKey: "channels.email.fromAddressPlaceholder" },
      { name: "allowFrom", labelKey: "channels.email.allowFromLabel", type: "text", placeholderKey: "channels.email.allowFromPlaceholder" },
    ],
  },
  {
    key: "terminal",
    nameKey: "channels.terminal",
    colorClass: "bg-gray-50 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400",
    fields: [],
  },
];

// 根据 key 获取 Channel 信息
export function getChannelInfo(channelKey: string): ChannelInfo | undefined {
  return CHANNELS_CONFIG.find(c => c.key === channelKey);
}

// 检查 Channel 是否已启用
export function isChannelEnabled(
  config: { channels?: Record<string, { enabled?: boolean }> },
  channelKey: string
): boolean {
  return config.channels?.[channelKey]?.enabled || false;
}
