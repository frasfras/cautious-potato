import React, { useState, useEffect } from "react";
// import { Slider } from "@/components/ui/slider"; // or any slider component you’re using

const RacingLineVisualizer = ({ gpsPoints, trackImage }) => {
  // Load from localStorage or set defaults
  const [transform, setTransform] = useState(() => {
    const saved = localStorage.getItem("gpsTransform");
    return (
      saved
        ? JSON.parse(saved)
        : { a: 142000, e: -143000, c: 200, f: 600 } // adjust defaults
    );
  });

  // Save transform to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("gpsTransform", JSON.stringify(transform));
  }, [transform]);

  const gpsToPixel = (lat, lon) => {
    const { a, e, c, f } = transform;
    const pixelX = a * lon + c;
    const pixelY = e * lat + f;
    return { pixelX, pixelY };
  };

  // Convert gps points to pixel coords
  const mappedPoints = gpsPoints.map((p) => {
    const { pixelX, pixelY } = gpsToPixel(p.VBOX_Lat_Min, p.VBOX_Long_Minutes);
    return { x: pixelX, y: pixelY };
  });

  const linePoints = mappedPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const handleTransformChange = (key, value) => {
    setTransform((prev) => ({ ...prev, [key]: parseFloat(value) }));
  };

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center p-4">
      {/* Track background image */}
      <div className="relative w-[2056px] h-[1212px]">
        <img
          src={trackImage}
          alt="Track"
          className="absolute top-0 left-0 w-full h-full opacity-40"
        />
        <svg
          width="2056"
          height="1212"
          className="absolute top-0 left-0 overflow-visible"
        >
          {/* Glowing racing line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 12px #22d3ee)" }}
          />
          {/* Red dots */}
          {mappedPoints.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="6" fill="red" />
          ))}
        </svg>
      </div>

      {/* Sliders for tuning transform */}
      <div className="mt-4 bg-gray-900 p-4 rounded-lg shadow-lg w-[500px] space-y-4 text-white">
        <h2 className="text-lg font-semibold">Adjust Transform</h2>

         <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 10,
        }}
      >
        {["a", "e", "c", "f", "rotation"].map((k) => (
          <div key={k}>
            <label>
              {k}: {transform[k].toFixed(2)}
              <input
                type="range"
                min={k === "rotation" ? -180 : -500000}
                max={k === "rotation" ? 180 : 500000}
                step={k === "rotation" ? 0.5 : 500}
                value={transform[k]}
                onChange={(e) => handleTransformChange(k, e.target.value)}
                style={{ width: "100%" }}
              />
            </label>
          </div>
        ))}
      </div>
        {/* {Object.keys(transform).map((key) => (
          <div key={key}>
            <label className="block mb-1">{key}: {transform[key].toFixed(2)}</label>
            <Slider
              min={key === "a" || key === "e" ? 50000 : 0}
              max={key === "a" || key === "e" ? 200000 : 2000}
              step={10}
              value={[transform[key]]}
              onValueChange={([val]) => setTransform((prev) => ({ ...prev, [key]: val }))}
            />
          </div>
        ))} */}
      </div>
    </div>
  );
};

export default RacingLineVisualizer;
