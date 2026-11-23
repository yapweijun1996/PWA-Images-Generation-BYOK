import type { Asset, JobStatus, Project } from '@engine/types'

export type Locale = 'en' | 'zh-CN'
const statuses: Record<JobStatus, [string,string]> = {
  queued: ['Queued','已排队'], running: ['Generating','生成中'], succeeded: ['Completed','已完成'],
  failed: ['Failed','失败'], uncertain: ['Result unconfirmed','结果待确认'],
}
const sources: Record<Asset['source'], [string,string]> = {
  imported: ['Imported image','导入图像'], generated: ['Generated image','生成图像'], edited: ['Edited image','编辑图像'],
}
const qualities: Record<string,[string,string]> = {
  auto: ['Auto','自动'], low: ['Low','低'], medium: ['Medium','中'], high: ['High','高'], xhigh: ['Extra high','超高'], max: ['Maximum','最高'],
}

export function jobLabel(status: JobStatus, locale: Locale) { return statuses[status][locale === 'en' ? 0 : 1] }
export function sourceLabel(source: Asset['source'], locale: Locale) { return sources[source][locale === 'en' ? 0 : 1] }
export function qualityLabel(quality: string, locale: Locale) { return qualities[quality]?.[locale === 'en' ? 0 : 1] ?? quality }

export function projectLabel(project: Project, locale: Locale) {
  const isDefault = project.defaultName ?? (project.id === 'first-project' && project.name === 'Untitled project')
  return isDefault ? (locale === 'en' ? 'Untitled project' : '未命名项目') : project.name
}

// Existing offline job records contain English messages. Translate at presentation time so a language change also updates history.
const errors: Record<string,string> = {
  'Too many references.': '参考图过多。',
  'Choose a PNG, JPEG or WebP image under 20 MB.': '请选择小于 20 MB 的 PNG、JPEG 或 WebP 图像。',
  'Choose between one and four generations.': '请选择生成 1 至 4 张图片。',
  'The previous session ended during generation. Check provider usage.': '上次会话在生成期间结束，请核对服务商用量。',
  'Batch stopped after an earlier request. This item was not sent.': '批次已在前一个请求后停止，此项尚未发送。',
  'Selected provider is unavailable.': '所选服务商不可用。',
  'Reference image is unavailable.': '参考图不可用。',
  'Check the prompt, references and model settings.': '请检查提示词、参考图和模型设置。',
  'Use PNG, JPEG or WebP references under 50 MB each.': '请使用 PNG、JPEG 或 WebP 参考图，每张须小于 50 MB。',
  'Use a transparent PNG mask under 4 MB.': '请使用小于 4 MB 的透明 PNG 蒙版。',
  'Enter your OpenAI API key in Settings.': '请在设置中输入你的 OpenAI API 密钥。',
  'You are offline. Reconnect before generating.': '当前处于离线状态，请联网后再生成。',
  'The result could not be confirmed. Check your provider usage before trying again.': '无法确认生成结果。再次尝试前，请先核对服务商用量。',
  'Could not complete generation.': '无法完成生成。',
  'Device storage is full. Free space, then try saving again.': '设备存储空间不足，请释放空间后重新保存。',
  'Device storage is full. Free space and restore the backup again.': '设备存储空间不足，请释放空间后重新恢复备份。',
  'This image is missing from device storage. Restore a project backup or import the image again.': '设备存储中缺少此图像，请恢复项目备份或重新导入图像。',
  'This image could not be decoded.': '无法读取此图像，请重新导入或从备份恢复。',
  'Image storage is unavailable. Reopen the app with device storage enabled.': '图像存储不可用，请启用设备存储后重新打开应用。',
  'Device storage is unavailable. Check browser storage settings and reopen the app.': '设备存储不可用，请检查浏览器存储设置并重新打开应用。',
  'The project no longer exists.': '此项目已不存在。',
  'Project not found.': '找不到项目。',
  'Unsupported image format.': '不支持此图像格式。',
  'Project exceeds the 256 MiB or 10,000-image backup limit.': '项目超过 256 MiB 或 10,000 张图片的备份限制。',
  'Project backup exceeds 256 MiB.': '项目备份超过 256 MiB。',
  'Project backup exceeds size limits.': '项目备份超过大小限制。',
  'Backup image is missing or damaged.': '备份中的图像缺失或损坏。',
  'Invalid project backup. Choose a ZIP exported by the studio.': '项目备份无效，请选择由工作室导出的 ZIP 文件。',
  'Asset metadata does not match image data.': '图像信息与文件内容不一致。',
  'The generation record or project changed while the image was being created.': '图片生成期间，项目或生成记录发生了变化。',
  'Each version image must belong to this project.': '版本中的图像必须属于当前项目。',
  'The parent version must belong to this project.': '父版本必须属于当前项目。',
  'Canvas unavailable': '画布不可用。',
  'Export failed': '导出失败。',
  'The board changed in another tab. Review its current panels and try again.': '另一标签页已修改分镜。请查看最新画格后重试。',
}
export function feedback(message: string, locale: Locale) {
  if (!message) return ''
  if (Object.hasOwn(errors, message)) return locale === 'en' ? message : errors[message]
  const http = /^OpenAI returned HTTP (\d{3})\.$/.exec(message)
  if (http) return locale === 'en' ? message : 'OpenAI 返回 HTTP ' + http[1] + '。'
  if (/backup|ZIP|manifest|draft mask|draft parent version|missing project image|missing locked reference/i.test(message)) {
    return locale === 'en' ? 'Invalid project backup. Check the archive and try again.' : '项目备份无效，请检查文件后重试。'
  }
  return locale === 'en' ? 'The operation could not finish. Check device storage and try again.' : '操作未完成，请检查设备存储后重试。'
}
