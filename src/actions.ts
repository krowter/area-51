export function createCanvasActions(
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

// TODO infer from ReturnType<typeof createCanvasActions>
export type CanvasDrawEvent =
  | {
      type: "blur";
      payload: [startX: number, startY: number, endX: number, endY: number];
    }
  | {
      type: "black-out";
      payload: [startX: number, startY: number, endX: number, endY: number];
    };
