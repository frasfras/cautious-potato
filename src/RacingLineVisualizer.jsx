import React, { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
// 


// 📊 CSV Parsing Functions
function extractGPSPoints(rows) {
  // Group all telemetry data by timestamp
  const grouped = {};
  for (const row of rows) {
    if (!row.telemetry_name || !row.telemetry_value || !row.timestamp) continue;
    
    const t = row.timestamp;
    if (!grouped[t]) grouped[t] = {};
    grouped[t][row.telemetry_name] = parseFloat(row.telemetry_value);
  }

  // Extract GPS points with all relevant telemetry
  const gpsPoints = Object.entries(grouped)
    .map(([timestamp, data]) => ({
      timestamp,
      lat: data.VBOX_Lat_Min,
      lon: data.VBOX_Long_Minutes,
      speed: data.speed,
      gear: data.gear,
      rpm: data.nmot,
      throttle: data.aps,
      brakeFront: data.pbrake_f,
      brakeRear: data.pbrake_r,
      steeringAngle: data.Steering_Angle,
      accelX: data.accx_can,
      accelY: data.accy_can,
      lapDistance: data.Laptrigger_lapdist_dls
    }))
    .filter((p) => p.lat !== undefined && p.lon !== undefined)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  return gpsPoints;
}

function parseCSVData(csvText) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      complete: (result) => {
        try {
          const gpsPoints = extractGPSPoints(result.data);
          resolve(gpsPoints);
        } catch (error) {
          reject(new Error(`Failed to extract GPS points: ${error.message}`));
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
}

// 🔑 API Configuration Helper Functions
function loadApiConfig() {
  try {
    // Check environment variables first, then fall back to localStorage
    const envApiKey = process.env.REACT_APP_API_KEY || '';
    const envProvider = process.env.REACT_APP_DEFAULT_API_PROVIDER || '';
    
    // Debug logging
    console.log('🔍 Environment variables check:');
    console.log('  REACT_APP_API_KEY exists:', !!envApiKey);
    console.log('  REACT_APP_API_KEY length:', envApiKey.length);
    console.log('  REACT_APP_DEFAULT_API_PROVIDER:', envProvider || 'not set');
    
    const apiKey = localStorage.getItem('racing-coach-api-key') || envApiKey;
    const apiProvider = localStorage.getItem('racing-coach-provider') || envProvider || 'openai';
    
    console.log('  Final API key length:', apiKey.length);
    console.log('  Final provider:', apiProvider);
    
    return { apiKey, apiProvider };
  } catch (error) {
    console.error('Failed to load API config from localStorage:', error);
    return { apiKey: '', apiProvider: 'openai' };
  }
}

function saveApiConfig(apiKey, apiProvider) {
  try {
    localStorage.setItem('racing-coach-api-key', apiKey);
    localStorage.setItem('racing-coach-provider', apiProvider);
  } catch (error) {
    console.error('Failed to save API config to localStorage:', error);
  }
}

// 🏎️ Telemetry Context Preparation
function prepareTelemetryContext(points, currentPosition) {
  if (!points || points.length === 0) {
    return {
      stats: {
        totalPoints: 0,
        currentPosition: 0,
        error: 'No telemetry data available'
      },
      sampleData: []
    };
  }

  // Get a sample of points around current position
  const contextWindow = 50; // points before and after
  const start = Math.max(0, Math.floor(currentPosition) - contextWindow);
  const end = Math.min(points.length, Math.floor(currentPosition) + contextWindow);
  const relevantPoints = points.slice(start, end);

  // Calculate summary statistics
  const stats = {
    totalPoints: points.length,
    currentPosition: Math.floor(currentPosition),
    sampleStart: start,
    sampleEnd: end,
    contextWindowSize: relevantPoints.length
  };

  // Calculate summary statistics from all points
  const speeds = points.map(p => p.speed).filter(s => s !== undefined);
  const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
  const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

  // Limit sample data to prevent token overflow (first 20 points from relevant window)
  const sampleData = relevantPoints.slice(0, 20).map(point => ({
    timestamp: point.timestamp,
    lat: point.lat,
    lon: point.lon,
    speed: point.speed,
    gear: point.gear,
    rpm: point.rpm,
    throttle: point.throttle,
    brakeFront: point.brakeFront,
    brakeRear: point.brakeRear,
    steeringAngle: point.steeringAngle,
    accelX: point.accelX,
    accelY: point.accelY
  }));

  return {
    stats: {
      ...stats,
      maxSpeed: maxSpeed.toFixed(2),
      avgSpeed: avgSpeed.toFixed(2)
    },
    sampleData
  };
}

// 💡 Example Racing Questions
const exampleQuestions = [
  "What was my top speed on this lap?",
  "Where did I brake the hardest?",
  "How consistent was my racing line?",
  "What's my average speed through the corners?",
  "Where can I improve my lap time?",
  "How does my speed compare at different sections of the track?",
  "What are the key areas where I'm losing time?"
];

// 🤖 AI Racing Coach API Communication
async function askRacingCoach(question, telemetryContext, apiKey, apiProvider) {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  if (!question || question.trim().length === 0) {
    throw new Error('Question cannot be empty');
  }

  const endpoints = {
    openai: 'https://api.openai.com/v1/chat/completions',
    synthetic: 'https://api.synthetic.new/v1/chat/completions'
  };

  const endpoint = endpoints[apiProvider];
  if (!endpoint) {
    throw new Error(`Unknown API provider: ${apiProvider}`);
  }

  const systemPrompt = `You are an expert racing coach analyzing telemetry data. 
Provide concise, actionable insights about racing performance. 
Focus on racing line, braking points, acceleration, and cornering technique.
Be specific and reference the data when possible.`;

  const userPrompt = `Telemetry Data Summary:
- Total GPS points: ${telemetryContext.stats.totalPoints}
- Current position: ${telemetryContext.stats.currentPosition}
- Max speed: ${telemetryContext.stats.maxSpeed} km/h
- Average speed: ${telemetryContext.stats.avgSpeed} km/h
- Sample window: points ${telemetryContext.stats.sampleStart} to ${telemetryContext.stats.sampleEnd}

Sample Telemetry Data (${telemetryContext.sampleData.length} points):
${JSON.stringify(telemetryContext.sampleData, null, 2)}

Available data fields:
- speed (km/h): Vehicle speed
- gear: Current gear
- rpm: Engine RPM
- throttle: Throttle position (0-100%)
- brakeFront/brakeRear: Brake pressure
- steeringAngle: Steering wheel angle
- accelX/accelY: Lateral and longitudinal acceleration (g-force)
- lat/lon: GPS coordinates

Question: ${question}

Provide a clear, specific answer based on the telemetry data. Reference specific values when possible.`;

  // Synthetic API uses different model format
  const modelName = apiProvider === 'synthetic' ? 'hf:openai/gpt-oss-120b' : 'gpt-4o-mini';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      let errorMessage = 'API request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorMessage;
      } catch (e) {
        errorMessage = `${errorMessage} (${response.status} ${response.statusText})`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from AI');
    }

    return data.choices[0].message.content;
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach API. Check your internet connection.');
    }
    throw error;
  }
}

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
    a: 121000,
    e: -81000,
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

  // 📁 File loading state
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [currentFileName, setCurrentFileName] = useState("lap_2.csv");

  // 💬 Chat state management
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 🔑 API configuration state
  const [apiKey, setApiKey] = useState('');
  const [apiProvider, setApiProvider] = useState('openai');
  const [apiKeyValid, setApiKeyValid] = useState(null); // null = untested, true = valid, false = invalid
  const [testingConnection, setTestingConnection] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);

  // 📁 File input handler
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoadingFile(true);
    setFileError(null);
    setCurrentFileName(file.name);

    try {
      const text = await file.text();
      const gpsPoints = await parseCSVData(text);
      
      if (gpsPoints.length === 0) {
        throw new Error("No valid GPS data found in file");
      }
      
      setPoints(gpsPoints);
      setCarPosition(0); // Reset car to start
    } catch (error) {
      setFileError(`Failed to load file: ${error.message}`);
      console.error("CSV parsing error:", error);
    } finally {
      setLoadingFile(false);
    }
  };

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

  // 💬 Message handling logic
  const handleSendMessage = async () => {
    // Validate input
    if (!input.trim()) {
      return;
    }

    if (!apiKey) {
      const errorMessage = {
        id: Date.now(),
        question: input,
        answer: null,
        loading: false,
        error: 'Please configure your API key before sending messages'
      };
      setMessages(prev => [...prev, errorMessage]);
      setInput('');
      return;
    }

    // Create new message with loading state
    const newMessage = {
      id: Date.now(),
      question: input,
      answer: null,
      loading: true,
      error: null
    };

    // Add message to chat history
    setMessages(prev => [...prev, newMessage]);
    
    // Clear input field immediately after adding to history
    setInput('');
    
    // Set global loading state
    setIsLoading(true);

    try {
      // Prepare telemetry context
      const context = prepareTelemetryContext(points, carPosition);
      
      // Check if telemetry data is available
      if (context.stats.totalPoints === 0) {
        throw new Error('No telemetry data available. Please load a CSV file first.');
      }

      // Call API with telemetry context
      const answer = await askRacingCoach(newMessage.question, context, apiKey, apiProvider);

      // Update message with response
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id
          ? { ...msg, answer, loading: false, error: null }
          : msg
      ));
    } catch (error) {
      // Update message with error
      setMessages(prev => prev.map(msg =>
        msg.id === newMessage.id
          ? { ...msg, answer: null, loading: false, error: error.message }
          : msg
      ));
    } finally {
      // Clear global loading state
      setIsLoading(false);
    }
  };

  // 🔄 Retry failed message
  const handleRetryMessage = async (messageId) => {
    const messageToRetry = messages.find(msg => msg.id === messageId);
    if (!messageToRetry) return;

    // Update message to loading state
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, loading: true, error: null }
        : msg
    ));

    setIsLoading(true);

    try {
      // Prepare telemetry context
      const context = prepareTelemetryContext(points, carPosition);
      
      // Check if telemetry data is available
      if (context.stats.totalPoints === 0) {
        throw new Error('No telemetry data available. Please load a CSV file first.');
      }

      // Call API with telemetry context
      const answer = await askRacingCoach(messageToRetry.question, context, apiKey, apiProvider);

      // Update message with response
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, answer, loading: false, error: null }
          : msg
      ));
    } catch (error) {
      // Update message with error
      setMessages(prev => prev.map(msg =>
        msg.id === messageId
          ? { ...msg, answer: null, loading: false, error: error.message }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // 🗑️ Clear chat history
  const handleClearChat = () => {
    setMessages([]);
    setInput('');
  };

  // 💡 Handle example question click
  const handleExampleClick = (question) => {
    setInput(question);
  };

  // 🔑 Test API connection
  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setApiKeyValid(false);
      return;
    }

    setTestingConnection(true);
    setApiKeyValid(null);

    try {
      // Make a minimal test request to validate the API key
      const endpoints = {
        openai: 'https://api.openai.com/v1/chat/completions',
        synthetic: 'https://api.synthetic.new/v1/chat/completions'
      };

      const endpoint = endpoints[apiProvider];
      console.log('🔍 Testing connection to:', endpoint);
      console.log('🔑 Using provider:', apiProvider);
      console.log('🔑 API Key length:', apiKey.length);

      // Synthetic API uses different model format
      const modelName = apiProvider === 'synthetic' ? 'hf:openai/gpt-oss-120b' : 'gpt-4o-mini';
      
      const requestBody = {
        model: modelName,
        messages: [
          { role: 'user', content: 'Hello' }
        ]
      };

      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Connection successful!', data);
        setApiKeyValid(true);
      } else {
        const errorText = await response.text();
        console.error('❌ Connection failed:', response.status, response.statusText);
        console.error('❌ Error response:', errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ Parsed error:', errorData);
        } catch (e) {
          console.error('❌ Could not parse error response');
        }
        setApiKeyValid(false);
      }
    } catch (error) {
      console.error('❌ Connection error:', error);
      console.error('❌ Error stack:', error.stack);
      setApiKeyValid(false);
    } finally {
      setTestingConnection(false);
    }
  };

  // 🔑 Handle API key change
  const handleApiKeyChange = (newKey) => {
    setApiKey(newKey);
    setApiKeyValid(null); // Reset validation status when key changes
  };

  // 🔑 Handle API provider change
  const handleApiProviderChange = (newProvider) => {
    setApiProvider(newProvider);
    setApiKeyValid(null); // Reset validation status when provider changes
  };

  // 🔑 Load API configuration from localStorage on mount
  useEffect(() => {
    const config = loadApiConfig();
    setApiKey(config.apiKey);
    setApiProvider(config.apiProvider);
  }, []);

  // 🔑 Save API configuration to localStorage when it changes
  useEffect(() => {
    saveApiConfig(apiKey, apiProvider);
  }, [apiKey, apiProvider]);

  // ✅ Load default CSV file on mount
  useEffect(() => {
    const loadDefaultFile = async () => {
      try {
        const response = await fetch("/lap_2.csv");
        const csvText = await response.text();
        const gpsPoints = await parseCSVData(csvText);
        console.log("✅ Parsed GPS points:", gpsPoints.length);
        setPoints(gpsPoints);
      } catch (error) {
        console.error("Failed to load default CSV:", error);
      }
    };

    loadDefaultFile();
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
    // return;
    setTransform((prev) => ({ ...prev, [key]: parseFloat(value) }));
  };

  return (
    <>
      {/* CSS Animations and Responsive Styles */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          .chat-message-enter {
            animation: fadeIn 0.3s ease-out;
          }
          
          .typing-indicator {
            animation: pulse 1.5s ease-in-out infinite;
          }
          
          /* Responsive Layout Styles */
          .main-content {
            transition: margin-right 0.3s ease-in-out;
          }
          
          .chat-panel {
            position: fixed;
            right: 0;
            top: 0;
            width: 400px;
            height: 100vh;
            background: rgba(0, 0, 0, 0.95);
            border-left: 2px solid #22d3ee;
            display: flex;
            flex-direction: column;
            z-index: 1000;
            box-shadow: -4px 0 20px rgba(34, 211, 238, 0.3);
            transition: transform 0.3s ease-in-out;
            transform: translateX(100%);
          }
          
          .chat-panel.open {
            transform: translateX(0);
          }
          
          /* Desktop: Adjust main content when chat is open */
          @media (min-width: 1025px) {
            .main-content.chat-open {
              margin-right: 400px;
            }
          }
          
          /* Tablet and Mobile: Chat overlays instead of side-by-side */
          @media (max-width: 1024px) {
            .chat-panel {
              width: 100%;
              max-width: 400px;
            }
            
            .main-content.chat-open {
              margin-right: 0;
            }
          }
          
          /* Mobile: Full width chat panel */
          @media (max-width: 768px) {
            .chat-panel {
              width: 100%;
              max-width: 100%;
            }
            
            .chat-panel .chat-header h3 {
              font-size: 18px;
            }
            
            .chat-panel textarea {
              min-height: 60px !important;
              font-size: 16px !important;
            }
          }
          
          /* Small mobile: Adjust padding and font sizes */
          @media (max-width: 480px) {
            .chat-panel .chat-header,
            .chat-panel .chat-messages,
            .chat-panel .chat-input {
              padding: 15px !important;
            }
            
            .chat-panel .chat-header h3 {
              font-size: 16px;
            }
            
            .chat-panel textarea {
              font-size: 14px !important;
            }
          }
        `}
      </style>
      
      <div
        className={`main-content ${chatOpen ? 'chat-open' : ''}`}
        style={{
          background: "#0d1117",
          color: "#fff",
          minHeight: "100vh",
          padding: 20,
          position: "relative"
        }}
      > 
    {/* <GhostApp /> */}
    
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Racing Line Visualizer</h2>
          <p>{points.length} GPS points</p>
        </div>
        
        {/* 💬 Toggle Chat Button */}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          style={{
            padding: '12px 24px',
            background: chatOpen ? '#22d3ee' : 'rgba(34, 211, 238, 0.2)',
            color: chatOpen ? '#000' : '#22d3ee',
            border: '2px solid #22d3ee',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            transform: 'scale(1)'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 4px 12px rgba(34, 211, 238, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = 'none';
          }}
        >
          💬 {chatOpen ? 'Close' : 'Open'} AI Coach
        </button>
      </div>

      {/* 📁 File Input Section */}
      <div style={{
        background: 'rgba(0,0,0,0.7)',
        padding: '15px 25px',
        borderRadius: 10,
        marginBottom: 20,
        border: '2px solid #22d3ee'
      }}>
        <div style={{ marginBottom: 10 }}>
          <label style={{ 
            fontSize: 16, 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            📁 Load CSV File:
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{
                padding: '5px 10px',
                borderRadius: 5,
                border: '1px solid #22d3ee',
                background: '#1a1a1a',
                color: '#fff',
                cursor: 'pointer'
              }}
            />
          </label>
        </div>
        
        <div style={{ fontSize: 14, color: '#888' }}>
         Currently loaded: <span style={{ color: '#22d3ee' }}>{currentFileName}</span>  Datasource: GR cup R1 R2 Barber
        </div>
        
        {loadingFile && (
          <div style={{ 
            marginTop: 10, 
            color: '#22d3ee',
            fontSize: 14,
            fontWeight: 'bold'
          }}>
            ⏳ Loading file...
          </div>
        )}
        
        {fileError && (
          <div style={{ 
            marginTop: 10, 
            padding: '10px',
            background: 'rgba(255, 68, 68, 0.1)',
            border: '1px solid #ff4444',
            borderRadius: 5,
            color: '#ff4444',
            fontSize: 14
          }}>
            ⚠️ {fileError}
          </div>
        )}
      </div>

      {/* 🏎️ Speed HUD */}
      <div style={{
        background: 'rgba(0,0,0,0.7)',
        padding: '15px 25px',
        borderRadius: 10,
        marginBottom: 20,
        display: 'inline-block',
        border: '2px solid #22d3ee'
      }}>
        <div style={{ fontSize: 24, fontWeight: 'bold' }}>
          Speed: <span style={{ color: '#22d3ee' }}>{carSpeed.toFixed(1)}</span> km/h
        </div>
        <div style={{ fontSize: 14, color: '#888', marginTop: 5 }}>
          Use ↑↓ arrow keys to control
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
              href="/ghostmobile.jpeg"
              x="0"
              y="10"
              width="100%"
              height="800"
              opacity="0.95"
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
            <image x={carPixel.pixelX} y={carPixel.pixelY} width="30" height="30" href="logo1923.png" />
          </g>
        </svg>
      </div>

      {/* 💬 Chat Panel */}
      <div
        className={`chat-panel ${chatOpen ? 'open' : ''}`}
      >
          {/* Chat Header */}
          <div
            className="chat-header"
            style={{
              padding: '20px',
              background: 'rgba(34, 211, 238, 0.1)',
              borderBottom: '1px solid #22d3ee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3 style={{ margin: 0, fontSize: 20, color: '#22d3ee' }}>
              🏎️ AI Racing Coach
            </h3>
            <button
              onClick={() => setChatOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#22d3ee',
                fontSize: 24,
                cursor: 'pointer',
                padding: '0 8px',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>

          {/* API Configuration Section */}
          <div
            style={{
              padding: '15px 20px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderBottom: '1px solid rgba(34, 211, 238, 0.3)'
            }}
          >
            {/* Settings Toggle Button */}
            <button
              onClick={() => setShowApiSettings(!showApiSettings)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(34, 211, 238, 0.1)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                borderRadius: 6,
                color: '#22d3ee',
                fontSize: 13,
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(34, 211, 238, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(34, 211, 238, 0.1)';
              }}
            >
              <span>⚙️ API Settings</span>
              <span style={{ fontSize: 10 }}>
                {showApiSettings ? '▲' : '▼'}
              </span>
            </button>

            {/* API Settings Panel */}
            {showApiSettings && (
              <div
                style={{
                  marginTop: '15px',
                  padding: '15px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: 6,
                  border: '1px solid rgba(34, 211, 238, 0.2)'
                }}
              >
                {/* No API Key Warning */}
                {!apiKey && (
                  <div
                    style={{
                      padding: '12px',
                      background: 'rgba(255, 165, 0, 0.1)',
                      border: '1px solid rgba(255, 165, 0, 0.3)',
                      borderRadius: 6,
                      color: '#ffa500',
                      fontSize: 12,
                      marginBottom: '15px',
                      lineHeight: 1.5
                    }}
                  >
                    <strong>⚠️ No API Key Configured</strong>
                    <p style={{ margin: '8px 0 0 0' }}>
                      Please enter your API key below to start chatting with the AI Racing Coach.
                      Get your key from{' '}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#22d3ee', textDecoration: 'underline' }}
                      >
                        OpenAI
                      </a>
                      {' '}or{' '}
                      <a
                        href="https://synthetic.new"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#22d3ee', textDecoration: 'underline' }}
                      >
                        Synthetic
                      </a>
                      .
                    </p>
                  </div>
                )}

                {/* API Provider Selection */}
                <div style={{ marginBottom: '15px' }}>
                  <label
                    style={{
                      display: 'block',
                      color: '#22d3ee',
                      fontSize: 12,
                      fontWeight: 'bold',
                      marginBottom: '6px'
                    }}
                  >
                    API Provider:
                  </label>
                  <select
                    value={apiProvider}
                    onChange={(e) => handleApiProviderChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid #22d3ee',
                      borderRadius: 6,
                      color: '#fff',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    <option value="openai" style={{ background: '#1a1a1a' }}>
                      OpenAI
                    </option>
                    <option value="synthetic" style={{ background: '#1a1a1a' }}>
                      Synthetic
                    </option>
                  </select>
                </div>

                {/* API Key Input */}
                <div style={{ marginBottom: '15px' }}>
                  <label
                    style={{
                      display: 'block',
                      color: '#22d3ee',
                      fontSize: 12,
                      fontWeight: 'bold',
                      marginBottom: '6px'
                    }}
                  >
                    API Key:
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder={apiProvider === 'openai' ? 'sk-...' : 'syn_...'}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid #22d3ee',
                      borderRadius: 6,
                      color: '#fff',
                      fontSize: 13,
                      fontFamily: 'monospace',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ 
                    marginTop: '6px', 
                    fontSize: 11, 
                    color: '#888',
                    fontStyle: 'italic'
                  }}>
                    {apiProvider === 'openai' 
                      ? '💡 OpenAI keys start with "sk-"' 
                      : '💡 Synthetic keys start with "syn_"'}
                  </div>
                </div>

                {/* Test Connection Button */}
                <button
                  onClick={handleTestConnection}
                  disabled={!apiKey.trim() || testingConnection}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: !apiKey.trim() || testingConnection ? '#555' : 'rgba(34, 211, 238, 0.2)',
                    border: `1px solid ${!apiKey.trim() || testingConnection ? '#666' : '#22d3ee'}`,
                    borderRadius: 6,
                    color: !apiKey.trim() || testingConnection ? '#888' : '#22d3ee',
                    fontSize: 13,
                    fontWeight: 'bold',
                    cursor: !apiKey.trim() || testingConnection ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => {
                    if (apiKey.trim() && !testingConnection) {
                      e.target.style.background = 'rgba(34, 211, 238, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (apiKey.trim() && !testingConnection) {
                      e.target.style.background = 'rgba(34, 211, 238, 0.2)';
                    }
                  }}
                >
                  {testingConnection ? (
                    <>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          border: '2px solid #888',
                          borderTop: '2px solid transparent',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}
                      />
                      Testing...
                    </>
                  ) : (
                    '🔌 Test Connection'
                  )}
                </button>

                {/* Validation Status */}
                {apiKeyValid !== null && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '10px',
                      background: apiKeyValid ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                      border: `1px solid ${apiKeyValid ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 68, 68, 0.3)'}`,
                      borderRadius: 6,
                      color: apiKeyValid ? '#00ff00' : '#ff4444',
                      fontSize: 12,
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    {apiKeyValid ? (
                      <>
                        <span>✅</span>
                        <span>Connection successful! API key is valid.</span>
                      </>
                    ) : (
                      <>
                        <span>❌</span>
                        <span>Connection failed. Please check your API key and provider.</span>
                      </>
                    )}
                  </div>
                )}

                {/* Debug Info */}
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 6,
                    fontSize: 11,
                    color: '#888',
                    fontFamily: 'monospace'
                  }}
                >
                  <div>Provider: {apiProvider}</div>
                  <div>Key length: {apiKey.length} chars</div>
                  <div style={{ marginTop: 6, fontSize: 10, color: '#666' }}>
                    💡 Check browser console (F12) for detailed error logs
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Messages Container */}
          <div
            className="chat-messages"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            {messages.length === 0 ? (
              <div style={{ 
                color: '#888', 
                fontSize: 14
              }}>
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '30px',
                  paddingTop: '20px'
                }}>
                  <p style={{ fontSize: 16, color: '#22d3ee', marginBottom: 8 }}>
                    🏎️ Ask me anything about your lap performance!
                  </p>
                  <p style={{ fontSize: 12, marginTop: 10 }}>
                    Load a CSV file and start chatting.
                  </p>
                </div>

                {/* Example Questions */}
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ 
                    color: '#22d3ee', 
                    fontSize: 14, 
                    marginBottom: 12,
                    fontWeight: 'bold'
                  }}>
                    💡 Example Questions:
                  </h4>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px' 
                  }}>
                    {exampleQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleExampleClick(question)}
                        style={{
                          background: 'rgba(34, 211, 238, 0.1)',
                          border: '1px solid rgba(34, 211, 238, 0.3)',
                          borderRadius: 6,
                          padding: '10px 12px',
                          color: '#22d3ee',
                          fontSize: 13,
                          textAlign: 'left',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(34, 211, 238, 0.2)';
                          e.target.style.borderColor = '#22d3ee';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(34, 211, 238, 0.1)';
                          e.target.style.borderColor = 'rgba(34, 211, 238, 0.3)';
                        }}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Clear Chat Button */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  marginBottom: '8px'
                }}>
                  <button
                    onClick={handleClearChat}
                    style={{
                      padding: '6px 12px',
                      background: 'rgba(255, 68, 68, 0.1)',
                      border: '1px solid rgba(255, 68, 68, 0.3)',
                      borderRadius: 4,
                      color: '#ff4444',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 68, 68, 0.2)';
                      e.target.style.borderColor = '#ff4444';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 68, 68, 0.1)';
                      e.target.style.borderColor = 'rgba(255, 68, 68, 0.3)';
                    }}
                  >
                    🗑️ Clear Chat
                  </button>
                </div>

                {/* Messages */}
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className="chat-message-enter"
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                  >
                    {/* User Question */}
                    <div
                      style={{
                        background: 'rgba(34, 211, 238, 0.2)',
                        padding: '12px',
                        borderRadius: 8,
                        color: '#fff',
                        fontSize: 14
                      }}
                    >
                      <strong style={{ color: '#22d3ee' }}>You:</strong> {msg.question}
                    </div>

                    {/* AI Answer or Loading/Error */}
                    {msg.loading ? (
                      <div
                        className="typing-indicator"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '12px',
                          borderRadius: 8,
                          borderLeft: '3px solid #22d3ee',
                          color: '#22d3ee',
                          fontSize: 14,
                          fontStyle: 'italic'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div
                            style={{
                              width: '16px',
                              height: '16px',
                              border: '2px solid #22d3ee',
                              borderTop: '2px solid transparent',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}
                          />
                          <span>Analyzing telemetry</span>
                          <span
                            style={{
                              animation: 'dots 1.5s steps(4, end) infinite'
                            }}
                          >
                            ...
                          </span>
                        </div>
                      </div>
                    ) : msg.error ? (
                      <div
                        style={{
                          background: 'rgba(255, 68, 68, 0.1)',
                          padding: '12px',
                          borderRadius: 8,
                          borderLeft: '3px solid #ff4444',
                          color: '#ff4444',
                          fontSize: 14
                        }}
                      >
                        <div style={{ marginBottom: 8 }}>
                          <strong>Error:</strong> {msg.error}
                        </div>
                        <button
                          onClick={() => handleRetryMessage(msg.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(255, 68, 68, 0.2)',
                            border: '1px solid #ff4444',
                            borderRadius: 4,
                            color: '#ff4444',
                            fontSize: 12,
                            cursor: 'pointer'
                          }}
                        >
                          🔄 Retry
                        </button>
                      </div>
                    ) : msg.answer ? (
                      <div
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '12px',
                          borderRadius: 8,
                          borderLeft: '3px solid #22d3ee',
                          color: '#22d3ee',
                          fontSize: 14,
                          lineHeight: 1.6
                        }}
                      >
                        <strong style={{ color: '#fff' }}>Coach:</strong> {msg.answer}
                      </div>
                    ) : null}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Chat Input Section */}
          <div
            className="chat-input"
            style={{
              padding: '20px',
              borderTop: '1px solid #22d3ee',
              background: 'rgba(0, 0, 0, 0.8)'
            }}
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask about your lap performance..."
              disabled={isLoading}
              style={{
                width: '100%',
                minHeight: '80px',
                background: isLoading ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                border: `1px solid ${isLoading ? 'rgba(34, 211, 238, 0.3)' : '#22d3ee'}`,
                color: '#fff',
                padding: '12px',
                borderRadius: 8,
                resize: 'none',
                fontFamily: 'inherit',
                fontSize: 14,
                boxSizing: 'border-box',
                opacity: isLoading ? 0.5 : 1,
                transition: 'all 0.3s ease',
                cursor: isLoading ? 'not-allowed' : 'text'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '12px',
                background: isLoading || !input.trim() ? '#555' : '#22d3ee',
                color: isLoading || !input.trim() ? '#888' : '#000',
                border: 'none',
                borderRadius: 8,
                fontWeight: 'bold',
                fontSize: 14,
                cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                transform: 'scale(1)',
                opacity: isLoading || !input.trim() ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading && input.trim()) {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow = '0 4px 12px rgba(34, 211, 238, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid #888',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}
                  />
                  Sending...
                </span>
              ) : '📤 Send Message'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}