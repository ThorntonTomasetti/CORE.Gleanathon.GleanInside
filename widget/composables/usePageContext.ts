import { reactive, onMounted, onUnmounted } from 'vue'
import type { PageContext } from '../types'

const HTML_LIMIT = 8000
const STRIP_TAGS = ['script', 'style', 'svg', 'noscript', 'link', 'meta', 'glean-helper']
const STRIP_ATTRS = ['class', 'style', 'data-v', 'aria-hidden']

function sanitizeHtml (root: Element): string {
  const clone = root.cloneNode(true) as Element

  for (const tag of STRIP_TAGS) {
    clone.querySelectorAll(tag).forEach(el => el.remove())
  }

  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT)
  while (walker.nextNode()) {
    const el = walker.currentNode as Element
    const toRemove: string[] = []
    for (const attr of el.attributes) {
      if (STRIP_ATTRS.some(s => attr.name.startsWith(s))) toRemove.push(attr.name)
    }
    toRemove.forEach(a => el.removeAttribute(a))
  }

  return clone.innerHTML
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '>\n<')
    .trim()
    .slice(0, HTML_LIMIT)
}

export function usePageContext (enabled = true) {
  const context: PageContext = reactive({})

  function collectBrowserContext () {
    try {
      const hostDoc = window.parent?.document ?? document
      context.url = hostDoc.location?.href
      context.pageTitle = hostDoc.title || undefined
    } catch {
      context.url = window.location.href
      context.pageTitle = document.title || undefined
    }
  }

  function collectHtmlSnippet () {
    try {
      const hostDoc = window.parent?.document ?? document
      const target = hostDoc.querySelector('[data-glean-context]') || hostDoc.body
      if (target) {
        context.htmlSnippet = sanitizeHtml(target)
      }
    } catch { /* cross-origin — skip */ }
  }

  function onHostMessage (e: MessageEvent) {
    if (!e.data || typeof e.data !== 'object') return
    if (e.data.type !== 'glean-context') return

    const p = e.data.payload
    if (!p || typeof p !== 'object') return

    if (p.activeView) context.activeView = String(p.activeView)
    if (p.pageTitle) context.pageTitle = String(p.pageTitle)
    if (p.url) context.url = String(p.url)
    if (p.htmlSnippet) context.htmlSnippet = String(p.htmlSnippet).slice(0, HTML_LIMIT)
    if (p.metadata && typeof p.metadata === 'object') {
      context.metadata = { ...context.metadata }
      for (const [k, v] of Object.entries(p.metadata)) {
        context.metadata[k] = String(v)
      }
    }
  }

  onMounted(() => {
    if (!enabled) return
    collectBrowserContext()
    collectHtmlSnippet()
    window.addEventListener('message', onHostMessage)
  })

  onUnmounted(() => {
    if (!enabled) return
    window.removeEventListener('message', onHostMessage)
  })

  function snapshot (): PageContext | undefined {
    if (!enabled) return undefined
    collectBrowserContext()
    collectHtmlSnippet()
    const out: PageContext = {}
    if (context.url) out.url = context.url
    if (context.pageTitle) out.pageTitle = context.pageTitle
    if (context.htmlSnippet) out.htmlSnippet = context.htmlSnippet
    if (context.activeView) out.activeView = context.activeView
    if (context.metadata && Object.keys(context.metadata).length) out.metadata = { ...context.metadata }
    return Object.keys(out).length ? out : undefined
  }

  return { context, snapshot }
}
