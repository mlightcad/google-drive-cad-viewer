import {
  buildMlightcadEmbedUrl,
  EMBED_OPEN_TYPE,
  EMBED_READY_TYPE,
  getMlightcadEmbedOrigin
} from './mlightcadEmbed'

export class CadEmbedViewer {
  private host: HTMLElement
  private iframe: HTMLIFrameElement | null = null
  private embedReady = false
  private fileName = ''
  private buffer: ArrayBuffer | null = null
  private readonly embedOrigin = getMlightcadEmbedOrigin()
  private readonly onMessage = (event: MessageEvent) => {
    if (event.origin !== this.embedOrigin) return
    if (event.data?.type === EMBED_READY_TYPE) {
      this.embedReady = true
      this.sendDrawing()
    }
  }

  constructor(host: HTMLElement) {
    this.host = host
  }

  mount(): void {
    window.addEventListener('message', this.onMessage)
  }

  unmount(): void {
    window.removeEventListener('message', this.onMessage)
    this.clear()
  }

  clear(): void {
    this.embedReady = false
    this.fileName = ''
    this.buffer = null
    if (this.iframe) {
      this.iframe.remove()
      this.iframe = null
    }
  }

  open(fileName: string, buffer: ArrayBuffer): void {
    this.clear()
    this.fileName = fileName
    this.buffer = buffer

    const iframe = document.createElement('iframe')
    iframe.className = 'cad-embed'
    iframe.title = fileName
    iframe.allow = 'fullscreen'
    iframe.src = buildMlightcadEmbedUrl()
    this.host.appendChild(iframe)
    this.iframe = iframe
  }

  private sendDrawing(): void {
    const frame = this.iframe?.contentWindow
    if (!frame || !this.embedReady || !this.buffer) return

    frame.postMessage(
      {
        type: EMBED_OPEN_TYPE,
        filename: this.fileName,
        buffer: this.buffer
      },
      this.embedOrigin
    )
  }
}
