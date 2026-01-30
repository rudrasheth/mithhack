import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutTemplate, ShieldAlert, CreditCard, Users,
  QrCode, Search, Bell, Mic, Clipboard, Activity,
  Globe, UserX, AlertTriangle, Signal
} from 'lucide-react';
import { io } from 'socket.io-client';
import RiskOrb from './components/RiskOrb';
import { riskEngine } from './services/RiskEngine';

// DYNAMIC URL: Uses 'localhost' on laptop, but uses '10.200.129.90' (or whatever IP) on Phone/Network
const getBackendUrl = () => {
  const host = window.location.hostname;
  return `http://${host}:5001`;
};
const SOCKET_URL = getBackendUrl();


function App() {
  const [riskScore, setRiskScore] = useState(0.0);
  const [alerts, setAlerts] = useState([]);
  const [globalStats, setGlobalStats] = useState({ blocked: 45200, count: 1205 });
  const [socket, setSocket] = useState(null);
  const [simText, setSimText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [language, setLanguage] = useState('EN');

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('fraud-alert', (data) => {
      // If it's a "Global Network" packet (simulated traffic)
      if (data.isGlobal) {
        setGlobalStats(prev => ({
          blocked: data.risk > 0.5 ? prev.blocked + 500 : prev.blocked,
          count: prev.count + 1
        }));
        // Only add to alerts if it's high risk or we want noise
        if (data.risk > 0.6) setAlerts(prev => [data, ...prev].slice(0, 50));
      } else {
        // Direct User Alert
        setRiskScore(data.risk);
        setAlerts(prev => [data, ...prev].slice(0, 50));
      }
    });
    return () => newSocket.close();
  }, []);

  // --- FEATURE: CLIPBOARD SCAN ---
  const handleClipboardScan = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setSimText(text);
      // Auto-trigger analysis
      handleAnalysis(text, "Clipboard_Scan");
    } catch (err) {
      alert("Permission needed to read clipboard. Please paste manually.");
    }
  };

  // --- FEATURE: VISHING (VOICE) DETECTION ---
  const handleVoiceListen = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Voice not supported in this browser. Try Chrome.");
      return;
    }
    setIsListening(true);
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US'; // Could switch based on 'language' state

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSimText(transcript);
      handleAnalysis(transcript, "Voice_Call_Listener");
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleAnalysis = async (text, source) => {
    const edgeRisk = riskEngine.analyzeText(text);
    const optimisticAlert = {
      id: Date.now(), type: source === "Voice_Call_Listener" ? 'Vishing' : 'Message',
      content: text, sender: source,
      risk: edgeRisk > 0.5 ? edgeRisk : 0.05, triggers: edgeRisk > 0.5 ? ["Keyword_Match"] : [],
      isEdge: true, timestamp: new Date().toISOString()
    };
    setAlerts(prev => [optimisticAlert, ...prev]);
    if (edgeRisk > 0.5) setRiskScore(edgeRisk);

    try {
      await fetch(`${SOCKET_URL}/api/ingest/sms`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sender: source })
      });
    } catch (err) { console.error(err); }
  };

  const strings = {
    EN: {
      vishing: "Vishing Monitor", clip: "Scan Clipboard",
      dash_title: "Activity Feed",
      global_live: "Network Live"
    },
    HI: {
      vishing: "कॉल मॉनिटर", clip: "क्लिपबोर्ड स्कैन",
      dash_title: "गतिविधि फ़ीड",
      global_live: "नेटवर्क लाइव"
    }
  };
  const t = strings[language];

  return (
    <div className="flex min-h-screen bg-[#FDFBF7] font-sans text-stone-900">

      {/* SIDEBAR */}
      {/* SIDEBAR */}
      <aside className="w-20 lg:w-64 bg-white border-r border-stone-200 hidden md:flex flex-col p-4 h-screen transition-all relative z-40">
        <div className="flex items-center gap-3 mb-10 pl-2">
          <div className="w-10 h-10 bg-fin-blue rounded-xl flex items-center justify-center text-white shadow-blue-200 shadow-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <span className="font-bold text-lg hidden lg:block">Raksha<span className="text-stone-400">Pay</span></span>
        </div>
        <nav className="space-y-2">
          <NavButton icon={LayoutTemplate} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavButton icon={Globe} label="Network Map" />
          <NavButton icon={Users} label="Crowd Intel" />
        </nav>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto w-full relative z-20">
        <header className="flex justify-between items-center mb-8 relative z-50">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Threat Console</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-stone-500">{t.global_live}: {globalStats.count} Nodes</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleVoiceListen}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white border border-stone-200 hover:bg-stone-50'
                }`}
            >
              <Mic className="w-4 h-4" /> {isListening ? 'Listening...' : t.vishing}
            </button>
            <button
              onClick={handleClipboardScan}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-full font-bold text-sm hover:bg-black"
            >
              <Clipboard className="w-4 h-4" /> {t.clip}
            </button>
          </div>
        </header>

        {/* DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: RISK ORB */}
          <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-stone-100 shadow-sm flex flex-col items-center">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-6 w-full">Local Threat Index</h3>
            <RiskOrb riskScore={riskScore} />
            <div className="mt-8 text-center text-3xl font-bold text-stone-800">
              {Math.round(riskScore * 100)}<span className="text-lg text-stone-300">/100</span>
            </div>
          </div>

          {/* MIDDLE: REAL TIME FEED */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-100 shadow-sm flex flex-col h-[500px]">
            <div className="p-4 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <h3 className="font-bold text-stone-700 flex items-center gap-2">
                <Activity className="w-4 h-4 text-fin-blue" /> {t.dash_title}
              </h3>
              <span className="text-[10px] font-mono text-stone-400">WS_STREAM_ACTIVE</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              <AnimatePresence>
                {alerts.map(alert => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border flex justify-between items-center ${alert.risk > 0.6
                      ? 'bg-red-50 border-red-100'
                      : 'bg-white border-stone-100 hover:border-stone-200'
                      }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-stone-800">{alert.sender}</span>
                        {alert.type === 'Vishing' && <span className="bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 rounded">VOICE</span>}
                        {alert.isEdge && <span className="bg-stone-100 text-stone-500 text-[9px] font-bold px-1.5 rounded">LOCAL</span>}
                      </div>
                      <div className="text-xs text-stone-500 truncate max-w-[300px]">{alert.content}</div>
                    </div>

                    <div className="text-right">
                      <div className={`text-xs font-bold ${alert.risk > 0.6 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {alert.risk > 0.6 ? 'THREAT' : 'SAFE'}
                      </div>
                      <div className="text-[9px] font-mono text-stone-400">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-stone-900 text-white rounded-xl flex justify-between items-center">
            <div>
              <div className="text-xs opacity-50 uppercase">Network Blocks</div>
              <div className="text-2xl font-bold">{globalStats.blocked.toLocaleString()}</div>
            </div>
            <ShieldAlert className="w-8 h-8 opacity-20" />
          </div>
          {/* ... More stats */}
        </div>

      </main>
    </div>
  );
}

const NavButton = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className="w-full h-10 flex items-center gap-3 px-3 rounded-lg text-sm font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-900 lg:justify-start justify-center">
    <Icon className="w-5 h-5" />
    <span className="hidden lg:block">{label}</span>
  </button>
)

export default App;
