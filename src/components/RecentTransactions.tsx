/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Transaction } from '../types';
import { CategoryIcon, getCategoryStyles } from './CategoryIcon';
import { ChevronDown, ChevronUp, ShoppingBag, PlusCircle } from 'lucide-react';
import { formatAmount, formatSignedAmount } from '../lib/format';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onTransactionClick?: (tx: Transaction) => void;
  onAddClick?: () => void;
  currency: string;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ 
  transactions, 
  onTransactionClick,
  onAddClick,
  currency
}) => {
  // Local state to keep track of expanded transaction IDs to show sub-items
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Show last 6 transactions on the dashboard to give more visibility
  const displayTxs = transactions.slice(0, 6);

  const formatTxDate = (dateStr: string, timeStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    let dayLabel = '';
    if (dateStr === today) {
      dayLabel = 'Bugun';
    } else if (dateStr === yesterday) {
      dayLabel = 'Kecha';
    } else {
      // Format as DD.MM.YYYY
      const [year, month, day] = dateStr.split('-');
      dayLabel = `${day}.${month}.${year}`;
    }
    
    return `${dayLabel}, ${timeStr}`;
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent opening the edit modal
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <section className="space-y-4 px-1" id="recent-transactions-section">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
          So'nggi amallar
        </h3>
        <span className="text-[10px] bg-primary/10 dark:bg-primary-container/20 text-primary dark:text-primary-fixed-dim px-2 py-0.5 rounded-full font-bold">
          Batafsil ro'yxat uchun bosing
        </span>
      </div>
      
      <div className="space-y-3">
        {displayTxs.length === 0 ? (
          <div className="bg-[#ffffff] dark:bg-[#131b2e] text-center py-8 rounded-2xl border border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 text-sm">
            Hali hech qanday amal bajarilmagan.
          </div>
        ) : (
          displayTxs.map((tx) => {
            const isExpense = tx.type === 'chiqim';
            const styles = getCategoryStyles(tx.category);

            const hasItems = tx.items && tx.items.length > 0;
            const isExpanded = expandedId === tx.id;

            return (
              <div 
                key={tx.id}
                onClick={() => onTransactionClick?.(tx)}
                className="bg-[#ffffff] dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-primary/30 dark:hover:border-primary-fixed-dim/30 transition-all cursor-pointer group active:scale-[0.99] space-y-3 shadow-sm hover:shadow-md"
                title="Tahrirlash uchun bosing"
              >
                {/* Core Transaction Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Category circular background */}
                    <div className={`w-12 h-12 rounded-full ${styles.bg} ${styles.text} flex items-center justify-center transition-transform group-hover:scale-105 duration-200`}>
                      <CategoryIcon category={tx.category} size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 group-hover:text-primary dark:group-hover:text-primary-fixed-dim transition-colors">
                          {tx.title}
                        </p>
                        
                        {/* Display itemized indicator badge */}
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
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        {formatTxDate(tx.date, tx.time)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <p className={`font-bold text-sm tracking-tight font-tabular whitespace-nowrap shrink-0 ${
                      isExpense 
                        ? 'text-rose-600 dark:text-rose-400' 
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {formatSignedAmount(tx.amount, tx.type, currency)}
                    </p>
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

                {/* PLUS FEATURE: Expandable list of spent items */}
                {hasItems && isExpanded && (
                  <div 
                    className="pt-3 border-t border-gray-100 dark:border-white/5 space-y-2 animate-in slide-in-from-top-2 duration-200"
                    onClick={(e) => e.stopPropagation()} // Keep click on this area local to not open edit modal
                  >
                    <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400 dark:text-gray-500 tracking-wider">
                      <ShoppingBag size={10} />
                      <span>Xarajat tafsilotlari (Nimalarga ishlatilgan)</span>
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
        
        {/* "+ Yangi xarid qo'shish" card button */}
        <div 
          onClick={onAddClick}
          className="bg-white dark:bg-white/5 flex items-center justify-center gap-2.5 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary-fixed-dim/50 hover:bg-gray-50/50 dark:hover:bg-white/10 transition-all cursor-pointer group active:scale-[0.99] shadow-sm py-4.5 mt-1"
          id="add-new-transaction-card-btn"
        >
          <PlusCircle size={18} className="text-primary dark:text-primary-fixed-dim group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold text-primary dark:text-primary-fixed-dim">
            Yangi xarid qo'shish (Xarajat yoki Kirim)
          </span>
        </div>
      </div>
    </section>
  );
};
