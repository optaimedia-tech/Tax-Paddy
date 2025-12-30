import React, { useState } from 'react';
import { calculatePIT, calculateVAT } from '../services/taxLogic';
import { PITResult } from '../types';
import { RefreshCcw } from 'lucide-react';

export default function Calculator() {
  const [activeTab, setActiveTab] = useState<'PIT' | 'VAT'>('PIT');
  
  // PIT State
  const [grossIncome, setGrossIncome] = useState<string>('');
  const [rent, setRent] = useState<string>('');
  const [pitResult, setPitResult] = useState<PITResult | null>(null);

  // VAT State
  const [vatAmount, setVatAmount] = useState<string>('');
  const [vatInclusive, setVatInclusive] = useState<boolean>(false);
  const [vatResult, setVatResult] = useState<number | null>(null);

  const handlePITCalculate = () => {
    const gross = parseFloat(grossIncome.replace(/,/g, ''));
    const rentVal = parseFloat(rent.replace(/,/g, ''));
    if (!isNaN(gross) && !isNaN(rentVal)) {
      setPitResult(calculatePIT(gross, rentVal));
    }
  };

  const handleVATCalculate = () => {
    const amount = parseFloat(vatAmount.replace(/,/g, ''));
    if (!isNaN(amount)) {
      setVatResult(calculateVAT(amount, vatInclusive));
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tab Header */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('PIT')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'PIT' 
                ? 'bg-paddy-50 text-paddy-900 border-b-2 border-paddy-900' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Personal Income Tax
          </button>
          <button
            onClick={() => setActiveTab('VAT')}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'VAT' 
                ? 'bg-paddy-50 text-paddy-900 border-b-2 border-paddy-900' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Value Added Tax
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'PIT' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gross Annual Income</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
                  <input
                    type="number"
                    value={grossIncome}
                    onChange={(e) => setGrossIncome(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-paddy-500 focus:border-paddy-500 outline-none transition-all"
                    placeholder="e.g. 5,000,000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Rent Paid</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
                  <input
                    type="number"
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-paddy-500 focus:border-paddy-500 outline-none transition-all"
                    placeholder="e.g. 1,200,000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Used for tax relief calculation</p>
                </div>
              </div>

              <button
                onClick={handlePITCalculate}
                className="w-full bg-paddy-900 text-white font-semibold py-3 rounded-xl hover:bg-paddy-800 transition-colors shadow-lg shadow-paddy-900/20"
              >
                Calculate Tax
              </button>

              {pitResult && (
                <div className="mt-8 bg-gray-50 rounded-xl p-6 space-y-3 border border-gray-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Tax Relief</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(pitResult.relief)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Taxable Income</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(pitResult.taxable)}</span>
                  </div>
                  <div className="h-px bg-gray-200 my-2"></div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-bold">Total Tax Payable</span>
                    <span className="text-xl font-bold text-paddy-700">{formatCurrency(pitResult.tax)}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₦</span>
                  <input
                    type="number"
                    value={vatAmount}
                    onChange={(e) => setVatAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-paddy-500 focus:border-paddy-500 outline-none transition-all"
                    placeholder="e.g. 100,000"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="inclusive"
                  checked={vatInclusive}
                  onChange={(e) => setVatInclusive(e.target.checked)}
                  className="w-5 h-5 text-paddy-900 border-gray-300 rounded focus:ring-paddy-500"
                />
                <label htmlFor="inclusive" className="text-gray-700 font-medium cursor-pointer select-none">
                  Amount is VAT Inclusive?
                </label>
              </div>

              <button
                onClick={handleVATCalculate}
                className="w-full bg-paddy-900 text-white font-semibold py-3 rounded-xl hover:bg-paddy-800 transition-colors shadow-lg shadow-paddy-900/20"
              >
                Calculate VAT (7.5%)
              </button>

              {vatResult !== null && (
                <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-100 text-center">
                  <p className="text-sm text-gray-500 mb-1">VAT Amount</p>
                  <p className="text-3xl font-bold text-paddy-700">{formatCurrency(vatResult)}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {vatInclusive 
                      ? `Original Base: ${formatCurrency(parseFloat(vatAmount) - vatResult)}` 
                      : `Total with VAT: ${formatCurrency(parseFloat(vatAmount) + vatResult)}`}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 flex justify-center">
        <button 
          onClick={() => {
             setPitResult(null); setVatResult(null); 
             setGrossIncome(''); setRent(''); setVatAmount('');
          }}
          className="flex items-center space-x-2 text-sm text-gray-500 hover:text-paddy-700 transition-colors"
        >
          <RefreshCcw size={16} />
          <span>Reset Calculator</span>
        </button>
      </div>
    </div>
  );
}