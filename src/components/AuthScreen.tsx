/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../lib/firebase';
import { saveProfile, getProfile, saveTransactions, saveBaseBalance } from '../lib/storage';
import { 
  Wallet, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface AuthScreenProps {
  onSuccess: () => void;
  onContinueAsGuest?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, onContinueAsGuest }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getFriendlyErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/configuration-not-found':
        return 'Firebase Console’da Email/Password autentifikatsiyasi yoqilmagan. Firebase Console -> Authentication -> Sign-in method bo‘limidan Email/Password usulini yoqing yoki quyidagi "Mehmon rejimida kirish" tugmasini bosing.';
      case 'auth/user-not-found':
        return 'Bunday email manziliga ega foydalanuvchi topilmadi. Ro‘yxatdan o‘tish tabiga o‘ting.';
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Email yoki parol noto‘g‘ri kiritildi. Agar hali ro‘yxatdan o‘tmagan bo‘lsangiz, "Ro‘yxatdan o‘tish" tabiga o‘ting.';
      case 'auth/email-already-in-use':
        return 'Ushbu email manzili allaqachon ro‘yxatdan o‘tgan. Iltimos, "Kirish" tabidan hisobingizga kiring.';
      case 'auth/weak-password':
        return 'Parol juda zaif. Kamida 6 ta belgidan iborat bo‘lishi kerak.';
      case 'auth/invalid-email':
        return 'Iltimos, haqiqiy email manzilini kiriting.';
      case 'auth/too-many-requests':
        return 'Juda ko‘p muvaffaqiyatsiz urinishlar. Birozdan so‘ng qayta urinib ko‘ring.';
      default:
        return 'Tizimga kirishda xatolik yuz berdi. Internet aloqasini va Firebase sozlamalarini tekshiring.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Iltimos, email va parolni to‘liq kiriting.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setError('Iltimos, ismingizni kiriting.');
      return;
    }

    if (password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password.trim());
        if (userCredential.user) {
          if (name.trim()) {
            await updateProfile(userCredential.user, {
              displayName: name.trim()
            });
          }
          // Initialize clean 0 balance and empty transactions for new account
          const currentProfile = getProfile();
          saveProfile({
            ...currentProfile,
            name: name.trim() || 'Foydalanuvchi',
            email: email.trim()
          }, userCredential.user.uid);
          saveTransactions([], userCredential.user.uid);
          saveBaseBalance(0, userCredential.user.uid);
        }
      }
      onSuccess();
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      setError(getFriendlyErrorMessage(err?.code || ''));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] dark:bg-[#0f172a] text-gray-900 dark:text-white flex items-center justify-center p-4 sm:p-6 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#131b2e] rounded-3xl border border-gray-100 dark:border-white/10 shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 relative">
        
        {/* Top Decorative Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#2116d0]/10 dark:bg-indigo-500/20 border border-[#2116d0]/20 text-[#2116d0] dark:text-indigo-400 shadow-inner mb-1">
            <Wallet size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              SmartBudget
            </h1>
            <p className="text-xs font-semibold text-[#2116d0] dark:text-indigo-400 mt-1 flex items-center justify-center gap-1">
              <ShieldCheck size={14} />
              <span>Firebase Bulutli Xavfsiz Baza</span>
            </p>
          </div>
        </div>

        {!isFirebaseConfigured && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-amber-800 dark:text-amber-300 text-xs font-semibold space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles size={16} className="text-amber-600 dark:text-amber-400" />
              <span>Eslatma: Firebase kalitlari kiritilishi kutilmoqda</span>
            </div>
            <p className="text-[11px] font-normal leading-relaxed text-gray-600 dark:text-gray-300">
              Secrets panelida Firebase kalitlari o‘rnatilganda avtomatik ulanadi. Sinov uchun ham login/ro‘yxatdan o‘tish amallari faol.
            </p>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Kirish
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white dark:bg-[#1e293b] text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Ro‘yxatdan o‘tish
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-semibold flex flex-col gap-2 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {error.includes('allaqachon ro‘yxatdan o‘tgan') && mode === 'register' && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className="mt-1 self-start px-3 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold hover:bg-rose-700 transition-colors cursor-pointer"
              >
                Kirish bo‘limiga o‘tish
              </button>
            )}
            {mode === 'login' && (error.includes('noto‘g‘ri') || error.includes('topilmadi')) && (
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className="mt-1 self-start px-3 py-1 bg-[#2116d0] text-white rounded-lg text-[11px] font-bold hover:bg-[#1b12b5] transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Yangi hisob ochish (Ro‘yxatdan o‘tish)</span>
              </button>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Ismingiz
              </label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-3.5 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ismingizni kiriting"
                  required={mode === 'register'}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2116d0] focus:ring-1 focus:ring-[#2116d0]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Email Manzil
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3.5 top-3 text-gray-400 dark:text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2116d0] focus:ring-1 focus:ring-[#2116d0]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Parol
            </label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-3 text-gray-400 dark:text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-10 pr-10 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#2116d0] focus:ring-1 focus:ring-[#2116d0]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2116d0] hover:bg-[#1b12b5] text-white py-3.5 rounded-2xl text-xs font-black tracking-wide uppercase shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 duration-100 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Tekshirilmoqda...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Tizimga Kirish' : 'Ro‘yxatdan O‘tish'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Guest Mode Option */}
        {onContinueAsGuest && (
          <div className="pt-1 border-t border-gray-100 dark:border-white/5 text-center">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="w-full py-2.5 px-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Mehmon sifida davom etish (Offlayn Rejim)</span>
            </button>
          </div>
        )}

        {/* Privacy Note */}
        <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 font-medium leading-relaxed">
          Firebase Authentication va Firestore qoidalariga muvofiq barcha moliyaviy ma’lumotlaringiz maxfiy saqlanadi.
        </p>

      </div>
    </div>
  );
};
