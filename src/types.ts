/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'kirim' | 'chiqim'; // 'kirim' = income, 'chiqim' = expense

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string; // e.g. 'Oziq-ovqat', 'Ijara', 'Transport', etc.
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description?: string;
  items?: { id: string; name: string; price: number }[];
}

export interface Category {
  id: string;
  name: string;
  iconName: string; // Name of Lucide icon
  color: string; // Tailwind hex color or class
  percentage?: number;
}

export interface BudgetLimit {
  category: string;
  limit: number;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  currency: string; // e.g., '$' or 'UZS'
  monthlyBudget?: number;
  notificationsEnabled?: boolean;
  notificationTime?: string; // HH:MM format, e.g., '20:00'
  phoneNumber?: string; // User's phone number for SMS notifications, e.g., '+998901234567'
}
