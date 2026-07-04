/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, UserProfile } from '../types';

// Let's create some beautiful, realistic initial data that adds up perfectly:
// Initial Base Balance: $2,560.00
// + Salary: $1,200.00
// + Freelance project: $1,640.00
// Total Income (Kirim): $2,840.00
//
// - Rent (Ijara): $345.00 (30% of $1,150)
// - Food (Rayhon Milliy Taomlar): $24.50
// - Food (Oziq-ovqat xaridi): $435.50 (Oziq-ovqat Total = $460.00 which is 40% of $1,150)
// - Transport (Yandex Go): $12.00
// - Transport (Benzin): $218.00 (Transport Total = $230.00 which is 20% of $1,150)
// - Clothing (Kiyim-kechak): $115.00 (Other/Clothing = 10%)
// Total Expense (Chiqim): $1,150.00
//
// Current Balance = $2,560.00 + $2,840.00 - $1,150.00 = $4,250.00!
// This is mathematically pristine and aligns with the screenshots.

const INITIAL_TRANSACTIONS: Transaction[] = [];

const INITIAL_PROFILE: UserProfile = {
  name: 'Mehmon',
  email: '',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
  currency: 'UZS',
  monthlyBudget: 0
};

const STORAGE_KEYS = {
  TRANSACTIONS: 'moliya_transactions',
  PROFILE: 'moliya_profile',
  THEME: 'moliya_theme',
  BASE_BALANCE: 'moliya_base_balance'
};

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    return INITIAL_TRANSACTIONS;
  }
  const parsed = JSON.parse(data);
  return parsed;
};

export const saveTransactions = (txs: Transaction[]): void => {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
};

export const getProfile = (): UserProfile => {
  const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(INITIAL_PROFILE));
    return INITIAL_PROFILE;
  }
  const parsed = JSON.parse(data);
  // Migrate existing '$' to 'UZS'
  if (parsed.currency === '$' || !parsed.currency) {
    parsed.currency = 'UZS';
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(parsed));
  }
  return parsed;
};

export const saveProfile = (profile: UserProfile): void => {
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
};

export const getBaseBalance = (): number => {
  const data = localStorage.getItem(STORAGE_KEYS.BASE_BALANCE);
  if (data === null) {
    localStorage.setItem(STORAGE_KEYS.BASE_BALANCE, '0');
    return 0;
  }
  return parseFloat(data);
};

export const saveBaseBalance = (balance: number): void => {
  localStorage.setItem(STORAGE_KEYS.BASE_BALANCE, balance.toString());
};

export const getTheme = (): 'light' | 'dark' => {
  const data = localStorage.getItem(STORAGE_KEYS.THEME);
  if (!data) {
    return 'dark'; // Dark mode by default as per screenshots
  }
  return data as 'light' | 'dark';
};

export const saveTheme = (theme: 'light' | 'dark'): void => {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
};
