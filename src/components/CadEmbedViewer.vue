<template>
  <iframe
    v-if="embedSrc"
    ref="frameRef"
    class="cad-embed"
    :src="embedSrc"
    :title="title"
    allow="fullscreen"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

import {
  buildMlightcadEmbedUrl,
  EMBED_OPEN_TYPE,
  EMBED_READY_TYPE,
  getMlightcadEmbedOrigin
} from '../utils/mlightcadEmbed'

const props = withDefaults(
  defineProps<{
    fileName: string
    buffer: ArrayBuffer | null
    title?: string
  }>(),
  {
    title: 'CAD drawing viewer'
  }
)

const frameRef = ref<HTMLIFrameElement | null>(null)
const embedReady = ref(false)
const embedSrc = ref('')
const embedOrigin = getMlightcadEmbedOrigin()

const sendDrawing = () => {
  const frame = frameRef.value?.contentWindow
  if (!frame || !embedReady.value || !props.buffer) return

  frame.postMessage(
    {
      type: EMBED_OPEN_TYPE,
      filename: props.fileName,
      buffer: props.buffer
    },
    embedOrigin
  )
}

const onMessage = (event: MessageEvent) => {
  if (event.origin !== embedOrigin) return
  if (event.data?.type === EMBED_READY_TYPE) {
    embedReady.value = true
    sendDrawing()
  }
}

// Parent remounts via :key on file change; this covers buffer updates on the same instance.
watch(() => props.buffer, sendDrawing)

onMounted(() => {
  window.addEventListener('message', onMessage)
  embedSrc.value = buildMlightcadEmbedUrl()
})

onUnmounted(() => {
  window.removeEventListener('message', onMessage)
})
</script>

<style scoped>
.cad-embed {
  width: 100%;
  height: 100%;
  min-height: 600px;
  border: 0;
  display: block;
  background: #111;
}
</style>
