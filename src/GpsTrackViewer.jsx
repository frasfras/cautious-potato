import React, { useState } from "react";
import Papa from "papaparse";

// Simple GPS → pixel transform (adjust for your map image)
// const transform = {
//   a: 20000, // scale X (adjust)
//   b: 0,
//   c: -1710000, // offset X
//   d: 0,
//   e: -20000, // scale Y (negative flips vertically)
//   f: 676000, // offset Y
// };

const transform = {
  a: 2250000,
  b: 0,
  c: -1700000,
  d: 0,
  e: -2250000,
  f: 676000,
};


// Convert lat/lon to pixel coords
const gpsToPixel = (lat, lon) => {
  const pixelX = transform.a * lat + transform.b * lon + transform.c;
  const pixelY = transform.d * lat + transform.e * lon + transform.f;
  return { pixelX, pixelY };
};

export default function GpsTrackViewer() {
  const [points, setPoints] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
  header: true,
  skipEmptyLines: true,
  complete: (result) => {
    const rows = result.data;
    const grouped = {};

    rows.forEach((row) => {
      const time = (row.timestamp || "").trim();
      if (!time) return;

      if (!grouped[time]) grouped[time] = { timestamp: time };

      const name = row.telemetry_name?.trim();
      const val = parseFloat(row.telemetry_value);
      if (name && !isNaN(val)) grouped[time][name] = val;
    });


    const combined = Object.values(grouped);
    // const validPoints = combined.filter(
    //   (p) =>
    //     typeof p.VBOX_Lat_Min === "number" &&
    //     typeof p.VBOX_Long_Minutes === "number"
    // );

    // Convert GPS strings to numbers
    const validPoints = combined
    .filter((p) => p.VBOX_Lat_Min && p.VBOX_Long_Minutes)
    .map((p) => ({
        ...p,
        VBOX_Lat_Min: parseFloat(p.VBOX_Lat_Min),
        VBOX_Long_Minutes: parseFloat(p.VBOX_Long_Minutes),
    }));

    console.log("✅ Valid GPS points:", validPoints.slice(0, 3));
    setPoints(validPoints);
    // console.log("✅ Grouped sample:", combined.slice(0, 3));
    // console.log("✅ Valid GPS points:", validPoints.slice(0, 3));

    // setPoints(validPoints);
  },
});

  };

  return (
    <div
      style={{
        background: "#0a0a0a",
        color: "#fff",
        minHeight: "100vh",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      <h2 style={{ color: "#22d3ee", marginBottom: "1rem" }}>
        GPS Track Viewer
      </h2>

      <input type="file" accept=".csv" onChange={handleFileUpload} />

      <div
        style={{
          marginTop: "2rem",
          position: "relative",
          width: "100%",
          height: "600px",
          background: "#111",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Track background (optional) */}
        {/* <img
          src="/barber.png"
          alt="Track"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            opacity: 0.2,
            position: "absolute",
          }}
        /> */}

        <svg
          viewBox="0 0 2056 1212"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
            {points.length < 2 && (
  <polyline
    points="100,100 400,200 700,150 1000,400"
    fill="none"
    stroke="red"
    strokeWidth="4"
  />
)}

          {points.length > 1 && (
            <>
              {/* Glowing track line */}
              <polyline
                points={points
                  .map((p) => {
                    const { pixelX, pixelY } = gpsToPixel(
                      p.VBOX_Lat_Min,
                      p.VBOX_Long_Minutes
                    );
                    return `${pixelX},${pixelY}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="4"
                strokeLinecap="round"
                style={{
                  filter: "drop-shadow(0 0 8px #00ffff)",
                }}
              />

              {points.slice(0, 5).map((p, i) => {
  const { pixelX, pixelY } = gpsToPixel(p.VBOX_Lat_Min, p.VBOX_Long_Minutes);
  return (
    <text
      key={i}
      x={pixelX + 10}
      y={pixelY}
      fontSize="18"
      fill="#00ffff"
      style={{ pointerEvents: "none" }}
    >
      {i}
    </text>
  );
})}
  
              {/* Optional start/end points */}
              {(() => {
                const start = gpsToPixel(
                  points[0].VBOX_Lat_Min,
                  points[0].VBOX_Long_Minutes
                );
                const end = gpsToPixel(
                  points[points.length - 1].VBOX_Lat_Min,
                  points[points.length - 1].VBOX_Long_Minutes
                );
                return (
                  <>
                    <circle
                      cx={start.pixelX}
                      cy={start.pixelY}
                      r="8"
                      fill="#22d3ee"
                    />
                    <circle
                      cx={end.pixelX}
                      cy={end.pixelY}
                      r="8"
                      fill="#f87171"
                    />
                  </>
                );
              })()}
            </>
          )}
        </svg>
      </div>

      <p style={{ marginTop: "1rem", opacity: 0.7 }}>
        Parsed points: {points.length}
      </p>
    </div>
  );
}
