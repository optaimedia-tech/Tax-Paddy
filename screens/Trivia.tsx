import React, { useState, useEffect } from 'react';
import { TriviaQuestion } from '../types';
import { Check, X, RefreshCw, Trophy, BookOpen, Shuffle } from 'lucide-react';

const MASTER_POOL: TriviaQuestion[] = [
  // --- VAT & General ---
  {
    id: 1,
    question: "What is the standard VAT rate in Nigeria?",
    options: ["5%", "7.5%", "10%", "15%"],
    correctAnswer: 1,
    explanation: "The standard Value Added Tax (VAT) rate in Nigeria is 7.5%."
  },
  {
    id: 2,
    question: "What does TIN stand for?",
    options: ["Tax Identification Number", "Total Income Net", "Tax Interest Notice", "Temporary ID Number"],
    correctAnswer: 0,
    explanation: "TIN stands for Tax Identification Number, a unique identifier for tax purposes."
  },
  {
    id: 3,
    question: "Which agency collects taxes for the Federal Government?",
    options: ["LIRS", "FIRS", "NNPC", "CBN"],
    correctAnswer: 1,
    explanation: "The Federal Inland Revenue Service (FIRS) is responsible for assessing, collecting, and accounting for tax and other revenues accruing to the Federal Government."
  },
  {
    id: 4,
    question: "What is the deadline for filing VAT returns?",
    options: ["10th of every month", "21st of every month", "30th of every month", "Last day of the year"],
    correctAnswer: 1,
    explanation: "VAT returns must be filed and paid by the 21st day of the month following the month of transaction."
  },
  
  // --- 2025 Law Context (From Prompt) ---
  {
    id: 5,
    question: "Under the 2025 Tax Law, what is the annual income exemption threshold for Personal Income Tax (PIT)?",
    options: ["₦300,000", "₦500,000", "₦800,000", "₦1,000,000"],
    correctAnswer: 2,
    explanation: "Annual income of ₦800,000 or less is completely exempt (0% tax) under the new provisions."
  },
  {
    id: 6,
    question: "What is the Rent Relief deduction percentage for individuals?",
    options: ["10% of gross income", "20% of gross income", "50% of gross income", "100% of rent paid"],
    correctAnswer: 1,
    explanation: "Individuals can deduct 20% of their gross annual income for rent, subject to a cap."
  },
  {
    id: 7,
    question: "What is the maximum cap for the Rent Relief deduction?",
    options: ["₦100,000", "₦250,000", "₦500,000", "₦1,000,000"],
    correctAnswer: 2,
    explanation: "The rent relief deduction is capped at a maximum of ₦500,000."
  },
  {
    id: 8,
    question: "What is the 'Small Company' turnover threshold for 0% CIT exemption?",
    options: ["₦25 Million", "₦50 Million", "₦100 Million", "₦10 Million"],
    correctAnswer: 1,
    explanation: "Companies with a turnover of ₦50 million or less are classified as Small Companies and pay 0% Company Income Tax."
  },
  {
    id: 9,
    question: "What is the CIT rate for Large Companies (Turnover > ₦50m)?",
    options: ["20%", "25%", "30%", "35%"],
    correctAnswer: 2,
    explanation: "Large companies with turnover above ₦50m pay 30% Company Income Tax (CIT)."
  },
  {
    id: 10,
    question: "Large companies must pay a Development Levy of what percentage?",
    options: ["1%", "2%", "4%", "5%"],
    correctAnswer: 2,
    explanation: "In addition to CIT, large companies are subject to a 4% Development Levy."
  },
  {
    id: 11,
    question: "How is VAT revenue shared among the three tiers of government?",
    options: ["Equal share", "15% Fed, 50% State, 35% LG", "10% Fed, 55% State, 35% LG", "52% Fed, 26% State, 20% LG"],
    correctAnswer: 2,
    explanation: "The VAT sharing formula is 10% Federal, 55% State, and 35% Local Government."
  },
  {
    id: 12,
    question: "Which identification number is used for individuals for tax purposes?",
    options: ["BVN", "NIN", "International Passport", "Voters Card"],
    correctAnswer: 1,
    explanation: "The National Identity Number (NIN) is the primary identification for individuals for tax purposes."
  },
  {
    id: 13,
    question: "Which identification number is used for companies for tax purposes?",
    options: ["CAC Number", "RC Number", "Business ID", "Company TIN"],
    correctAnswer: 1,
    explanation: "The RC Number (Registration Number) is used for identifying companies."
  },

  // --- General Nigerian Tax Knowledge ---
  {
    id: 14,
    question: "When is the deadline for filing Personal Income Tax (PIT) returns?",
    options: ["January 31st", "March 31st", "June 30th", "December 31st"],
    correctAnswer: 1,
    explanation: "Individual taxpayers must file their returns by the 31st of March every year."
  },
  {
    id: 15,
    question: "Who is responsible for collecting Personal Income Tax from residents of a State?",
    options: ["FIRS", "State Internal Revenue Service (SIRS)", "Local Government", "Joint Tax Board"],
    correctAnswer: 1,
    explanation: "The State Internal Revenue Service (SIRS) collects PIT from individuals residing in that state, except for residents of the FCT, Police, and Military."
  },
  {
    id: 16,
    question: "What is the standard Withholding Tax (WHT) rate on Rent for individuals?",
    options: ["5%", "7.5%", "10%", "15%"],
    correctAnswer: 2,
    explanation: "The standard Withholding Tax rate on rent for individuals is 10%."
  },
  {
    id: 17,
    question: "What does PAYE stand for?",
    options: ["Pay All Your Earnings", "Pay As You Earn", "Payment After Year End", "Personal Annual Year Earnings"],
    correctAnswer: 1,
    explanation: "PAYE stands for 'Pay As You Earn', a method of collecting income tax from employees."
  },
  {
    id: 18,
    question: "Which of these items is generally EXEMPT from VAT in Nigeria?",
    options: ["Luxury Cars", "Basic Food Items", "Electronics", "Designer Clothing"],
    correctAnswer: 1,
    explanation: "Basic food items, medical supplies, and educational materials are generally exempt from VAT."
  },
  {
    id: 19,
    question: "What is the Capital Gains Tax (CGT) rate in Nigeria?",
    options: ["5%", "10%", "20%", "30%"],
    correctAnswer: 1,
    explanation: "Capital Gains Tax is charged at a flat rate of 10% on chargeable gains."
  },
  {
    id: 20,
    question: "The deadline for remitting PAYE is?",
    options: ["10th of the following month", "21st of the following month", "Last day of the month", "First day of the month"],
    correctAnswer: 0,
    explanation: "Employers must remit PAYE deducted from employees by the 10th day of the following month."
  },
  {
    id: 21,
    question: "Tertiary Education Tax is charged on?",
    options: ["Revenue", "Gross Profit", "Assessable Profit", "Net Assets"],
    correctAnswer: 2,
    explanation: "Tertiary Education Tax is charged on the Assessable Profit of companies registered in Nigeria."
  },
  {
    id: 22,
    question: "Which of these is NOT a direct tax?",
    options: ["Personal Income Tax", "Company Income Tax", "Value Added Tax", "Capital Gains Tax"],
    correctAnswer: 2,
    explanation: "Value Added Tax (VAT) is an indirect tax imposed on the supply of goods and services."
  },
  {
    id: 23,
    question: "Tenement rates are collected by?",
    options: ["Federal Government", "State Government", "Local Government", "Residents Association"],
    correctAnswer: 2,
    explanation: "Tenement rates (property rates) are typically collected by the Local Government."
  },
  {
    id: 24,
    question: "Stamp Duties are charged on?",
    options: ["Physical goods only", "Written or Electronic Instruments", "Salaries", "Dividends"],
    correctAnswer: 1,
    explanation: "Stamp Duties are taxes levied on written or electronic documents/instruments (like agreements, receipts)."
  },
  {
    id: 25,
    question: "A 'Tax Clearance Certificate' (TCC) usually certifies tax compliance for how many previous years?",
    options: ["1 Year", "2 Years", "3 Years", "5 Years"],
    correctAnswer: 2,
    explanation: "A TCC certifies that the taxpayer has paid all taxes due for the three immediately preceding years."
  },
  {
    id: 26,
    question: "Withholding Tax is:",
    options: ["A separate tax type", "An advance payment of tax", "A penalty", "A tax on bank deposits only"],
    correctAnswer: 1,
    explanation: "Withholding Tax is not a separate tax but an advance payment of income tax, which can often be used as tax credit."
  },
  {
    id: 27,
    question: "What happens if a company fails to file CIT on time?",
    options: ["Nothing", "They get a bonus", "They pay a penalty/fine", "They are closed down immediately"],
    correctAnswer: 2,
    explanation: "Failure to file returns on time attracts monetary penalties and potential interest charges."
  },
  {
    id: 28,
    question: "Is 'Tips and Gratuities' taxable under PIT?",
    options: ["No, never", "Yes, if they form part of emoluments", "Only for government workers", "Only if paid in dollars"],
    correctAnswer: 1,
    explanation: "Generally, any gain or profit from employment, including tips and gratuities that form part of emoluments, is taxable."
  },
  {
    id: 29,
    question: "Can losses be carried forward in CIT?",
    options: ["No", "Yes, indefinitely (for the same trade)", "Yes, for 1 year only", "Yes, but only 50%"],
    correctAnswer: 1,
    explanation: "Companies can typically carry forward losses indefinitely to set off against future profits from the same trade/business."
  },
  {
    id: 30,
    question: "Who is the Chairman of the Joint Tax Board (JTB)?",
    options: ["CBN Governor", "Minister of Finance", "Executive Chairman of FIRS", "President of Nigeria"],
    correctAnswer: 2,
    explanation: "The Executive Chairman of the Federal Inland Revenue Service (FIRS) serves as the Chairman of the Joint Tax Board."
  },
  // --- New Question: Transfer Narration ---
  {
    id: 31,
    question: "You want to send ₦50,000 to your brother for feeding. Which method is safer for his 2026 tax record?",
    options: ["Use USSD (737) quickly", "Use Bank App and write 'Feeding' in remark", "Send it and call him to explain"],
    correctAnswer: 1,
    explanation: "USSD often lacks description fields. Without writing 'Feeding', tax authorities might treat that ₦50k as taxable income! Always clearly label non-income transfers."
  }
];

// Number of questions per round
const ROUND_SIZE = 10;

export default function Trivia() {
  const [activeQuestions, setActiveQuestions] = useState<TriviaQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Initialize game on mount
  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    // 1. Shuffle the master pool
    const shuffled = [...MASTER_POOL].sort(() => 0.5 - Math.random());
    // 2. Take the first N questions for this round
    const selected = shuffled.slice(0, ROUND_SIZE);
    
    setActiveQuestions(selected);
    setCurrentIndex(0);
    setScore(0);
    setShowResult(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const currentQuestion = activeQuestions[currentIndex];

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);
    
    if (index === currentQuestion.correctAnswer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < activeQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResult(true);
    }
  };

  // Guard clause for initial render before useEffect runs
  if (!currentQuestion && !showResult) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-paddy-900"></div></div>;
  }

  if (showResult) {
    const percentage = (score / activeQuestions.length) * 100;
    let message = "Time to brush up on your tax knowledge! 📖";
    if (percentage === 100) message = "Perfect! You're a Tax Guru! 🎓";
    else if (percentage >= 70) message = "Great job! You know your taxes! 📚";
    else if (percentage >= 50) message = "Good effort! Keep learning! 📝";

    return (
      <div className="max-w-md mx-auto text-center pt-10 animate-fade-in">
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 relative overflow-hidden">
          {/* Confetti/Decor background if high score */}
          {percentage >= 70 && (
             <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute top-10 left-10 w-4 h-4 bg-yellow-400 rounded-full animate-bounce"></div>
                <div className="absolute bottom-10 right-10 w-6 h-6 bg-paddy-500 rounded-lg animate-bounce" style={{ animationDelay: '0.2s' }}></div>
             </div>
          )}

          <div className="w-24 h-24 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Trophy size={48} className="text-yellow-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz Complete!</h2>
          <p className="text-gray-500 mb-6">You scored</p>
          
          <div className="relative inline-block mb-4">
            <span className="text-7xl font-black text-paddy-900 tracking-tighter">{score}</span>
            <span className="text-2xl text-gray-400 font-medium absolute -right-6 bottom-2">/{activeQuestions.length}</span>
          </div>

          <p className="text-sm text-gray-600 mb-8 px-4 font-medium leading-relaxed">
            {message}
          </p>
          
          <button 
            onClick={startNewGame}
            className="w-full bg-paddy-900 text-white py-4 rounded-xl font-bold hover:bg-paddy-800 transition-all transform active:scale-95 flex items-center justify-center space-x-2 shadow-lg shadow-paddy-900/20"
          >
            <RefreshCw size={20} />
            <span>Play New Round</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto animate-fade-in">
      {/* Header / Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-3">
          <div>
             <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
               <BookOpen size={20} className="text-paddy-600" />
               Tax Trivia
             </h2>
             <p className="text-xs text-gray-400">Round of {ROUND_SIZE}</p>
          </div>
          <div className="text-right">
             <span className="text-2xl font-black text-paddy-900">{score}</span>
             <span className="text-gray-300 text-sm"> pts</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-paddy-500 to-paddy-700 transition-all duration-500 ease-out" 
            style={{ width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs font-semibold text-gray-400">
           <span>Question {currentIndex + 1}</span>
           <span>{activeQuestions.length - (currentIndex + 1)} remaining</span>
        </div>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden relative transition-all duration-300">
        
        {/* Question Area */}
        <div className="p-6 md:p-8 bg-white z-10 relative">
          <div className="min-h-[80px] flex items-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-snug">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="space-y-3 mt-8">
            {currentQuestion.options.map((option, idx) => {
              let btnClass = "border-gray-200 hover:bg-gray-50 text-gray-700 hover:border-gray-300";
              let icon = null;
              
              if (isAnswered) {
                if (idx === currentQuestion.correctAnswer) {
                  btnClass = "bg-green-50 border-green-500 text-green-800 shadow-sm ring-1 ring-green-500";
                  icon = <Check size={20} className="text-green-600" />;
                } else if (idx === selectedOption) {
                  btnClass = "bg-red-50 border-red-500 text-red-800 shadow-sm ring-1 ring-red-500";
                  icon = <X size={20} className="text-red-600" />;
                } else {
                  btnClass = "opacity-40 border-gray-100 bg-gray-50";
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-xl border-2 font-medium transition-all duration-200 flex justify-between items-center ${btnClass} ${!isAnswered ? 'active:scale-[0.99]' : ''}`}
                >
                  <span className="flex-1 mr-2">{option}</span>
                  {icon}
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation Area (Slide down) */}
        {isAnswered && (
          <div className="bg-gray-50 p-6 border-t border-gray-100 animate-slide-up">
            <div className="flex gap-3 mb-6">
               <div className="mt-1 shrink-0">
                 <div className="w-6 h-6 rounded-full bg-paddy-100 flex items-center justify-center text-paddy-700">
                   <span className="text-xs font-bold">i</span>
                 </div>
               </div>
               <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-1">Did you know?</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
               </div>
            </div>
            
            <button 
              onClick={nextQuestion}
              className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <span>{currentIndex === activeQuestions.length - 1 ? "Finish Round" : "Next Question"}</span>
              <Shuffle size={16} className="opacity-50" />
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-center">
         <button 
           onClick={startNewGame}
           className="text-xs text-gray-400 hover:text-paddy-600 transition-colors flex items-center justify-center gap-1 mx-auto"
         >
           <RefreshCw size={12} />
           <span>Reset Round</span>
         </button>
      </div>
    </div>
  );
}