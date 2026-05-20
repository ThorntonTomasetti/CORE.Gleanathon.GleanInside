import { reactive, onMounted, onUnmounted } from 'vue'
import type { PageContext } from '../types'

const HTML_LIMIT = 8000
const STRIP_TAGS = ['script', 'style', 'svg', 'noscript', 'link', 'meta', 'glean-helper']
const STRIP_ATTRS = ['class', 'style', 'data-v', 'aria-hidden']

const ALL_FIELDS = new Set(['url', 'pageTitle', 'html', 'activeView', 'metadata'])

function parseFields (setting?: string): Set<string> | null {
  if (!setting || setting === 'all') return ALL_FIELDS
  if (setting === 'false' || setting === 'none') return null
  const fields = new Set(setting.split(',').map(s => s.trim()).filter(s => ALL_FIELDS.has(s)))
  return fields.size ? fields : null
}

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

export function usePageContext (setting?: string) {
  const fields = parseFields(setting)
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
    if (!fields) return
    collectBrowserContext()
    if (fields.has('html')) collectHtmlSnippet()
    window.addEventListener('message', onHostMessage)
  })

  onUnmounted(() => {
    if (!fields) return
    window.removeEventListener('message', onHostMessage)
  })

  function snapshot (): PageContext | undefined {
    if (!fields) return undefined
    collectBrowserContext()
    if (fields.has('html')) collectHtmlSnippet()
    const out: PageContext = {}
    if (fields.has('url') && context.url) out.url = context.url
    if (fields.has('pageTitle') && context.pageTitle) out.pageTitle = context.pageTitle
    if (fields.has('html') && context.htmlSnippet) out.htmlSnippet = context.htmlSnippet
    if (fields.has('activeView') && context.activeView) out.activeView = context.activeView
    if (fields.has('metadata') && context.metadata && Object.keys(context.metadata).length) out.metadata = { ...context.metadata }
    return Object.keys(out).length ? out : undefined
  }

  return { context, snapshot }
}
