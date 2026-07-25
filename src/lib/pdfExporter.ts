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

export const exportPDFReport = async (
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
    cleanText(t.description || (t.receiptImage ? '[Chek biriktirilgan]' : '-')),
    t.receiptImage ? 'Mavjud (Chek)' : '-',
    t.type === 'kirim' 
      ? `+${formatAmount(t.amount, currency)}` 
      : `-${formatAmount(t.amount, currency)}`,
  ]);

  autoTable(doc, {
    startY: 102,
    head: [['№', 'Sana', 'Turi', 'Kategoriya', 'Izoh', 'Chek', 'Summa']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [33, 22, 208],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 22, fontStyle: 'bold' },
      3: { cellWidth: 32 },
      4: { cellWidth: 38 },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 36, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Colorize the type and amount columns
      if (data.section === 'body') {
        const rowData = transactions[data.row.index];
        if (rowData && rowData.type === 'kirim') {
          if (data.column.index === 2 || data.column.index === 6) {
            data.cell.styles.textColor = [16, 122, 87]; // Green
          }
        } else if (rowData && rowData.type === 'chiqim') {
          if (data.column.index === 2 || data.column.index === 6) {
            data.cell.styles.textColor = [200, 30, 30]; // Red
          }
        }
      }
    },
  });

  // 5. Embed attached receipt photos gallery section at the end of the PDF
  const receipts = transactions.filter((t) => t.receiptImage);
  if (receipts.length > 0) {
    doc.addPage();
    doc.setFillColor(33, 22, 208);
    doc.rect(0, 0, 210, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Biriktirilgan AI Cheklar va Kvitansiyalar Gallerya', 14, 12);

    let yOffset = 25;
    receipts.forEach((rx, idx) => {
      if (yOffset > 220) {
        doc.addPage();
        yOffset = 20;
      }
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `${idx + 1}. ${cleanText(rx.title)} (${rx.date} - ${formatAmount(rx.amount, currency)})`,
        14,
        yOffset
      );
      yOffset += 5;

      try {
        doc.addImage(rx.receiptImage!, 'JPEG', 14, yOffset, 65, 65);
        yOffset += 72;
      } catch (e) {
        console.error('PDF receipt image embed error:', e);
        yOffset += 10;
      }
    });
  }

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

  // Save or share the generated PDF file across desktop and mobile devices
  const filename = `smartbudget_hisobot_${new Date().toISOString().split('T')[0]}.pdf`;
  
  try {
    // 1. Primary: Standard jsPDF download trigger
    doc.save(filename);

    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });

    // 2. Web Share API (native share/save to Files/Drive/Gallery on iOS Safari & Android Chrome)
    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          files: [pdfFile],
          title: 'SmartBudget Hisoboti',
          text: `${cleanText(profile.name) || 'Foydalanuvchi'}ning SmartBudget hisoboti (PDF)`,
        });
        return;
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') return;
      }
    }

    // 3. Fallback: Blob URL window open / link click for iframe preview sandbox
    const blobUrl = URL.createObjectURL(pdfBlob);
    const openedWin = window.open(blobUrl, '_blank');
    if (!openedWin) {
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 15000);
  } catch (err) {
    console.error('PDF generation or download error:', err);
    doc.save(filename);
  }
};
