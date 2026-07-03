/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatAmount } from '../lib/format';

interface BalanceCardProps {
  balance: number;
  currency: string;
  percentageChange: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ 
  balance, 
  currency, 
  percentageChange = 12.5 
}) => {
  const isPositive = percentageChange >= 0;

  return (
    <section className="mt-4 px-1" id="total-balance-card">
      <div className="main-gradient rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
        {/* Decorative background glass elements for premium finish */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary-container/20 rounded-full blur-xl"></div>
        
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-1">
              Umumiy Balans
            </p>
            <h2 className="text-2xl min-[370px]:text-3xl min-[420px]:text-4xl font-extrabold tracking-tight font-tabular whitespace-nowrap truncate">
              {formatAmount(balance, currency)}
            </h2>
          </div>
          
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-white/20 hover:bg-white/25 active:scale-95 transition-all px-3.5 py-1.5 rounded-full backdrop-blur-md text-xs font-medium cursor-default">
              {isPositive ? (
                <TrendingUp size={14} className="text-emerald-300" />
              ) : (
                <TrendingDown size={14} className="text-rose-300" />
              )}
              <span>
                {isPositive ? '+' : ''}{percentageChange}% o'tgan oydan
              </span>
            </div>

            <div className="text-white/40 text-[10px] font-mono tracking-widest uppercase">
              Secure Cloud Active
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
