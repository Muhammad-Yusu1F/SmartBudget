/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldAlert, 
  Download, 
  Calendar, 
  Users, 
  Radio, 
  Database, 
  Sparkles, 
  Clock, 
  Plus, 
  Trash2, 
  Smartphone, 
  Globe, 
  MapPin, 
  Check, 
  Volume2,
  RefreshCw,
  Server,
  AlertCircle,
  Coins,
  Cloud
} from 'lucide-react';

interface DownloadEvent {
  id: string;
  deviceId: string;
  date: string;
  time: string;
  name: string;
  email: string;
  device: string;
  city: string;
}

interface AdminPanelProps {
  onClose: () => void;
  onAddSampleTransactions: () => void;
  onShowWebToast: (msg: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  onClose, 
  onAddSampleTransactions,
  onShowWebToast 
}) => {
  // State for tracked downloads
  const [downloads, setDownloads] = useState<DownloadEvent[]>([]);
  const [totalCounter, setTotalCounter] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // State for announcement
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(false);
  const [showResetDownloadsConfirm, setShowResetDownloadsConfirm] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Fetch real downloads tracker data from backend
  const fetchDownloads = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const response = await fetch('/api/admin/downloads');
      if (response.ok) {
        const data = await response.json();
        setDownloads(data.downloads || []);
        setTotalCounter(data.totalCounter || 0);
      }
    } catch (err) {
      console.error('Error fetching downloads:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fetch active announcement from backend
  const fetchAnnouncement = async () => {
    try {
      const res = await fetch('/api/announcement');
      if (res.ok) {
        const data = await res.json();
        setAnnouncementTitle(data.title || '');
        setAnnouncementMsg(data.msg || '');
        setIsAnnouncementActive(data.active || false);
      }
    } catch (err) {
      console.error('Error fetching announcement:', err);
    }
  };

  useEffect(() => {
    fetchDownloads();
    fetchAnnouncement();

    // Poll server every 10 seconds to keep statistics live across all devices!
    const interval = setInterval(() => {
      fetchDownloads(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Simulate new install event on the server-side DB
  const handleSimulateInstall = async () => {
    try {
      const response = await fetch('/api/admin/simulate-download', {
        method: 'POST',
      });
      if (response.ok) {
        const newEvent = await response.json();
        onShowWebToast(`Simulyatsiya: ${newEvent.name} (${newEvent.city}) ilovani yuklab oldi!`);
        fetchDownloads(true);
      }
    } catch (err) {
      console.error('Error simulating install:', err);
    }
  };

  // Reset downloads list on server DB
  const executeResetDownloads = async () => {
    try {
      const response = await fetch('/api/admin/clear-downloads', {
        method: 'POST',
      });
      if (response.ok) {
        onShowWebToast('Tizim yuklashlar tarixi muvaffaqiyatli tozalandi.');
        fetchDownloads(true);
      }
    } catch (err) {
      console.error('Error clearing downloads:', err);
    }
    setShowResetDownloadsConfirm(false);
  };

  // Publish announcement to server DB for all other users to fetch
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (!announcementTitle.trim() || !announcementMsg.trim()) {
      setAdminError('Iltimos, eʻlon sarlavhasi va matnini toʻliq kiriting!');
      return;
    }

    try {
      const response = await fetch('/api/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: announcementTitle.trim(),
          msg: announcementMsg.trim(),
          active: true
        })
      });

      if (response.ok) {
        setIsAnnouncementActive(true);
        // Dispatch local event for instant update on current device
        window.dispatchEvent(new Event('admin_announcement_updated'));
        onShowWebToast('Tizim eʻloni serverda barcha foydalanuvchilar uchun chop etildi!');
      }
    } catch (err) {
      console.error('Error publishing announcement:', err);
    }
  };

  // Disable / delete announcement on server
  const handleDisableAnnouncement = async () => {
    try {
      const response = await fetch('/api/admin/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '',
          msg: '',
          active: false
        })
      });

      if (response.ok) {
        setAnnouncementTitle('');
        setAnnouncementMsg('');
        setIsAnnouncementActive(false);
        window.dispatchEvent(new Event('admin_announcement_updated'));
        onShowWebToast('Tizim eʻloni oʻchirildi.');
      }
    } catch (err) {
      console.error('Error disabling announcement:', err);
    }
  };

  // Get downloads grouped by date for small bar chart visualization
  const chartData = React.useMemo(() => {
    const counts: { [key: string]: number } = {};
    downloads.forEach(d => {
      counts[d.date] = (counts[d.date] || 0) + 1;
    });
    // Sort dates ascending
    return Object.entries(counts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-5); // Last 5 dates
  }, [downloads]);

  const maxChartCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#faf8ff] dark:bg-[#0f172a] rounded-3xl border border-gray-200/40 dark:border-white/10 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#2116d0] to-[#006c49] text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
              <Coins size={22} className="text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight flex items-center gap-1.5">
                SmartBudget Sinxronlash Markazi
              </h3>
              <p className="text-[10px] text-teal-100 font-bold uppercase tracking-wider flex items-center gap-1">
                <Cloud size={10} className="text-emerald-300" /> Onlayn Ma'lumotlar Bazasi
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchDownloads()}
              className={`w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center transition-all cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
              title="Yangilash"
            >
              <RefreshCw size={14} />
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 scrollbar-thin">

          {/* 1. Statistics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-gray-150/50 dark:border-white/5 shadow-sm text-center relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-[#2116d0]/10 dark:text-[#2116d0]/5 group-hover:scale-110 duration-200">
                <Download size={48} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Jami yuklashlar
              </p>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white mt-1 font-tabular">
                {totalCounter} <span className="text-xs text-[#2116d0] dark:text-teal-400 font-bold">marta</span>
              </h4>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold mt-1">
                Bulut bilan bog'langan
              </p>
            </div>

            <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-gray-150/50 dark:border-white/5 shadow-sm text-center relative overflow-hidden group">
              <div className="absolute top-2 right-2 text-[#006c49]/10 dark:text-[#006c49]/5">
                <Users size={48} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Faol qurilmalar
              </p>
              <h4 className="text-2xl font-black text-gray-900 dark:text-white mt-1 font-tabular">
                {downloads.length > 0 ? downloads.filter(d => d.device !== 'Simulation').length : 0} <span className="text-xs text-emerald-500 font-bold">ta</span>
              </h4>
              <p className="text-[9px] text-emerald-500 font-bold mt-1 animate-pulse flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block animate-ping"></span> Tizim onlayn
              </p>
            </div>
          </div>

          {/* 2. Simulation & Debug Actions */}
          <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-gray-150/50 dark:border-white/5 shadow-sm space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-500 animate-pulse" />
              Tizim Faolligini Tekshirish (Test Rejimi)
            </h4>
            <div className="space-y-2">
              <button 
                onClick={onAddSampleTransactions}
                className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-600 to-[#006c49] hover:from-emerald-700 hover:to-[#005236] text-white text-[11px] font-extrabold py-2.5 px-3 rounded-xl transition-all active:scale-95 duration-100 cursor-pointer shadow-md shadow-emerald-500/10"
              >
                <Database size={14} />
                5 ta Test Amal Qo'shish (Mahalliy)
              </button>
            </div>
            {showResetDownloadsConfirm ? (
              <div className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-950/40 space-y-2 mt-2">
                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold text-center">
                  Yuklashlar va oʻrnatishlar tarixini butunlay tozalaysizmi? (Hisoblagich 0 bo'ladi)
                </p>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={executeResetDownloads}
                    className="bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black py-1 px-2.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Ha, tozalansin
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetDownloadsConfirm(false)}
                    className="bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-[9px] font-black py-1 px-2.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                  >
                    Bekor qilish
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center pt-2">
                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold flex items-center gap-1">
                  <AlertCircle size={10} className="text-gray-400" />
                  Sizning testlaringiz serverda yoziladi va saqlanadi.
                </span>
                <button 
                  type="button"
                  onClick={() => setShowResetDownloadsConfirm(true)}
                  className="text-[9px] font-bold text-rose-500 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={10} /> Tozalash
                </button>
              </div>
            )}
          </div>

          {/* 3. Download Trend Chart */}
          <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-gray-150/50 dark:border-white/5 shadow-sm space-y-3">
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <Calendar size={13} className="text-[#2116d0] dark:text-[#6ffbbe]" />
              Kunlik Faollik Grafigi
            </p>
            {chartData.length === 0 ? (
              <p className="text-center text-[10px] text-gray-400 dark:text-gray-500 py-6 font-semibold">
                Grafikda hozircha ma'lumot yoʻq. Ilovani biror qurilma ochishi bilan bu yerda faollik grafigi paydo boʻladi.
              </p>
            ) : (
              <div className="flex items-end justify-between h-20 pt-4 px-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/40 dark:border-white/5">
                {chartData.map((d, idx) => {
                  const percent = (d.count / maxChartCount) * 100;
                  const dateParts = d.date.split('-');
                  const label = `${dateParts[2]}/${dateParts[1]}`;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 group">
                      <span className="text-[8px] font-black text-indigo-500 dark:text-indigo-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.count} ta
                      </span>
                      <div className="w-6 bg-gradient-to-t from-[#006c49] to-[#2116d0] rounded-t-md hover:brightness-110 transition-all duration-200" style={{ height: `${percent * 0.7 + 10}%` }}></div>
                      <span className="text-[8px] font-semibold text-gray-400 dark:text-gray-500 mt-1">{label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Tizim E'lonlari Manager */}
          <div className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-gray-150/50 dark:border-white/5 shadow-sm space-y-3.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <Radio size={13} className="text-emerald-500 animate-pulse" />
              Tizim Eʻlonlari va Bildirishnomalar
            </h4>

            {isAnnouncementActive && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1.5 relative">
                <span className="absolute top-2 right-2 text-[8px] uppercase tracking-widest font-black text-emerald-500 bg-emerald-500/20 px-1.5 py-0.5 rounded animate-pulse">
                  Chop etilgan
                </span>
                <p className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-1">
                  <Volume2 size={12} className="text-emerald-500" />
                  {announcementTitle}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold line-clamp-2">
                  {announcementMsg}
                </p>
                <button 
                  onClick={handleDisableAnnouncement}
                  className="text-[9px] font-black text-rose-500 hover:text-rose-600 transition-colors uppercase tracking-wider block mt-1 cursor-pointer"
                >
                  Eʻlonni serverdan oʻchirish
                </button>
              </div>
            )}

            <form onSubmit={handlePublishAnnouncement} className="space-y-3">
              <div>
                <input 
                  type="text" 
                  placeholder="E'lon Sarlavhasi (Masalan: Yangilanish!)"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <textarea 
                  placeholder="Foydalanuvchilarga koʻrsatiladigan tizim xabari matni..."
                  value={announcementMsg}
                  onChange={(e) => setAnnouncementMsg(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              {adminError && (
                <p className="text-[10px] text-rose-500 font-bold bg-rose-500/10 p-2 rounded-xl text-center">
                  ⚠️ {adminError}
                </p>
              )}
              <button
                type="submit"
                className="w-full bg-[#2116d0] hover:bg-[#1b12b5] text-white py-2.5 rounded-xl text-[11px] font-black transition-all cursor-pointer shadow-md shadow-indigo-500/10 text-center"
              >
                Yangi E'lonni Chop Etish
              </button>
            </form>
          </div>

          {/* 5. Downloads Log List */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between">
              <span>Sinxronlangan Qurilmalar</span>
              <span className="text-[10px] text-indigo-500 font-bold">{downloads.length} ta qurilma</span>
            </h4>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500 space-y-2">
                <RefreshCw size={20} className="animate-spin text-indigo-500" />
                <span className="text-xs">Yuklanmoqda...</span>
              </div>
            ) : downloads.length === 0 ? (
              <div className="p-6 bg-white dark:bg-[#131b2e] border border-gray-150/40 dark:border-white/5 rounded-2xl text-center text-xs text-gray-400">
                Hali hech kim ilovani oʻrnatmadi yoki ochmadi. Ilovani boshqa qurilmalarda ochsangiz real ismlar bu yerda koʻrinadi!
              </div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 scrollbar-thin">
                {downloads.map((item) => {
                  const isAnd = item.device?.toLowerCase() === 'android';
                  const isIos = item.device?.toLowerCase() === 'ios';

                  return (
                    <div 
                      key={item.id} 
                      className="flex justify-between items-center p-2.5 bg-white dark:bg-[#131b2e] border border-gray-150/40 dark:border-white/5 rounded-xl text-xs hover:border-indigo-500/20 transition-all shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isAnd 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : isIos 
                              ? 'bg-purple-500/10 text-purple-500' 
                              : 'bg-blue-500/10 text-blue-500'
                        }`}>
                          {isAnd ? <Smartphone size={13} /> : isIos ? <Smartphone size={13} /> : <Globe size={13} />}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-800 dark:text-gray-200 text-[11px] leading-tight">
                            {item.name}
                          </p>
                          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold flex items-center gap-1 mt-0.5">
                            <MapPin size={8} /> {item.city} <span className="text-gray-300 dark:text-gray-700">|</span> <span className="text-indigo-400">{item.device}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-bold text-gray-700 dark:text-gray-300 text-[10px] font-tabular">
                          {item.date}
                        </p>
                        <p className="text-[9px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-0.5 justify-end mt-0.5">
                          <Clock size={8} /> {item.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 dark:bg-white/5 border-t border-gray-200/40 dark:border-white/5 text-center shrink-0">
          <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black tracking-widest uppercase flex items-center justify-center gap-1">
            <span>Sinxron Tahlil Markazi</span>
            <span>•</span>
            <span className="text-emerald-500 animate-pulse">Server Active</span>
          </p>
        </div>

      </div>
    </div>
  );
};
