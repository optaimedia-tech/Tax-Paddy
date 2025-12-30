import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Calendar, RefreshCw, ExternalLink, TrendingUp, AlertCircle, BookOpen, Loader2 } from 'lucide-react';

// Interface for Grounding Chunks (Sources)
interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export default function News() {
  const [briefing, setBriefing] = useState<string>('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchNews = async () => {
    setIsLoading(true);
    setError(null);
    setSources([]);
    
    try {
      if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Find the latest news, regulatory updates, deadlines, and educational articles regarding Nigerian Tax Laws, FIRS circulars, and the Finance Act for the current year. 
        
        Summarize the top 5 most relevant and recent items into a "Daily Tax Briefing". 
        
        For each item:
        1. Use a clear, bold header (e.g. **Title**).
        2. Provide a concise summary of the update.
        3. Explain the implication for taxpayers (e.g. "Why this matters").
        
        Keep the tone professional and journalistic.`,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      if (response.text) {
        setBriefing(response.text);
        setLastUpdated(new Date());
      }
      
      // Extract sources from grounding metadata
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[];
      if (chunks) {
        // Filter out duplicates based on URI
        const uniqueSources = chunks.filter((chunk, index, self) => 
          chunk.web && index === self.findIndex((t) => (
            t.web?.uri === chunk.web?.uri
          ))
        );
        setSources(uniqueSources);
      }

    } catch (err: any) {
      console.error("Failed to fetch news:", err);
      setError("Unable to load latest updates. Please check your connection or try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Simple Markdown-like renderer for the briefing text
  const renderBriefing = (text: string) => {
    return text.split('\n').map((line, index) => {
      // Headers (bold lines)
      if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
         return <h3 key={index} className="text-lg font-bold text-gray-900 mt-6 mb-2">{line.replace(/\*\*/g, '')}</h3>;
      }
      // Bullet points
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return (
          <li key={index} className="ml-4 mb-2 text-gray-700 leading-relaxed list-disc pl-2">
            {line.replace(/^[\*\-]\s/, '').split('**').map((part, i) => 
              i % 2 === 1 ? <strong key={i} className="text-gray-900">{part}</strong> : part
            )}
          </li>
        );
      }
      // Standard paragraphs with bold parsing
      if (line.trim().length > 0) {
        return (
          <p key={index} className="mb-3 text-gray-700 leading-relaxed">
             {line.split('**').map((part, i) => 
               i % 2 === 1 ? <strong key={i} className="text-gray-900 font-semibold">{part}</strong> : part
             )}
          </p>
        );
      }
      return null;
    });
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
               <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> Live
             </span>
             <h2 className="text-2xl font-bold text-gray-800">Tax Intelligence Feed</h2>
          </div>
          <p className="text-gray-500 text-sm">Real-time updates curated from the web.</p>
        </div>
        
        <div className="flex items-center gap-4">
           {lastUpdated && (
             <span className="text-xs text-gray-400 hidden md:block">
               Updated: {lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </span>
           )}
           <button 
             onClick={fetchNews}
             disabled={isLoading}
             className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-gray-800 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
             <span>Refresh</span>
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Briefing Column */}
        <div className="lg:col-span-2 space-y-6">
           {isLoading ? (
             <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm animate-pulse space-y-4">
               <div className="h-6 bg-gray-100 rounded w-3/4"></div>
               <div className="h-4 bg-gray-100 rounded w-full"></div>
               <div className="h-4 bg-gray-100 rounded w-full"></div>
               <div className="h-4 bg-gray-100 rounded w-5/6"></div>
               <div className="h-20 bg-gray-50 rounded-xl mt-6"></div>
               <div className="h-6 bg-gray-100 rounded w-1/2 mt-8"></div>
               <div className="h-4 bg-gray-100 rounded w-full"></div>
             </div>
           ) : error ? (
             <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                  <AlertCircle size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Update Failed</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">{error}</p>
                <button onClick={fetchNews} className="text-paddy-700 font-bold text-sm hover:underline">Try Again</button>
             </div>
           ) : (
             <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
                <div className="prose prose-green max-w-none">
                  {renderBriefing(briefing)}
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <BookOpen size={16} />
                    <span>This briefing is generated by AI using Google Search. Verify critical details with official FIRS sources.</span>
                  </div>
                </div>
             </div>
           )}
        </div>

        {/* Sources & Links Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ExternalLink size={18} className="text-paddy-600" />
              Sources & References
            </h3>
            
            {isLoading ? (
              <div className="space-y-3">
                 {[1,2,3].map(i => (
                   <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse"></div>
                 ))}
              </div>
            ) : sources.length > 0 ? (
              <div className="space-y-3">
                {sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.web?.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-xl border border-gray-200 hover:border-paddy-300 hover:bg-paddy-50 transition-all group"
                  >
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <TrendingUp size={10} /> Source {idx + 1}
                    </p>
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-paddy-800 line-clamp-2">
                      {source.web?.title || "No Title Available"}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-2 truncate">
                      {source.web?.uri}
                    </p>
                  </a>
                ))}
              </div>
            ) : (
               <div className="text-center py-8 text-gray-400 text-sm">
                 <p>No external sources cited for this briefing.</p>
               </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100">
               <h4 className="font-bold text-gray-800 text-sm mb-3">Quick Links</h4>
               <ul className="space-y-2 text-sm">
                 <li>
                   <a href="https://www.firs.gov.ng" target="_blank" className="text-paddy-700 hover:underline flex items-center gap-1">
                     <ExternalLink size={12} /> FIRS Official Website
                   </a>
                 </li>
                 <li>
                   <a href="https://citn.org" target="_blank" className="text-paddy-700 hover:underline flex items-center gap-1">
                     <ExternalLink size={12} /> CITN (Tax Institute)
                   </a>
                 </li>
               </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}