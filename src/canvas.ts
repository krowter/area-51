import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { controllerCensorOption } from "./symbols";
import { type CanvasDrawEvent, createCanvasActions } from "./actions";
import { EventSource } from "./event-source";

@customElement("a51-canvas")
export class A51Canvas extends LitElement {
  isMouseDown = false;
  startX = 0;
  startY = 0;
  endX = 0;
  endY = 0;

  imageCtx: CanvasRenderingContext2D | null = null;
  image: HTMLCanvasElement | null = null;
  overlayCtx: CanvasRenderingContext2D | null = null;
  overlay: HTMLCanvasElement | null = null;

  eventSource: EventSource<CanvasDrawEvent> | undefined;

  render() {
    return html`
      <div class="wrapper">
        <canvas class="overlay" width="500" height="500"></canvas>
        <canvas class="image" width="500" height="500"></canvas>
      </div>
    `;
  }

  firstUpdated(): void {
    this.image = this.renderRoot.querySelector(".image");
    this.overlay = this.renderRoot.querySelector(".overlay");

    if (this.image === null) throw new Error(".image querySelector is null");
    if (this.overlay === null)
      throw new Error(".overlay querySelector is null");

    this.imageCtx = this.image.getContext("2d", { willReadFrequently: true });
    this.overlayCtx = this.overlay.getContext("2d");

    if (this.imageCtx === null) throw new Error("imageCtx is null");
    if (this.overlayCtx === null) throw new Error("overlayCtx is null");

    this.overlay.addEventListener("mousemove", (e) => {
      if (!this.isMouseDown) return;
      this.endX = e.offsetX;
      this.endY = e.offsetY;
      this.drawSelectionRect();
    });

    this.overlay.addEventListener("mousedown", (e) => {
      if (this.overlay === null || this.overlayCtx === null) return;

      this.isMouseDown = true;
      var rect = this.overlay.getBoundingClientRect();
      this.startX = e.clientX - rect.left;
      this.startY = e.clientY - rect.top;
    });

    this.overlay.addEventListener("mouseup", (e) => {
      if (this.overlay === null) return;

      this.isMouseDown = false;
      var rect = this.overlay.getBoundingClientRect();
      const _endX = e.clientX - rect.left;
      const _endY = e.clientY - rect.top;

      if (_endX < this.startX) {
        this.endX = this.startX;
        this.startX = _endX;
      }
      if (_endY < this.startY) {
        this.endY = this.startY;
        this.startY = _endY;
      }
      this.applyFilter();
    });

    const canvasActions = createCanvasActions(this.image, this.imageCtx);
    this.eventSource = new EventSource<CanvasDrawEvent>(canvasActions);
  }

  undo() {
    if (this.eventSource === undefined)
      throw new Error("this.eventSource is undefined");
    this.eventSource.undo();
  }

  redo() {
    if (this.eventSource === undefined)
      throw new Error("this.eventSource is undefined");
    this.eventSource.redo();
  }

  handleUpload(e: Event & { currentTarget: HTMLFormElement }) {
    if (e.currentTarget.files === null)
      throw new Error("e.currentTarget.files is null");

    const src = URL.createObjectURL(e.currentTarget.files[0]);
    const img = new Image();
    img.onload = () => {
      this.imageCtx?.drawImage(img, 0, 0);
    };
    img.src = src;

    if (this.eventSource === undefined)
      throw new Error("this.eventSource is undefined");

    this.eventSource.resetState = () => {
      if (this.imageCtx === null) throw new Error("this.imageCtx is null");

      this.imageCtx.drawImage(img, 0, 0);
    };
  }

  handleDownload() {
    if (this.image === null) throw new Error("this.image is null");
    document.write(`<img src="${this.image.toDataURL("image/png")}"/>`);
  }

  private drawSelectionRect() {
    if (this.overlayCtx === null || this.overlay === null)
      throw new Error("this.overlayCtx is null");

    this.overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);

    this.overlayCtx.strokeStyle = "blue";
    this.overlayCtx.lineWidth = 2;
    this.overlayCtx.strokeRect(
      this.startX,
      this.startY,
      this.endX - this.startX,
      this.endY - this.startY
    );
  }

  private applyFilter() {
    if (this.eventSource === undefined)
      throw new Error("this.eventSource is undefined");

    switch (window[controllerCensorOption]) {
      case "black-out":
        return this.eventSource.append({
          type: "black-out",
          payload: [this.startX, this.startY, this.endX, this.endY],
        });
      case "blur":
        return this.eventSource.append({
          type: "blur",
          payload: [this.startX, this.startY, this.endX, this.endY],
        });
      default:
        window[controllerCensorOption] satisfies never; // exhaustive check
    }
  }

  static styles = css`
    .wrapper {
      position: relative;
    }

    .image {
      margin: 0 100% 0 0;
    }

    .overlay {
      cursor: crosshair;
      position: absolute;
      left: 0;
      top: 0;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "a51-canvas": A51Canvas;
  }
}
