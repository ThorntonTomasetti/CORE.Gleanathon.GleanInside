import { marked } from 'marked'
import DOMPurify from 'dompurify'

marked.use({ breaks: true, gfm: true })

export function useMarkdown () {
  function renderMarkdown (text: string): string {
    return DOMPurify.sanitize(marked.parse(text) as string)
  }

  return { renderMarkdown }
}
