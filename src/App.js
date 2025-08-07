import React, { useState } from "react";
import SurfaceRevolution from "./SurfaceRevolution";

function App() {
  const [func, setFunc] = useState("sin(x) + 2");
  const [axis, setAxis] = useState("x");
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  return (
    <div style={{ fontFamily: "sans-serif", padding: 20 }}>
      <h2>Surface of Revolution Visualizer</h2>
      <div style={{ marginBottom: 10 }}>
        <label>
          Function y = f(x):{" "}
          <input
            value={func}
            onChange={e => setFunc(e.target.value)}
            style={{ width: 150 }}
          />
        </label>
        <label style={{ marginLeft: 20 }}>
          Axis:{" "}
          <select value={axis} onChange={e => setAxis(e.target.value)}>
            <option value="x">x-axis</option>
            <option value="y">y-axis</option>
          </select>
        </label>
        <label style={{ marginLeft: 20 }}>
          Speed: <input type="range" min={0.1} max={3} step={0.01} value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: 120 }} />
          <span style={{ marginLeft: 8 }}>{speed.toFixed(2)}x</span>
        </label>
        <button
          style={{ marginLeft: 20 }}
          onClick={() => setPlaying(p => !p)}
        >
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <SurfaceRevolution func={func} axis={axis} playing={playing} speed={speed} />
      <div style={{ marginTop: 10, fontSize: 12, color: "#888" }}>
        Example functions: <code>sin(x) + 2</code>, <code>x^2</code>, <code>sqrt(x)</code>
      </div>
    </div>
  );
}

export default App;