<template>
  <div class="root">
    <button
      v-if="!open"
      class="launcher"
      aria-label="Open helper chat"
      @click="open = true"
    >
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2a2 2 0 0 1 2 2v1h3a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-1.5l-2.8 2.8a1 1 0 0 1-1.4 0L8.5 18H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h3V4a2 2 0 0 1 2-2Zm-3 9a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 9 11Zm6 0a1.25 1.25 0 1 0 0 2.5A1.25 1.25 0 0 0 15 11Z"
        />
      </svg>
    </button>

    <div v-else class="panel" role="dialog" :aria-label="title">
      <header class="panel-header">
        <span class="panel-title">{{ title }}</span>
        <button class="icon-btn" aria-label="Close" @click="open = false">×</button>
      </header>

      <div ref="scroller" class="panel-body">
        <div v-if="messages.length === 0" class="empty">
          Ask me anything about this app.
        </div>
        <div
          v-for="(msg, i) in messages"
          :key="i"
          class="msg"
          :class="msg.role"
        >
          <div class="bubble">{{ msg.text }}</div>
          <div v-if="msg.citations && msg.citations.length" class="citations">
            <a
              v-for="(c, ci) in msg.citations"
              :key="ci"
              class="chip"
              :href="c.url"
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

      <form class="panel-input" @submit.prevent="send">
        <input
          v-model="draft"
          :disabled="pending"
          placeholder="Type a question…"
          autocomplete="off"
        />
        <button type="submit" :disabled="pending || !draft.trim()">Send</button>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { nextTick, ref, watch } from 'vue'
  import { postChat } from './api'
  import type { ChatMessage } from './types'

  const props = defineProps<{
    appId: string
    apiUrl?: string
    title?: string
    agentId?: string
  }>()

  const apiUrl = () => props.apiUrl || '/api/chat'
  const title = props.title || 'Helper'

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
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  .root { color: #1a1a1a; }
  .launcher {
    position: fixed;
    right: 20px;
    bottom: 20px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    background: #4f46e5;
    color: white;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483646;
    transition: transform 0.15s ease;
  }
  .launcher:hover { transform: scale(1.05); }
  .panel {
    position: fixed;
    right: 20px;
    bottom: 20px;
    width: 360px;
    height: 520px;
    max-width: calc(100vw - 40px);
    max-height: calc(100vh - 40px);
    background: white;
    border-radius: 12px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.22);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    z-index: 2147483647;
  }
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: #4f46e5;
    color: white;
  }
  .panel-title { font-weight: 600; font-size: 14px; }
  .icon-btn {
    background: transparent;
    border: none;
    color: white;
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
    padding: 0 4px;
  }
  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 12px 14px;
    background: #f7f7fb;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .empty { color: #888; font-size: 13px; text-align: center; margin-top: 24px; }
  .msg { display: flex; flex-direction: column; gap: 4px; }
  .msg.user { align-items: flex-end; }
  .msg.assistant { align-items: flex-start; }
  .bubble {
    max-width: 85%;
    padding: 8px 12px;
    border-radius: 12px;
    font-size: 14px;
    line-height: 1.4;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  .msg.user .bubble { background: #4f46e5; color: white; border-bottom-right-radius: 4px; }
  .msg.assistant .bubble { background: white; color: #1a1a1a; border: 1px solid #e5e5ef; border-bottom-left-radius: 4px; }
  .citations { display: flex; flex-wrap: wrap; gap: 4px; }
  .chip {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    background: #ece9ff;
    color: #4f46e5;
    text-decoration: none;
    border: 1px solid #d8d2ff;
  }
  .chip:hover { background: #ddd6ff; }
  .typing { display: inline-flex; gap: 4px; }
  .typing span {
    width: 6px; height: 6px; border-radius: 50%; background: #aaa;
    animation: blink 1.2s infinite;
  }
  .typing span:nth-child(2) { animation-delay: 0.2s; }
  .typing span:nth-child(3) { animation-delay: 0.4s; }
  @keyframes blink { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }
  .error { color: #b00020; font-size: 12px; padding: 6px 8px; background: #fde7e9; border-radius: 6px; }
  .panel-input { display: flex; gap: 8px; padding: 10px; background: white; border-top: 1px solid #e5e5ef; }
  .panel-input input {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid #d4d4dc;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
  }
  .panel-input input:focus { border-color: #4f46e5; }
  .panel-input button {
    padding: 8px 14px;
    border: none;
    background: #4f46e5;
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
  }
  .panel-input button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
