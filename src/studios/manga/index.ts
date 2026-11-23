interface MangaStudioConfig {
  id: 'manga'
  name: string
  workflows: readonly string[]
}

// Phase 2 owns the manga workflows.
export const mangaStudio: MangaStudioConfig = {
  id: 'manga',
  name: 'Manga & Comics',
  workflows: [],
}
