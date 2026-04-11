import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, History, Trophy, LogOut, Menu, Zap, Clock, Terminal, Play, CheckCircle, Calendar, XCircle } from 'lucide-react';

const quotes = [
  "Code is like humor. When you have to explain it, it’s bad.",
  "First, solve the problem. Then, write the code.",
  "Make it work, make it right, make it fast.",
  "Simplicity is the soul of efficiency."
];

function App() {
  // --- STATE MANAGEMENT ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  
  const [activeView, setActiveView] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quote, setQuote] = useState(quotes[0]);

  const [input, setInput] = useState("");
  const [scheduleDate, setScheduleDate] = useState(""); 
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeTask, setActiveTask] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [taskHistory, setTaskHistory] = useState([]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval;
    if (activeTask) {
      interval = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [activeTask]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- AUTHENTICATION LOGIC ---
  const handleAuth = () => {
    if (username.trim() === "" || password.trim() === "") return alert("ERROR: Credentials cannot be empty.");
    const usersDB = JSON.parse(localStorage.getItem('smart_schedule_users')) || {};

    if (authMode === 'signup') {
      if (usersDB[username]) return alert("ERROR: User already exists! Please Login.");
      usersDB[username] = password;
      localStorage.setItem('smart_schedule_users', JSON.stringify(usersDB));
      alert("ACCOUNT CREATED! Logging you in...");
    } else {
      if (!usersDB[username] || usersDB[username] !== password) return alert("ACCESS DENIED: Incorrect username or password.");
    }
    
    // NEW: Load the specific user's history from Local Storage
    const historyDB = JSON.parse(localStorage.getItem('smart_schedule_history')) || {};
    setTaskHistory(historyDB[username] || []);

    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    setIsLoggedIn(true);
  };

  const confirmLogout = () => {
    setIsLoggedIn(false);
    setShowLogoutPopup(false);
    setUsername(""); setPassword("");
    setTasks([]); setActiveTask(null); setTimeElapsed(0);
    
    // NEW: Clear the history from memory so the next user doesn't see it
    setTaskHistory([]); 
  };

  // --- AI & TASK ACTIONS ---
  const handleGenerate = async () => {
    if (!input || !scheduleDate) return alert("Please provide both parameters and select a date from the calendar.");
    setLoading(true);
    try {
      const res = await axios.post('https://smart-schedule-drab.vercel.app/generate', {
        userInput: `For the date ${scheduleDate}: ${input}` 
      });
      setTasks(res.data);
    } catch (err) { 
      alert("System Error: Connection to AI Neural Net failed."); 
    }
    setLoading(false);
  };

  const startAITask = (task) => {
    if (activeTask) return alert("A protocol is already running! Complete it first.");
    setActiveTask(task);
    setTimeElapsed(0);
  };

  // NEW: Helper function to save to state AND Local Storage
  const updateAndSaveHistory = (newTask) => {
    const updatedHistory = [...taskHistory, newTask];
    setTaskHistory(updatedHistory);
    
    // Save to the database under this specific username
    const historyDB = JSON.parse(localStorage.getItem('smart_schedule_history')) || {};
    historyDB[username] = updatedHistory;
    localStorage.setItem('smart_schedule_history', JSON.stringify(historyDB));
  };

  const completeTask = () => {
    updateAndSaveHistory({ ...activeTask, actualTime: formatTime(timeElapsed), date: scheduleDate || "Unspecified", status: 'completed' });
    setTasks(tasks.filter(t => t.title !== activeTask.title));
    setActiveTask(null);
  };

  const cancelTask = () => {
    updateAndSaveHistory({ ...activeTask, actualTime: formatTime(timeElapsed), date: scheduleDate || "Unspecified", status: 'cancelled' });
    setTasks(tasks.filter(t => t.title !== activeTask.title));
    setActiveTask(null);
  };

  // --- RENDER LOGIN / SIGNUP SCREEN ---
  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#050505', color: '#00ffcc', fontFamily: 'monospace' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '400px', padding: '40px', backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', boxShadow: '0 0 30px rgba(0,255,204,0.1)' }}>
          <h2 style={{ textAlign: 'center', margin: '0 0 5px 0', color: '#fff' }}>SYSTEM.SCHEDULE</h2>
          <h4 style={{ textAlign: 'center', margin: '0 0 30px 0', color: '#00ffcc', letterSpacing: '2px' }}>
            {authMode === 'login' ? 'SECURE LOGIN' : 'CREATE ACCOUNT'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <input type="text" placeholder="USERNAME" style={inputStyle} value={username} onChange={(e) => setUsername(e.target.value)} />
            <input type="password" placeholder="PASSWORD" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAuth()} />
            <motion.button onClick={handleAuth} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} style={buttonStyle}>
              {authMode === 'login' ? 'AUTHENTICATE' : 'REGISTER SYSTEM'}
            </motion.button>
            <p style={{ textAlign: 'center', color: '#888', cursor: 'pointer', marginTop: '10px' }} onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
              {authMode === 'login' ? "New user? Click here to Sign Up." : "Already have an account? Login here."}
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- RENDER MAIN DASHBOARD ---
  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#050505', color: '#fff', fontFamily: 'monospace', overflow: 'hidden' }}>
      
      {/* SIDEBAR */}
      <motion.div animate={{ width: sidebarOpen ? '250px' : '70px' }} style={{ backgroundColor: '#0a0a0a', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', transition: 'width 0.3s' }}>
        <div style={{ padding: '20px', display: 'flex', justifyContent: sidebarOpen ? 'space-between' : 'center', alignItems: 'center', borderBottom: '1px solid #222' }}>
          {sidebarOpen && <span style={{ color: '#00ffcc', fontWeight: 'bold' }}>MENU</span>}
          <Menu size={24} color="#00ffcc" style={{ cursor: 'pointer' }} onClick={() => setSidebarOpen(!sidebarOpen)} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px 10px', flexGrow: 1 }}>
          <SidebarItem icon={<Home />} label="Dashboard" isOpen={sidebarOpen} isActive={activeView === 'home'} onClick={() => setActiveView('home')} />
          <SidebarItem icon={<History />} label="History" isOpen={sidebarOpen} isActive={activeView === 'history'} onClick={() => setActiveView('history')} />
          <SidebarItem icon={<Trophy />} label="Achievements" isOpen={sidebarOpen} isActive={activeView === 'achievements'} onClick={() => setActiveView('achievements')} />
        </div>
        <div style={{ padding: '20px 10px', borderTop: '1px solid #222' }}>
          <SidebarItem icon={<LogOut color="#ff4444" />} label="LOGOUT" isOpen={sidebarOpen} isActive={false} onClick={() => setShowLogoutPopup(true)} isDanger />
        </div>
      </motion.div>

      {/* MAIN CONTENT AREA */}
      <div style={{ flexGrow: 1, padding: '40px', overflowY: 'auto' }}>
        {activeView === 'home' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ maxWidth: '800px', margin: '0 auto' }}>
            
            <motion.div whileHover={{ scale: 1.01 }} style={{ padding: '20px', backgroundColor: '#111', borderLeft: '4px solid #00ffcc', marginBottom: '40px' }}>
              <h4 style={{ margin: 0, color: '#888', marginBottom: '10px' }}>// USER: {username.toUpperCase()} | DAILY_DIRECTIVE</h4>
              <p style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>"{quote}"</p>
            </motion.div>

            {/* ACTIVE TASK TIMER */}
            <AnimatePresence>
              {activeTask && (
                <motion.div initial={{ scale: 0.95, opacity: 0, height: 0 }} animate={{ scale: 1, opacity: 1, height: 'auto' }} exit={{ scale: 0.95, opacity: 0, height: 0 }} style={{ backgroundColor: '#001a11', border: '1px solid #00ffcc', padding: '30px', borderRadius: '8px', marginBottom: '40px', textAlign: 'center', boxShadow: '0 0 20px rgba(0, 255, 204, 0.2)' }}>
                  <h3 style={{ color: '#00ffcc', marginTop: 0 }}>ACTIVE PROTOCOL: {activeTask.title}</h3>
                  <p style={{ color: '#888' }}>Target Duration: {activeTask.duration}</p>
                  <div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '10px 0', textShadow: '0 0 15px #00ffcc' }}>
                    {formatTime(timeElapsed)}
                  </div>
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    <button onClick={cancelTask} style={{ ...buttonStyle, width: '200px', borderColor: '#ff4444', color: '#ff4444', backgroundColor: 'transparent' }}>
                      <XCircle size={20} style={{ marginRight: '10px' }} /> CANCEL TASK
                    </button>
                    <button onClick={completeTask} style={{ ...buttonStyle, width: '200px', backgroundColor: '#00ffcc', color: '#000' }}>
                      <CheckCircle size={20} style={{ marginRight: '10px' }} /> MARK AS ACHIEVED
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI INPUT CONSOLE */}
            <div style={{ backgroundColor: '#0a0a0a', padding: '20px', border: '1px solid #222', borderRadius: '8px', marginBottom: '40px' }}>
              <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Terminal size={18} color="#00ffcc" /> AI_SCHEDULE_GENERATOR
              </h3>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', backgroundColor: '#111', border: '1px solid #333', borderRadius: '4px', padding: '0 15px' }}>
                  <Calendar size={18} color="#888" style={{ marginRight: '10px' }} />
                  <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} style={{ ...inputStyle, border: 'none', padding: '15px 0' }} />
                </div>
              </div>

              <textarea rows="3" placeholder="Enter parameters (e.g., Classes till 2, need 3 hours for project, gym at 7)..." value={input} onChange={(e) => setInput(e.target.value)} style={{ ...inputStyle, resize: 'vertical', marginBottom: '15px' }} />
              <motion.button onClick={handleGenerate} disabled={loading} whileHover={{ scale: 1.02, boxShadow: '0 0 15px rgba(0, 255, 204, 0.4)' }} whileTap={{ scale: 0.98 }} style={{ ...buttonStyle, color: loading ? '#555' : '#00ffcc' }}>
                {loading ? "PROCESSING NEURAL NET..." : <><Zap size={20} /> COMPILE SCHEDULE</>}
              </motion.button>
            </div>

            {/* GENERATED TASKS LIST */}
            <div>
              <AnimatePresence>
                {tasks.map((t, index) => (
                  <motion.div key={index + t.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '15px 20px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '4px', marginBottom: '15px', borderLeft: '3px solid #00ffcc' }}>
                    <Clock size={24} color="#00ffcc" />
                    <div style={{ flexGrow: 1 }}>
                      <div style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '1rem' }}>{t.time}</div>
                      <div style={{ fontSize: '1.2rem', color: '#fff' }}>{t.title}</div>
                    </div>
                    <span style={{ color: '#0a0a0a', backgroundColor: '#00ffcc', padding: '5px 10px', borderRadius: '2px', fontWeight: 'bold', marginRight: '15px' }}>{t.duration}</span>
                    <motion.button onClick={() => startAITask(t)} whileHover={{ scale: 1.1, color: '#fff' }} whileTap={{ scale: 0.9 }} style={{ backgroundColor: 'transparent', border: 'none', color: '#00ffcc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }} title="Start Timer">
                      <Play size={28} />
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* HISTORY TAB */}
        {activeView === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2>YOUR_ARCHIVES</h2>
            {taskHistory.length === 0 ? <p style={{ color: '#888' }}>No tasks logged yet.</p> : (
              taskHistory.map((task, i) => (
                <div key={i} style={{ backgroundColor: '#111', padding: '15px', borderLeft: `3px solid ${task.status === 'completed' ? '#00ffcc' : '#ff4444'}`, marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: '#888', fontSize: '0.9rem', marginRight: '15px' }}>{task.date}</span>
                    <span style={{ fontSize: '1.1rem', color: task.status === 'completed' ? '#fff' : '#aaa', textDecoration: task.status === 'cancelled' ? 'line-through' : 'none' }}>
                      {task.status === 'completed' ? 
                        <CheckCircle size={16} color="#00ffcc" style={{ marginRight: '10px', display: 'inline', verticalAlign: 'middle' }}/> : 
                        <XCircle size={16} color="#ff4444" style={{ marginRight: '10px', display: 'inline', verticalAlign: 'middle' }}/>
                      } 
                      {task.title}
                    </span>
                  </div>
                  <span style={{ color: task.status === 'completed' ? '#00ffcc' : '#ff4444', backgroundColor: task.status === 'completed' ? '#003322' : '#330000', padding: '5px 10px', borderRadius: '4px' }}>
                    Logged: {task.actualTime}
                  </span>
                </div>
              ))
            )}
          </motion.div>
        )}

        {/* ACHIEVEMENTS TAB */}
        {activeView === 'achievements' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Trophy color="#ffd700" /> YOUR_TROPHIES</h2>
            {taskHistory.filter(t => t.status === 'completed').length === 0 ? <p style={{ color: '#888' }}>No achievements unlocked yet. Complete a task!</p> : (
              taskHistory.filter(t => t.status === 'completed').map((task, i) => (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} style={{ backgroundColor: '#0a0a0a', padding: '20px', border: '1px solid #332200', borderRadius: '8px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 0 15px rgba(255, 215, 0, 0.1)' }}>
                  <div>
                    <span style={{ color: '#ffd700', fontWeight: 'bold', fontSize: '1.2rem', display: 'block', marginBottom: '5px' }}>{task.title}</span>
                    <span style={{ color: '#888', fontSize: '0.9rem' }}>Conquered on {task.date}</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Trophy size={30} color="#ffd700" style={{ marginBottom: '5px' }} />
                    <div style={{ color: '#ffd700', fontSize: '0.8rem', fontWeight: 'bold' }}>{task.actualTime}</div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>

      {/* LOGOUT POPUP */}
      {showLogoutPopup && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#0a0a0a', border: '1px solid #ff4444', padding: '30px', width: '400px', textAlign: 'center' }}>
            <h2 style={{ color: '#ff4444' }}>TERMINATE SESSION?</h2>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button onClick={() => setShowLogoutPopup(false)} style={{ ...buttonStyle, borderColor: '#555', color: '#fff' }}>CANCEL</button>
              <button onClick={confirmLogout} style={{ ...buttonStyle, borderColor: '#ff4444', color: '#ff4444' }}>CONFIRM LOGOUT</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarItem({ icon, label, isOpen, isActive, onClick, isDanger }) {
  return (
    <motion.div whileHover={{ backgroundColor: isDanger ? '#330000' : '#111', x: 5 }} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', cursor: 'pointer', borderRadius: '4px', backgroundColor: isActive ? '#111' : 'transparent', borderLeft: isActive ? '3px solid #00ffcc' : '3px solid transparent', color: isDanger ? '#ff4444' : (isActive ? '#00ffcc' : '#888') }}>
      {icon}
      {isOpen && <span style={{ fontWeight: 'bold' }}>{label}</span>}
    </motion.div>
  );
}
const inputStyle = { padding: '15px', backgroundColor: '#111', color: '#00ffcc', border: '1px solid #333', borderRadius: '4px', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' };
const buttonStyle = { padding: '15px', backgroundColor: 'transparent', color: '#00ffcc', border: '1px solid #00ffcc', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' };

export default App;