type Text = readonly [en: string, zh: string]
type Label = readonly [id: string, text: Text]
type Template = readonly [id: string, stageId: string, label: Text, prompt: Text]
interface Definition {
  name: Text
  stages: readonly Label[]
  templates: readonly Template[]
  reviewChecks: readonly Label[]
}
export const studioIds = ['manga', 'commercial', 'interior', 'uiux', 'movie', 'education'] as const
export type StudioId = typeof studioIds[number]
export type StudioLocale = 'en' | 'zh-CN'

const definitions: Record<StudioId, Definition> = {
  manga: {
    name: ['Manga & Comics', '漫画'],
    stages: [
      ['story', ['Story', '故事']], ['character', ['Character', '角色']], ['storyboard', ['Storyboard', '分镜']],
      ['panel', ['Panel', '画格']], ['page', ['Page', '漫画页']], ['chapter', ['Chapter', '章节']],
    ],
    templates: [
      ['character-sheet', 'character', ['Character sheet', '角色设定表'],
        ['Draw a character sheet for [character] in [Japanese manga, Chinese manhua or American comics style]. Show front, profile and three-quarter views. Keep hairstyle, clothing and proportions consistent with the reference.', '为[角色]绘制[日漫、国漫或美漫风格]的角色设定表，包含正面、侧面和四分之三侧面。发型、服装和身材比例与参考图保持一致。']],
      ['page', 'page', ['Multi-panel page', '多格漫画页'],
        ['Draw a [black-and-white or color] comic page showing [action] in [number] panels, read [left to right or right to left]. Build from an establishing shot to the final reaction. Leave blank speech bubbles for dialogue.', '用[黑白或彩色]绘制一页漫画，以[格数]格展现[情节]，采用[从左至右或从右至左]的阅读顺序。先交代环境，再推进至最后的反应特写。为对白预留空白气泡。']],
    ],
    reviewChecks: [
      ['character', ['Compare the face, silhouette and costume with the character sheet.', '与角色设定表核对脸部、轮廓和服装。']],
      ['reading', ['Read the panels and dialogue in the intended direction.', '按预定的阅读方向检查画格和对白顺序。']],
    ],
  },
  commercial: {
    name: ['Commercial Artwork', '商业美术'],
    stages: [
      ['brand', ['Brand', '品牌']], ['reference', ['Product reference', '产品参考图']], ['campaign', ['Campaign', '营销活动']],
      ['variants', ['Variants', '变体']], ['review', ['Accuracy review', '准确性审核']], ['export', ['Export', '导出']],
    ],
    templates: [
      ['product-hero', 'campaign', ['Product hero', '产品主视觉'],
        ['Photograph the referenced [product] against [background] for [audience]. Keep the package shape, label, materials and brand colors true to the source. Light the product from [direction] and leave room for copy.', '以[背景]为[目标受众]拍摄参考图中的[产品]。忠实保留包装外形、标签、材质及品牌色。从[方向]布光，并留出文案空间。']],
      ['campaign-variant', 'variants', ['Campaign crop', '营销版式变体'],
        ['Adapt this campaign image for [banner, square post or portrait placement]. Preserve the exact product and logo, retain the brand palette, and move the background elements to fit the composition.', '将营销图调整为[横幅、方形贴文或竖版广告]。保留产品原貌、标志及品牌配色，调整背景元素以适应新构图。']],
    ],
    reviewChecks: [
      ['product', ['Compare product shape, color and packaging with the supplied photo.', '与原图核对产品外形、颜色和包装。']],
      ['brand', ['Check logo proportions, printed text and brand colors.', '核对标志比例、包装文字和品牌色。']],
    ],
  },
  interior: {
    name: ['Interior Design', '室内设计'],
    stages: [
      ['room', ['Room photo', '空间原照']], ['style', ['Style', '风格']], ['materials', ['Materials', '材料']],
      ['render', ['Render', '效果图']], ['comparison', ['Before / after', '改造前后']], ['export', ['Export', '导出']],
    ],
    templates: [
      ['renovation', 'render', ['Room renovation', '空间改造'],
        ['Reimagine the room in the uploaded photo as [style] for [use]. Keep the camera viewpoint, walls, windows and doorways fixed. Replace the furnishings with [furniture] and finish the surfaces in [materials].', '以[风格]重新设计原照中的房间，用作[用途]。保持相机视角、墙体、门窗位置，改用[家具]与[饰面材料]。']],
      ['materials', 'materials', ['Material study', '材料搭配'],
        ['Show [floor, wall and upholstery finishes] in the referenced room under [lighting]. Keep the furniture layout and room geometry so the material changes can be compared.', '在参考空间的[光照条件]下展示[地面、墙面和软包材质]，保留家具布局与空间结构，便于比较材质变化。']],
    ],
    reviewChecks: [
      ['openings', ['Compare every door and window position with the room photo.', '与空间原照逐一核对门窗位置。']],
      ['geometry', ['Check wall alignment, viewpoint and furniture scale before presenting the concept.', '展示概念方案前核对墙面走向、视角及家具比例。']],
    ],
  },
  uiux: {
    name: ['UI/UX Design', 'UI/UX 设计'],
    stages: [
      ['requirements', ['Requirements', '需求']], ['style', ['Style', '风格']], ['layout', ['Layout concept', '布局概念']],
      ['responsive', ['Responsive visual variants', '响应式视觉方案']], ['review', ['Review', '审核']], ['handoff', ['Handoff', '设计交付']],
    ],
    templates: [
      ['desktop', 'layout', ['Desktop concept', '桌面概念图'],
        ['Create a desktop screen concept for [product] helping [user] complete [task]. Give [primary action] visual priority. Use [design-system reference] for type, spacing and color.', '设计[产品]的桌面界面概念图，帮助[用户]完成[任务]。突出[主要操作]，并以[设计系统参考图]确定字体、间距和色彩。']],
      ['mobile', 'responsive', ['Mobile companion', '移动端配套方案'],
        ['Adapt the referenced desktop screen to a narrow phone screen. Preserve the primary task, navigation priorities and visual style. Reflow dense content into readable sections with touch-sized controls.', '将参考桌面界面调整为窄屏手机方案，保留核心任务、导航优先级与视觉风格。将密集内容重新分区，并为触控操作留出空间。']],
    ],
    reviewChecks: [
      ['task', ['Compare the main action and content hierarchy on desktop and mobile.', '比较桌面和移动方案的主要操作与内容层级。']],
      ['system', ['Compare component styles, labels and palette with the design reference.', '与设计参考图核对组件样式、标签和配色。']],
    ],
  },
  movie: {
    name: ['Movie & Cinematic', '电影视觉'],
    stages: [
      ['script', ['Script', '剧本']], ['scene', ['Scene', '场景']], ['shots', ['Shot list', '镜头表']],
      ['storyboard', ['Storyboard', '故事板']], ['keyframes', ['Keyframes', '关键帧']], ['export', ['Export', '导出']],
    ],
    templates: [
      ['establishing-shot', 'storyboard', ['Establishing shot', '建立镜头'],
        ['Storyboard the opening of [scene] as a wide shot from [camera angle]. Place [character] relative to [landmark] and establish the direction of movement, time of day and key light.', '以[机位角度]的远景为[场景]绘制开场分镜。交代[角色]与[地标]的位置关系、运动方向、时段及主光方向。']],
      ['keyframe', 'keyframes', ['Continuity keyframe', '连续性关键帧'],
        ['Create a single cinematic keyframe for shot [number] at [story beat], using [shot size and lens]. Match costume, screen direction and lighting to the previous storyboard frame.', '为第[编号]个镜头的[剧情节点]绘制一张静态关键帧，使用[景别与镜头焦段]。对照上一格故事板保持服装、运动方向和光线连续。']],
    ],
    reviewChecks: [
      ['continuity', ['Match character styling, screen direction and lighting across adjacent shots.', '逐一核对相邻镜头中的人物造型、运动方向与光线。']],
      ['sequence', ['Read the storyboard in shot-list order and check the intended story beat.', '按镜头表顺序阅读故事板，核对每个剧情节点。']],
    ],
  },
  education: {
    name: ['Education', '教育插画'],
    stages: [
      ['topic', ['Topic', '主题']], ['goal', ['Learning goal', '学习目标']], ['diagram', ['Diagram', '图解']],
      ['annotation', ['Editable annotation', '可编辑标注']], ['review', ['Factual review', '事实核查']], ['export', ['Export', '导出']],
    ],
    templates: [
      ['diagram', 'diagram', ['Teaching diagram', '教学图解'],
        ['Illustrate [concept] for learners aged [age]. The learning goal is [objective]. Show [parts] with clear relationships and leave space for labels in [language]. Use the supplied teaching reference for proportions.', '为[年龄]的学习者绘制[概念]示意图，学习目标为[目标]。清晰展现[组成部分]及其关系，预留[语言]标签的位置，并参照教材图核对比例。']],
      ['process', 'annotation', ['Process illustration', '过程示意图'],
        ['Illustrate [process] in [number] ordered steps for [grade level]. Use consistent symbols and arrows. Leave room beside each step for an editable explanation in [language].', '面向[年级]学习者，将[过程]画为[数量]个有序步骤，使用统一的符号和箭头。在每个步骤旁预留[语言]的可编辑说明。']],
    ],
    reviewChecks: [
      ['accuracy', ['Verify every factual claim, label and arrow against the teaching source.', '对照教学来源核实每项事实、标签及箭头方向。']],
      ['audience', ['Check terminology, translations and reading level for the intended learners.', '按学习者的年龄核对术语、翻译和阅读难度。']],
    ],
  },
}

export function isStudioId(id: string): id is StudioId {
  return studioIds.some(studio => studio === id)
}

export function getStudio(id: StudioId, locale: StudioLocale = 'en') {
  const definition = definitions[id]
  const language = locale === 'zh-CN' ? 1 : 0
  const label = ([id, text]: Label) => ({ id, label: text[language] })
  return {
    id, name: definition.name[language], stages: definition.stages.map(label),
    templates: definition.templates.map(([id, stageId, name, prompt]) => ({
      id, stageId, label: name[language], prompt: prompt[language],
    })),
    reviewChecks: definition.reviewChecks.map(label),
  }
}
