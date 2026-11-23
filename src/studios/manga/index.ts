import { getStudio } from '../index'

const manga = getStudio('manga')
export const mangaStudio = { id: manga.id, name: manga.name, workflows: manga.stages.map(stage => stage.label) }
