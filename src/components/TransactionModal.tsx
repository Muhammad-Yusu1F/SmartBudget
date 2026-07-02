/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus, Edit3, ShoppingBag, PlusCircle, Search } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatAmount } from '../lib/format';
import { CategoryIcon, getCategoryStyles } from './CategoryIcon';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
  editingTransaction?: Transaction | null;
  currency: string;
}

const CATEGORIES = [
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

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingTransaction,
  currency
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('chiqim');
  const [category, setCategory] = useState('Oziq-ovqat');
  const [categorySearch, setCategorySearch] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Helper to format raw input into dotted format for UZS or normal number
  const formatInput = (val: string): string => {
    // Remove all non-digit characters
    const clean = val.replace(/\D/g, '');
    if (!clean) return '';
    
    if (currency === 'UZS' || currency === 'so\'m' || currency === 'som' || currency === 'soʻm') {
      // Format with dot separators (e.g., 10.000)
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(parseInt(clean, 10)).replace(/,/g, '.');
    }
    
    return clean;
  };

  // Plus Feature: Detailed Itemized List Tracker (Nimalarga ishlatilgani)
  const [items, setItems] = useState<{ id: string; name: string; price: number }[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [showItemsEditor, setShowItemsEditor] = useState(false);

  // Update fields when editingTransaction changes
  useEffect(() => {
    setCategorySearch('');
    if (editingTransaction) {
      setTitle(editingTransaction.title);
      setAmount(formatInput(editingTransaction.amount.toString()));
      setType(editingTransaction.type);
      
      let initialCat = editingTransaction.category;
      if (initialCat === 'Ijara') {
        initialCat = 'Ijara va Uy';
      }
      setCategory(initialCat);
      
      setDate(editingTransaction.date);
      setTime(editingTransaction.time);
      setDescription(editingTransaction.description || '');
      
      if (editingTransaction.items && editingTransaction.items.length > 0) {
        setItems(editingTransaction.items);
        setShowItemsEditor(true);
      } else {
        setItems([]);
        setShowItemsEditor(false);
      }
    } else {
      // Defaults for a new transaction
      setTitle('');
      setAmount('');
      setType('chiqim');
      setCategory('Oziq-ovqat');
      setDate(new Date().toISOString().split('T')[0]);
      
      const now = new Date();
      const HH = String(now.getHours()).padStart(2, '0');
      const MM = String(now.getMinutes()).padStart(2, '0');
      setTime(`${HH}:${MM}`);
      
      setDescription('');
      setItems([]);
      setShowItemsEditor(false);
    }
    setNewItemName('');
    setNewItemPrice('');
    setError('');
  }, [editingTransaction, isOpen]);

  // Adjust default category based on type selection
  const handleTypeChange = (selectedType: TransactionType) => {
    setType(selectedType);
    if (selectedType === 'kirim') {
      setCategory('Maosh'); // default for income
    } else {
      setCategory('Oziq-ovqat'); // default for expense
    }
  };

  // Add sub-item to the itemized list
  const handleAddItem = () => {
    if (!newItemName.trim()) {
      setError('Mahsulot nomini kiritishingiz lozim.');
      return;
    }
    const cleanPriceStr = newItemPrice.replace(/\./g, '');
    const parsedPrice = parseFloat(cleanPriceStr);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('Narxi musbat son bo\'lishi lozim.');
      return;
    }

    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newItemName.trim(),
      price: parsedPrice
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    
    // Auto calculate and update the total amount field
    const sum = updatedItems.reduce((acc, curr) => acc + curr.price, 0);
    setAmount(formatInput(currency === 'UZS' ? Math.round(sum).toString() : sum.toFixed(2)));

    // Reset item inputs
    setNewItemName('');
    setNewItemPrice('');
    setError('');
  };

  // Remove sub-item
  const handleRemoveItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    
    const sum = updatedItems.reduce((acc, curr) => acc + curr.price, 0);
    setAmount(sum > 0 ? formatInput(currency === 'UZS' ? Math.round(sum).toString() : sum.toFixed(2)) : '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Sarlavha kiritilishi shart!');
      return;
    }

    const cleanAmountStr = amount.replace(/\./g, '');
    const parsedAmount = parseFloat(cleanAmountStr);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Miqdor musbat son bo\'lishi shart!');
      return;
    }

    if (!date) {
      setError('Sana kiritilishi shart!');
      return;
    }

    if (!time) {
      setError('Vaqt kiritilishi shart!');
      return;
    }

    onSave({
      id: editingTransaction?.id,
      title: title.trim(),
      amount: parsedAmount,
      type,
      category,
      date,
      time,
      description: description.trim() || undefined,
      items: showItemsEditor && items.length > 0 ? items : undefined
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-[#131b2e]/60 dark:bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content Card */}
      <div className="relative bg-white dark:bg-[#131b2e] w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden transform transition-all duration-300 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 shrink-0">
          <div className="flex items-center gap-2">
            {editingTransaction ? (
              <Edit3 size={18} className="text-primary dark:text-primary-fixed-dim" />
            ) : (
              <Plus size={18} className="text-primary dark:text-primary-fixed-dim" />
            )}
            <h3 className="font-bold text-gray-900 dark:text-white">
              {editingTransaction ? 'Amalni tahrirlash' : 'Yangi amal qo\'shish'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
          
          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-semibold border border-rose-100 dark:border-rose-950">
              {error}
            </div>
          )}

          {/* Type Toggle: Kirim / Chiqim */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200/50 dark:border-white/5">
            <button
              type="button"
              onClick={() => handleTypeChange('chiqim')}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === 'chiqim'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              Chiqim (Expense)
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('kirim')}
              className={`py-2 px-4 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                type === 'kirim'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              Kirim (Income)
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Amal sarlavhasi
            </label>
            <input
              type="text"
              placeholder="Masalan: Yandex Go, Tushlik, Supermarket"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-primary dark:focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim"
            />
          </div>

          {/* Amount (Disabled if showItemsEditor is on, to guide user to use item prices) */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Summa ({currency})
              </label>
              {showItemsEditor && (
                <span className="text-[10px] text-primary dark:text-primary-fixed-dim font-bold">
                  * Mahsulotlar summasidan hisoblandi
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-gray-400 dark:text-gray-500 text-sm font-semibold select-none">
                {currency}
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(formatInput(e.target.value))}
                disabled={showItemsEditor}
                className={`w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-primary dark:focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim font-tabular ${
                  currency.length > 1 ? 'pl-16' : 'pl-8'
                } ${
                  showItemsEditor ? 'opacity-70 cursor-not-allowed bg-gray-150 dark:bg-white/10' : ''
                }`}
              />
            </div>
          </div>

          {/* PLUS FEATURE: Itemized Purchase List Toggle */}
          <div className="bg-primary/5 dark:bg-white/5 p-4 rounded-xl border border-primary/20 dark:border-white/10 space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingBag size={16} className="text-primary dark:text-primary-fixed-dim" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Batafsil mahsulotlar (Plus funksiya)
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  setShowItemsEditor(!showItemsEditor);
                  if(!showItemsEditor && amount) {
                    // prefill with single item
                    setItems([{
                      id: `item-${Date.now()}`,
                      name: title.trim() || 'Xarid predmeti',
                      price: parseFloat(amount.replace(/\./g, '')) || 0
                    }]);
                  }
                }}
                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  showItemsEditor
                    ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-950/30'
                    : 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim border-primary/20'
                }`}
              >
                {showItemsEditor ? "Yopish" : "Yoqish"}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
              Ushbu xaridga tegishli barcha alohida narsalarni va ularning narxini kiriting. Ilova nimalarga ishlatganingizni aniq saqlab beradi.
            </p>

            {showItemsEditor && (
              <div className="space-y-3 pt-2">
                {/* Items List */}
                {items.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-white dark:bg-[#131b2e] p-2 rounded-lg border border-gray-150 dark:border-white/5 text-xs">
                        <span className="font-semibold text-gray-800 dark:text-gray-200 truncate pr-2">
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 dark:text-white font-tabular">
                            {formatAmount(item.price, currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* New Item Row Inputs */}
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Masalan: Sut, Non, Taksi"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="flex-1 bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400"
                  />
                  <div className={`relative ${currency.length > 1 ? 'w-28' : 'w-20'}`}>
                    <span className="absolute left-2 top-1.5 text-gray-400 text-[10px] sm:text-xs select-none">
                      {currency}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(formatInput(e.target.value))}
                      className={`w-full bg-white dark:bg-[#131b2e] border border-gray-200 dark:border-white/10 rounded-lg pr-1.5 py-1.5 text-xs text-gray-900 dark:text-white font-tabular placeholder-gray-400 ${
                        currency.length > 1 ? 'pl-11' : 'pl-5'
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-primary dark:bg-primary-container text-white p-2 rounded-lg hover:bg-primary/95 transition-colors cursor-pointer shrink-0"
                    title="Mahsulot qo'shish"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Category Selector with Search and Beautiful Icons */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Kategoriya tanlash
              </label>
              {category && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:text-primary-fixed-dim flex items-center gap-1">
                  <CategoryIcon category={category} size={11} />
                  {category}
                </span>
              )}
            </div>

            {/* Category Search Input */}
            <div className="relative mb-2.5">
              <Search size={14} className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Kategoriyani qidirish..."
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-primary dark:focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim"
              />
              {categorySearch && (
                <button
                  type="button"
                  onClick={() => setCategorySearch('')}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Scrollable Categories Grid */}
            <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1 pb-1 scrollbar-thin">
              {CATEGORIES.filter(cat => 
                cat.toLowerCase().includes(categorySearch.toLowerCase())
              ).map((cat) => {
                const styles = getCategoryStyles(cat);
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary dark:border-primary-fixed-dim bg-primary/5 dark:bg-white/10 shadow-sm ring-1 ring-primary'
                        : 'border-gray-150 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${styles.bg} ${styles.text} shrink-0`}>
                      <CategoryIcon category={cat} size={14} />
                    </div>
                    <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {cat}
                    </span>
                  </button>
                );
              })}
              {CATEGORIES.filter(cat => 
                cat.toLowerCase().includes(categorySearch.toLowerCase())
              ).length === 0 && (
                <div className="col-span-full py-4 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
                  Kategoriya topilmadi
                </div>
              )}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Sana
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary dark:focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Vaqt
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary dark:focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim cursor-pointer"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
              Izoh (Ixtiyoriy)
            </label>
            <textarea
              placeholder="Xarid tafsilotlari..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-primary dark:focus:border-primary-fixed-dim focus:ring-1 focus:ring-primary dark:focus:ring-primary-fixed-dim resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-white/5 shrink-0">
            {editingTransaction && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Ushbu amalni o\'chirishni xohlaysizmi?')) {
                    onDelete(editingTransaction.id);
                    onClose();
                  }
                }}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-rose-200 dark:border-rose-950/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm font-bold transition-all cursor-pointer active:scale-95 duration-100"
              >
                <Trash2 size={16} />
              </button>
            )}
            
            <button
              type="submit"
              className="flex-1 bg-primary dark:bg-primary-container text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary/10 dark:shadow-primary-container/10 hover:bg-primary/95 dark:hover:bg-primary-container/90 transition-all cursor-pointer active:scale-[0.98] duration-100 flex items-center justify-center gap-2"
            >
              <span>Saqlash</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
