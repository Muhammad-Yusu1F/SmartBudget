import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet } from 'lucide-react';

const appIconImg = new URL('../assets/images/app_icon_1783061109645.jpg', import.meta.url).href;

interface SplashScreenProps {
  isVisible: boolean;
  onFinish?: () => void;
  userName?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  isVisible, 
  onFinish, 
  userName = 'Foydalanuvchi' 
}) => {
  // Auto-dismiss splash screen after 2.2 seconds whenever it becomes visible
  React.useEffect(() => {
    if (isVisible && onFinish) {
      const timer = setTimeout(() => {
        onFinish();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          onClick={onFinish}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-between p-8 bg-[#090d16] text-white overflow-hidden select-none cursor-pointer"
        >
          {/* Animated Background Mesh & Floating Glow Circles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.35, 0.6, 0.35],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px]"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.25, 0.5, 0.25],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
              className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/30 rounded-full blur-[100px]"
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-[90px]" />
          </div>

          {/* Top spacer */}
          <div className="w-full h-8" />

          {/* Main Centered Content */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-sm mx-auto">
            {/* Logo Wrapper with Glow & Entrance Animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.7, type: 'spring', stiffness: 200, damping: 20 }}
              className="relative mb-8"
            >
              {/* Outer Glow Halo */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-3xl blur-xl opacity-70 animate-pulse" />

              {/* App Icon Box */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl p-1 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 shadow-2xl flex items-center justify-center overflow-hidden">
                <img
                  src={appIconImg}
                  alt="SmartBudget Logo"
                  className="w-full h-full object-cover rounded-[22px] shadow-inner relative z-10"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-blue-600 to-indigo-700 rounded-[22px]">
                  <Wallet size={52} className="text-white drop-shadow-md" />
                </div>
              </div>
            </motion.div>

            {/* App Name */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent mb-2"
            >
              SmartBudget
            </motion.h1>

            {/* Welcome Greeting Banner */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-2 px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 shadow-xl"
            >
              <p className="text-sm sm:text-base font-extrabold text-blue-200">
                SmartBudget-ga Xush Kelibsiz!
              </p>
            </motion.div>

            {/* Personalized greeting or tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="mt-3 text-xs sm:text-sm text-gray-300 font-medium tracking-wide"
            >
              Salom, <span className="text-white font-bold">{userName}</span>! Aqlli moliya tizimingiz tayyorlanmoqda...
            </motion.p>
          </div>

          {/* Bottom Progress Bar & Branding */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="relative z-10 w-full max-w-xs flex flex-col items-center gap-4 mb-4"
          >
            {/* Animated Loading Bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-400 to-cyan-400 rounded-full shadow-lg shadow-blue-500/50"
              />
            </div>

            <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase flex items-center gap-1">
              <span>Xavfsiz Bulutli Tizim • 2026</span>
            </p>
            <span className="text-[10px] text-blue-300/80 font-medium bg-white/5 px-3 py-1 rounded-full border border-white/10">
              O'tkazib yuborish uchun bosing ➔
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
