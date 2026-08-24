/**
 * Centralized Indian Rupee (INR) and Multi-Currency Formatter Utility
 */

export const DEFAULT_USD_TO_INR_RATE = 83.50;

/**
 * Formats a number according to the Indian Numbering System (Lakhs and Crores).
 * Example: 1500 -> "1,500.00", 125000 -> "1,25,000.00", 1250000 -> "12,50,000.00"
 */
export const formatIndianNumber = (num, decimals = 2) => {
  if (num === null || num === undefined) return '0.00';
  const n = Number(num);
  if (isNaN(n)) return '0.00';

  const isNegative = n < 0;
  const absNum = Math.abs(n);
  const fixed = absNum.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');

  let formattedInt = intPart;
  if (intPart.length > 3) {
    const last3 = intPart.substring(intPart.length - 3);
    const rest = intPart.substring(0, intPart.length - 3);
    const restFormatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
    formattedInt = `${restFormatted},${last3}`;
  }

  const result = decPart !== undefined && decimals > 0 ? `${formattedInt}.${decPart}` : formattedInt;
  return isNegative ? `-${result}` : result;
};

/**
 * Formats monetary amounts in Indian Rupees (₹) with Indian numbering format.
 */
export const formatINR = (amount, decimals = 2) => {
  return `₹${formatIndianNumber(amount, decimals)}`;
};

/**
 * Compact Indian format for charts and compact badges (e.g., ₹1.2L, ₹15K, ₹1.5Cr).
 */
export const formatCompactINR = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  const n = Number(amount);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}₹${abs.toFixed(0)}`;
};

/**
 * Universal Currency Formatter supporting INR, USD, and EUR.
 */
export const formatCurrency = (amount, currencyCode = 'INR', decimals = 2) => {
  const code = (currencyCode || 'INR').toUpperCase();
  if (code === 'INR') {
    return formatINR(amount, decimals);
  }
  const symbol = code === 'EUR' ? '€' : '$';
  const n = Number(amount) || 0;
  return `${symbol}${n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};
