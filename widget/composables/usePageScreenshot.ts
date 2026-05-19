import domtoimage from 'dom-to-image-more'
import { ref } from 'vue'

export function usePageScreenshot () {
  const capturing = ref(false)

  async function captureScreenshot (panelEl: HTMLElement | null): Promise<{ name: string; type: string; data: string; previewUrl: string } | null> {
    capturing.value = true

    // Hide the widget panel so it doesn't appear in the capture
    if (panelEl) panelEl.style.visibility = 'hidden'

    try {
      const target = document.querySelector<HTMLElement>('[data-glean-context]') ?? document.body

      const dataUrl = await domtoimage.toPng(target, {
        quality: 0.92,
        // Skip the widget host element entirely
        filter: (node: Node) => !(node instanceof HTMLElement && node.tagName.toLowerCase() === 'glean-helper'),
      })

      const data = dataUrl.split(',')[1]

      return {
        name: `screenshot-${Date.now()}.png`,
        type: 'image/png',
        data,
        previewUrl: dataUrl,
      }
    } catch (err) {
      console.error('[usePageScreenshot] capture failed:', err)
      return null
    } finally {
      if (panelEl) panelEl.style.visibility = ''
      capturing.value = false
    }
  }

  return { capturing, captureScreenshot }
}
