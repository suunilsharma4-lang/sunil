import React, { useState } from 'react';
import { AppState, User, UserRole } from '../../types';
import { UserCheck, Plus, Shield, User as UserIcon, Trash2, Key } from 'lucide-react';

interface UserManagementProps {
  state: AppState;
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  state,
  onAddUser,
  onDeleteUser,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('staff');
  const [phone, setPhone] = useState('');

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim()) return;

    const newUser: User = {
      id: `user-${Date.now()}`,
      username: username.trim().toLowerCase(),
      name: name.trim(),
      role,
      phone: phone.trim(),
    };

    onAddUser(newUser);
    setIsModalOpen(false);
    setUsername('');
    setName('');
    setPhone('');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <UserCheck className="w-6 h-6 text-emerald-600" />
            <span>Staff & User Access Control</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage admin and staff accounts, role permissions, and cashier credentials.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {/* User Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {state.users.map((u) => (
          <div key={u.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white ${
                    u.role === 'admin' ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                >
                  {u.role === 'admin' ? '👑' : '👤'}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{u.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">Username: {u.username}</p>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                  u.role === 'admin'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-blue-100 text-blue-800 border border-blue-300'
                }`}
              >
                {u.role}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>{u.phone ? `📞 ${u.phone}` : 'No phone listed'}</span>
              
              {u.username !== 'admin' && u.username !== '23571113' && u.username.toLowerCase() !== 'sunil' && (
                <button
                  onClick={() => {
                    if (confirm(`Delete account for ${u.name}?`)) {
                      onDeleteUser(u.id);
                    }
                  }}
                  className="text-rose-600 hover:text-rose-800 font-bold"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 max-w-md w-full space-y-4">
            <h3 className="font-extrabold text-base text-slate-900">Add Staff Account</h3>

            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Shrestha"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. maya"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-white"
                >
                  <option value="staff">Staff (Sales & Billing Access Only)</option>
                  <option value="admin">Admin (Full System Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  placeholder="98XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-extrabold text-xs rounded-xl cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
