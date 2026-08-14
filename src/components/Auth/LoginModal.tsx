import React, { useState } from 'react';
import { User } from '../../types';
import { ShieldCheck, User as UserIcon, Lock, Sparkles, KeyRound, AlertTriangle } from 'lucide-react';

interface LoginModalProps {
  users: User[];
  onLogin: (user: User) => void;
  businessName: string;
  logoUrl?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  onLogin,
  businessName,
  logoUrl,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);

  const initials = businessName
    ? businessName
        .split(' ')
        .map((w) => w[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'SC';

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    // Direct check for default secret credentials & unchangeable master account 23571113
    if (
      (cleanUser === '23571113' && cleanPass === '23571113') ||
      (cleanUser.toLowerCase() === 'sunil' && cleanPass === 'Sunil369@')
    ) {
      const adminUser =
        users.find(
          (u) =>
            u.username === '23571113' || u.username.toLowerCase() === 'sunil'
        ) ||
        users[0] || {
          id: 'master-admin',
          name: 'Sunil Sharma (Founder)',
          username: '23571113',
          role: 'admin',
        };
      onLogin(adminUser);
      return;
    }

    // Look up user by username or fallback
    const userObj = users.find((u) => 
      u.username.toLowerCase() === cleanUser.toLowerCase() ||
      u.name.toLowerCase().includes(cleanUser.toLowerCase()) ||
      u.id === cleanUser.toLowerCase()
    );

    if (!userObj) {
      setError('User not found!');
      return;
    }

    const expectedPassword = userObj.password || 'Sunil369@';
    if (cleanPass !== expectedPassword) {
      setError('Invalid Password!');
      return;
    }

    onLogin(userObj);
  };

  // Check if logoUrl is a valid non-empty string
  const hasValidLogo = Boolean(logoUrl && logoUrl.trim().length > 0 && !imgError);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-6 text-white text-center space-y-2 relative">
          {hasValidLogo ? (
            <img
              src={logoUrl}
              alt="Logo"
              onError={() => setImgError(true)} // यदि Logo Load भएन भने Initials देखाउने
              className="w-16 h-16 object-contain rounded-2xl bg-white p-1 mx-auto shadow-xl shadow-emerald-950/60 border border-emerald-400/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-xl mx-auto shadow-xl shadow-emerald-950/60 border border-emerald-400/30">
              {initials}
            </div>
          )}
          <h2 className="font-extrabold text-lg text-white leading-snug">
            {businessName || 'Business ERP'}
          </h2>
          <p className="text-xs text-slate-300">
            Secure ERP Authorization Portal
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Username *</span>
            </label>
            <input
              type="text"
              required
              placeholder="Enter username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>Password *</span>
            </label>
            <input
              type="password"
              required
              placeholder="Enter password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center space-x-2 animate-pulse">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer transform hover:scale-[1.01]"
          >
            Sign In to System
          </button>
        </form>

      </div>
    </div>
  );
};
