export enum Tab {
  HOME = 'Home',
  NEWS = 'Tax Updates',
  CALCULATOR = 'Calculator',
  WATCHDOG = '₦50m Watchdog',
  TRIVIA = 'Tax Trivia',
  AI_CHAT = 'Tax Paddy AI'
}

export interface PITResult {
  taxable: number;
  tax: number;
  relief: number;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type?: 'income' | 'non-income'; // Distinguish between taxable turnover and gifts/loans
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // Index
  explanation: string;
}

export interface NewsItem {
  id: string;
  title: string;
  category: 'Regulatory' | 'Deadline' | 'Tips' | 'Economy';
  date: string;
  readTime: string;
  summary: string;
  content: string;
  isNew?: boolean;
}