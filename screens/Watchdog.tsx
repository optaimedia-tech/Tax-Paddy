import React, { useState } from 'react';
import { Transaction } from '../types';
import { Plus, Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function Watchdog() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', amount: 5000000, description: 'Consulting Q1', date: '2023-01-15', type: 'income' },
    { id: '2', amount: 8500000, description: 'Project Alpha', date: '2023-03-22', type: 'income' },
    { id: '3', amount: 3200000, description: 'Retainer Fee', date: '2023-04-10', type: 'income' },
  ]);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [txType, setTxType] = useState<'income' | 'non-income'>('income');

  const threshold = 50000000; // 50 Million
  // Only calculate turnover based on taxable business income
  const currentTotal = transactions
    .filter(t => t.type === 'income' || t.type === undefined) // Fallback for old data
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const percentage = Math.min((currentTotal / threshold) * 100, 100);

  const addTransaction = () => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0 && desc.trim()) {
      const newTx: Transaction = {
        id: Date.now().toString(),
        amount: val,
        description: desc,
        date: new Date().toISOString().split('T')[0],
        type: txType
      };
      setTransactions([...transactions, newTx]);
      setAmount('');
      setDesc('');
      setTxType('income'); // Reset to default
    }
  };

  const removeTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(val);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">₦50M Turnover Watchdog</h2>
        <p className="text-gray-500 mb-6">Track your business turnover against the CIT exemption threshold. <br/><span className="text-xs text-gray-400">Note: Genuine gifts/loans do not count towards this threshold.</span></p>

        {/* Progress Bar */}
        <div className="mb-2 flex justify-between items-end">
          <div>
             <span className="text-3xl font-bold text-paddy-900">{formatCurrency(currentTotal)}</span>
             <span className="text-gray-400 text-sm ml-2">/ ₦50,000,000</span>
          </div>
          <span className="font-bold text-lg text-gray-700">{percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden mb-4">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${percentage >= 100 ? 'bg-red-500' : 'bg-paddy-600'}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        {percentage >= 100 ? (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start space-x-3">
            <AlertTriangle className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-700">Threshold Exceeded</h4>
              <p className="text-sm text-red-600">You have crossed the ₦50m small company threshold. You may now be liable for Company Income Tax (CIT) filing obligations.</p>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-start space-x-3">
            <CheckCircle className="text-green-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-green-700">Small Company Status</h4>
              <p className="text-sm text-green-600">You are currently below the ₦50m threshold.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h3 className="font-bold text-gray-800 mb-4">Add Transaction</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
              <input 
                type="text" 
                value={desc}
                onChange={e => setDesc(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-paddy-500 focus:border-paddy-500 outline-none text-sm"
                placeholder="e.g. Invoice #001"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Classification</label>
              <div className="relative">
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as 'income' | 'non-income')}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-paddy-500 focus:border-paddy-500 outline-none text-sm appearance-none"
                >
                  <option value="income">Business Income (Taxable)</option>
                  <option value="non-income">Gift / Loan / Support</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Warning for Non-Income */}
            {txType === 'non-income' && (
              <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-lg text-xs text-yellow-800 flex items-start gap-2">
                 <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                 <p>
                   <b>Important:</b> Ensure the sender wrote "Gift", "Loan" or "Support" in the bank transfer narration. Unlabeled inflows may be taxed!
                 </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount</label>
              <input 
                type="number" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-paddy-500 focus:border-paddy-500 outline-none text-sm"
                placeholder="0.00"
              />
            </div>
            <button 
              onClick={addTransaction}
              className="w-full flex items-center justify-center space-x-2 bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus size={18} />
              <span>Add Transaction</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {transactions.length === 0 ? (
               <p className="text-center text-gray-400 py-8">No transactions recorded yet.</p>
            ) : (
              transactions.slice().reverse().map(t => (
                <div key={t.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all group">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800">{t.description}</p>
                      {t.type === 'non-income' && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-medium border border-yellow-200">
                          Non-Income
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{t.date}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`font-bold ${t.type === 'non-income' ? 'text-gray-400 line-through decoration-gray-300' : 'text-paddy-700'}`}>
                      {formatCurrency(t.amount)}
                    </span>
                    <button 
                      onClick={() => removeTransaction(t.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}