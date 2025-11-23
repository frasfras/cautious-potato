import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";

// 🏎️ Car Class
class Car {
  constructor(maxSpeed = 200, accelRate = 5, brakeRate = 8) {
    this.speed = 0;
    this.maxSpeed = maxSpeed;
    this.accelRate = accelRate;
    this.brakeRate = brakeRate;
    this.targetSpeed = 0;
  }
  
  accelerate(amount = 10) {
    this.targetSpeed = Math.min(this.targetSpeed + amount, this.maxSpeed);
  }
  
  brake(amount = 10) {
    this.targetSpeed = Math.max(this.targetSpeed - amount, 0);
  }
  
  update(deltaTime = 0.016) {
    const diff = this.targetSpeed - this.speed;
    const rate = diff > 0 ? this.accelRate : this.brakeRate;
    this.speed += Math.sign(diff) * Math.min(Math.abs(diff), rate * deltaTime * 60);
  }
  
  getSpeed() {
    return this.speed;
  }
}

export default function RacingLineVisualizer() {
  const [points, setPoints] = useState([]);
  const [transform, setTransform] = useState({
    a: 142000,
    e: -143000,
    c: 200,
    f: 600,
    rotation: 0
  });

  const [showLine, setShowLine] = useState(true);
  const [showDots, setShowDots] = useState(true);
  const [showTrack, setShowTrack] = useState(true);
  
  // 🏎️ Car state
  const [carPosition, setCarPosition] = useState(0);
  const [carSpeed, setCarSpeed] = useState(0);
  const carRef = useRef(new Car(200));
  const animationRef = useRef(null);
  const lastTimeRef = useRef(Date.now());

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

  // 🎮 Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      const car = carRef.current;
      if (e.key === 'ArrowUp') car.accelerate(20);
      if (e.key === 'ArrowDown') car.brake(30);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 🏁 Animation loop
  useEffect(() => {
    if (points.length === 0) return;

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const car = carRef.current;
      car.update(deltaTime);
      
      setCarPosition(prev => (prev + car.getSpeed() * 0.02) % points.length);
      setCarSpeed(car.getSpeed());

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [points.length]);

  if (points.length === 0) return <div style={{ color: '#fff', padding: 20 }}>Loading or no GPS data...</div>;

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

  // Get car position
  const currentPoint = points[Math.floor(carPosition)];
  const carPixel = currentPoint 
    ? gpsToPixel(currentPoint.lat, currentPoint.lon, minLat, minLon, center)
    : { pixelX: 0, pixelY: 0 };

  const handleTransformChange = (key, value) => {
    setTransform((prev) => ({ ...prev, [key]: parseFloat(value) }));
  };

  return (
    <div
      style={{
        background: "linear-gradient(180deg, #0a0015 0%, #1a0a2e 50%, #0f0520 100%)",
        color: "#fff",
        minHeight: "100vh",
        padding: 20,
        fontFamily: "'Creepster', 'Courier New', monospace"
      }}
    >
      <h2 style={{ 
        fontSize: 42, 
        color: '#ff6b00',
        textShadow: '0 0 20px #ff6b00, 0 0 40px #ff0000',
        letterSpacing: 3
      }}>
        👻 HAUNTED RACING LINE 👻
      </h2>
      <p style={{ color: '#9d00ff' }}>{points.length} cursed waypoints detected...</p>

      {/* 🏎️ Speed HUD */}
      <div style={{
        background: 'rgba(20,0,40,0.9)',
        padding: '15px 25px',
        borderRadius: 10,
        marginBottom: 20,
        display: 'inline-block',
        border: '3px solid #ff6b00',
        boxShadow: '0 0 30px #ff6b00, inset 0 0 20px rgba(255,107,0,0.3)'
      }}>
        <div style={{ fontSize: 24, fontWeight: 'bold' }}>
          🎃 Speed: <span style={{ color: '#ff6b00', textShadow: '0 0 10px #ff6b00' }}>{carSpeed.toFixed(1)}</span> km/h
        </div>
        <div style={{ fontSize: 12, color: '#9d00ff', marginTop: 5 }}>
          ⚰️ Use ↑↓ arrow keys to escape the darkness
        </div>
      </div>

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
                step={k === "rotation" ? 0.5 : 500}
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
          {showTrack && (
            <image
              href="/track.png"
              x="0"
              y="0"
              width="100%"
              height="800"
              opacity="0.35"
              preserveAspectRatio="xMidYMid meet"
            />
          )}

          {/* 💡 Racing Line */}
          {showLine && (
            <polyline
              points={linePoints}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 8px #00ffff)" }}
            />
          )}

          {/* 🔴 GPS Points */}
          {showDots && points.map(({ lat, lon }, i) => {
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

          {/* 🏎️ Moving Car */}
          <g>
            <circle
              cx={carPixel.pixelX}
              cy={carPixel.pixelY}
              r="8"
              fill="#00ff00"
              stroke="#fff"
              strokeWidth="2"
              style={{ filter: "drop-shadow(0 0 12px #00ff00)" }}
            />
            <circle
              cx={carPixel.pixelX}
              cy={carPixel.pixelY}
              r="4"
              fill="#fff"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}