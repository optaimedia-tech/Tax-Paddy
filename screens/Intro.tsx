import React from 'react';
import { Calculator, ShieldCheck, MessageSquare, ArrowRight, TrendingUp } from 'lucide-react';

interface IntroProps {
  onComplete: () => void;
}

export default function Intro({ onComplete }: IntroProps) {
  return (
    <div className="relative h-screen w-full bg-paddy-900 overflow-hidden flex flex-col items-center justify-center text-white">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute top-20 left-10 animate-float">
          <Calculator size={64} />
        </div>
        <div className="absolute bottom-32 right-10 animate-float-delayed">
          <ShieldCheck size={80} />
        </div>
        <div className="absolute top-1/3 right-1/4 animate-float">
          <TrendingUp size={48} />
        </div>
        <div className="absolute bottom-20 left-1/3 animate-float-delayed">
          <MessageSquare size={56} />
        </div>
        {/* Large abstract circle */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-paddy-500 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-green-400 rounded-full blur-3xl opacity-20"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center max-w-md px-6 text-center">
        {/* Logo Animation */}
        <div className="mb-8 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-2xl animate-fade-in transform transition-transform hover:scale-105 duration-300">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center">
            <span className="text-4xl font-extrabold text-paddy-900">₦</span>
          </div>
        </div>

        {/* Text Content */}
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight animate-slide-up" style={{ animationDelay: '0.2s' }}>
          TaxPaddy
        </h1>
        <p className="text-lg md:text-xl text-paddy-100 mb-8 leading-relaxed animate-slide-up" style={{ animationDelay: '0.4s' }}>
          Your intelligent companion for Nigerian tax compliance, calculations, and advice.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
            PIT & VAT Calc
          </span>
          <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
            AI Assistant
          </span>
          <span className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full text-xs font-medium border border-white/10">
            Turnover Watchdog
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onComplete}
          className="group relative flex items-center gap-3 bg-white text-paddy-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-paddy-50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-slide-up"
          style={{ animationDelay: '0.8s' }}
        >
          <span>Get Started</span>
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          
          {/* Button Glow Effect */}
          <div className="absolute inset-0 rounded-xl ring-2 ring-white/50 animate-pulse"></div>
        </button>

        <p className="mt-8 text-xs text-paddy-300 animate-fade-in" style={{ animationDelay: '1.2s' }}>
          Based on Nigerian Tax Law 2025
        </p>
      </div>
    </div>
  );
}