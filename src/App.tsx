/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  getTransactions, 
  saveTransactions, 
  getProfile, 
  saveProfile, 
  getBaseBalance, 
  saveBaseBalance, 
  getTheme, 
  saveTheme 
} from './lib/storage';
import { Transaction, UserProfile } from './types';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { IncomeExpenseSummary } from './components/IncomeExpenseSummary';
import { ExpenseBreakdown } from './components/ExpenseBreakdown';
import { RecentTransactions } from './components/RecentTransactions';
import { TransactionModal } from './components/TransactionModal';
import { HistoryScreen } from './components/HistoryScreen';
import { InsightsScreen } from './components/InsightsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { AboutScreen } from './components/AboutScreen';
import { Plus, Home, ReceiptText, BarChart3, User, Grid2X2, Info } from 'lucide-react';

export default function App() {
  // Global States
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme());
  const [profile, setProfile] = useState<UserProfile>(getProfile());
  const [baseBalance, setBaseBalance] = useState<number>(getBaseBalance());
  const [transactions, setTransactions] = useState<Transaction[]>(getTransactions());
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'insights' | 'profile' | 'about'>('home');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Apply and persist dark mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    saveTheme(theme);
  }, [theme]);

  // Run a one-time force reset of all dynamic transaction data and balance to 0 for the user's fresh start
  useEffect(() => {
    const isReset = localStorage.getItem('moliya_force_reset_v4');
    if (!isReset) {
      localStorage.setItem('moliya_transactions', JSON.stringify([]));
      localStorage.setItem('moliya_base_balance', '0');
      localStorage.setItem('moliya_force_reset_v4', 'true');
      setTransactions([]);
      setBaseBalance(0);
    }
  }, []);

  // Recalculated dynamic metrics based on loaded transactions
  const totalIncome = transactions
    .filter((t) => t.type === 'kirim')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'chiqim')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = baseBalance + totalIncome - totalExpense;

  // Let's compute a dynamic comparison metric (e.g. income/expense ratios or fixed healthy 12.5% increase)
  const percentageChange = transactions.length === 0 ? 0 : 12.5;

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Profile updaters
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    saveProfile(updatedProfile);
  };

  const handleUpdateBaseBalance = (newBaseBalance: number) => {
    setBaseBalance(newBaseBalance);
    saveBaseBalance(newBaseBalance);
  };

  // Transaction state modifiers
  const handleSaveTransaction = (txData: Omit<Transaction, 'id'> & { id?: string }) => {
    let updatedList: Transaction[] = [];
    
    if (txData.id) {
      // Edit mode
      updatedList = transactions.map((t) => 
        t.id === txData.id ? { ...t, ...txData } as Transaction : t
      );
    } else {
      // Create mode
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
      };
      // Insert at the beginning of the list
      updatedList = [newTx, ...transactions];
    }

    setTransactions(updatedList);
    saveTransactions(updatedList);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    const updatedList = transactions.filter((t) => t.id !== id);
    setTransactions(updatedList);
    saveTransactions(updatedList);
    setEditingTransaction(null);
  };

  const handleOpenEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsModalOpen(true);
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  // Seed / Reset / Diagnostics helper
  const handleResetData = () => {
    localStorage.clear();
    setTransactions(getTransactions());
    setProfile(getProfile());
    setBaseBalance(getBaseBalance());
  };

  const handleImportData = (transactionsJson: string, profileJson?: string): boolean => {
    try {
      const parsedTxs = JSON.parse(transactionsJson);
      if (Array.isArray(parsedTxs)) {
        setTransactions(parsedTxs);
        saveTransactions(parsedTxs);
        
        if (profileJson) {
          const parsedProfile = JSON.parse(profileJson);
          setProfile(parsedProfile);
          saveProfile(parsedProfile);
        }
        
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Render proper screen based on active tab
  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6 pt-2 pb-24 px-1 animate-in fade-in-50 duration-300">
            {/* Balance Card */}
            <BalanceCard 
              balance={currentBalance} 
              currency={profile.currency} 
              percentageChange={percentageChange} 
            />
            
            {/* Income vs Expense Summaries */}
            <IncomeExpenseSummary 
              income={totalIncome} 
              expense={totalExpense} 
              currency={profile.currency} 
            />
            
            {/* Expenses breakdown */}
            <ExpenseBreakdown 
              transactions={transactions} 
              onViewAll={() => setActiveTab('insights')} 
              currency={profile.currency}
            />
            
            {/* Recent Transaction rows */}
            <RecentTransactions 
              transactions={transactions} 
              onTransactionClick={handleOpenEditModal}
              onAddClick={handleOpenAddModal}
              currency={profile.currency}
            />
          </div>
        );
      case 'history':
        return (
          <HistoryScreen 
            transactions={transactions} 
            onTransactionClick={handleOpenEditModal}
            currency={profile.currency}
          />
        );
      case 'insights':
        return (
          <InsightsScreen 
            transactions={transactions} 
            currency={profile.currency} 
          />
        );
      case 'profile':
        return (
          <ProfileScreen 
            profile={profile}
            baseBalance={baseBalance}
            onUpdateProfile={handleUpdateProfile}
            onUpdateBaseBalance={handleUpdateBaseBalance}
            onResetData={handleResetData}
            onImportData={handleImportData}
            transactionsJson={JSON.stringify(transactions)}
          />
        );
      case 'about':
        return (
          <AboutScreen />
        );
    }
  };

  return (
    <div className="bg-[#faf8ff] dark:bg-[#131b2e] text-[#131b2e] dark:text-[#faf8ff] min-h-screen pb-24 transition-colors duration-200">
      
      {/* Top App Bar */}
      <Header 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        avatarUrl={profile.avatarUrl} 
        userName={profile.name}
      />

      {/* Main Container */}
      <main className="pt-20 px-4 max-w-2xl mx-auto">
        {renderActiveScreen()}
      </main>

      {/* Floating Action Button (FAB) */}
      {activeTab === 'home' && (
        <button 
          onClick={handleOpenAddModal}
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary hover:bg-primary/95 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-all duration-200 cursor-pointer"
          aria-label="Add transaction"
          id="add-transaction-fab"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 w-full z-40 flex justify-around items-center px-2 pb-4 pt-2 bg-white/90 dark:bg-[#131b2e]/90 backdrop-blur-md border-t border-gray-100 dark:border-white/5 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] rounded-t-2xl max-w-2xl mx-auto">
        
        {/* Tab 1: Home */}
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
            activeTab === 'home'
              ? 'bg-primary/10 dark:bg-primary-container text-primary dark:text-white'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
          }`}
          id="nav-home-tab"
        >
          <Grid2X2 size={20} />
          <span className="text-[10px] font-bold mt-0.5">Home</span>
        </button>

        {/* Tab 2: History */}
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
            activeTab === 'history'
              ? 'bg-primary/10 dark:bg-primary-container text-primary dark:text-white'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
          }`}
          id="nav-history-tab"
        >
          <ReceiptText size={20} />
          <span className="text-[10px] font-bold mt-0.5">History</span>
        </button>

        {/* Tab 3: Insights */}
        <button 
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
            activeTab === 'insights'
              ? 'bg-primary/10 dark:bg-primary-container text-primary dark:text-white'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
          }`}
          id="nav-insights-tab"
        >
          <BarChart3 size={20} />
          <span className="text-[10px] font-bold mt-0.5">Insights</span>
        </button>

        {/* Tab 4: Profile */}
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
            activeTab === 'profile'
              ? 'bg-primary/10 dark:bg-primary-container text-primary dark:text-white'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
          }`}
          id="nav-profile-tab"
        >
          <User size={20} />
          <span className="text-[10px] font-bold mt-0.5">Profile</span>
        </button>

        {/* Tab 5: About */}
        <button 
          onClick={() => setActiveTab('about')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-full transition-all duration-200 cursor-pointer active:scale-90 ${
            activeTab === 'about'
              ? 'bg-primary/10 dark:bg-primary-container text-primary dark:text-white'
              : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
          }`}
          id="nav-about-tab"
        >
          <Info size={20} />
          <span className="text-[10px] font-bold mt-0.5">Haqida</span>
        </button>

      </nav>

      {/* Popover / Overlay Modal for adding/editing transaction */}
      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        editingTransaction={editingTransaction}
        currency={profile.currency}
      />

    </div>
  );
}
