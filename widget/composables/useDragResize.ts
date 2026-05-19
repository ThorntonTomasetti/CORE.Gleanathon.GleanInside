import { computed, ref } from 'vue'

const DEFAULT_W = 368
const DEFAULT_H = 540
const MIN_W = 280
const MIN_H = 300

export function useDragResize () {
  const panelX = ref(-1)
  const panelY = ref(-1)
  const panelW = ref(DEFAULT_W)
  const panelH = ref(DEFAULT_H)
  const dragging = ref(false)

  const panelStyle = computed(() => {
    const w = `${panelW.value}px`
    const h = `${panelH.value}px`
    if (panelX.value < 0) return { right: '24px', bottom: '24px', width: w, height: h }
    return { left: `${panelX.value}px`, top: `${panelY.value}px`, width: w, height: h }
  })

  function initPosition () {
    if (panelX.value >= 0) return
    panelX.value = window.innerWidth - panelW.value - 24
    panelY.value = window.innerHeight - panelH.value - 24
  }

  function onDragStart (e: PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return
    initPosition()
    dragging.value = true
    const ox = e.clientX - panelX.value
    const oy = e.clientY - panelY.value

    function onMove (e: PointerEvent) {
      panelX.value = Math.max(0, Math.min(window.innerWidth - panelW.value, e.clientX - ox))
      panelY.value = Math.max(0, Math.min(window.innerHeight - panelH.value, e.clientY - oy))
    }
    function onUp () {
      dragging.value = false
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  function onResizeStart (e: PointerEvent) {
    e.preventDefault()
    initPosition()
    const sx = e.clientX
    const sy = e.clientY
    const sw = panelW.value
    const sh = panelH.value

    function onMove (e: PointerEvent) {
      panelW.value = Math.max(MIN_W, Math.min(window.innerWidth - panelX.value, sw + (e.clientX - sx)))
      panelH.value = Math.max(MIN_H, Math.min(window.innerHeight - panelY.value, sh + (e.clientY - sy)))
    }
    function onUp () {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  return { panelStyle, dragging, onDragStart, onResizeStart }
}
