import express from 'express'
import multer from 'multer'
import { knowledgeBaseStore } from '../store/KnowledgeBaseStore'
import knowledgeService from '../services/KnowledgeService'
import { fileStorage } from '../services/FileStorage'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { getProviderById } from '../utils/api-utils'

const router = express.Router()
const upload = multer({ dest: path.join(process.cwd(), 'storage', 'uploads') })

function normalizeProviderId(base: any): string | undefined {
  if (typeof base?.embedApiClient?.provider === 'string') return base.embedApiClient.provider
  if (typeof base?.model?.provider === 'string') return base.model.provider
  if (base?.model?.provider && typeof base.model.provider === 'object' && typeof base.model.provider.id === 'string')
    return base.model.provider.id
  const p = base?.embeddingModel?.provider
  if (typeof p === 'string') return p
  if (p && typeof p === 'object' && typeof p.id === 'string') return p.id
  return undefined
}

function normalizeEmbeddingModelId(base: any, providerId?: string): string | undefined {
  const direct =
    (typeof base?.embedApiClient?.model === 'string' && base.embedApiClient.model) ||
    (typeof base?.model?.id === 'string' && base.model.id) ||
    (typeof base?.embeddingModel?.id === 'string' && base.embeddingModel.id) ||
    undefined

  if (!direct) return undefined

  if (providerId && direct.startsWith(providerId + '-')) {
    return direct.slice(providerId.length + 1)
  }

  if (direct.includes(':')) {
    const parts = direct.split(':')
    if (parts[0]) return parts.slice(1).join(':')
  }

  return direct
}

async function getKnowledgeBaseParams(base: any) {
  const providerId = normalizeProviderId(base) || 'openai'
  const provider = await getProviderById(providerId)

  // Use nullish-aware checks: empty string '' is falsy but should NOT fall through
  // to defaults if the client explicitly sent it. Use explicit non-empty checks.
  const clientBaseURL = base?.embedApiClient?.baseURL
  const clientApiKey = base?.embedApiClient?.apiKey

  let baseURL =
    (typeof clientBaseURL === 'string' && clientBaseURL.trim()) ||
    provider?.apiHost ||
    process.env.OPENAI_API_HOST ||
    'https://api.openai.com/v1'

  // Ensure baseURL has API version path (e.g. /v1) for OpenAI-compatible providers.
  // Many providers store apiHost without /v1 (e.g. 'https://api.siliconflow.cn'),
  // but the OpenAI SDK needs the full path to construct correct API endpoints.
  const VERSION_REGEX = /\/v\d+(?:alpha|beta)?(?=\/|$)/i
  if (baseURL && !VERSION_REGEX.test(baseURL) && !baseURL.includes('/openai')) {
    baseURL = baseURL.replace(/\/$/, '') + '/v1'
  }

  const apiKey =
    (typeof clientApiKey === 'string' && clientApiKey) || provider?.apiKey || process.env.OPENAI_API_KEY || ''
  const model = normalizeEmbeddingModelId(base, providerId) || 'text-embedding-3-small'

  return {
    id: base.id,
    embedApiClient: {
      model,
      provider: providerId,
      apiKey,
      baseURL
    },
    dimensions: base.dimensions,
    chunkSize: base.chunkSize,
    chunkOverlap: base.chunkOverlap,
    documentCount: base.documentCount,
    model: base.model,
    rerankModel: base.rerankModel,
    preprocessProvider: base.preprocessProvider
  }
}

// List all knowledge bases
router.get('/', (req, res) => {
  const bases = knowledgeBaseStore.getAll()
  res.json(bases)
})

// Create knowledge base
router.post('/', async (req, res) => {
  const base = req.body
  if (!base.id) base.id = uuidv4()

  try {
    const baseParams = await getKnowledgeBaseParams(base)
    if (!baseParams.embedApiClient?.apiKey || baseParams.embedApiClient.apiKey === 'secret') {
      knowledgeBaseStore.add({ ...(base as any), id: base.id, items: base.items || [] } as any)
      return res.status(200).json({
        ...base,
        warning: 'Missing embedding apiKey. Knowledge base created without RAG initialization.'
      })
    }
    await knowledgeService.create(null, baseParams)
    knowledgeBaseStore.add({ ...(base as any), id: base.id, items: base.items || [] } as any)
    res.json(base)
  } catch (error) {
    const message = (error as Error).message || 'Unknown error'
    res.status(500).json({ error: message })
  }
})

// Update knowledge base metadata
router.put('/:id', async (req, res) => {
  const { id } = req.params as { id: string }
  const updates = req.body

  const existing = knowledgeBaseStore.get(id)
  if (!existing) return res.status(404).json({ error: 'Knowledge base not found' })

  try {
    const merged = { ...existing, ...updates, id, updated_at: Date.now() } as any
    // Preserve items from store (client may send stale/empty items)
    if (!Array.isArray(updates.items)) {
      merged.items = (existing as any).items || []
    }
    knowledgeBaseStore.update(merged)
    res.json(merged)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

// Delete knowledge base
router.delete('/:id', async (req, res) => {
  const { id } = req.params as { id: string }

  try {
    // Best-effort vector DB cleanup; ignore errors (e.g. missing API key)
    try {
      await knowledgeService.delete(null, id)
    } catch (ragError) {
      console.warn(`[KnowledgeDelete] Vector DB cleanup failed (non-fatal) for KB ${id}:`, (ragError as Error).message)
    }
    knowledgeBaseStore.delete(id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

// Upload file to knowledge base
router.post('/:id/upload', upload.single('file'), async (req, res) => {
  const { id } = req.params as { id: string }
  const file = req.file

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  // Fix multer Latin-1 encoding issue: browsers send filenames as UTF-8 bytes
  // but multer's Content-Disposition parser interprets them as Latin-1, causing mojibake.
  const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8')

  const bodyBase = (() => {
    const raw = (req as any).body?.base
    if (!raw) return undefined
    try {
      return JSON.parse(raw)
    } catch {
      return undefined
    }
  })()

  const base = knowledgeBaseStore.get(id) || bodyBase
  if (!base) return res.status(404).json({ error: 'Knowledge base not found' })

  try {
    // Move file to storage
    const storageDir = fileStorage.getStorageDir()
    const ext = path.extname(originalName)
    const fileId = uuidv4()
    const destPath = path.join(storageDir, fileId + ext)

    await fs.promises.rename(file.path, destPath)

    const fileMetadata = {
      id: fileId,
      name: originalName,
      origin_name: originalName,
      path: destPath,
      size: file.size,
      ext: ext,
      type: 'file', // TODO: determine type
      created_at: new Date().toISOString()
    }

    const item = {
      id: uuidv4(),
      type: 'file',
      content: fileMetadata,
      created_at: Date.now(),
      updated_at: Date.now(),
      uniqueId: fileId,
      uniqueIds: [fileId]
    }

    // Add to RAG
    const baseParams = await getKnowledgeBaseParams(bodyBase || base)
    console.log(
      '[KnowledgeUpload] baseParams:',
      JSON.stringify({
        id: baseParams.id,
        model: baseParams.embedApiClient?.model,
        provider: baseParams.embedApiClient?.provider,
        baseURL: baseParams.embedApiClient?.baseURL,
        hasApiKey: !!baseParams.embedApiClient?.apiKey && baseParams.embedApiClient.apiKey !== 'secret',
        dimensions: baseParams.dimensions
      })
    )
    if (!baseParams.embedApiClient?.apiKey || baseParams.embedApiClient.apiKey === 'secret') {
      return res.status(400).json({ error: 'Embedding apiKey is required for uploading documents' })
    }
    const loaderReturn = await knowledgeService.add(null, {
      base: baseParams,
      item: item as any
    })

    // Check if embedding actually succeeded
    if (loaderReturn && loaderReturn.status === 'failed') {
      console.error(
        '[KnowledgeUpload] Embedding failed:',
        loaderReturn.message,
        'source:',
        (loaderReturn as any).messageSource
      )
      return res.status(500).json({
        error: `Embedding failed: ${loaderReturn.message || 'Unknown embedding error'}`,
        messageSource: (loaderReturn as any).messageSource,
        item
      })
    }
    if (loaderReturn) {
      console.log(
        '[KnowledgeUpload] Embedding result:',
        JSON.stringify({
          entriesAdded: loaderReturn.entriesAdded,
          uniqueId: loaderReturn.uniqueId,
          loaderType: loaderReturn.loaderType,
          status: loaderReturn.status
        })
      )
    }

    // Update store
    if (!Array.isArray((base as any).items)) (base as any).items = []
    ;(base as any).items.push(item as any)
    if (knowledgeBaseStore.get(id)) {
      knowledgeBaseStore.update(base)
    } else {
      knowledgeBaseStore.add({ ...(base as any), id } as any)
    }

    res.json({ ...item, loaderReturn })
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

// Remove item from knowledge base (delete vectors + remove from store)
router.post('/:id/remove', async (req, res) => {
  const { id } = req.params as { id: string }
  const { uniqueId, uniqueIds, base: requestBase } = req.body

  if (!uniqueId && (!uniqueIds || !Array.isArray(uniqueIds) || uniqueIds.length === 0)) {
    return res.status(400).json({ error: 'uniqueId or uniqueIds is required' })
  }

  const base = knowledgeBaseStore.get(id) || requestBase
  if (!base) return res.status(404).json({ error: 'Knowledge base not found' })

  // Try to remove vectors from RAG, but don't fail if embedding API is unavailable.
  // This allows deleting items that were never successfully embedded (e.g. missing API key).
  try {
    const baseParams = await getKnowledgeBaseParams(requestBase || base)
    await knowledgeService.remove(null, {
      uniqueId: uniqueId || '',
      uniqueIds: uniqueIds || [uniqueId],
      base: baseParams
    })
  } catch (ragError) {
    console.warn(`[KnowledgeRemove] Vector removal failed (non-fatal) for KB ${id}:`, (ragError as Error).message)
  }

  // Always remove the item from the KB store, regardless of vector deletion result
  try {
    const storedBase = knowledgeBaseStore.get(id)
    if (storedBase && Array.isArray((storedBase as any).items)) {
      const idsToRemove = new Set(uniqueIds || [uniqueId])
      ;(storedBase as any).items = (storedBase as any).items.filter((item: any) => !idsToRemove.has(item.uniqueId))
      knowledgeBaseStore.update(storedBase)
    }

    res.json({ success: true })
  } catch (error) {
    console.error(`[KnowledgeRemove] Failed to update store for KB ${id}:`, (error as Error).message)
    res.status(500).json({ error: (error as Error).message })
  }
})
// Search
router.post('/:id/search', async (req, res) => {
  const { id } = req.params as { id: string }
  const { query, base: requestBase } = req.body

  const base = knowledgeBaseStore.get(id) || requestBase
  if (!base) {
    return res.status(404).json({ error: 'Knowledge base not found' })
  }

  try {
    const baseParams = await getKnowledgeBaseParams(requestBase || base)
    console.log(
      '[KnowledgeSearch] baseParams:',
      JSON.stringify({
        id: baseParams.id,
        model: baseParams.embedApiClient?.model,
        provider: baseParams.embedApiClient?.provider,
        baseURL: baseParams.embedApiClient?.baseURL,
        hasApiKey: !!baseParams.embedApiClient?.apiKey && baseParams.embedApiClient.apiKey !== 'secret',
        dimensions: baseParams.dimensions,
        documentCount: baseParams.documentCount
      })
    )
    if (!baseParams.embedApiClient?.apiKey || baseParams.embedApiClient.apiKey === 'secret') {
      return res.status(400).json({ error: 'Embedding apiKey is required for searching knowledge base' })
    }
    const results = await knowledgeService.search(null, {
      base: baseParams,
      search: query
    })
    res.json(results)
  } catch (error: any) {
    const errMsg = error?.message || 'Unknown error'
    const errDetail = error?.response?.data || error?.cause || ''
    console.error(`[KnowledgeSearch] Search failed for KB ${id}, query="${query}": ${errMsg}`, errDetail)
    console.error('[KnowledgeSearch] Full error:', error)
    res
      .status(500)
      .json({ error: errMsg, detail: typeof errDetail === 'object' ? JSON.stringify(errDetail) : String(errDetail) })
  }
})

// Rerank
router.post('/:id/rerank', async (req, res) => {
  const { id } = req.params as { id: string }
  const { search, base: requestBase, results } = req.body

  const base = knowledgeBaseStore.get(id) || requestBase
  if (!base) return res.status(404).json({ error: 'Knowledge base not found' })

  try {
    const baseParams =
      requestBase && requestBase.embedApiClient ? requestBase : await getKnowledgeBaseParams(requestBase || base)

    if (!baseParams.embedApiClient?.apiKey || baseParams.embedApiClient.apiKey === 'secret') {
      return res.status(400).json({ error: 'Embedding apiKey is required for reranking' })
    }
    if (!baseParams.rerankApiClient) {
      return res.status(400).json({ error: 'Rerank model is required' })
    }

    const reranked = await knowledgeService.rerank(null, {
      search: search || '',
      base: baseParams,
      results: Array.isArray(results) ? results : []
    })
    res.json(reranked)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

// Test embedding configuration (diagnostic endpoint)
router.post('/test-embedding', async (req, res) => {
  const { base: requestBase } = req.body
  if (!requestBase?.embedApiClient) {
    return res.status(400).json({ error: 'embedApiClient is required' })
  }
  try {
    const baseParams = await getKnowledgeBaseParams(requestBase)
    console.log(
      '[KnowledgeTest] Testing embedding with:',
      JSON.stringify({
        model: baseParams.embedApiClient?.model,
        provider: baseParams.embedApiClient?.provider,
        baseURL: baseParams.embedApiClient?.baseURL,
        hasApiKey: !!baseParams.embedApiClient?.apiKey && baseParams.embedApiClient.apiKey !== 'secret',
        dimensions: baseParams.dimensions
      })
    )

    if (!baseParams.embedApiClient?.apiKey || baseParams.embedApiClient.apiKey === 'secret') {
      return res.status(400).json({ error: 'Embedding apiKey is required' })
    }

    const ragApplication = await knowledgeService.create(null, baseParams)
    // Try a test embedding
    const testResult = await knowledgeService.search(null, {
      base: baseParams,
      search: 'test'
    })
    res.json({ success: true, resultCount: testResult.length, message: 'Embedding API is working correctly' })
  } catch (error: any) {
    console.error('[KnowledgeTest] Embedding test failed:', error)
    res.status(500).json({
      success: false,
      error: error?.message || 'Unknown error',
      detail: error?.response?.data || error?.cause || ''
    })
  }
})

export default router
