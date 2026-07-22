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
  percentageChange?: number;
  periodLabel?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ 
  balance, 
  currency, 
  percentageChange = 12.5,
  periodLabel = "24-soatlik aktiv sikl"
}) => {
  const isPositive = balance >= 0;

  return (
    <section className="mt-2 px-1" id="total-balance-card">
      <div className="main-gradient rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
        {/* Decorative background glass elements for premium finish */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary-container/20 rounded-full blur-xl"></div>
        
        <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/80 mb-1 flex items-center gap-1.5">
                <span>Balans ({periodLabel})</span>
              </p>
              <h2 className="text-2xl min-[370px]:text-3xl min-[420px]:text-4xl font-extrabold tracking-tight font-tabular whitespace-nowrap">
                {formatAmount(balance, currency)}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2 border-t border-white/15">
            <div className="flex items-center gap-1.5 bg-white/20 hover:bg-white/25 transition-all px-3 py-1 rounded-full backdrop-blur-md text-xs font-semibold">
              {isPositive ? (
                <TrendingUp size={14} className="text-emerald-300 shrink-0" />
              ) : (
                <TrendingDown size={14} className="text-rose-300 shrink-0" />
              )}
              <span className="whitespace-nowrap">
                {isPositive ? 'Sof tushum' : 'Salbiy balans'}
              </span>
            </div>

            <div className="text-white/60 text-[10px] font-bold tracking-wider uppercase whitespace-nowrap">
              Avto Tarixda Saqlanadi
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
