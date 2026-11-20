import { useRef, useState, useEffect } from 'react'
import { useBlocker } from 'react-router-dom'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { friendlyError } from '../../shared/lib/rules'
export function useEditor(userId, editorKey = 'editor') {
  const [draft, setDraft] = useState(null),
    [order, setOrder] = useState(null),
    [processing, setProcessing] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const inFlight = useRef(false),
    cache = useQueryClient()
  const mutation = useMutation({
    mutationFn: (action) => action(),
    onSuccess: () =>
      Promise.all([
        cache.invalidateQueries({ queryKey: [editorKey, userId] }),
        cache.invalidateQueries({ queryKey: ['public'] }),
      ]),
  })
  const busy = mutation.isPending || processing
  const dirty = Boolean(draft?.changed)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (dirty || busy) && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (!dirty && !busy) return
    const guard = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [dirty, busy])
  async function run(action, { after, optimistic, retry } = {}) {
    if (inFlight.current || processing) return
    inFlight.current = true
    setFeedback(null)
    if (optimistic) setOrder(optimistic)
    try {
      const message = await mutation.mutateAsync(action)
      after?.()
      setFeedback({ message: typeof message === 'string' ? message : 'Perubahan tersimpan.' })
    } catch (error) {
      setFeedback({
        error: true,
        message: friendlyError(error),
        conflict: error.code === 'PT409',
        retry: retry && (() => run(action, { optimistic, retry })),
      })
    } finally {
      setOrder(null)
      inFlight.current = false
    }
  }
  function edit(next) {
    setFeedback(null)
    setDraft(next)
  }
  async function reload() {
    if (dirty && !window.confirm('Buang draft ini dan muat versi terbaru dari penyimpanan?')) return
    try {
      await cache.refetchQueries({ queryKey: [editorKey, userId] }, { throwOnError: true })
      setDraft(null)
      setFeedback({ message: 'Versi terbaru dimuat.' })
    } catch {
      setFeedback({
        error: true,
        message: 'Versi terbaru gagal dimuat. Coba lagi.',
        conflict: true,
      })
    }
  }
  return {
    draft,
    edit,
    order,
    run,
    reload,
    feedback,
    dirty,
    busy,
    processing,
    setProcessing,
    blocker,
  }
}
