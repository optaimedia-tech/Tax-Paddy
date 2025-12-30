import React from 'react';
import { Tab } from '../types';
import { Home, Calculator, ShieldAlert, Trophy, Mic, Newspaper } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

interface NavItemProps {
  tab: Tab;
  activeTab: Tab;
  onClick: (t: Tab) => void;
  icon: React.ElementType;
}

const NavItem: React.FC<NavItemProps> = ({ 
  tab, 
  activeTab, 
  onClick, 
  icon: Icon 
}) => {
  const isActive = activeTab === tab;
  return (
    <button
      onClick={() => onClick(tab)}
      className={`flex items-center space-x-3 px-4 py-3 w-full rounded-lg transition-colors duration-200 ${
        isActive 
          ? 'bg-paddy-900 text-white shadow-md' 
          : 'text-gray-600 hover:bg-paddy-100 hover:text-paddy-900'
      }`}
    >
      <Icon size={24} className={isActive ? 'text-white' : ''} />
      <span className="font-medium">{tab}</span>
    </button>
  );
};

const MobileNavItem: React.FC<NavItemProps> = ({ 
  tab, 
  activeTab, 
  onClick, 
  icon: Icon 
}) => {
  const isActive = activeTab === tab;
  return (
    <button
      onClick={() => onClick(tab)}
      className={`flex flex-col items-center justify-center w-full py-2 ${
        isActive ? 'text-paddy-900' : 'text-gray-400'
      }`}
    >
      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10px] mt-1 font-medium">{tab === Tab.WATCHDOG ? 'Watchdog' : tab === Tab.NEWS ? 'Updates' : tab}</span>
    </button>
  );
};

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  // Mapping tabs to icons
  const getIcon = (tab: Tab) => {
    switch (tab) {
      case Tab.HOME: return Home;
      case Tab.NEWS: return Newspaper;
      case Tab.CALCULATOR: return Calculator;
      case Tab.WATCHDOG: return ShieldAlert;
      case Tab.TRIVIA: return Trophy;
      case Tab.AI_CHAT: return Mic;
      default: return Home;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-full">
        <div className="p-6 flex items-center space-x-2 border-b border-gray-100">
          <div className="w-8 h-8 bg-paddy-900 rounded-lg flex items-center justify-center">
             <span className="text-white font-bold text-xl">₦</span>
          </div>
          <h1 className="text-2xl font-bold text-paddy-900 tracking-tight">TaxPaddy</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {Object.values(Tab).map((tab) => (
            <NavItem 
              key={tab} 
              tab={tab} 
              activeTab={activeTab} 
              onClick={onTabChange} 
              icon={getIcon(tab)} 
            />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="bg-paddy-50 p-4 rounded-xl">
            <p className="text-xs text-paddy-800 font-semibold mb-1">Tax Season Tip</p>
            <p className="text-xs text-paddy-600">File your VAT returns by the 21st of every month to avoid penalties.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative w-full">
        {/* Mobile Header */}
        <header className="md:hidden bg-paddy-900 text-white p-4 flex items-center justify-between shadow-md z-20">
          <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                 <span className="text-white font-bold">₦</span>
             </div>
             <h1 className="text-xl font-bold">TaxPaddy</h1>
          </div>
        </header>

        {/* Content Scroll Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-5xl mx-auto w-full">
            {children}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30 flex justify-around pb-safe">
           {Object.values(Tab).map((tab) => (
            <MobileNavItem 
              key={tab} 
              tab={tab} 
              activeTab={activeTab} 
              onClick={onTabChange} 
              icon={getIcon(tab)} 
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Layout;