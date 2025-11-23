import React, { useState } from 'react';
import { Upload, Map, Activity, Zap, AlertCircle } from 'lucide-react';

export default function RacingLineVisualizer() {
  const [data, setData] = useState([]);
  const [mapImage, setMapImage] = useState(null);
  const [stats, setStats] = useState(null);
  const [fileName, setFileName] = useState('');
  const [mapFileName, setMapFileName] = useState('');
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');

  // const calibrationPoints = [
  //   { gpsLat: 33.5326722, gpsLon: -86.6196083, pixelX: 385.33, pixelY: 299.2, name: 'Finish Line' },
  //   { gpsLat: 33.5327, gpsLon: -86.6195, pixelX: 386.84, pixelY: 290.7, name: 'Turn 1' },
  //   { gpsLat: 33.5318, gpsLon: -86.6208, pixelX: 306.5, pixelY: 438.16, name: 'Turn 4' },
  // ];

  const calibrationPoints = [
  { gpsLat: 33.5326722, gpsLon: -86.6196083, pixelX: 1441, pixelY: 658, name: 'Finish Line' },
  { gpsLat: 33.5327, gpsLon: -86.6195, pixelX: 1447, pixelY: 639, name: 'Turn 1' },
  { gpsLat: 33.5318, gpsLon: -86.6208, pixelX: 1146, pixelY: 964, name: 'Turn 4' },
];



  const calculateTransform = () => {
    const p = calibrationPoints;
    const lat0 = p[0].gpsLat, lon0 = p[0].gpsLon, px0 = p[0].pixelX, py0 = p[0].pixelY;
    const lat1 = p[1].gpsLat, lon1 = p[1].gpsLon, px1 = p[1].pixelX, py1 = p[1].pixelY;
    const lat2 = p[2].gpsLat, lon2 = p[2].gpsLon, px2 = p[2].pixelX, py2 = p[2].pixelY;
    
    const denom = (lat1 - lat0) * (lon2 - lon0) - (lat2 - lat0) * (lon1 - lon0);
    
    const a = ((px1 - px0) * (lon2 - lon0) - (px2 - px0) * (lon1 - lon0)) / denom;
    const b = ((px2 - px0) * (lat1 - lat0) - (px1 - px0) * (lat2 - lat0)) / denom;
    const c = px0 - a * lat0 - b * lon0;
    
    const d = ((py1 - py0) * (lon2 - lon0) - (py2 - py0) * (lon1 - lon0)) / denom;
    const e = ((py2 - py0) * (lat1 - lat0) - (py1 - py0) * (lat2 - lat0)) / denom;
    const f = py0 - d * lat0 - e * lon0;
    
    return { a, b, c, d, e, f };
  };

  // const transform = calculateTransform();
  const [transform, setTransform] = useState(() => calculateTransform());


  const gpsToPixel = (lat, lon) => {
    const pixelX = transform.a * lat + transform.b * lon + transform.c;
    const pixelY = transform.d * lat + transform.e * lon + transform.f;
    return { pixelX, pixelY };
  };

  const parseCSV = (text) => {
    try {
      const lines = text.split('\n').filter(l => l.trim());
      const dataLines = lines.slice(2).filter(l => l.trim());
      
      const lonPoints = {};
      const latPoints = {};
      let lonCount = 0;
      let latCount = 0;
      
      dataLines.forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length < 12) return;
        
        const timestamp = parts[11];
        const telemetryName = parts[8];
        const telemetryValue = parts[9];
        
        if (!timestamp || !telemetryName || !telemetryValue) return;
        
        if (telemetryName === 'VBOX_Long_Minutes') {
          lonPoints[timestamp] = parseFloat(telemetryValue);
          lonCount++;
        } else if (telemetryName === 'VBOX_Lat_Min') {
          latPoints[timestamp] = parseFloat(telemetryValue);
          latCount++;
        }
      });
      
      const points = [];
      Object.keys(lonPoints).forEach(ts => {
        if (latPoints[ts] !== undefined) {
          const lon = lonPoints[ts];
          const lat = latPoints[ts];
          if (!isNaN(lon) && !isNaN(lat) && lon !== 0 && lat !== 0) {
            points.push({ lon, lat, time: ts });
          }
        }
      });
      
      return points;
    } catch (err) {
      setError(`Parse error: ${err.message}`);
      return [];
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError('');
      setFileName(file.name);
      
      const text = await file.text();
      const points = parseCSV(text);
      
      if (points.length === 0) {
        setError('No valid coordinate pairs found.');
        return;
      }

      setData(points);
      
      const lons = points.map(p => p.lon);
      const lats = points.map(p => p.lat);
      
      setStats({
        points: points.length,
        minLon: Math.min(...lons).toFixed(6),
        maxLon: Math.max(...lons).toFixed(6),
        minLat: Math.min(...lats).toFixed(6),
        maxLat: Math.max(...lats).toFixed(6),
      });
    } catch (err) {
      setError(`Upload error: ${err.message}`);
    }
  };

  const handleMapUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        setMapImage(event.target.result);
        setMapFileName(file.name);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(`Map upload error: ${err.message}`);
    }
  };

  const trackedPoints = data.filter((p) => {
    const pixel = gpsToPixel(p.lat, p.lon);
    return pixel.pixelX > 150 && pixel.pixelX < 550 && pixel.pixelY > 150 && pixel.pixelY < 550;
  });

  const pointsPerSector = Math.floor(trackedPoints.length / 3);
  const sector1 = trackedPoints.slice(0, pointsPerSector);
  const sector2 = trackedPoints.slice(pointsPerSector, pointsPerSector * 2);
  const sector3 = trackedPoints.slice(pointsPerSector * 2);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 border-b border-cyan-500/30 pb-6">
          <h1 className="text-5xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            BARBER MOTORSPORTS PARK
          </h1>
          <p className="text-cyan-500/70 text-lg">Racing Line Telemetry Overlay</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-slate-900/60 to-black border border-cyan-500/20 p-6 rounded">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="p-4 bg-cyan-600 group-hover:bg-cyan-500 rounded transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-lg">Upload GPS Data (CSV)</div>
                <div className="text-cyan-500/70 text-sm">Telemetry file</div>
              </div>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            {fileName && <div className="mt-4 text-emerald-400 text-sm">✓ {fileName}</div>}
          </div>

          <div className="bg-gradient-to-br from-slate-900/60 to-black border border-cyan-500/20 p-6 rounded">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="p-4 bg-purple-600 group-hover:bg-purple-500 rounded transition-colors">
                <Map className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-lg">Upload Track Map (PNG)</div>
                <div className="text-cyan-500/70 text-sm">Circuit image</div>
              </div>
              <input type="file" accept=".png,.jpg" onChange={handleMapUpload} className="hidden" />
            </label>
            {mapFileName && <div className="mt-4 text-emerald-400 text-sm">✓ {mapFileName}</div>}
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-red-900/30 border border-red-500/50 p-4 rounded flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="text-red-300">{error}</div>
          </div>
        )}

        {data.length > 0 && mapImage && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-emerald-900/20 to-black border border-emerald-500/40 p-4 rounded">
                <div className="text-xs uppercase tracking-widest text-emerald-400 font-black mb-2">Valid Points</div>
                <div className="text-3xl font-black">{trackedPoints.length}</div>
                <div className="text-xs text-emerald-500/70">of {stats.points}</div>
              </div>
              <div className="bg-gradient-to-br from-cyan-900/20 to-black border border-cyan-500/40 p-4 rounded">
                <div className="text-xs uppercase tracking-widest text-cyan-400 font-black mb-2">Calibration</div>
                <div className="text-2xl font-black">{calibrationPoints.length}</div>
                <div className="text-xs text-cyan-500/70">reference points</div>
              </div>
              <div className="bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/40 p-4 rounded">
                <div className="text-xs uppercase tracking-widest text-blue-400 font-black mb-2">Sectors</div>
                <div className="text-2xl font-black">3</div>
                <div className="text-xs text-blue-500/70">color-coded</div>
              </div>
              <div className="bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/40 p-4 rounded">
                <div className="text-xs uppercase tracking-widest text-purple-400 font-black mb-2">Status</div>
                <div className="text-2xl font-black">Ready</div>
                <div className="text-xs text-purple-500/70">mapped</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900/60 to-black border border-cyan-500/20 p-6 rounded mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Map className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black uppercase tracking-widest">Racing Line Overlay</h3>
              </div>

              <div className="min-h-screen bg-[#0a0a0a] text-white p-8" style={{ width: 1028, height: 606 }}>
                <img 
                  src={mapImage} 
                  alt="Barber Track" 
                  className="rounded border border-slate-700 w-full"
                />
                

                <svg 
                viewBox="0 0 2056 1212"
                  className="absolute inset-0 w-full h-full pointer-events-none" 
                  style={{ zIndex: 10 }}
                  preserveAspectRatio="none"
                >
        

                  <polyline
  points="607.9,1144.8 809.7,695.3 1411.1,672.6 578.4,1200.2"
  fill="none"
  stroke="lime"
  strokeWidth="4"
/>

                 <polyline
  points={sector1
    .map(p => {
      const { pixelX, pixelY } = gpsToPixel(p.VBOX_Lat_Min, p.VBOX_Long_Minutes);
      return `${pixelX},${pixelY}`;
    })
    .join(' ')}
  fill="none"
  stroke="#22d3ee"
  strokeWidth="6"
  strokeLinecap="round"
  style={{ filter: 'drop-shadow(0 0 10px #00ffff)' }}
/>


                  <circle cx="1411" cy="672" r="10" fill="red" />

                  <polyline
                    points={sector2.map(p => {
                      const pixel = gpsToPixel(p.lat, p.lon);
                      return `${pixel.pixelX},${pixel.pixelY}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity="0.9"
                    style={{ filter: 'drop-shadow(0 0 10px #00ffff)' }}
                  />
                  
                  <polyline
                    points={sector3.map(p => {
                      const pixel = gpsToPixel(p.lat, p.lon);
                      return `${pixel.pixelX},${pixel.pixelY}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity="0.9"
                    style={{ filter: 'drop-shadow(0 0 10px #00ffff)' }}
                  />

                  {data.length > 0 && (() => {
                    const start = gpsToPixel(data[0].lat, data[0].lon);
                    return (
                      <circle cx={start.pixelX} cy={start.pixelY} r="8" fill="#10b981" stroke="#34d399" strokeWidth="2" />
                    );
                  })()}

                  {data.length > 0 && (() => {
                    const end = gpsToPixel(data[data.length - 1].lat, data[data.length - 1].lon);
                    return (
                      <circle cx={end.pixelX} cy={end.pixelY} r="8" fill="#ef4444" stroke="#f87171" strokeWidth="2" />
                    );
                  })()}

                  {/* Calibration Points */}
                  {/* {calibrationPoints.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.pixelX}
                      cy={p.pixelY}
                      r="10"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="3"
                    >
                      <title>{p.name}</title>
                    </circle>
                  ))} */}

                  {/* Debug for first few GPS points */}
                  {data.slice(0, 5).map((p, i) => {
                    const { pixelX, pixelY } = gpsToPixel(p.lat, p.lon);
                    console.log("sector1 sample:", sector1.slice(0, 3));
                   
                    // console.log(`Point ${i}: ${pixelX.toFixed(1)}, ${pixelY.toFixed(1)}`);
                    return (
                      <circle
                        key={`gps-${i}`}
                        cx={pixelX}
                        cy={pixelY}
                        r="6"
                        fill="yellow"
                        stroke="black"
                        strokeWidth="1"
                      >
                        <title>{`${i}: ${pixelX.toFixed(1)}, ${pixelY.toFixed(1)}`}</title>
                      </circle>
                    );
                  })}

                </svg>

              </div>

                                  {/* === Live Calibration Controls === */}
<div className="mt-8 bg-gradient-to-br from-slate-900/70 to-black border border-cyan-500/30 p-6 rounded-xl">
  <h3 className="text-cyan-400 font-black text-sm uppercase mb-4 tracking-widest">
    Calibration Controls
  </h3>
  <div className="grid grid-cols-2 gap-6">
    {[
      { key: 'a', label: 'Scale X (a)', min: 10000, max: 200000 },
      { key: 'e', label: 'Scale Y (e)', min: -200000, max: -10000 },
      { key: 'c', label: 'Offset X (c)', min: -3000000, max: 3000000 },
      { key: 'f', label: 'Offset Y (f)', min: -3000000, max: 3000000 },
    ].map(({ key, label, min, max }) => (
      <div key={key}>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{label}</span>
          <span className="text-cyan-300 font-mono">{transform[key].toFixed(0)}</span>
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step="5000"
          value={transform[key]}
          onChange={(e) =>
            setTransform((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
          }
          className="w-full accent-cyan-500"
        />
      </div>
    ))}
  </div>
</div>

              <div className="mt-4 flex gap-6 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                  Start
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  End
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-6 bg-cyan-400"></div>
                  Sector 1
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-6 bg-purple-500"></div>
                  Sector 2
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-6 bg-pink-500"></div>
                  Sector 3
                </div>
              </div>

              <div className="mt-4 bg-black/50 p-3 rounded font-mono text-xs text-slate-300">
                <div className="text-cyan-400 mb-2">First 5 points on track:</div>
                {data.slice(0, 5).map((p, i) => {
                  const pixel = gpsToPixel(p.lat, p.lon);
                  const inBounds = pixel.pixelX > 150 && pixel.pixelX < 550 && pixel.pixelY > 150 && pixel.pixelY < 550;
                  return (
                    <div key={i} className={inBounds ? 'text-emerald-400' : 'text-red-400'}>
                      {i}: ({pixel.pixelX.toFixed(1)}, {pixel.pixelY.toFixed(1)}) {inBounds ? '✓' : '✗'}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {(data.length === 0 || !mapImage) && (
          <div className="text-center py-12 text-slate-400">
            <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Upload both GPS data and track map to see overlay</p>
          </div>
        )}
      </div>
    </div>
  );
}