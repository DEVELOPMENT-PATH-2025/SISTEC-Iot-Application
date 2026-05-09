import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { UserPlus, User, Mail, Key, Cpu } from 'lucide-react';
import { motion } from 'motion/react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update Auth Profile
      await updateProfile(user, { displayName: name });

      // Create User Document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: name,
        email: email,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });

    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please login instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Ensure user document exists in Firestore (for Google sign-in)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        lastLogin: serverTimestamp(),
      }, { merge: true });

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#050505] p-4 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orange-600/5 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900/40 border border-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
            <Cpu className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Register Terminal</h1>
          <p className="text-slate-400 text-sm uppercase tracking-widest font-medium">Create hardware operator profile</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 text-red-400 p-4 rounded-xl text-xs font-bold uppercase tracking-widest mb-8 border border-red-500/20 text-center"
          >
            System Error: {error}
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Operator Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-xl text-white font-mono placeholder-slate-700 focus:border-blue-500/50 focus:bg-black/60 outline-none transition-all"
                placeholder="OPERATOR NAME"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Terminal ID (Email)</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-xl text-white font-mono placeholder-slate-700 focus:border-blue-500/50 focus:bg-black/60 outline-none transition-all"
                placeholder="EMAIL@SISTEC.AC.IN"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Access Key (Password)</label>
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/5 rounded-xl text-white font-mono placeholder-slate-700 focus:border-blue-500/50 focus:bg-black/60 outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-4 bg-white text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)] active:scale-[0.98] uppercase tracking-widest text-xs"
          >
            <UserPlus className="w-4 h-4" />
            Deploy Profile
          </button>
        </form>

        <div className="mt-8">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full"></div>
            <span className="bg-slate-900/0 px-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest absolute">AUTHENTICATION GATE</span>
          </div>
          <button
            onClick={handleGoogleLogin}
            className="w-full mt-8 bg-black/60 hover:bg-slate-800 text-white font-bold py-4 px-4 border border-white/10 rounded-xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-xs"
          >
            <img 
              src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" 
              className="w-5 h-5" 
              alt="Google" 
              referrerPolicy="no-referrer"
            />
            Continue with Google
          </button>
        </div>

        <p className="text-center mt-10 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
          Already registered?{' '}
          <Link to="/login" className="text-blue-500 hover:text-blue-400 transition-colors ml-1">
            Back to Terminal
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
