import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('a51-canvas')
export class A51Canvas extends LitElement {
  /**
   * Copy for the read the docs hint.
   */
  @property()
  docsHint = 'Click on the Vite and Lit logos to learn more'

  @property({ type: Number })
  count = 0

  render() {
    return html`
      <canvas width=500 height=500></canvas>
      <input type=file @change=${this.handleFileUpload} />
    `
  }

  private handleFileUpload(e: Event) {
    if (!(e.currentTarget instanceof HTMLInputElement)) return
    if (e.currentTarget.files === null) return

    const src = URL.createObjectURL(e.currentTarget.files[0])
    const img = new Image()
    img.onload = () => {
      const ctx = this.renderRoot.querySelector('canvas')?.getContext('2d')
      ctx?.drawImage(img, 0, 0)
    }
    img.src = src
  }


  static styles = css`
    :host {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'a51-canvas': A51Canvas
  }
}
