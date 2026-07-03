/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { Transaction } from '../types';
import { formatAmount } from './format';

// Helper to check if running in a native/Capacitor environment
export const isNativePlatform = (): boolean => {
  return (window as any).Capacitor !== undefined && (window as any).Capacitor.isNativePlatform();
};

export interface DailySummaryData {
  startingBalance: number;
  totalSpent: number;
  remainingBalance: number;
  currency: string;
}

// Calculate financial figures for today
export const getTodaySummary = (transactions: Transaction[], currentBalance: number, currency: string): DailySummaryData => {
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Sum today's transactions
  let todayIncome = 0;
  let todayExpense = 0;

  transactions.forEach(t => {
    if (t.date === todayStr) {
      if (t.type === 'kirim') {
        todayIncome += t.amount;
      } else if (t.type === 'chiqim') {
        todayExpense += t.amount;
      }
    }
  });

  const remainingBalance = currentBalance;
  // Starting balance of today before today's transactions happened
  const startingBalance = remainingBalance - todayIncome + todayExpense;

  return {
    startingBalance,
    totalSpent: todayExpense,
    remainingBalance,
    currency
  };
};

// Generate a beautifully formatted SMS / notification message in Uzbek
export const generateSMSMessage = (summary: DailySummaryData): string => {
  const spentStr = formatAmount(summary.totalSpent, summary.currency);
  const remainingStr = formatAmount(summary.remainingBalance, summary.currency);
  const startStr = formatAmount(summary.startingBalance, summary.currency);

  if (summary.totalSpent === 0) {
    return `SmartBudget: Bugun xarajat qilmadingiz! 🌟 Boshlang'ich balans: ${startStr}, Hozirgi qolgan pulingiz: ${remainingStr}. Baraka toping!`;
  }

  return `SmartBudget: Bugun ${startStr} balansdan ${spentStr} ishlatdingiz. Hozirgi qolgan pulingiz: ${remainingStr}. Xarajatlaringiz nazorati joyida! 🚀`;
};

// Request permissions
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (isNativePlatform()) {
    try {
      const permission = await LocalNotifications.requestPermissions();
      return permission.display === 'granted';
    } catch (e) {
      console.error('Error requesting Capacitor local notification permission', e);
      return false;
    }
  } else {
    // Web notifications fallback
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return true;
  }
};

// Schedule recurring daily notification at a specific hour and minute
export const scheduleDailyReminder = async (
  timeStr: string, // e.g. "20:00"
  enabled: boolean,
  transactions: Transaction[],
  currentBalance: number,
  currency: string
): Promise<void> => {
  // If not enabled or native platform check, cancel any pending reminders
  if (isNativePlatform()) {
    try {
      // Always cancel previous notifications before rescheduling
      await LocalNotifications.cancel({ notifications: [{ id: 101 }] });
      
      if (!enabled) return;

      const [hourStr, minuteStr] = timeStr.split(':');
      const hour = parseInt(hourStr || '20', 10);
      const minute = parseInt(minuteStr || '00', 10);

      const summary = getTodaySummary(transactions, currentBalance, currency);
      const bodyText = generateSMSMessage(summary);

      // Request permission
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;

      await LocalNotifications.schedule({
        notifications: [
          {
            title: '💬 SmartBudget SMS-Xabarnoma',
            body: bodyText,
            id: 101,
            schedule: {
              on: {
                hour,
                minute,
              },
              allowWhileIdle: true,
              repeats: true,
            },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: null,
          }
        ]
      });
      console.log(`Capacitor Local Notification successfully scheduled daily at ${timeStr}`);
    } catch (e) {
      console.error('Failed to schedule local notification', e);
    }
  } else {
    console.log(`Web mode: Daily reminder would schedule at ${timeStr}. Status: ${enabled ? 'Yoqilgan' : 'O\'chirilgan'}`);
  }
};

// Send real SMS through our full-stack server endpoint /api/send-sms
export const sendRealSMS = async (phoneNumber: string, message: string): Promise<{ success: boolean; msg: string }> => {
  try {
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneNumber, message }),
    });

    const data = await response.json();
    if (response.ok && data.success) {
      return { success: true, msg: data.message };
    } else {
      return { 
        success: false, 
        msg: data.message || data.error || 'Serverga ulanishda noma\'lum xatolik.' 
      };
    }
  } catch (error: any) {
    console.error('Real SMS sending network error:', error);
    return { 
      success: false, 
      msg: 'Tarmoq xatoligi: SMS provayderiga ulanib bo\'lmadi. (Twilio sozlamalarini tekshiring)' 
    };
  }
};

// Instantly fire a notification (for testing & instant visual feedback)
export const triggerInstantNotification = async (
  transactions: Transaction[],
  currentBalance: number,
  currency: string,
  onShowInWebToast: (msg: string) => void,
  phoneNumber?: string
): Promise<void> => {
  const summary = getTodaySummary(transactions, currentBalance, currency);
  const bodyText = generateSMSMessage(summary);

  // If a phone number is provided, try sending a real SMS through our server api
  if (phoneNumber && phoneNumber.trim()) {
    onShowInWebToast(`SMS yuborilmoqda: ${phoneNumber}...`);
    const smsResult = await sendRealSMS(phoneNumber, bodyText);
    
    if (smsResult.success) {
      onShowInWebToast(`📲 ${smsResult.msg}`);
      return;
    } else {
      // If server could not send it (e.g. credentials missing), show the simulated preview with twilio info
      onShowInWebToast(`⚠️ SMS Simulyatsiyasi:\n${smsResult.msg}`);
      return;
    }
  }

  if (isNativePlatform()) {
    try {
      await requestNotificationPermission();
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '💬 SmartBudget SMS-Xabarnoma',
            body: bodyText,
            id: Math.floor(Math.random() * 100000),
            sound: 'default'
          }
        ]
      });
    } catch (e) {
      console.error('Failed to trigger native notification', e);
      onShowInWebToast(bodyText);
    }
  } else {
    // Try browser Notifications API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('💬 SmartBudget SMS-Xabarnoma', {
        body: bodyText,
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%230ea5e9"/><circle cx="50" cy="50" r="30" fill="white"/></svg>'
      });
    }
    // Also show our beautiful custom web in-app toast
    onShowInWebToast(bodyText);
  }
};
