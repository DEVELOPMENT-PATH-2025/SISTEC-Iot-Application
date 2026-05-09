import React, { useState, useEffect } from 'react';
import { User as AuthUser, signOut } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { formatInTimeZone } from 'date-fns-tz';
import { 
  Thermometer, 
  Droplets, 
  Monitor, 
  History, 
  Trash2, 
  LogOut, 
  Send,
  Calendar,
  Clock,
  Menu,
  X,
  User as UserIcon,
  Cpu,
  RefreshCcw
} from 'lucide-react';
import { motion } from 'motion/react';

interface Reading {
  id: string;
  temperature: number;
  humidity: number;
  timestamp: any;
}

const TIMEZONE = 'Asia/Kolkata';

export default function Dashboard({ user }: { user: AuthUser }) {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [lcdText, setLcdText] = useState('');
  const [isUpdatingLcd, setIsUpdatingLcd] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "readings"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reading[];
      setReadings(data);
    });
    return () => unsubscribe();
  }, []);

  const latest = readings[0];

  const handleLcdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lcdText.trim()) return;
    setIsUpdatingLcd(true);
    try {
      const response = await fetch('/api/lcd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lcdText.substring(0, 16) }),
      });
      if (response.ok) {
        alert('LCD Updated Successfully!');
        setLcdText('');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to update LCD');
    } finally {
      setIsUpdatingLcd(false);
    }
  };

  const deleteReading = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      try {
        await deleteDoc(doc(db, "readings", id));
      } catch (err) {
        console.error(err);
        alert('Failed to delete');
      }
    }
  };

  const formatDate = (ts: any) => {
    if (!ts) return 'N/A';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return formatInTimeZone(date, TIMEZONE, 'dd-MM-yyyy');
  };

  const formatTime = (ts: any) => {
    if (!ts) return 'N/A';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return formatInTimeZone(date, TIMEZONE, 'hh:mm a');
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col font-sans overflow-x-hidden">
      {/* Navigation Bar */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-8 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
            <Cpu className="text-white w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white hidden sm:inline">SISTec IoT Application 2026</span>
          <span className="text-lg font-bold tracking-tight text-white inline sm:hidden">SISTec IoT</span>
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:block text-right">
            <p className="text-[10px] text-slate-400 leading-none mb-1 uppercase tracking-tighter">Welcome,</p>
            <p className="text-sm font-semibold text-white">{user.displayName || 'User'}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white uppercase sm:hidden lg:flex">
            {getInitials(user.displayName)}
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Main Content Dashboard */}
      <main className="flex-1 p-4 lg:p-8 grid grid-cols-12 gap-6 bg-[radial-gradient(circle_at_top_right,_#1a1005_0%,_transparent_40%)]">
        
        {/* Left Column: Metrics & Control */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          
          {/* Section 1: Real-time Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl flex flex-col justify-between backdrop-blur-sm group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em]">Temperature</span>
                <Thermometer className="w-4 h-4 text-orange-500/50 group-hover:text-orange-500 transition-colors" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-5xl font-light text-white leading-none">
                  {latest?.temperature || '--'}<span className="text-2xl text-slate-500">°C</span>
                </h2>
                <div className="mt-6 space-y-1">
                  <p className="text-[10px] text-slate-400 font-mono uppercase">Update: {formatTime(latest?.timestamp)}</p>
                  <p className="text-[10px] text-slate-600 font-mono">{formatDate(latest?.timestamp)}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl flex flex-col justify-between backdrop-blur-sm group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Humidity</span>
                <Droplets className="w-4 h-4 text-blue-400/50 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-5xl font-light text-white leading-none">
                  {latest?.humidity || '--'}<span className="text-2xl text-slate-500">%</span>
                </h2>
                <div className="mt-6 space-y-1">
                  <p className="text-[10px] text-slate-400 font-mono uppercase">Update: {formatTime(latest?.timestamp)}</p>
                  <p className="text-[10px] text-slate-600 font-mono">{formatDate(latest?.timestamp)}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Section 2: LCD Command Center */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-8 bg-black/60 border border-white/10 rounded-2xl shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] pointer-events-none"></div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-300">LCD Hardware Control</h3>
            </div>
            
            <form onSubmit={handleLcdSubmit} className="space-y-4">
              <label className="block text-[10px] text-slate-500 uppercase font-bold tracking-widest">Display Message (Max 16 Chars)</label>
              <div className="relative">
                <input 
                  type="text" 
                  maxLength={16} 
                  value={lcdText}
                  onChange={(e) => setLcdText(e.target.value)}
                  placeholder="WELCOME SISTec" 
                  className="w-full bg-black border border-white/10 rounded-lg p-5 font-mono text-xl text-green-400 placeholder-white/5 focus:outline-none focus:border-orange-500/50 transition-all shadow-inner uppercase"
                />
                <span className="absolute right-4 bottom-[-1.5rem] text-[10px] text-slate-600 font-mono">
                  {lcdText.length} / 16 chars
                </span>
              </div>
              <button 
                disabled={isUpdatingLcd}
                className="w-full mt-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-xs rounded-lg hover:bg-orange-500 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-95"
              >
                {isUpdatingLcd ? 'PROCESSING...' : 'Overwrite lcd.txt'}
              </button>
            </form>
          </motion.div>

          {/* Tech Specs Indicator */}
          <div className="mt-auto p-4 flex items-center gap-4 bg-slate-900/30 rounded-xl border border-white/5">
            <div className="text-[9px] sm:text-[10px] font-mono text-slate-500">
              <span className="text-slate-400">STATUS:</span> <span className="text-green-500/80">ONLINE</span> <br />
              <span className="text-slate-400">I2C ADDR:</span> 0x27 | <span className="text-slate-400">DHT11:</span> D5
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="text-[9px] sm:text-[10px] font-mono text-slate-500">
              <span className="text-slate-400">TIMEZONE:</span> IST (Asia/Kolkata) <br />
              <span className="text-slate-400">RECS:</span> {readings.length}
            </div>
            <div className="ml-auto">
               <RefreshCcw className="w-3 h-3 text-slate-700 hover:text-slate-400 cursor-pointer transition-colors" />
            </div>
          </div>
        </div>

        {/* Right Column: History Table */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="col-span-12 lg:col-span-7 bg-slate-900/40 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-sm"
        >
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/2">
            <div className="flex items-center gap-3">
              <History className="w-4 h-4 text-orange-500" />
              <h3 className="font-semibold uppercase tracking-widest text-sm text-white">Sensor Record History</h3>
            </div>
            <div className="text-[10px] bg-slate-800/80 border border-white/5 px-3 py-1.5 rounded text-slate-400 uppercase tracking-widest font-bold">
              LOG VOLUME: {(readings.length / 1024).toFixed(2)} KB
            </div>
          </div>
          
          <div className="flex-1 overflow-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="text-[10px] text-slate-500 uppercase tracking-tighter bg-black border-b border-white/5 font-mono">
                  <th className="p-4 px-6">#</th>
                  <th className="p-4">Temperature</th>
                  <th className="p-4">Humidity</th>
                  <th className="p-4">Time</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm font-mono whitespace-nowrap">
                {readings.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-white/5 transition-colors group ${idx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'} hover:bg-white/[0.05]`}>
                    <td className="p-4 px-6 text-slate-600">{(readings.length - idx).toString().padStart(2, '0')}</td>
                    <td className="p-4 text-white font-medium">{r.temperature} 'C</td>
                    <td className="p-4 text-white font-medium">{r.humidity} %</td>
                    <td className="p-4 text-slate-400 group-hover:text-slate-300">{formatTime(r.timestamp)}</td>
                    <td className="p-4 text-slate-400 group-hover:text-slate-300">{formatDate(r.timestamp)}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => deleteReading(r.id)}
                        className="text-[10px] text-red-500/50 hover:text-red-400 hover:bg-red-500/10 px-2 py-1 rounded transition-all font-bold uppercase tracking-tighter"
                      >
                        [Delete]
                      </button>
                    </td>
                  </tr>
                ))}
                {readings.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-600 uppercase tracking-widest text-xs">
                      No Records Detected
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 text-center text-[10px] text-slate-600 font-mono border-t border-white/5 bg-black/40 uppercase tracking-widest">
            End of Data Stream | SISTec IoT System 2026
          </div>
        </motion.div>
      </main>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
