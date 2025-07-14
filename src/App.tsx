import { useEffect, useRef, useState } from "react";
import "./App.css";
import { InputController } from "./InputController";
import type { InputState } from "./InputController";

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<InputController | null>(null);
  const [currentState, setCurrentState] = useState<InputState>("idle");

  useEffect(() => {
    if (!canvasRef.current) return;

    controllerRef.current = new InputController(
      canvasRef.current,
      setCurrentState
    );

    return () => {
      controllerRef.current?.cleanup();
    };
  }, []);

  return (
    <>
      <h1>Multi-Touch Input Controller</h1>
      <div className="canvas-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{
            border: "1px solid #ccc",
            touchAction: "none", // Prevents default touch behaviors
          }}
        />
        <div className="state-display">Current State: {currentState}</div>
      </div>
    </>
  );
}

export default App;
