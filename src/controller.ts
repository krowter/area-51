import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { controllerCensorOption } from "./symbols";
import { type A51Canvas } from "./canvas";

@customElement("a51-controller")
export class A51Controller extends LitElement {
  canvas: A51Canvas | undefined;

  constructor() {
    super();
    this.canvas = document.querySelector("a51-canvas") as A51Canvas;
    if (this.canvas === undefined) throw new Error("canvas is undefined");
    window[controllerCensorOption] = "black-out";
  }
  private handleCensorChange(
    e: FormDataEvent & { currentTarget: HTMLFormElement }
  ) {
    const censorOption = new FormData(e.currentTarget).get("censor-option");

    if (censorOption === "blur" || censorOption === "black-out") {
      window[controllerCensorOption] = censorOption;
    }
  }

  undo() {
    if (this.canvas === undefined) throw new Error("canvas is undefined");
    this.canvas.undo();
  }

  redo() {
    if (this.canvas === undefined) throw new Error("canvas is undefined");
    this.canvas.redo();
  }

  handleUpload(e: Event & { currentTarget: HTMLFormElement }) {
    if (this.canvas === undefined) throw new Error("canvas is undefined");
    this.canvas.handleUpload(e);
  }

  handleDownload() {
    if (this.canvas === undefined) throw new Error("canvas is undefined");
    this.canvas.handleDownload();
  }

  render() {
    return html`
      <input type="file" @change=${this.handleUpload} />
      <button @click=${this.undo}>Undo</button>
      <button @click=${this.redo}>Redo</button>
      <button @click=${this.handleDownload}>Download</button>
      <form @change=${this.handleCensorChange}>
        <label>
          <input
            type="radio"
            name="censor-option"
            value="black-out"
            checked="checked"
          />
          Black out
        </label>
        <label>
          <input type="radio" name="censor-option" value="blur" />
          Blur
        </label>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "a51-controller": A51Controller;
  }
}
