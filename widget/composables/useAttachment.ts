import { ref } from 'vue'

export interface Attachment {
  name: string
  type: string
  data: string      // base64, no data URL prefix
  previewUrl: string  // full data URL for <img> src
}

export function useAttachment () {
  const attachment = ref<Attachment | null>(null)

  function onFileSelect (e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      attachment.value = {
        name: file.name,
        type: file.type,
        data: dataUrl.split(',')[1],
        previewUrl: dataUrl,
      }
    }
    reader.readAsDataURL(file)
    // reset input so the same file can be re-selected after clearing
    ;(e.target as HTMLInputElement).value = ''
  }

  function clearAttachment () {
    attachment.value = null
  }

  return { attachment, onFileSelect, clearAttachment }
}
