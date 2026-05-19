import html2canvas from 'html2canvas'
import { ref } from 'vue'

export function usePageScreenshot () {
  const capturing = ref(false)

  async function captureScreenshot (panelEl: HTMLElement | null): Promise<{ name: string; type: string; data: string; previewUrl: string } | null> {
    capturing.value = true

    // Hide the widget panel so it doesn't appear in the capture
    if (panelEl) panelEl.style.visibility = 'hidden'

    try {
      const target = document.querySelector<HTMLElement>('[data-glean-context]') ?? document.body

      const canvas = await html2canvas(target, {
        useCORS: true,
        allowTaint: false,
        logging: false,
        // Capture only the visible portion of the target
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      })

      const dataUrl = canvas.toDataURL('image/png')
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
