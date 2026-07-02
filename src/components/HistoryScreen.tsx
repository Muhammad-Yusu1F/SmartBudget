/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Filter, Calendar, X, ArrowUpRight, ArrowDownLeft, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { CategoryIcon, getCategoryStyles } from './CategoryIcon';
import { formatAmount, formatSignedAmount } from '../lib/format';

interface HistoryScreenProps {
  transactions: Transaction[];
  onTransactionClick: (tx: Transaction) => void;
  currency: string;
}

const CATEGORIES = [
  'Barchasi',
  'Oziq-ovqat',
  'Ijara va Uy',
  'Transport',
  'Kafe va Restoran',
  'Kommunal to\'lovlar',
  'Kiyim-kechak',
  'Sog\'liq',
  'Ta\'lim va Kitoblar',
  'Telefon va Internet',
  'Ko\'ngilochar',
  'Kredit va Qarz',
  'Maosh',
  'Boshqa'
];

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ 
  transactions, 
  onTransactionClick,
  currency 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'barchasi' | TransactionType>('barchasi');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const [selectedDate, setSelectedDate] = useState('');
  
  // Local state to manage expanded item lists
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filtering logic
  const filteredTransactions = transactions.filter(tx => {
    // Also search inside sub-items names! This makes search incredibly smart and useful for users!
    const itemsMatch = tx.items?.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase())) || false;

    const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (tx.description && tx.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          itemsMatch;
    
    const matchesType = selectedType === 'barchasi' ? true : tx.type === selectedType;
    
    const matchesCategory = selectedCategory === 'Barchasi' ? true : 
                            (tx.category === selectedCategory || (selectedCategory === 'Ijara va Uy' && tx.category === 'Ijara'));
    
    const matchesDate = selectedDate ? tx.date === selectedDate : true;

    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  const formatTxDate = (dateStr: string, timeStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let dayLabel = '';
    if (dateStr === today) {
      dayLabel = 'Bugun';
    } else if (dateStr === yesterday) {
      dayLabel = 'Kecha';
    } else {
      const [year, month, day] = dateStr.split('-');
      dayLabel = `${day}.${month}.${year}`;
    }
    
    return `${dayLabel}, ${timeStr}`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('barchasi');
    setSelectedCategory('Barchasi');
    setSelectedDate('');
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Avoid opening the edit modal
    setExpandedId(prev => (prev === id ? null : id));
  };

  const isFiltered = searchTerm !== '' || selectedType !== 'barchasi' || selectedCategory !== 'Barchasi' || selectedDate !== '';

  return (
    <div className="space-y-6 pb-20 px-1 animate-in fade-in-50 duration-300">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Amallar tarixi
        </h2>
        
        {isFiltered && (
          <button 
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer active:scale-95 duration-100"
          >
            <X size={14} />
            <span>Filtrlarni tozalash</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-white dark:bg-[#131b2e] rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Nomi, izohi yoki mahsulot nomi bo'yicha qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-primary dark:focus:border-primary-fixed-dim"
          />
        </div>

        {/* Date and Type Selectors side-by-side */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* Type Filter */}
          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-3 pr-8 py-2.5 text-xs text-gray-700 dark:text-gray-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="barchasi" className="bg-white dark:bg-[#131b2e]">Barcha turlar</option>
              <option value="kirim" className="bg-white dark:bg-[#131b2e]">Kirim (Income)</option>
              <option value="chiqim" className="bg-white dark:bg-[#131b2e]">Chiqim (Expense)</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="relative flex items-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5">
            <Calendar size={14} className="text-gray-400 dark:text-gray-500 mr-2 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-gray-700 dark:text-gray-300 font-semibold focus:outline-none p-0 cursor-pointer"
            />
          </div>

        </div>

        {/* Categories Horizontal Scroll Chips */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Kategoriya bo'yicha filtr
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin select-none snap-x">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-100 cursor-pointer snap-start ${
                  selectedCategory === cat
                    ? 'bg-primary dark:bg-primary-container text-white shadow-sm shadow-primary/20'
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#131b2e] rounded-2xl border border-gray-100 dark:border-white/5 p-6">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-1">
              Amallar topilmadi
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-xs mx-auto">
              Qidiruv so'zini o'zgartirib ko'ring yoki filtrlarni tozalang.
            </p>
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const isExpense = tx.type === 'chiqim';
            const styles = getCategoryStyles(tx.category);

            const hasItems = tx.items && tx.items.length > 0;
            const isExpanded = expandedId === tx.id;

            return (
              <div
                key={tx.id}
                onClick={() => onTransactionClick(tx)}
                className="bg-white dark:bg-[#131b2e] p-4 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-primary/30 dark:hover:border-primary-fixed-dim/30 transition-all cursor-pointer group active:scale-[0.99] shadow-sm hover:shadow-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-full ${styles.bg} ${styles.text} flex items-center justify-center transition-transform group-hover:scale-105 duration-200`}>
                      <CategoryIcon category={tx.category} size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors">
                          {tx.title}
                        </p>
                        {hasItems && (
                          <span 
                            onClick={(e) => toggleExpand(e, tx.id)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary/10 hover:bg-primary/25 text-primary dark:text-primary-fixed-dim px-2 py-0.5 rounded-full border border-primary/10 transition-colors"
                          >
                            <ShoppingBag size={10} />
                            <span>{tx.items?.length} mahsulot</span>
                            {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                          {formatTxDate(tx.date, tx.time)}
                        </p>
                        {tx.description && (
                          <>
                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full"></span>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px] sm:max-w-[180px]">
                              {tx.description}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm tracking-tight font-tabular ${
                      isExpense 
                        ? 'text-rose-600 dark:text-rose-400' 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {formatSignedAmount(tx.amount, tx.type, currency)}
                    </span>
                    {hasItems && (
                      <button
                        onClick={(e) => toggleExpand(e, tx.id)}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors cursor-pointer"
                        title="Mahsulotlarni ko'rish"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* PLUS FEATURE: Expandable sub-items spend list */}
                {hasItems && isExpanded && (
                  <div 
                    className="pt-3 border-t border-gray-100 dark:border-white/5 space-y-2 animate-in slide-in-from-top-2 duration-200"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                      <ShoppingBag size={10} />
                      <span>Xarid qilingan narsalar va xarajatlar ro'yxati</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-1.5 pl-2">
                      {tx.items?.map((item, idx) => (
                        <div 
                          key={item.id || idx} 
                          className="flex justify-between items-center text-xs py-1.5 px-2.5 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 hover:bg-primary/5 dark:hover:bg-white/10 transition-colors"
                        >
                          <span className="text-gray-700 dark:text-gray-300 font-semibold">
                            {item.name}
                          </span>
                          <span className="text-gray-900 dark:text-white font-extrabold font-tabular">
                            {formatAmount(item.price, currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
