import React, { useState, useEffect } from "react";
import Papa from "papaparse";

export default function RacingLineVisualizer() {
  const [points, setPoints] = useState([]);
  const [transform, setTransform] = useState({
    a: 142000,  // X scale
    e: -300, // Y scale (usually negative)
    c: 200,     // X offset
    f: 600,     // Y offset
    rotation: 0 // Rotation in degrees
  });

  // 👇 NEW: Visibility toggles
  const [showLine, setShowLine] = useState(true);
  const [showDots, setShowDots] = useState(true);
  const [showTrack, setShowTrack] = useState(true);

  
  // ✅ Convert lat/lon → pixel with scaling + offset + rotation
  const gpsToPixel = (lat, lon, minLat, minLon, center) => {
    const x = (lon - minLon) * transform.a;
    const y = (lat - minLat) * transform.e;

    const rad = (transform.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const rotatedX = cos * (x - center.x) - sin * (y - center.y) + center.x;
    const rotatedY = sin * (x - center.x) + cos * (y - center.y) + center.y;

    return { pixelX: rotatedX + transform.c, pixelY: rotatedY + transform.f };
  };

  

  // ✅ Parse CSV and group telemetry by timestamp
  useEffect(() => {
    Papa.parse("/lap_2.csv", {
      header: true,
      download: true,
      complete: (result) => {
        const rows = result.data.filter(
          (r) =>
            r.telemetry_name &&
            r.telemetry_value &&
            r.timestamp &&
            r.telemetry_name.startsWith("VBOX_")
        );

        const grouped = {};
        for (const row of rows) {
          const t = row.timestamp;
          if (!grouped[t]) grouped[t] = {};
          grouped[t][row.telemetry_name] = parseFloat(row.telemetry_value);
        }

        // const gpsPoints = Object.values(grouped)
        //   .filter(
        //     (g) =>
        //       g.VBOX_Lat_Min !== undefined && g.VBOX_Long_Minutes !== undefined
        //   )
        //   .map((g) => ({
        //     lat: g.VBOX_Lat_Min,
        //     lon: g.VBOX_Long_Minutes
        //   }));
        const gpsPoints = Object.entries(grouped)
        .map(([timestamp, g]) => ({
            timestamp,
            lat: g.VBOX_Lat_Min,
            lon: g.VBOX_Long_Minutes
        }))
        .filter((p) => p.lat !== undefined && p.lon !== undefined)
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));


        console.log("✅ Parsed GPS points:", gpsPoints.length);
        setPoints(gpsPoints);
      },
    });
  }, []);

  if (points.length === 0) return <div>Loading or no GPS data...</div>;

  // Base references
  const minLat = Math.min(...points.map((p) => p.lat));
  const minLon = Math.min(...points.map((p) => p.lon));
  const maxLat = Math.max(...points.map((p) => p.lat));
  const maxLon = Math.max(...points.map((p) => p.lon));

  // Compute center for rotation
  const center = {
    x: ((maxLon - minLon) * transform.a) / 2,
    y: ((maxLat - minLat) * transform.e) / 2,
  };

  // Build polyline points
  const linePoints = points
    .map(({ lat, lon }) => {
      const { pixelX, pixelY } = gpsToPixel(lat, lon, minLat, minLon, center);
      return `${pixelX},${pixelY}`;
    })
    .join(" ");

  const handleTransformChange = (key, value) => {
    setTransform((prev) => ({ ...prev, [key]: parseFloat(value) }));
  };

  return (
    <div
      style={{
        background: "#0d1117",
        color: "#fff",
        minHeight: "100vh",
        padding: 20,
      }}
    >
      <h2>Racing Line Visualizer</h2>
      <p>{points.length} GPS points</p>

      {/* 🎛 Visibility Toggles */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ marginRight: 10 }}>
          <input
            type="checkbox"
            checked={showTrack}
            onChange={() => setShowTrack(!showTrack)}
          />{" "}
          Show Track Image
        </label>
        <label style={{ marginRight: 10 }}>
          <input
            type="checkbox"
            checked={showLine}
            onChange={() => setShowLine(!showLine)}
          />{" "}
          Show Racing Line
        </label>
        <label>
          <input
            type="checkbox"
            checked={showDots}
            onChange={() => setShowDots(!showDots)}
          />{" "}
          Show GPS Points
        </label>
      </div>

      {/* 🔧 Sliders for transform */}
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
                step={k === "rotation" ? 0.5 : 200}
                value={transform[k]}
                onChange={(e) => handleTransformChange(k, e.target.value)}
                style={{ width: "100%" }}
              />
            </label>
          </div>
        ))}
      </div>

      {/* 🏁 SVG Layer */}
      <div style={{ marginTop: 20, position: "relative" }}>
        <svg
          width="100%"
          height="800"
          viewBox="0 0 2000 800"
          style={{
            background: "#000",
            border: "1px solid #333",
            display: "block",
          }}
        >
            
          {/* 🔲 Alignment Grid */}
          <defs>
            <pattern
              id="smallGrid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="#222"
                strokeWidth="0.5"
              />
            </pattern>
            <pattern
              id="grid"
              width="500"
              height="500"
              patternUnits="userSpaceOnUse"
            >
              <rect width="500" height="500" fill="url(#smallGrid)" />
              <path
                d="M 500 0 L 0 0 0 500"
                fill="none"
                stroke="#444"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* 🏎️ Track Background */}
          <image
            href="/track.png"
            x="0"
            y="0"
            width="100%"
            height="800"
            opacity="0.35"
            preserveAspectRatio="xMidYMid meet"
          />

          {/* 💡 Racing Line */}
          <polyline
            points={linePoints}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 8px #00ffff)" }}
          />

          {/* 🔴 Points */}
          {points.map(({ lat, lon }, i) => {
            const { pixelX, pixelY } = gpsToPixel(lat, lon, minLat, minLon, center);
            return (
              <circle
                key={i}
                cx={pixelX}
                cy={pixelY}
                r="3"
                fill="#ff4444"
                stroke="#fff"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
}
