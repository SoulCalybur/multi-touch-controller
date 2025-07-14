export class InputController {
  private canvas: HTMLCanvasElement;
  private activePointers: Map<number, Point>;
  private currentState: InputState;
  private holdTimeout: number | null;
  private initialPoints: Point[];
  private lastPoints: Point[];
  private onStateChange?: (state: InputState) => void;

  constructor(
    canvas: HTMLCanvasElement,
    onStateChange?: (state: InputState) => void
  ) {
    this.canvas = canvas;
    this.activePointers = new Map();
    this.currentState = "idle";
    this.holdTimeout = null;
    this.initialPoints = [];
    this.lastPoints = [];
    this.onStateChange = onStateChange;

    console.log("InputController initialized");

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointerup", this.handlePointerUp);
    this.canvas.addEventListener("pointercancel", this.handlePointerUp);
  }

  private setState(state: InputState) {
    if (this.currentState !== state) {
      this.currentState = state;
      if (this.onStateChange) this.onStateChange(state);
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    console.log("Pointer down:", e.pointerId, e.button, e.buttons);

    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);

    const rect = this.canvas.getBoundingClientRect();
    const point: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: e.pointerId,
    };
    this.activePointers.set(e.pointerId, point);

    if (this.activePointers.size === 1) {
      this.initialPoints = [point];
      this.lastPoints = [point];
      this.startHoldTimer();
      this.setState("tap");
      console.log("State changed to tap");
    } else if (this.activePointers.size === 2) {
      this.cancelHoldTimer();
      this.initialPoints = Array.from(this.activePointers.values());
      this.lastPoints = [...this.initialPoints];
      this.determineGesture();
    }
    this.drawPointers();
  };

  private handlePointerMove = (e: PointerEvent) => {
    console.log("Pointer move:", e.pointerId, "buttons: ", e.button, e.buttons);

    e.preventDefault();
    if (!this.activePointers.has(e.pointerId)) return;

    const rect = this.canvas.getBoundingClientRect();
    const point: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: e.pointerId,
    };
    this.activePointers.set(e.pointerId, point);

    if (this.activePointers.size === 1) {
      if (this.currentState === "idle" && e.buttons === 0) {
        console.log("hover detected");
      }
      if (this.currentState === "tap") {
        const initialPoint = this.initialPoints[0];
        const distance = Math.hypot(
          point.x - initialPoint.x,
          point.y - initialPoint.y
        );
        if (distance > 10) {
          this.cancelHoldTimer();
          this.setState("oneFingerRotation");
        }
      }
    } else if (this.activePointers.size === 2) {
      this.determineGesture();
    }

    this.lastPoints = Array.from(this.activePointers.values());
    this.drawPointers();
  };

  private handlePointerUp = (e: PointerEvent) => {
    e.preventDefault();
    this.canvas.releasePointerCapture(e.pointerId);
    this.activePointers.delete(e.pointerId);
    this.cancelHoldTimer();

    if (this.activePointers.size === 0) {
      this.setState("idle");
      console.log("State changed to idle");
    }
    this.drawPointers();
  };

  private startHoldTimer() {
    this.cancelHoldTimer();
    this.holdTimeout = window.setTimeout(() => {
      if (this.currentState === "tap") {
        this.setState("tapAndHold");
      }
    }, 500);
  }

  private cancelHoldTimer() {
    if (this.holdTimeout !== null) {
      clearTimeout(this.holdTimeout);
      this.holdTimeout = null;
    }
  }

  private determineGesture() {
    if (this.activePointers.size !== 2) return;

    const points = Array.from(this.activePointers.values());
    const lastPoints = this.lastPoints;

    // Calculate the change in distance between points to detect pinch/zoom
    const currentDist = Math.hypot(
      points[1].x - points[0].x,
      points[1].y - points[0].y
    );
    const lastDist = Math.hypot(
      lastPoints[1].x - lastPoints[0].x,
      lastPoints[1].y - lastPoints[0].y
    );

    // Calculate movement of midpoint to detect panning
    const currentMidX = (points[1].x + points[0].x) / 2;
    const currentMidY = (points[1].y + points[0].y) / 2;
    const lastMidX = (lastPoints[1].x + lastPoints[0].x) / 2;
    const lastMidY = (lastPoints[1].y + lastPoints[0].y) / 2;
    const panDistance = Math.hypot(
      currentMidX - lastMidX,
      currentMidY - lastMidY
    );

    // Determine if this is primarily a pinch/zoom or pan gesture
    const distanceDiff = Math.abs(currentDist - lastDist);

    if (distanceDiff > panDistance) {
      this.setState("twoFingerPinchZoom");
    } else {
      this.setState("twoFingerPan");
    }
  }

  private drawPointers() {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const pointer of this.activePointers.values()) {
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 24, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(0, 128, 255, 0.4)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0078ff";
      ctx.stroke();
      ctx.font = "16px monospace";
      ctx.fillStyle = "#0078ff";
      ctx.fillText(`ID: ${pointer.id}`, pointer.x + 28, pointer.y + 6);
    }
  }

  public getCurrentState(): InputState {
    return this.currentState;
  }

  public cleanup() {
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
    this.canvas.removeEventListener("pointercancel", this.handlePointerUp);
  }
}
export type InputState =
  | "idle"
  | "tap"
  | "tapAndHold"
  | "oneFingerRotation"
  | "twoFingerPan"
  | "twoFingerPinchZoom";
export type Point = {
  x: number;
  y: number;
  id: number;
};
