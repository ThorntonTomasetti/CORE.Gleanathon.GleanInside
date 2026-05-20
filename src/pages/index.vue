<template>
  <HelloWorld />
  <glean-helper app-id="gleaninside" agent-id="532b0e6b1e2b47feae7a373fca9fc1da" />
</template>

<script lang="ts" setup>
  import HelloWorld from '@/components/HelloWorld.vue'
  // Registers the <glean-helper> custom element. In production the widget
  // ships as a separate bundle (dist-widget/glean-helper.js) so any app can
  // embed it; here we import directly for HMR while developing the widget.
  import '../../widget'
</script>
