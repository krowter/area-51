import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { controllerCensorOption } from './symbols'

@customElement('a51-canvas')
export class A51Canvas extends LitElement {
  isDragging = false
  startX = 0
  startY = 0
  endX = 0
  endY = 0

  imageCtx: CanvasRenderingContext2D | null = null
  image: HTMLCanvasElement | null = null
  overlayCtx: CanvasRenderingContext2D | null = null
  overlay: HTMLCanvasElement | null = null

  render() {
    return html`
      <input type=file @change=${this.handleFileUpload} />
      <button @click=${this.handleDownload}>Download</button>
      <div class=wrapper>
        <canvas class=overlay width=500 height=500></canvas>
        <canvas class=image width=500 height=500></canvas>
      </div>
    `
  }

  firstUpdated(): void {
    this.image = this.renderRoot.querySelector('.image')
    this.overlay = this.renderRoot.querySelector('.overlay')

    if (this.image === null) throw new Error('.image querySelector is null')
    if (this.overlay === null) throw new Error('.overlay querySelector is null')

    this.imageCtx = this.image.getContext('2d', { willReadFrequently: true })
    this.overlayCtx = this.overlay.getContext('2d')

    if (this.imageCtx === null) throw new Error('imageCtx is null')
    if (this.overlayCtx === null) throw new Error('overlayCtx is null')

    this.overlay.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.endX = e.offsetX;
      this.endY = e.offsetY;
      this.drawSelectionRect();
    });

    this.overlay.addEventListener('mousedown', (e) => {
      if (this.overlay === null) return;

      this.isDragging = true;
      var rect = this.overlay.getBoundingClientRect();
      this.startX = e.clientX - rect.left;
      this.startY = e.clientY - rect.top;
    });
    this.overlay.addEventListener('mouseup', (e) => {
      if (this.overlay === null) return;

      this.isDragging = false;
      var rect = this.overlay.getBoundingClientRect();
      const _endX = e.clientX - rect.left;
      const _endY = e.clientY - rect.top;

      if (_endX < this.startX) {
        this.endX = this.startX
        this.startX = _endX
      }
      if (_endY < this.startY) {
        this.endY = this.startY
        this.startY = _endY
      }
      this.clearSelectionRect();
    });

  }

  private handleFileUpload(e: Event & { currentTarget: HTMLFormElement }) {
    if (e.currentTarget.files === null) throw new Error('e.currentTarget.files is null')

    const src = URL.createObjectURL(e.currentTarget.files[0])
    const img = new Image()
    img.onload = () => {
      console.log(this.imageCtx)
      this.imageCtx?.drawImage(img, 0, 0)
    }
    img.src = src
  }

  private handleDownload() {
    if (this.image === null) throw new Error('this.image is null');
    document.write(`<img src="${this.image.toDataURL('image/png')}"/>`)
  }

  private drawSelectionRect() {
    if (this.overlayCtx === null || this.overlay === null) throw new Error('this.overlayCtx is null');

    this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);

    this.overlayCtx.strokeStyle = 'blue';
    this.overlayCtx.lineWidth = 2;
    this.overlayCtx.strokeRect(this.startX, this.startY, this.endX - this.startX, this.endY - this.startY);
  }

  private clearSelectionRect() {
    if (this.image === null) throw new Error('this.image is null');

    const latestCanvasImage = new Image()

    if (this.overlayCtx === null || this.overlay === null) throw new Error('this.overlayCtx is null');
    if (this.imageCtx === null || this.image === null) throw new Error('this.imageCtx is null');

    switch (window[controllerCensorOption]) {
      case 'black-out':
        this.imageCtx.rect(this.startX, this.startY, this.endX - this.startX, this.endY - this.startY);
        this.imageCtx.fill()
        break

      case 'blur':
        latestCanvasImage.onload = () => {
          if (this.imageCtx === null || this.image === null) throw new Error('this.imageCtx is null');

          this.imageCtx.filter = 'blur(5px)'

          const selectedArea = [this.startX, this.startY, this.endX - this.startX, this.endY - this.startY] as const

          this.imageCtx.drawImage(latestCanvasImage, ...selectedArea, ...selectedArea)

          this.imageCtx.filter = 'none'
        }
        latestCanvasImage.src = this.image.toDataURL()
        break

      default:
        window[controllerCensorOption] satisfies never
    }
  }

  static styles = css`
    .wrapper {
      position: relative;
    }

    .image {
      margin: 0 100% 0 0
    }

    .overlay {
      position: absolute;
      left: 0;
      top: 0;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'a51-canvas': A51Canvas
  }
}
