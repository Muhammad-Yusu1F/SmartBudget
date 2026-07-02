/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { formatAmount } from '../lib/format';

interface IncomeExpenseSummaryProps {
  income: number;
  expense: number;
  currency: string;
}

export const IncomeExpenseSummary: React.FC<IncomeExpenseSummaryProps> = ({ 
  income, 
  expense, 
  currency 
}) => {
  return (
    <section className="grid grid-cols-2 gap-4 px-1" id="income-expense-summary">
      {/* Kirim (Income) Card */}
      <div className="bg-[#ffffff] dark:bg-[#131b2e] rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2.5} 
              stroke="currentColor" 
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Kirim
          </span>
        </div>
        <p className="text-xl md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight font-tabular">
          {formatAmount(income, currency)}
        </p>
      </div>

      {/* Chiqim (Expense) Card */}
      <div className="bg-[#ffffff] dark:bg-[#131b2e] rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={2.5} 
              stroke="currentColor" 
              className="w-5 h-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Chiqim
          </span>
        </div>
        <p className="text-xl md:text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight font-tabular">
          {formatAmount(expense, currency)}
        </p>
      </div>
    </section>
  );
};
