import { defineCustomElement } from 'vue'
import ChatWidget from './ChatWidget.ce.vue'

const GleanHelper = defineCustomElement(ChatWidget)

if (!customElements.get('glean-helper')) {
  customElements.define('glean-helper', GleanHelper)
}

export { GleanHelper }
