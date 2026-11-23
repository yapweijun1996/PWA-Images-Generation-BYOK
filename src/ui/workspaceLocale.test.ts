import { expect, it } from 'vitest'
import type { Project } from '@engine/types'
import { feedback, jobLabel, projectLabel, qualityLabel, sourceLabel } from './workspaceLocale'

it('translates stored system feedback and preserves the HTTP status and uncertainty guidance', () => {
  const message = 'The result could not be confirmed. Check your provider usage before trying again.'
  expect(feedback(message,'en')).toBe(message)
  expect(feedback(message,'zh-CN')).toContain('核对服务商用量')
  expect(feedback('OpenAI returned HTTP 429.','zh-CN')).toBe('OpenAI 返回 HTTP 429。')
  expect(feedback('Backup image is missing or damaged.','zh-CN')).toContain('图像缺失或损坏')
  expect(jobLabel('uncertain','zh-CN')).toBe('结果待确认')
  expect(qualityLabel('auto','zh-CN')).toBe('自动')
  expect(sourceLabel('edited','zh-CN')).toBe('编辑图像')
})

it('translates only a system-generated name, including legacy default project records', () => {
  const project: Project = {id:'first-project',name:'Untitled project',studioId:'manga',createdAt:'',updatedAt:''}
  expect(projectLabel(project,'zh-CN')).toBe('未命名项目')
  expect(projectLabel({...project,id:'restored',defaultName:true},'zh-CN')).toBe('未命名项目')
  expect(projectLabel({...project,defaultName:false},'zh-CN')).toBe('Untitled project')
  expect(projectLabel({...project,id:'custom'},'zh-CN')).toBe('Untitled project')
  expect(projectLabel({...project,name:'My user-named project'},'zh-CN')).toBe('My user-named project')
})
