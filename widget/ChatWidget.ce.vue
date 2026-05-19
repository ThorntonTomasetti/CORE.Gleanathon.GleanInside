<template>
  <div class="root">
    <button
      v-if="!open"
      class="launcher"
      aria-label="Open Glean helper"
      @click="open = true"
    >
      <!-- Glean G logomark -->
      <svg viewBox="-2 25 92 112" width="26" height="26" aria-hidden="true" fill="white">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M50.3849 39.9032L60.3505 27.2256L72.4436 36.6161L62.5509 49.201C67.6576 55.2704 70.7312 63.0876 70.7312 71.6184C70.7312 90.93 54.9802 106.585 35.5502 106.585C16.1202 106.585 0.369141 90.9299 0.369141 71.6184C0.369141 52.307 16.1202 36.6519 35.5502 36.6519C40.8505 36.6519 45.8771 37.8168 50.3849 39.9032ZM35.5502 91.5675C24.465 91.5675 15.4787 82.636 15.4787 71.6184C15.4787 60.6009 24.465 51.6693 35.5502 51.6693C46.6354 51.6693 55.6217 60.6009 55.6217 71.6184C55.6217 82.636 46.6354 91.5675 35.5502 91.5675ZM71.1406 101.532C70.2693 102.558 69.351 103.537 68.3926 104.489C67.4341 105.435 66.4354 106.341 65.3965 107.201C64.3643 108.06 63.2919 108.873 62.1792 109.639C61.0733 110.405 59.9272 111.131 58.7542 111.797C57.588 112.47 56.3882 113.083 55.1616 113.649C53.9417 114.216 52.6951 114.729 51.4216 115.181C50.1548 115.641 48.8679 116.041 47.5541 116.381C46.2605 116.734 44.9402 117.02 43.6063 117.247C42.2859 117.48 40.9454 117.653 39.5915 117.766C38.2576 117.88 36.9104 117.939 35.5498 117.939C34.1892 117.939 32.842 117.88 31.5082 117.766C30.1542 117.653 28.8137 117.48 27.4933 117.247C26.1595 117.02 24.8391 116.734 23.5455 116.381L19.5976 131.023C21.3135 131.483 23.0696 131.869 24.8458 132.176C26.5951 132.482 28.378 132.715 30.181 132.862C31.9505 133.015 33.7401 133.095 35.5498 133.095C37.3595 133.095 39.1491 133.015 40.9186 132.862C42.7216 132.715 44.4978 132.482 46.2539 132.176C48.03 131.869 49.7794 131.483 51.502 131.023C53.2447 130.57 54.9606 130.037 56.6362 129.424C58.3319 128.818 59.9875 128.139 61.6095 127.386C63.2383 126.633 64.8335 125.814 66.3818 124.928C67.9368 124.035 69.4516 123.076 70.9194 122.05C72.394 121.031 73.8217 119.951 75.1957 118.805C76.5764 117.66 77.9035 116.46 79.1703 115.201C80.4438 113.942 81.657 112.637 82.8166 111.271C83.9761 109.912 85.0753 108.493 86.1075 107.034L73.6206 98.3406C72.8431 99.4398 72.012 100.506 71.1406 101.532Z"/>
      </svg>
    </button>

    <div v-else class="panel" :class="{ dragging }" role="dialog" :aria-label="title" :style="panelStyle">
      <header class="panel-header" @pointerdown="onDragStart">
        <div class="header-brand">
          <svg viewBox="-2 25 92 112" width="16" height="16" aria-hidden="true" fill="white">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M50.3849 39.9032L60.3505 27.2256L72.4436 36.6161L62.5509 49.201C67.6576 55.2704 70.7312 63.0876 70.7312 71.6184C70.7312 90.93 54.9802 106.585 35.5502 106.585C16.1202 106.585 0.369141 90.9299 0.369141 71.6184C0.369141 52.307 16.1202 36.6519 35.5502 36.6519C40.8505 36.6519 45.8771 37.8168 50.3849 39.9032ZM35.5502 91.5675C24.465 91.5675 15.4787 82.636 15.4787 71.6184C15.4787 60.6009 24.465 51.6693 35.5502 51.6693C46.6354 51.6693 55.6217 60.6009 55.6217 71.6184C55.6217 82.636 46.6354 91.5675 35.5502 91.5675ZM71.1406 101.532C70.2693 102.558 69.351 103.537 68.3926 104.489C67.4341 105.435 66.4354 106.341 65.3965 107.201C64.3643 108.06 63.2919 108.873 62.1792 109.639C61.0733 110.405 59.9272 111.131 58.7542 111.797C57.588 112.47 56.3882 113.083 55.1616 113.649C53.9417 114.216 52.6951 114.729 51.4216 115.181C50.1548 115.641 48.8679 116.041 47.5541 116.381C46.2605 116.734 44.9402 117.02 43.6063 117.247C42.2859 117.48 40.9454 117.653 39.5915 117.766C38.2576 117.88 36.9104 117.939 35.5498 117.939C34.1892 117.939 32.842 117.88 31.5082 117.766C30.1542 117.653 28.8137 117.48 27.4933 117.247C26.1595 117.02 24.8391 116.734 23.5455 116.381L19.5976 131.023C21.3135 131.483 23.0696 131.869 24.8458 132.176C26.5951 132.482 28.378 132.715 30.181 132.862C31.9505 133.015 33.7401 133.095 35.5498 133.095C37.3595 133.095 39.1491 133.015 40.9186 132.862C42.7216 132.715 44.4978 132.482 46.2539 132.176C48.03 131.869 49.7794 131.483 51.502 131.023C53.2447 130.57 54.9606 130.037 56.6362 129.424C58.3319 128.818 59.9875 128.139 61.6095 127.386C63.2383 126.633 64.8335 125.814 66.3818 124.928C67.9368 124.035 69.4516 123.076 70.9194 122.05C72.394 121.031 73.8217 119.951 75.1957 118.805C76.5764 117.66 77.9035 116.46 79.1703 115.201C80.4438 113.942 81.657 112.637 82.8166 111.271C83.9761 109.912 85.0753 108.493 86.1075 107.034L73.6206 98.3406C72.8431 99.4398 72.012 100.506 71.1406 101.532Z"/>
          </svg>
          <span class="panel-title">{{ title }}</span>
        </div>
        <button class="icon-btn" aria-label="Close" @click="open = false">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </header>

      <div ref="scroller" class="panel-body">
        <div v-if="messages.length === 0" class="empty">
          <svg viewBox="-2 25 92 112" width="32" height="32" fill="#343CED" opacity="0.25" aria-hidden="true">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M50.3849 39.9032L60.3505 27.2256L72.4436 36.6161L62.5509 49.201C67.6576 55.2704 70.7312 63.0876 70.7312 71.6184C70.7312 90.93 54.9802 106.585 35.5502 106.585C16.1202 106.585 0.369141 90.9299 0.369141 71.6184C0.369141 52.307 16.1202 36.6519 35.5502 36.6519C40.8505 36.6519 45.8771 37.8168 50.3849 39.9032ZM35.5502 91.5675C24.465 91.5675 15.4787 82.636 15.4787 71.6184C15.4787 60.6009 24.465 51.6693 35.5502 51.6693C46.6354 51.6693 55.6217 60.6009 55.6217 71.6184C55.6217 82.636 46.6354 91.5675 35.5502 91.5675ZM71.1406 101.532C70.2693 102.558 69.351 103.537 68.3926 104.489C67.4341 105.435 66.4354 106.341 65.3965 107.201C64.3643 108.06 63.2919 108.873 62.1792 109.639C61.0733 110.405 59.9272 111.131 58.7542 111.797C57.588 112.47 56.3882 113.083 55.1616 113.649C53.9417 114.216 52.6951 114.729 51.4216 115.181C50.1548 115.641 48.8679 116.041 47.5541 116.381C46.2605 116.734 44.9402 117.02 43.6063 117.247C42.2859 117.48 40.9454 117.653 39.5915 117.766C38.2576 117.88 36.9104 117.939 35.5498 117.939C34.1892 117.939 32.842 117.88 31.5082 117.766C30.1542 117.653 28.8137 117.48 27.4933 117.247C26.1595 117.02 24.8391 116.734 23.5455 116.381L19.5976 131.023C21.3135 131.483 23.0696 131.869 24.8458 132.176C26.5951 132.482 28.378 132.715 30.181 132.862C31.9505 133.015 33.7401 133.095 35.5498 133.095C37.3595 133.095 39.1491 133.015 40.9186 132.862C42.7216 132.715 44.4978 132.482 46.2539 132.176C48.03 131.869 49.7794 131.483 51.502 131.023C53.2447 130.57 54.9606 130.037 56.6362 129.424C58.3319 128.818 59.9875 128.139 61.6095 127.386C63.2383 126.633 64.8335 125.814 66.3818 124.928C67.9368 124.035 69.4516 123.076 70.9194 122.05C72.394 121.031 73.8217 119.951 75.1957 118.805C76.5764 117.66 77.9035 116.46 79.1703 115.201C80.4438 113.942 81.657 112.637 82.8166 111.271C83.9761 109.912 85.0753 108.493 86.1075 107.034L73.6206 98.3406C72.8431 99.4398 72.012 100.506 71.1406 101.532Z"/>
          </svg>
          <p>Ask me anything about this app.</p>
        </div>
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="msg"
          :class="msg.role"
        >
          <div
            v-if="msg.role === 'assistant'"
            class="bubble markdown"
            v-html="renderMarkdown(msg.text)"
          ></div>
          <div v-else class="bubble">{{ msg.text }}</div>
          <div v-if="msg.citations && msg.citations.length" class="citations">
            <a
              v-for="(c, ci) in msg.citations"
              :key="ci"
              class="chip"
              :href="c.url || '#'"
              :title="c.snippet || ''"
              target="_blank"
              rel="noopener"
            >{{ c.title }}</a>
          </div>
        </div>
        <div v-if="pending" class="msg assistant">
          <div class="bubble typing"><span></span><span></span><span></span></div>
        </div>
        <div v-if="error" class="error">{{ error }}</div>
      </div>

      <div class="resize-grip" @pointerdown.stop="onResizeStart" aria-hidden="true">
        <svg viewBox="0 0 10 10" width="10" height="10" fill="currentColor">
          <path d="M9 1L1 9M9 5L5 9M9 9"/>
          <path d="M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M9 5L5 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>

      <form class="panel-input" @submit.prevent="send">
        <input
          v-model="draft"
          :disabled="pending"
          placeholder="Ask Glean…"
          autocomplete="off"
        />
        <button type="submit" :disabled="pending || !draft.trim()" aria-label="Send">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, nextTick, ref, watch } from 'vue'
  import { useDragResize } from './composables/useDragResize'
  import { useMarkdown } from './composables/useMarkdown'
  import { postChat } from './api'
  import type { ChatMessage } from './types'

  const props = defineProps<{
    appId: string
    apiUrl?: string
    title?: string
    agentId?: string
  }>()

  const apiUrl = () => props.apiUrl || '/api/chat'
  const title = computed(() => props.title || 'Glean Helper')

  const { panelStyle, dragging, onDragStart, onResizeStart } = useDragResize()
  const { renderMarkdown } = useMarkdown()

  const open = ref(false)
  const draft = ref('')
  const pending = ref(false)
  const error = ref<string | null>(null)
  const messages = ref<ChatMessage[]>([])
  const conversationId = ref<string | undefined>(undefined)
  const scroller = ref<HTMLElement | null>(null)

  watch(messages, async () => {
    await nextTick()
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  }, { deep: true })

  async function send () {
    const text = draft.value.trim()
    if (!text || pending.value) return
    if (!props.appId) {
      error.value = 'Missing app-id attribute on <glean-helper>.'
      return
    }
    error.value = null
    messages.value.push({ role: 'user', text })
    draft.value = ''
    pending.value = true
    try {
      const res = await postChat(apiUrl(), {
        appId: props.appId,
        message: text,
        conversationId: conversationId.value,
        agentId: props.agentId,
      })
      conversationId.value = res.conversationId
      messages.value.push({ role: 'assistant', text: res.answer, citations: res.citations })
    } catch (e: any) {
      error.value = e?.message || 'Something went wrong.'
    } finally {
      pending.value = false
    }
  }
</script>

<style>
  :host {
    all: initial;
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
  }

  /* ── Layout ── */
  .root { color: #1a1a2e; }

  /* ── Launcher button ── */
  .launcher {
    position: fixed;
    right: 24px;
    bottom: 24px;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: none;
    background: #343CED;
    color: white;
    box-shadow: 0 4px 16px rgba(52, 60, 237, 0.4);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483646;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .launcher:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 20px rgba(52, 60, 237, 0.5);
  }

  /* ── Panel ── */
  .panel {
    position: fixed;
    background: white;
    border-radius: 16px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 2147483647;
    user-select: none;
  }

  /* ── Header ── */
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: #343CED;
    color: white;
    flex-shrink: 0;
    cursor: grab;
  }
  .panel.dragging .panel-header { cursor: grabbing; }
  .header-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .panel-title {
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.01em;
  }
  .icon-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    padding: 2px;
    display: flex;
    align-items: center;
    border-radius: 4px;
    transition: color 0.1s;
  }
  .icon-btn:hover { color: white; }

  /* ── Body / messages ── */
  .panel-body {
    flex: 1;
    overflow-y: auto;
    user-select: text;
    padding: 16px;
    background: #f5f6ff;
    display: flex;
    flex-direction: column;
    gap: 12px;
    scrollbar-width: thin;
    scrollbar-color: #d0d3f5 transparent;
  }
  .panel-body::-webkit-scrollbar { width: 4px; }
  .panel-body::-webkit-scrollbar-thumb { background: #d0d3f5; border-radius: 4px; }

  /* ── Empty state ── */
  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #9899b8;
    font-size: 13px;
    text-align: center;
    margin: auto;
    padding: 32px 16px;
  }
  .empty p { margin: 0; }

  /* ── Message bubbles ── */
  .msg { display: flex; flex-direction: column; gap: 6px; }
  .msg.user { align-items: flex-end; }
  .msg.assistant { align-items: flex-start; }

  .bubble {
    max-width: 88%;
    padding: 10px 14px;
    border-radius: 14px;
    font-size: 13.5px;
    line-height: 1.55;
    word-wrap: break-word;
  }
  .msg.user .bubble {
    background: #343CED;
    color: white;
    border-bottom-right-radius: 4px;
    white-space: pre-wrap;
  }
  .msg.assistant .bubble {
    background: white;
    color: #1a1a2e;
    border: 1px solid #e4e5f7;
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  }

  /* ── Markdown styles (assistant bubbles only) ── */
  .bubble.markdown p { margin: 0 0 8px; }
  .bubble.markdown p:last-child { margin-bottom: 0; }
  .bubble.markdown ul,
  .bubble.markdown ol { margin: 0 0 8px; padding-left: 20px; }
  .bubble.markdown li { margin-bottom: 3px; }
  .bubble.markdown li:last-child { margin-bottom: 0; }
  .bubble.markdown strong { font-weight: 600; color: #111; }
  .bubble.markdown em { font-style: italic; }
  .bubble.markdown code {
    font-family: 'Fira Code', 'Cascadia Code', Consolas, monospace;
    font-size: 12px;
    background: #f0f1fb;
    border: 1px solid #e0e2f8;
    border-radius: 4px;
    padding: 1px 5px;
  }
  .bubble.markdown pre {
    background: #f0f1fb;
    border: 1px solid #e0e2f8;
    border-radius: 8px;
    padding: 10px 12px;
    overflow-x: auto;
    margin: 8px 0;
  }
  .bubble.markdown pre code {
    background: none;
    border: none;
    padding: 0;
    font-size: 12px;
  }
  .bubble.markdown h1,
  .bubble.markdown h2,
  .bubble.markdown h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 10px 0 4px;
    color: #1a1a2e;
  }
  .bubble.markdown h1:first-child,
  .bubble.markdown h2:first-child,
  .bubble.markdown h3:first-child { margin-top: 0; }
  .bubble.markdown a {
    color: #343CED;
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  .bubble.markdown hr {
    border: none;
    border-top: 1px solid #e4e5f7;
    margin: 8px 0;
  }
  .bubble.markdown blockquote {
    border-left: 3px solid #343CED;
    margin: 8px 0;
    padding: 4px 10px;
    color: #5a5b7a;
  }

  /* ── Citations ── */
  .citations { display: flex; flex-wrap: wrap; gap: 5px; max-width: 88%; }
  .chip {
    font-size: 11px;
    padding: 3px 9px;
    border-radius: 999px;
    background: #eceeff;
    color: #343CED;
    text-decoration: none;
    border: 1px solid #d5d8fa;
    transition: background 0.1s;
    white-space: nowrap;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .chip:hover { background: #dde0f8; }

  /* ── Typing indicator ── */
  .typing { display: inline-flex; gap: 5px; align-items: center; padding: 4px 2px; }
  .typing span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #9899b8;
    animation: blink 1.2s infinite;
  }
  .typing span:nth-child(2) { animation-delay: 0.2s; }
  .typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes blink {
    0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
    40% { opacity: 1; transform: scale(1); }
  }

  /* ── Error ── */
  .error {
    color: #c0152a;
    font-size: 12px;
    padding: 8px 10px;
    background: #fde8eb;
    border-radius: 8px;
    border: 1px solid #f5c2c9;
  }

  /* ── Resize grip ── */
  .resize-grip {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 20px;
    height: 20px;
    cursor: nwse-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #c0c2e8;
    z-index: 1;
  }
  .resize-grip:hover { color: #343CED; }

  /* ── Input area ── */
  .panel-input {
    display: flex;
    gap: 8px;
    padding: 12px;
    background: white;
    border-top: 1px solid #e4e5f7;
    flex-shrink: 0;
  }
  .panel-input input {
    flex: 1;
    padding: 9px 12px;
    border: 1.5px solid #e4e5f7;
    border-radius: 10px;
    font-size: 13.5px;
    font-family: inherit;
    outline: none;
    color: #1a1a2e;
    background: #f9f9ff;
    transition: border-color 0.15s;
  }
  .panel-input input::placeholder { color: #9899b8; }
  .panel-input input:focus { border-color: #343CED; background: white; }
  .panel-input button {
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border: none;
    background: #343CED;
    color: white;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, transform 0.1s;
  }
  .panel-input button:hover:not(:disabled) { background: #2530d4; }
  .panel-input button:active:not(:disabled) { transform: scale(0.95); }
  .panel-input button:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
