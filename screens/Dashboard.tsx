import React, { useMemo, useState } from 'react';
import { Tab } from '../types';
import { ArrowRight, Calculator, Shield, TrendingUp, Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  onNavigate: (tab: Tab) => void;
}

// Helper to get dynamic chart data based on current date
const getRecentRevenueData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  const data = [];
  // Generate data for the last 6 months including current
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    // Deterministic mock data based on month index to prevent jitter on re-renders
    const seed = d.getMonth() + d.getFullYear(); 
    const amount = Math.floor((((seed * 9301 + 49297) % 233280) / 233280) * 4000000) + 3000000;
    
    data.push({
      name: months[d.getMonth()],
      fullDate: d,
      amount: amount,
    });
  }
  return data;
};

interface Deadline {
  date: Date;
  title: string;
  description: string;
  type: 'PAYE' | 'VAT' | 'CIT';
}

const getNextDeadline = (): Deadline => {
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11

  const candidates: Deadline[] = [];

  // 1. PAYE: 10th of every month
  let payeDate = new Date(currentYear, currentMonth, 10);
  if (today > payeDate) {
    payeDate = new Date(currentYear, currentMonth + 1, 10);
  }
  candidates.push({ 
    date: payeDate, 
    title: 'PAYE Remittance', 
    description: 'Deadline to remit Pay As You Earn (PAYE) taxes.',
    type: 'PAYE'
  });

  // 2. VAT: 21st of every month
  let vatDate = new Date(currentYear, currentMonth, 21);
  if (today > vatDate) {
    vatDate = new Date(currentYear, currentMonth + 1, 21);
  }
  candidates.push({ 
    date: vatDate, 
    title: 'VAT Remittance', 
    description: 'Deadline to file and pay Value Added Tax (VAT).',
    type: 'VAT'
  });

  // Sort by closest date
  candidates.sort((a, b) => a.date.getTime() - b.date.getTime());

  return candidates[0];
};

export default function Dashboard({ onNavigate }: DashboardProps) {
  const chartData = useMemo(() => getRecentRevenueData(), []);
  const nextDeadline = useMemo(() => getNextDeadline(), []);
  
  // Calendar State
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  };

  // Calendar Helpers
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const navigateMonth = (direction: number) => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + direction, 1));
  };

  const navigateYear = (direction: number) => {
    setCalendarDate(new Date(calendarDate.getFullYear() + direction, calendarDate.getMonth(), 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           calendarDate.getMonth() === today.getMonth() && 
           calendarDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && 
           calendarDate.getMonth() === selectedDate.getMonth() && 
           calendarDate.getFullYear() === selectedDate.getFullYear();
  };

  const getEventForDay = (day: number) => {
    // Check standard monthly recurring events
    if (day === 10) return { type: 'PAYE', title: 'PAYE Due' };
    if (day === 21) return { type: 'VAT', title: 'VAT Due' };
    return null;
  };

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day));
  };

  const renderCalendarGrid = () => {
    const blanks = Array(firstDayOfMonth).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const totalSlots = [...blanks, ...days];

    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-xs font-semibold text-gray-400">
            {day}
          </div>
        ))}
        {totalSlots.map((day, index) => {
          if (!day) return <div key={`blank-${index}`} className="h-10" />;
          
          const event = getEventForDay(day);
          const active = isSelected(day);
          const today = isToday(day);

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              className={`h-10 w-full rounded-lg flex flex-col items-center justify-center relative transition-colors ${
                active 
                  ? 'bg-paddy-900 text-white shadow-md' 
                  : today 
                    ? 'bg-paddy-100 text-paddy-900 font-bold' 
                    : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              <span className="text-sm">{day}</span>
              {event && !active && (
                <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                  event.type === 'PAYE' ? 'bg-blue-500' : 'bg-red-500'
                }`} />
              )}
            </button>
          );
        })}
      </div>
    );
  };

  const selectedEvent = selectedDate ? getEventForDay(selectedDate.getDate()) : null;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Welcome Back, Paddy!</h2>
          <p className="text-gray-500 mt-1">Here's your tax overview for {new Intl.DateTimeFormat('en-NG', { month: 'long', year: 'numeric' }).format(new Date())}.</p>
        </div>
        <div className="text-right hidden md:block">
           <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Current Date</p>
           <p className="text-lg font-medium text-gray-700">{new Intl.DateTimeFormat('en-NG', { dateStyle: 'full' }).format(new Date())}</p>
        </div>
      </header>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => onNavigate(Tab.WATCHDOG)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Shield size={24} />
            </div>
            <ArrowRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
          </div>
          <div className="relative z-10">
             <h3 className="text-gray-500 text-sm font-medium">YTD Turnover</h3>
             <p className="text-2xl font-bold text-gray-900 mt-1">₦24.5M</p>
             <div className="mt-2 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
               <div className="bg-blue-500 h-full rounded-full" style={{ width: '49%' }}></div>
             </div>
             <p className="text-xs text-gray-400 mt-2">49% to ₦50M threshold</p>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        </div>

        <div 
          onClick={() => onNavigate(Tab.CALCULATOR)}
          className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-green-50 text-paddy-600 rounded-xl">
              <Calculator size={24} />
            </div>
            <ArrowRight size={20} className="text-gray-300 group-hover:text-paddy-600 transition-colors" />
          </div>
          <div className="relative z-10">
             <h3 className="text-gray-500 text-sm font-medium">Quick Calc</h3>
             <p className="text-lg font-semibold text-gray-900 mt-1">Calculate PIT & VAT</p>
             <p className="text-xs text-gray-400 mt-2">Latest Finance Act rates</p>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-green-50 rounded-full opacity-50 group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Deadline Highlight Card */}
        <div className="bg-gradient-to-br from-paddy-800 to-paddy-900 p-6 rounded-2xl shadow-md text-white relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <CalendarIcon size={24} className="text-white" />
            </div>
          </div>
          <div className="relative z-10">
             <h3 className="text-paddy-100 text-sm font-medium flex items-center gap-2">
               Upcoming Deadline
               <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></span>
             </h3>
             <p className="text-3xl font-bold mt-1 tracking-tight">{formatDate(nextDeadline.date)}</p>
             <p className="text-sm text-paddy-200 mt-2 font-medium">{nextDeadline.title}</p>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
        </div>
      </div>

      {/* Main Content Split: Chart & Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-paddy-600" />
              Revenue Trend
            </h3>
            <select className="text-sm border-gray-200 rounded-lg text-gray-500 bg-gray-50 p-2 focus:ring-paddy-500 focus:border-paddy-500 outline-none">
              <option>Recent</option>
              <option>YTD</option>
            </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  tickFormatter={(value) => `₦${(value/1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  cursor={{ fill: '#f0fdf4' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    padding: '12px' 
                  }}
                  formatter={(value: number) => [`₦${new Intl.NumberFormat('en-NG').format(value)}`, 'Revenue']}
                  labelStyle={{ color: '#6b7280', marginBottom: '4px', fontSize: '12px' }}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1500}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === chartData.length - 1 ? '#15803d' : '#bbf7d0'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* In-App Calendar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full">
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center space-x-1">
                <button onClick={() => navigateYear(-1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-paddy-900 transition-colors">
                  <ChevronsLeft size={16} />
                </button>
                <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-paddy-900 transition-colors">
                  <ChevronLeft size={16} />
                </button>
             </div>
             
             <h3 className="font-bold text-gray-800 text-center select-none">
               {monthNames[calendarDate.getMonth()]} <span className="text-paddy-600">{calendarDate.getFullYear()}</span>
             </h3>

             <div className="flex items-center space-x-1">
                <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-paddy-900 transition-colors">
                  <ChevronRight size={16} />
                </button>
                <button onClick={() => navigateYear(1)} className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-paddy-900 transition-colors">
                  <ChevronsRight size={16} />
                </button>
             </div>
           </div>

           {/* Calendar Grid */}
           <div className="flex-1">
             {renderCalendarGrid()}
           </div>

           {/* Selected Date Info */}
           <div className="mt-4 pt-4 border-t border-gray-100">
             {selectedDate ? (
               <div className="bg-gray-50 rounded-xl p-4">
                 <p className="text-xs text-gray-500 font-semibold uppercase mb-1">{formatDate(selectedDate)}</p>
                 {selectedEvent ? (
                   <div className="flex items-start gap-3">
                     <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${selectedEvent.type === 'PAYE' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                     <div>
                       <p className="font-bold text-gray-900 text-sm">{selectedEvent.title}</p>
                       <p className="text-xs text-gray-500 mt-1">Compliance is mandatory.</p>
                     </div>
                   </div>
                 ) : (
                   <p className="text-sm text-gray-400 flex items-center gap-2">
                     <Info size={16} />
                     No tax events due.
                   </p>
                 )}
               </div>
             ) : (
               <div className="text-center text-gray-400 text-sm py-4">Select a date to view details</div>
             )}
           </div>

           {/* Legend */}
           <div className="flex gap-4 mt-4 justify-center text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> PAYE
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> VAT
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}