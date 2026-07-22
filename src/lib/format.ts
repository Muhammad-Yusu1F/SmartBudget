/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats an amount with proper thousands separator and no decimals for UZS.
 * E.g., 10000 UZS -> "10.000 UZS"
 *       12.50 USD -> "$12.50"
 */
export const formatAmount = (amount: number, currency: string): string => {
  if (currency === 'UZS' || currency === 'so\'m' || currency === 'som' || currency === 'soʻm') {
    // Format UZS with dot as thousand separator and no decimals (e.g. 10.000 UZS)
    const withDots = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace(/,/g, '.');

    return `${withDots}\u00A0UZS`;
  }
  
  // Normal currency format for others
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return `${currency}\u00A0${formatted}`;
};

/**
 * Returns a signed formatted amount with "+" or "-" prefix.
 */
export const formatSignedAmount = (amount: number, type: 'kirim' | 'chiqim', currency: string): string => {
  const sign = type === 'kirim' ? '+' : '-';
  if (currency === 'UZS' || currency === 'so\'m' || currency === 'som' || currency === 'soʻm') {
    const withDots = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace(/,/g, '.');
    return `${sign}${withDots}\u00A0UZS`;
  }
  
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
  
  return `${sign}${currency}\u00A0${formatted}`;
};
