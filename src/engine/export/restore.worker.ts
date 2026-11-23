/// <reference lib="webworker" />
import { restoreProjectBackup } from './restore'

declare const self: DedicatedWorkerGlobalScope

self.onmessage = async ({ data }: MessageEvent<Blob>) => {
  try {
    self.postMessage({ project: await restoreProjectBackup(data) })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Invalid project backup. Choose a ZIP exported by the studio.' })
  }
}
