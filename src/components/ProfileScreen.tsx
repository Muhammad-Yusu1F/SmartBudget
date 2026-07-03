/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { UserProfile, Transaction } from '../types';
import { 
  User, 
  Mail, 
  DollarSign, 
  Wallet, 
  Trash2, 
  Download, 
  Upload, 
  Check, 
  Sparkles,
  Camera,
  Image as ImageIcon,
  Bell,
  BellOff,
  MessageSquare,
  Clock,
  Send
} from 'lucide-react';
import { 
  triggerInstantNotification, 
  scheduleDailyReminder, 
  isNativePlatform 
} from '../lib/notifications';

const PRESET_AVATARS = [
  {
    name: 'Moviy',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%232563eb"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/><circle cx="50" cy="40" r="18" fill="white" fill-opacity="0.9"/><path d="M20,85 C20,68 35,62 50,62 C65,62 80,68 80,85 Z" fill="white" fill-opacity="0.9"/></svg>'
  },
  {
    name: 'Zumrad',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23059669"/><stop offset="100%" stop-color="%2314b8a6"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/><circle cx="50" cy="40" r="18" fill="white" fill-opacity="0.9"/><path d="M20,85 C20,68 35,62 50,62 C65,62 80,68 80,85 Z" fill="white" fill-opacity="0.9"/></svg>'
  },
  {
    name: 'Siyohrang',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%237c3aed"/><stop offset="100%" stop-color="%23f43f5e"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/><circle cx="50" cy="40" r="18" fill="white" fill-opacity="0.9"/><path d="M20,85 C20,68 35,62 50,62 C65,62 80,68 80,85 Z" fill="white" fill-opacity="0.9"/></svg>'
  },
  {
    name: 'Oltin',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23d97706"/><stop offset="100%" stop-color="%23f97316"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/><circle cx="50" cy="40" r="18" fill="white" fill-opacity="0.9"/><path d="M20,85 C20,68 35,62 50,62 C65,62 80,68 80,85 Z" fill="white" fill-opacity="0.9"/></svg>'
  },
  {
    name: 'Tungi',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23374151"/><stop offset="100%" stop-color="%23111827"/></linearGradient></defs><rect width="100" height="100" fill="url(%23g)"/><circle cx="50" cy="40" r="18" fill="white" fill-opacity="0.9"/><path d="M20,85 C20,68 35,62 50,62 C65,62 80,68 80,85 Z" fill="white" fill-opacity="0.9"/></svg>'
  }
];

const resizeAndConvertImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => {
        reject(new Error("Rasm yuklashda xatolik yuz berdi. Iltimos, boshqa rasm tanlang."));
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error("Faylni oʻqishda xatolik yuz berdi."));
    };
    reader.readAsDataURL(file);
  });
};

export const formatUzbekPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  let localDigits = digits;
  if (digits.startsWith('998')) {
    localDigits = digits.substring(3);
  }
  const truncated = localDigits.slice(0, 9);
  
  let formatted = '';
  if (truncated.length > 0) {
    formatted += truncated.slice(0, 2);
  }
  if (truncated.length > 2) {
    formatted += ' ' + truncated.slice(2, 5);
  }
  if (truncated.length > 5) {
    formatted += ' ' + truncated.slice(5, 7);
  }
  if (truncated.length > 7) {
    formatted += ' ' + truncated.slice(7, 9);
  }
  return formatted;
};

interface ProfileScreenProps {
  profile: UserProfile;
  baseBalance: number;
  onUpdateProfile: (profile: UserProfile) => void;
  onUpdateBaseBalance: (balance: number) => void;
  onResetData: () => void;
  onImportData: (transactionsJson: string, profileJson?: string) => boolean;
  transactionsJson: string; // For export
  transactions: Transaction[];
  currentBalance: number;
  onShowWebToast: (msg: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  baseBalance,
  onUpdateProfile,
  onUpdateBaseBalance,
  onResetData,
  onImportData,
  transactionsJson,
  transactions,
  currentBalance,
  onShowWebToast
}) => {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [currency, setCurrency] = useState(profile.currency);
  const [monthlyBudget, setMonthlyBudget] = useState(profile.monthlyBudget?.toString() || '');
  const [balanceInput, setBalanceInput] = useState(baseBalance.toString());
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile.notificationsEnabled ?? true);
  const [notificationTime, setNotificationTime] = useState(profile.notificationTime || '20:00');

  // Parse initial local phone digits
  const getInitialPhoneDigits = (rawPhone?: string): string => {
    if (!rawPhone) return '';
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('998')) {
      return formatUzbekPhone(digits.substring(3));
    }
    return formatUzbekPhone(digits);
  };

  const [phoneDigits, setPhoneDigits] = useState(getInitialPhoneDigits(profile.phoneNumber));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Iltimos, faqat rasm fayllarini yuklang.');
      return;
    }

    try {
      const resizedBase64 = await resizeAndConvertImage(file);
      setAvatarUrl(resizedBase64);
    } catch (err: any) {
      setUploadError(err.message || 'Rasm yuklashda xatolik.');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setUploadError('');
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Iltimos, faqat rasm fayllarini yuklang.');
      return;
    }

    try {
      const resizedBase64 = await resizeAndConvertImage(file);
      setAvatarUrl(resizedBase64);
    } catch (err: any) {
      setUploadError(err.message || 'Rasm yuklashda xatolik.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    const updatedProfile: UserProfile = {
      ...profile,
      name: name.trim() || 'Moliya Foydalanuvchisi',
      email: email.trim() || 'user@moliya.uz',
      avatarUrl: avatarUrl,
      currency: currency.trim() || 'UZS',
      monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : undefined,
      notificationsEnabled,
      notificationTime,
      phoneNumber: phoneDigits.trim() ? `+998${phoneDigits.replace(/\s/g, '')}` : ''
    };

    const parsedBalance = parseFloat(balanceInput);
    if (!isNaN(parsedBalance)) {
      onUpdateBaseBalance(parsedBalance);
    }

    onUpdateProfile(updatedProfile);

    // Reschedule local reminder
    scheduleDailyReminder(
      notificationTime,
      notificationsEnabled,
      transactions,
      parsedBalance || baseBalance,
      currency.trim() || 'UZS'
    );

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExport = () => {
    const fullBackup = {
      transactions: JSON.parse(transactionsJson),
      profile: {
        ...profile,
        name,
        email,
        avatarUrl,
        currency,
        monthlyBudget: monthlyBudget ? parseFloat(monthlyBudget) : undefined
      },
      baseBalance
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moliya_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.transactions && Array.isArray(parsed.transactions)) {
          // Trigger callbacks
          const success = onImportData(JSON.stringify(parsed.transactions), parsed.profile ? JSON.stringify(parsed.profile) : undefined);
          
          if (success) {
            if (parsed.baseBalance !== undefined) {
              onUpdateBaseBalance(parseFloat(parsed.baseBalance));
              setBalanceInput(parsed.baseBalance.toString());
            }
            if (parsed.profile) {
              setName(parsed.profile.name);
              setEmail(parsed.profile.email);
              setCurrency(parsed.profile.currency);
              setMonthlyBudget(parsed.profile.monthlyBudget?.toString() || '');
              if (parsed.profile.avatarUrl) {
                setAvatarUrl(parsed.profile.avatarUrl);
              }
            }
            setImportSuccess(true);
            setTimeout(() => setImportSuccess(false), 3000);
          } else {
            setImportError('Ma\'lumotlar formati mos kelmadi.');
          }
        } else {
          setImportError('Mos keluvchi zaxira fayli emas (transactions massivi topilmadi).');
        }
      } catch (err) {
        setImportError('Faylni o\'qishda xatolik yuz berdi. JSON formatini tekshiring.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-20 px-1 animate-in fade-in-50 duration-300">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Profil va Sozlamalar
      </h2>

      {/* Profile Card Summary & Avatar Customizer */}
      <div className="bg-white dark:bg-[#131b2e] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Avatar Edit Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative group w-24 h-24 rounded-full overflow-hidden shrink-0 border-4 ${
              isDragging 
                ? 'border-emerald-500 bg-emerald-500/10' 
                : 'border-primary/20 dark:border-white/10'
            } shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95`}
            title="Kompyuter yoki telefondan rasm yuklash uchun bosing yoki rasmni shu yerga tashlang"
          >
            <img 
              src={avatarUrl} 
              alt={name} 
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
              <Camera size={20} className="mb-0.5 animate-bounce" />
              <span className="text-[10px] font-bold text-center px-1">Yuklash</span>
            </div>
            {/* Dragging Overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center text-white">
                <Upload size={24} className="animate-pulse" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
              {name || 'Moliya Foydalanuvchisi'}
              <Sparkles size={16} className="text-primary dark:text-primary-fixed-dim animate-pulse shrink-0" />
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
              {email || 'user@moliya.uz'}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 text-primary dark:text-primary-fixed-dim hover:bg-primary/20 transition-all text-xs font-bold cursor-pointer"
              >
                <ImageIcon size={13} />
                Galereyadan rasm yuklash
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-2.5 rounded-xl text-xs font-semibold border border-rose-100 dark:border-rose-950/30">
            {uploadError}
          </div>
        )}

        {/* Predefined Avatar presets list */}
        <div className="pt-3.5 border-t border-gray-100 dark:border-white/5">
          <span className="block text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
            Yoki tayyor dizaynlardan birini tanlang:
          </span>
          <div className="flex flex-wrap gap-2.5">
            {PRESET_AVATARS.map((preset, idx) => {
              const isSelected = avatarUrl === preset.url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset.url)}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all duration-200 active:scale-90 hover:scale-105 shrink-0 cursor-pointer ${
                    isSelected 
                      ? 'border-primary ring-2 ring-primary/30 scale-105' 
                      : 'border-transparent opacity-85 hover:opacity-100'
                  }`}
                  title={preset.name}
                >
                  <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Form Settings */}
      <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm">
        <form onSubmit={handleSave} className="space-y-4">
          <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">
            Asosiy sozlamalar
          </h4>

          {/* Save Status Notification */}
          {saveSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs font-semibold border border-emerald-100 dark:border-emerald-950 flex items-center gap-2">
              <Check size={14} />
              <span>Sozlamalar muvaffaqiyatli saqlandi!</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Ism-sharif
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-3 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Foydalanuvchi nomi"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Elektron pochta
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3 text-gray-400 dark:text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="misol@moliya.uz"
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Currency */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Valyuta belgisi
              </label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3.5 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  maxLength={5}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="$, UZS, €, vb."
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary font-tabular"
                />
              </div>
            </div>

            {/* Base balance */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Boshlang'ich Balans
              </label>
              <div className="relative">
                <Wallet size={14} className="absolute left-3.5 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="number"
                  step="any"
                  value={balanceInput}
                  onChange={(e) => setBalanceInput(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary font-tabular"
                />
              </div>
            </div>
          </div>

          {/* Monthly Budget ceiling */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Oylik limit ({currency})
            </label>
            <input
              type="number"
              value={monthlyBudget}
              onChange={(e) => setMonthlyBudget(e.target.value)}
              placeholder="Masalan: 1500"
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary font-tabular"
            />
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              Oylik umumiy xarajatlaringiz uchun ogohlantirish chegarasi
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary/95 text-white py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-primary/10 transition-all cursor-pointer active:scale-95 duration-100"
          >
            Sozlamalarni saqlash
          </button>
        </form>
      </div>

      {/* Backup and diagnostic tools */}
      <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-5 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
        <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Zaxiralash va texnik xizmat
        </h4>

        {/* Import Messages */}
        {importError && (
          <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-semibold border border-rose-100 dark:border-rose-950">
            {importError}
          </div>
        )}
        {importSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs font-semibold border border-emerald-100 dark:border-emerald-950">
            Zaxira muvaffaqiyatli tiklandi! Sahifa yangilanmoqda...
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {/* Export JSON */}
          <button
            onClick={handleExport}
            className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 gap-1.5 transition-all text-xs cursor-pointer active:scale-95 duration-100"
          >
            <Download size={18} className="text-primary dark:text-primary-fixed-dim" />
            <span className="font-bold">Eksport qilish</span>
            <span className="text-[10px] text-gray-400 font-medium">Faylga yuklash</span>
          </button>

          {/* Import JSON file */}
          <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 gap-1.5 transition-all text-xs cursor-pointer active:scale-95 duration-100 relative">
            <Upload size={18} className="text-emerald-500" />
            <span className="font-bold">Import qilish</span>
            <span className="text-[10px] text-gray-400 font-medium">Zaxirani tiklash</span>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportFile} 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </label>
        </div>

        {/* Master reset database */}
        <button
          onClick={() => {
            if (confirm('Barcha ma\'lumotlarni o\'chirib, ilovani boshlang\'ich holatga qaytarishni xohlaysizmi? Bu amalni ortga qaytarib bo\'lmaydi!')) {
              onResetData();
              window.location.reload();
            }
          }}
          className="w-full flex items-center justify-center gap-2 border border-rose-200 hover:bg-rose-50 dark:border-rose-950/30 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 duration-100"
        >
          <Trash2 size={14} />
          <span>Barcha ma'lumotlarni tozalash</span>
        </button>
      </div>
    </div>
  );
};
