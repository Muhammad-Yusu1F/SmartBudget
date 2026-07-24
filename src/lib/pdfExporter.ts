import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, UserProfile } from '../types';
import { formatAmount } from './format';

// Helper to normalize apostrophes and quotes for PDF font compatibility
const cleanText = (str: string | undefined | null): string => {
  if (!str) return '';
  return str
    .replace(/[‘’ʻʼ`]/g, "'")
    .replace(/[“”]/g, '"');
};

export const exportPDFReport = (
  transactions: Transaction[],
  profile: UserProfile,
  baseBalance: number
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = profile.currency || 'UZS';
  const todayStr = new Date().toLocaleDateString('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === 'kirim')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'chiqim')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = baseBalance + totalIncome - totalExpense;

  // 1. Header Banner
  doc.setFillColor(33, 22, 208); // Primary Indigo #2116d0
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SmartBudget', 14, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Moliya va Tranzaksiyalar Hisoboti (PDF)', 14, 26);

  doc.setFontSize(9);
  doc.text(`Sana: ${todayStr}`, 196, 26, { align: 'right' });

  // 2. User & Account Info Box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, 38, 182, 28, 3, 3, 'F');

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Foydalanuvchi ma\'lumotlari:', 18, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Ism: ${cleanText(profile.name || 'Moliya Foydalanuvchisi')}`, 18, 52);
  doc.text(`Email: ${cleanText(profile.email || 'Ko\'rsatilmagan')}`, 18, 58);

  doc.text(`Tel: ${cleanText(profile.phoneNumber || 'Mavjud emas')}`, 110, 52);
  doc.text(`Valyuta: ${cleanText(currency)}`, 110, 58);

  // 3. Financial Summary Box
  doc.setFillColor(238, 242, 255); // Soft indigo light tint
  doc.roundedRect(14, 70, 182, 26, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 40, 90);

  // 4 columns in summary box
  doc.text('Boshlang\'ich balans:', 18, 78);
  doc.setFont('helvetica', 'normal');
  doc.text(formatAmount(baseBalance, currency), 18, 87);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 122, 87); // Green for income
  doc.text('Jami Kirim (+):', 65, 78);
  doc.setFont('helvetica', 'normal');
  doc.text(`+${formatAmount(totalIncome, currency)}`, 65, 87);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 30, 30); // Red for expense
  doc.text('Jami Chiqim (-):', 112, 78);
  doc.setFont('helvetica', 'normal');
  doc.text(`-${formatAmount(totalExpense, currency)}`, 112, 87);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 22, 208); // Primary indigo for total
  doc.text('Sof Balans:', 158, 78);
  doc.setFont('helvetica', 'normal');
  doc.text(formatAmount(currentBalance, currency), 158, 87);

  // 4. Transactions Table
  const tableData = transactions.map((t, index) => [
    (index + 1).toString(),
    t.date || '',
    t.type === 'kirim' ? 'Kirim (+)' : 'Chiqim (-)',
    cleanText(t.category),
    cleanText(t.description || '-'),
    t.type === 'kirim' 
      ? `+${formatAmount(t.amount, currency)}` 
      : `-${formatAmount(t.amount, currency)}`,
  ]);

  autoTable(doc, {
    startY: 102,
    head: [['№', 'Sana', 'Turi', 'Kategoriya', 'Izoh', 'Summa']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [33, 22, 208],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 24, fontStyle: 'bold' },
      3: { cellWidth: 38 },
      4: { cellWidth: 44 },
      5: { cellWidth: 40, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Colorize the type and amount columns
      if (data.section === 'body') {
        const rowData = transactions[data.row.index];
        if (rowData && rowData.type === 'kirim') {
          if (data.column.index === 2 || data.column.index === 5) {
            data.cell.styles.textColor = [16, 122, 87]; // Green
          }
        } else if (rowData && rowData.type === 'chiqim') {
          if (data.column.index === 2 || data.column.index === 5) {
            data.cell.styles.textColor = [200, 30, 30]; // Red
          }
        }
      }
    },
  });

  // Footer on each page
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `SmartBudget © ${new Date().getFullYear()} - Sahifa ${i} / ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  // Save the generated PDF file
  const filename = `smartbudget_hisobot_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};
