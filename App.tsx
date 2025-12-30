import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './screens/Dashboard';
import Calculator from './screens/Calculator';
import Watchdog from './screens/Watchdog';
import Trivia from './screens/Trivia';
import AIChat from './screens/AIChat';
import News from './screens/News';
import Intro from './screens/Intro';
import { Tab } from './types';

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);

  const renderScreen = () => {
    switch (activeTab) {
      case Tab.HOME:
        return <Dashboard onNavigate={setActiveTab} />;
      case Tab.NEWS:
        return <News />;
      case Tab.CALCULATOR:
        return <Calculator />;
      case Tab.WATCHDOG:
        return <Watchdog />;
      case Tab.TRIVIA:
        return <Trivia />;
      case Tab.AI_CHAT:
        return <AIChat />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  if (showIntro) {
    return <Intro onComplete={() => setShowIntro(false)} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderScreen()}
    </Layout>
  );
}