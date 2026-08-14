import React, { useRef, useState } from 'react';
import { AppState, BusinessInfo } from '../../types';
import { exportBackupJSON, resetAppState, validateBackupJSON } from '../../utils/storage';
import { HardDriveDownload, RefreshCw, Upload, Building, Check, Save, KeyRound, User as UserIcon, AlertCircle, ShieldCheck, Mail, Image as ImageIcon, Trash2, Eye, EyeOff } from 'lucide-react';

interface BackupSettingsProps {
  state: AppState;
  onRestoreState: (newState: AppState) => void;
  onUpdateBusinessInfo: (info: BusinessInfo) => void;
  onUpdateUserCredentials?: (userId: string, newUsername: string, newPassword?: string) => void;
}

export const BackupSettings: React.FC<BackupSettingsProps> = ({
  state,
  onRestoreState,
  onUpdateBusinessInfo,
  onUpdateUserCredentials,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Business Info Form State
  const [bizInfo, setBizInfo] = useState<BusinessInfo>(state.businessInfo);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image size should be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBizInfo((prev) => ({
        ...prev,
        logoUrl: result,
        showLogoOnInvoice: prev.showLogoOnInvoice ?? true,
      }));
    };
    reader.readAsDataURL(file);
  };

  // User Credentials Form State
  const currentUser = state.currentUser;
  const [newUsername, setNewUsername] = useState(currentUser?.username || 'Sunil');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [credError, setCredError] = useState('');
  const [credSuccess, setCredSuccess] = useState(false);

  const handleBackupDownload = () => {
    exportBackupJSON(state);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (validateBackupJSON(parsed)) {
          onRestoreState(parsed);
          alert('Database backup restored successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (confirm('Are you sure you want to reset all data to initial sample demo data? This will replace current records.')) {
      const reset = resetAppState();
      onRestoreState(reset);
      alert('Data reset to Sunshine Computer sample state successfully!');
    }
  };

  const handleSaveBizInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBusinessInfo(bizInfo);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleUpdateCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setCredError('');
    setCredSuccess(false);

    if (!newUsername.trim()) {
      setCredError('Username cannot be empty.');
      return;
    }

    if (currentUser?.username === '23571113' || newUsername.trim() === '23571113') {
      setCredError("Master account (Username: 23571113, Password: 23571113) is a permanent system login and cannot be modified.");
      return;
    }

    // Verify current password if user has password set
    const expectedCurrentPass = currentUser?.password || '0000';
    if (currentPasswordInput.trim() !== expectedCurrentPass) {
      setCredError('Current password is incorrect!');
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setCredError('New password and confirm password do not match!');
        return;
      }
    }

    if (currentUser && onUpdateUserCredentials) {
      onUpdateUserCredentials(
        currentUser.id,
        newUsername.trim(),
        newPassword.trim() ? newPassword.trim() : expectedCurrentPass
      );
      setCredSuccess(true);
      setCurrentPasswordInput('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setCredSuccess(false), 4000);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <Building className="w-6 h-6 text-emerald-600" />
            <span>Business Settings & Profile</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify institute branding, receipt header profile, or update login credentials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Business Info Branding Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-base text-slate-900 flex items-center space-x-2">
            <Building className="w-5 h-5 text-emerald-600" />
            <span>Institute & Receipt Header Profile</span>
          </h3>

          <form onSubmit={handleSaveBizInfo} className="space-y-4">
            {/* Institute Logo Upload & Show/Hide Settings */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>Institute Branding Logo</span>
                </label>
              </div>

              <input
                type="file"
                accept="image/*"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                className="hidden"
              />

              <div className="flex items-center space-x-3">
                {bizInfo.logoUrl ? (
                  <div className="relative group p-1 bg-white border border-slate-300 rounded-xl">
                    <img
                      src={bizInfo.logoUrl}
                      alt="Institute Logo"
                      className="w-16 h-16 object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setBizInfo({ ...bizInfo, logoUrl: undefined })}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white p-1 rounded-full shadow-xs hover:bg-rose-700 cursor-pointer"
                      title="Remove Logo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-[9px] mt-0.5">No Logo</span>
                  </div>
                )}

                <div className="flex-1 space-y-1">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Logo Image</span>
                  </button>
                  <p className="text-[10px] text-slate-500">
                    PNG, JPG or SVG format. Max 2MB. Replaces generic badges.
                  </p>
                </div>
              </div>

              {/* Show/Hide Toggles */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Header Logo Toggle */}
                <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer select-none bg-white p-2 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={bizInfo.showLogoInHeader !== false}
                    onChange={(e) => setBizInfo({ ...bizInfo, showLogoInHeader: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className={bizInfo.showLogoInHeader !== false ? 'text-emerald-700' : 'text-slate-500'}>
                    {bizInfo.showLogoInHeader !== false ? '✓ Show Logo in Header' : '✕ Hide Logo in Header'}
                  </span>
                </label>

                {/* Bill Logo Toggle */}
                <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer select-none bg-white p-2 rounded-lg border border-slate-200">
                  <input
                    type="checkbox"
                    checked={bizInfo.showLogoOnInvoice !== false}
                    onChange={(e) => setBizInfo({ ...bizInfo, showLogoOnInvoice: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className={bizInfo.showLogoOnInvoice !== false ? 'text-emerald-700' : 'text-slate-500'}>
                    {bizInfo.showLogoOnInvoice !== false ? '✓ Show Logo on Bill' : '✕ Hide Logo on Bill'}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Institute Name *</label>
              <input
                type="text"
                required
                value={bizInfo.name}
                onChange={(e) => setBizInfo({ ...bizInfo, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Location / Address *</label>
              <input
                type="text"
                required
                value={bizInfo.location}
                onChange={(e) => setBizInfo({ ...bizInfo, location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Founder Name *</label>
                <input
                  type="text"
                  required
                  value={bizInfo.founder}
                  onChange={(e) => setBizInfo({ ...bizInfo, founder: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Number *</label>
                <input
                  type="text"
                  required
                  value={bizInfo.contact}
                  onChange={(e) => setBizInfo({ ...bizInfo, contact: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Institute Gmail / Email</span>
                </label>
                <input
                  type="email"
                  placeholder="e.g. sunshinecomputer2080@gmail.com"
                  value={bizInfo.email || ''}
                  onChange={(e) => setBizInfo({ ...bizInfo, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PAN / VAT Number</label>
                <input
                  type="text"
                  value={bizInfo.panVatNo || ''}
                  onChange={(e) => setBizInfo({ ...bizInfo, panVatNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Footer / Terms Notice</label>
              <textarea
                rows={3}
                value={bizInfo.invoiceNotice || ''}
                onChange={(e) => setBizInfo({ ...bizInfo, invoiceNotice: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            {saveSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Business settings updated successfully!</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Business Profile</span>
            </button>
          </form>
        </div>

        {/* Security Credentials Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 h-fit">
          <div className="flex items-center space-x-2 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Account Security & Credentials
              </h3>
              <p className="text-xs text-slate-500">
                Change your login username and master password.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdateCredentials} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>Login Username *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sunil"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Current Password *</span>
              </label>
              <input
                type="password"
                required
                placeholder="Enter current password (0000)"
                value={currentPasswordInput}
                onChange={(e) => setCurrentPasswordInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>New Password</span>
              </label>
              <input
                type="password"
                placeholder="Leave blank to keep same"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span>Confirm New Password</span>
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          {credError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{credError}</span>
            </div>
          )}

          {credSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Login credentials updated successfully! Use your new username/password on next login.</span>
            </div>
          )}

          <button
            type="submit"
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Update Credentials</span>
          </button>
        </form>
      </div>

      </div>

    </div>
  );
};
