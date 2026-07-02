import React from 'react';
import { 
  Info, 
  HelpCircle, 
  Wallet, 
  TrendingUp, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  ChevronRight,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export const AboutScreen: React.FC = () => {
  return (
    <div className="space-y-6 pb-8 animate-fade-in" id="about-screen">
      {/* Header section */}
      <div className="text-center space-y-2 py-2">
        <div className="inline-flex p-3 bg-primary/10 dark:bg-primary-container rounded-2xl text-primary dark:text-white mb-1.5 shadow-sm">
          <Info size={28} />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Dastur haqida
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium max-w-md mx-auto">
          Moliya ilovasi — shaxsiy daromadlar va xarajatlarni hisoblash, nazorat qilish va moliyaviy barqarorlikka erishish uchun eng mukammal yordamchingizdir.
        </p>
      </div>

      {/* Main explanation card */}
      <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 dark:from-white/5 dark:to-white/5 border border-primary/10 dark:border-white/5 rounded-2xl p-5 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Wallet size={18} className="text-primary dark:text-primary-fixed-dim" />
          Nima uchun Moliya kerak?
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
          Kundalik hayotimizda qayerga qancha pul sarflayotganimizni bilmaslik ortiqcha xarajatlarga olib keladi. Ushbu ilova sizga <span className="text-primary font-bold dark:text-primary-fixed-dim">pullaringizni aniq hisoblash</span>, foydasiz xarajatlarni qisqartirish hamda oylik budjetingizni to'g'ri rejalashtirish imkonini beradi.
        </p>
        <div className="grid grid-cols-2 gap-3.5 pt-2">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/30 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <ArrowUpRight size={14} />
              Kirim
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-snug">
              Maosh, sovg'alar va boshqa daromadlarni hisoblab borish.
            </p>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-xs">
              <ArrowDownRight size={14} />
              Xarajat (Chiqim)
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-snug">
              Oziq-ovqat, ijara, yo'l haqi va kutilmagan chiqimlarni nazorat qilish.
            </p>
          </div>
        </div>
      </div>

      {/* Key capabilities accordion style */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">
          Dasturning asosiy imkoniyatlari
        </h4>

        {/* Item 1 */}
        <div className="bg-white dark:bg-[#131b2e] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex gap-4 shadow-sm">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-gray-800 dark:text-white">
              Tahlillar va Grafiklar (Insights)
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Oylik budjetni tahlil qilib, qaysi kategoriyalarga eng ko'p mablag' ketayotganini chiroyli diagrammalar orqali aniq ko'rib turasiz.
            </p>
          </div>
        </div>

        {/* Item 2 */}
        <div className="bg-white dark:bg-[#131b2e] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex gap-4 shadow-sm">
          <div className="p-2.5 bg-primary/10 text-primary dark:text-primary-fixed-dim rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
            <Search size={20} />
          </div>
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-gray-800 dark:text-white">
              Aqlli Qidiruv va Filtrlash
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Kategoriyalar nomi, sana yoki turiga qarab barcha amallarni lahzada topishingiz uchun mo'ljallangan mukammal filtr tizimi.
            </p>
          </div>
        </div>

        {/* Item 3 */}
        <div className="bg-white dark:bg-[#131b2e] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex gap-4 shadow-sm">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-gray-800 dark:text-white">
              100% Xavfsizlik va Maxfiylik
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Hech qanday ma'lumot internet serverlariga uzatilmaydi. Barcha hisob-kitoblar faqat va faqat o'zingizning brauzeringizda (LocalStorage) saqlanadi.
            </p>
          </div>
        </div>

        {/* Item 4 */}
        <div className="bg-white dark:bg-[#131b2e] border border-gray-100 dark:border-white/5 rounded-2xl p-4 flex gap-4 shadow-sm">
          <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
            <Sparkles size={20} />
          </div>
          <div className="space-y-1">
            <h5 className="text-sm font-bold text-gray-800 dark:text-white">
              Eksport va Import
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Ma'lumotlarni yo'qotib qo'ymaslik uchun ularni bitta fayl qilib yuklab olishingiz va boshqa qurilmaga osongina o'tkazishingiz mumkin.
            </p>
          </div>
        </div>
      </div>

      {/* Helpful Quick Tips */}
      <div className="bg-white dark:bg-[#131b2e] border border-gray-100 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-3.5">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen size={16} className="text-primary dark:text-primary-fixed-dim" />
          Tezkor maslahatlar
        </h4>
        <ul className="space-y-2.5">
          <li className="flex gap-2 text-xs text-gray-600 dark:text-gray-300">
            <ChevronRight size={14} className="text-primary shrink-0 mt-0.5" />
            <span>Budjetingizni belgilang — profil bo'limiga kirib oylik rejalashtirilgan chiqimlaringiz hajmini kiritib qo'ying.</span>
          </li>
          <li className="flex gap-2 text-xs text-gray-600 dark:text-gray-300">
            <ChevronRight size={14} className="text-primary shrink-0 mt-0.5" />
            <span>Kategoriyalarni qidiring — yangi xarid qo'shganda qidirish funksiyasidan foydalanib tegishli stiker va rangni oson toping.</span>
          </li>
          <li className="flex gap-2 text-xs text-gray-600 dark:text-gray-300">
            <ChevronRight size={14} className="text-primary shrink-0 mt-0.5" />
            <span>Rasmingizni yangilang — shaxsiy brendingiz va kayfiyatingizga mos fotosurat yoki chiroyli tayyor rangli dizaynni tanlang.</span>
          </li>
        </ul>
      </div>

      {/* Quote / Footer decoration */}
      <div className="text-center pt-2">
        <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          Moliyaviy Barqarorlik Sari Qadam!
        </span>
      </div>
    </div>
  );
};
