import { useEffect, useRef } from 'react'
import { useAppDispatch } from '@renderer/store'
import { updateBases } from '@renderer/store/knowledge'
import { useAppSelector } from '@renderer/store'

const KnowledgeBaseLoader = () => {
  const dispatch = useAppDispatch()
  const localBases = useAppSelector((s) => s.knowledge.bases)
  const localBasesRef = useRef(localBases)
  const loadedRef = useRef(false)

  useEffect(() => {
    localBasesRef.current = localBases
  }, [localBases])
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true
    // @ts-ignore
    if (window.api.knowledgeBase.getAll) {
      // @ts-ignore
      window.api.knowledgeBase
        .getAll()
        .then((bases: any) => {
          const serverBases: any[] = Array.isArray(bases) ? bases : []
          // Server is the source of truth for KB metadata (name, model, isPublic, etc.)
          // Local Redux only wins for items (which track processing state)
          const merged: any[] = []
          const processedIds = new Set<string>()

          // Start with server bases as the foundation
          for (const sb of serverBases) {
            const lb = localBasesRef.current.find((b: any) => b?.id === sb?.id) as any
            if (lb) {
              merged.push({
                ...lb,
                ...sb,
                // Keep local items (they have processing state)
                items: Array.isArray(lb?.items) && lb.items.length > 0
                  ? lb.items
                  : Array.isArray(sb?.items) ? sb.items : []
              })
            } else {
              merged.push(sb)
            }
            processedIds.add(sb.id)
          }

          // Add any local-only bases (not on server)
          for (const lb of localBasesRef.current) {
            if (!processedIds.has((lb as any)?.id)) {
              merged.push(lb)
            }
          }

          dispatch(updateBases(merged as any))
        })
        .catch((err: any) => console.error('Failed to load knowledge bases', err))
    }
  }, [dispatch])
  return null
}

export default KnowledgeBaseLoader
