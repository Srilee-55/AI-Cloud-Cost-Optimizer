import React, { createContext, useContext, useState } from 'react';
import { formatIndianNumber, formatINR, formatCompactINR } from '../utils/currency';

const CurrencyContext = createContext(null);

const RATES = {
  INR: { symbol: '₹', rate: 1.0, label: 'INR (₹)', locale: 'en-IN' },
  USD: { symbol: '$', rate: 0.012, label: 'USD ($)', locale: 'en-US' },
  EUR: { symbol: '€', rate: 0.011, label: 'EUR (€)', locale: 'de-DE' },
};

export const CurrencyProvider = ({ children }) => {
  // Default currency is strictly Indian Rupee (INR)
  const [currency, setCurrency] = useState(localStorage.getItem('preferred_currency') || 'INR');

  const updateCurrency = (curr) => {
    if (RATES[curr]) {
      setCurrency(curr);
      localStorage.setItem('preferred_currency', curr);
    }
  };

  /**
   * Universal format function for all UI components.
   * Defaults to Indian Rupee (INR) with Indian numbering format (e.g. ₹1,25,000.50).
   */
  const formatAmount = (amount, decimals = 2) => {
    if (amount === null || amount === undefined) return '₹0.00';
    const num = Number(amount);
    if (isNaN(num)) return '₹0.00';

    if (currency === 'INR') {
      return formatINR(num, decimals);
    }

    const { symbol, rate } = RATES[currency] || RATES.INR;
    const converted = num * rate;
    return `${symbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}`;
  };

  const convertAmount = (amount) => {
    const num = Number(amount) || 0;
    const { rate } = RATES[currency] || RATES.INR;
    return num * rate;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: updateCurrency,
        formatAmount,
        convertAmount,
        formatCompactINR,
        currencies: Object.keys(RATES).map((k) => ({ code: k, ...RATES[k] })),
        currentSymbol: RATES[currency]?.symbol || '₹',
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

export default CurrencyContext;
