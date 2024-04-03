import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { controllerCensorOption } from "./symbols";

function createCanvasActions(
  canvas: HTMLCanvasElement,
  canvasCtx: CanvasRenderingContext2D
) {
  return {
    blur: (startX: number, startY: number, endX: number, endY: number) => {
      const latestCanvasImage = new Image();
      latestCanvasImage.onload = () => {
        canvasCtx.filter = "blur(5px)";

        const selectedArea = [
          startX,
          startY,
          endX - startX,
          endY - startY,
        ] as const;

        canvasCtx.drawImage(
          latestCanvasImage,
          ...selectedArea,
          ...selectedArea
        );

        canvasCtx.filter = "none";
      };
      latestCanvasImage.src = canvas.toDataURL();
    },
    "black-out": (
      startX: number,
      startY: number,
      endX: number,
      endY: number
    ) => {
      canvasCtx.fillRect(startX, startY, endX - startX, endY - startY);
      canvasCtx.closePath();
    },
  };
}

type CanvasDrawEvent =
  | {
      type: "blur";
      payload: [startX: number, startY: number, endX: number, endY: number];
    }
  | {
      type: "black-out";
      payload: [startX: number, startY: number, endX: number, endY: number];
    };

class EventSource<EventItem extends { type: string; payload: unknown[] }> {
  events: EventItem[] = [];
  currentIndex = 0;

  constructor(
    private actionByType: Record<
      string,
      (...args: EventItem["payload"]) => void
    >
  ) {}

  resetState() {
    throw new Error("resetState not implemented.");
  }

  append(event: EventItem) {
    this.events[this.currentIndex++] = event;
    this.actionByType[event.type].apply(null, event.payload);
  }

  undo() {
    this.resetState();

    this.events
      .slice(0, this.currentIndex - 1)
      .forEach((event) =>
        this.actionByType[event.type].apply(null, event.payload)
      );

    this.currentIndex -= 1;
  }
}

@customElement("a51-canvas")
export class A51Canvas extends LitElement {
  isDragging = false;
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
      <input type="file" @change=${this.handleUpload} />
      <button @click=${this.undo}>Undo</button>
      <button @click=${this.handleDownload}>Download</button>
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
      if (!this.isDragging) return;
      this.endX = e.offsetX;
      this.endY = e.offsetY;
      this.drawSelectionRect();
    });

    this.overlay.addEventListener("mousedown", (e) => {
      if (this.overlay === null) return;

      this.isDragging = true;
      var rect = this.overlay.getBoundingClientRect();
      this.startX = e.clientX - rect.left;
      this.startY = e.clientY - rect.top;
    });

    this.overlay.addEventListener("mouseup", (e) => {
      if (this.overlay === null) return;

      this.isDragging = false;
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
      this.clearSelectionRect();
    });

    const canvasActions = createCanvasActions(this.image, this.imageCtx);
    this.eventSource = new EventSource<CanvasDrawEvent>(canvasActions);
  }

  private undo() {
    if (this.eventSource === undefined)
      throw new Error("this.eventSource is undefined");
    this.eventSource.undo();
  }

  private handleUpload(e: Event & { currentTarget: HTMLFormElement }) {
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

  private handleDownload() {
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

  private clearSelectionRect() {
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
        window[controllerCensorOption] satisfies never;
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
