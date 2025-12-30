import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini } from '../services/geminiService';
import { polyglotTTS } from '../services/ttsService';
import { ChatMessage } from '../types';
import { Send, Bot, User, Loader2, Mic, PhoneOff, Globe, AlertCircle, Lock } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// --- Constants ---
const DAILY_LIMIT = 5;
const STORAGE_KEY = 'taxpaddy_daily_limit';

// --- Audio Helpers ---

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp values to [-1, 1] before converting to PCM16
    const val = Math.max(-1, Math.min(1, data[i]));
    int16[i] = val * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Try browser native decode first (works for WAV from Azure)
  const bufferCopy = data.buffer.slice(0);
  
  try {
     return await ctx.decodeAudioData(bufferCopy); 
  } catch (e) {
     // Fallback to manual PCM decoding (for Gemini raw streams which have no headers)
     const dataInt16 = new Int16Array(data.buffer);
     const frameCount = dataInt16.length / numChannels;
     const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

     for (let channel = 0; channel < numChannels; channel++) {
       const channelData = buffer.getChannelData(channel);
       for (let i = 0; i < frameCount; i++) {
         channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
       }
     }
     return buffer;
  }
}

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Nigerian Pidgin', label: 'Pidgin' },
  { code: 'Hausa', label: 'Hausa' },
  { code: 'Yoruba', label: 'Yoruba' },
  { code: 'Igbo', label: 'Igbo' },
];

const getSystemInstruction = (language: string) => `You are Tax Paddy, a friendly and knowledgeable Nigerian tax assistant.
You provide guidance based on the **Nigerian Tax Law 2025 (Effective Jan 1, 2026)**.

**Knowledge Base (Strictly Adhere to These Provisions):**
1. **Rent Relief:** Individuals can deduct 20% of their gross annual income for rent, capped at ₦500,000 maximum.
2. **Personal Income Tax (PIT):** Annual income of ₦800,000 or less is completely exempt (0% tax).
3. **Small Company Exemption:** Companies with turnover of ₦50 million or less pay 0% Company Income Tax (CIT).
4. **Large Company CIT:** Companies with turnover > ₦50m pay 30% CIT plus a 4% Development Levy.
5. **VAT:** The standard Rate is 7.5%. The sharing formula is 10% Federal, 55% State, and 35% Local Government.
6. **Identification:** Use National Identity Number (NIN) for individuals and RC Number for companies.
7. **Transfer Narration Rule:** Starting Jan 1, 2026, unlabeled bank inflows are treated as taxable income. 
   - **Crucial Advice:** Advise users to ALWAYS add descriptions like "Gift", "Feeding", or "Loan" for non-business transfers. 
   - **USSD Warning:** Warn users that USSD often lacks description fields, making it risky for non-income transfers.

**Language Instruction:** 
You must communicate primarily in **${language}**. 
If the selected language is 'Nigerian Pidgin', speak in broken English.
If the selected language is 'Hausa', 'Yoruba', or 'Igbo', reply in that language.
Your tone is professional, encouraging, and Nigerian-friendly. Speak concisely and clearly.`;

export default function AIChat() {
  // --- Text Chat State ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'model',
      text: "Hello! I'm Tax Paddy 🤖. I'm updated with the Nigerian Tax Law 2025. Ask me about rent relief, PIT exemptions, or VAT!"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Voice Mode State ---
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0); 
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isUsingAzure, setIsUsingAzure] = useState(false);

  // --- Quota State ---
  const [remainingQuota, setRemainingQuota] = useState(DAILY_LIMIT);
  const remainingQuotaRef = useRef(DAILY_LIMIT);

  // --- Voice Refs ---
  const nextStartTimeRef = useRef<number>(0);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<Promise<any> | null>(null); 
  
  // Transcription buffer for Azure TTS
  const transcriptionBufferRef = useRef<string>("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Quota Logic ---
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.date === today) {
          setRemainingQuota(data.remaining);
          remainingQuotaRef.current = data.remaining;
        } else {
          resetQuota(today);
        }
      } else {
        resetQuota(today);
      }
    } catch (e) {
      resetQuota(today);
    }
  }, []);

  const resetQuota = (date: string) => {
    const data = { date, remaining: DAILY_LIMIT };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setRemainingQuota(DAILY_LIMIT);
    remainingQuotaRef.current = DAILY_LIMIT;
  };

  const decrementQuota = () => {
    if (remainingQuotaRef.current <= 0) return;
    
    const newQuota = remainingQuotaRef.current - 1;
    remainingQuotaRef.current = newQuota;
    setRemainingQuota(newQuota);
    
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, remaining: newQuota }));
  };

  // --- Text Chat Logic ---
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Check limit
    if (remainingQuota <= 0) {
      const limitMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: "You have reached your daily limit of 5 free questions. Please come back tomorrow! 🕒",
        isError: true
      };
      setMessages(prev => [...prev, limitMsg]);
      setInput('');
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Deduct immediately on attempt
    decrementQuota();

    try {
      const responseText = await sendMessageToGemini(userMsg.text);
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I'm having trouble connecting to the network. Please try again later.",
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Voice Mode Logic ---

  const stopVoiceMode = () => {
    // 1. Mark session as null immediately to stop loops
    sessionRef.current = null;
    transcriptionBufferRef.current = "";

    // 2. Stop Media Stream Tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // 3. Disconnect nodes
    if (sourceRef.current) {
      try { sourceRef.current.disconnect(); } catch(e) {}
      sourceRef.current = null;
    }
    if (processorRef.current) {
      try { 
        processorRef.current.disconnect(); 
        processorRef.current.onaudioprocess = null;
      } catch(e) {}
      processorRef.current = null;
    }

    // 4. Stop all playing sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    
    // 5. Close contexts
    if (inputContextRef.current) {
      inputContextRef.current.close().catch(() => {});
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close().catch(() => {});
      outputContextRef.current = null;
    }
    
    // 6. Update State
    setVoiceStatus('disconnected');
    setIsVoiceMode(false);
    setAudioLevel(0);
  };

  const playAudioBuffer = async (arrayBuffer: ArrayBuffer) => {
    if (!outputContextRef.current) return;
    const ctx = outputContextRef.current;

    // Ensure context is running (sometimes browsers suspend it)
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch(e) { console.warn("Failed to resume ctx", e); }
    }

    try {
      const audioBuffer = await decodeAudioData(new Uint8Array(arrayBuffer), ctx, 24000, 1);
      
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.addEventListener('ended', () => {
         sourcesRef.current.delete(source);
      });
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      sourcesRef.current.add(source);
    } catch (e) {
      console.error("Error playing audio buffer:", e);
    }
  };

  const startVoiceMode = async (lang = selectedLanguage) => {
    // Prevent double start or start while connecting
    if (voiceStatus === 'connecting' || voiceStatus === 'connected') return;
    
    // Check Limit
    if (remainingQuotaRef.current <= 0) {
      setIsVoiceMode(true);
      setVoiceError("Daily limit reached (5/5). Come back tomorrow!");
      return;
    }

    if (!process.env.API_KEY) {
      setIsVoiceMode(true); 
      setVoiceError("API Key missing. Cannot start voice mode.");
      return;
    }

    setIsVoiceMode(true);
    setVoiceStatus('connecting');
    setVoiceError(null);
    setAudioLevel(0);
    transcriptionBufferRef.current = "";

    // Use Azure Hybrid mode for Yoruba to ensure authentic intonation via SSML
    // Also using it for other indigenous languages if available for better quality
    const shouldUseAzure = (lang === 'Yoruba' || lang === 'Hausa' || lang === 'Igbo') && polyglotTTS.isAvailable;
    setIsUsingAzure(shouldUseAzure);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      inputContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      nextStartTimeRef.current = 0;

      // Ensure Contexts are Active
      if (inputContextRef.current.state === 'suspended') await inputContextRef.current.resume();
      if (outputContextRef.current.state === 'suspended') await outputContextRef.current.resume();

      // Get Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Connect to Gemini
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, 
          },
          // Enable transcription to support hybrid TTS if needed
          outputAudioTranscription: {}, 
          systemInstruction: getSystemInstruction(lang),
        },
        callbacks: {
          onopen: () => {
            console.log("Live Session Connected");
            setVoiceStatus('connected');
            setVoiceError(null);
            
            if (!inputContextRef.current || !streamRef.current) return;
            
            if (inputContextRef.current.state === 'suspended') inputContextRef.current.resume();

            const ctx = inputContextRef.current;
            const source = ctx.createMediaStreamSource(streamRef.current);
            const processor = ctx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
               if (!sessionRef.current) return;

               const inputData = e.inputBuffer.getChannelData(0);
               
               // Visualization
               let sum = 0;
               for(let i=0; i<inputData.length; i+=50) sum += inputData[i] * inputData[i];
               const rms = Math.sqrt(sum / (inputData.length/50));
               setAudioLevel(prev => prev * 0.8 + rms * 0.2);

               const pcmBlob = createBlob(inputData);
               
               sessionRef.current.then(session => {
                 return session.sendRealtimeInput({ media: pcmBlob });
               }).catch(err => {});
            };

            source.connect(processor);
            processor.connect(ctx.destination);
            sourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Count Usage on Turn Completion
            if (msg.serverContent?.turnComplete) {
              decrementQuota();
              if (remainingQuotaRef.current <= 0) {
                 // Close session gracefully or warn
                 // For now, let's just warn via error state to stop next inputs
                 setVoiceError("Daily limit reached. Session ending.");
                 setTimeout(() => stopVoiceMode(), 3000); // Give time to hear last part
              }
            }

            // Logic:
            // 1. If using Azure (Yoruba, etc.), buffer text and synthesize.
            // 2. If NOT using Azure (English/Default), use Gemini Native Audio.

            if (!shouldUseAzure) {
              const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
              if (base64Audio) {
                 const u8 = decode(base64Audio);
                 await playAudioBuffer(u8.buffer);
              }
            }

            if (shouldUseAzure) {
               const textPart = msg.serverContent?.outputTranscription?.text;
               if (textPart) {
                 transcriptionBufferRef.current += textPart;
                 
                 // Heuristic for sentence completion
                 if (transcriptionBufferRef.current.match(/[.?!。]+$/) || msg.serverContent?.turnComplete) {
                    const sentence = transcriptionBufferRef.current;
                    transcriptionBufferRef.current = ""; 
                    
                    try {
                      const audioData = await polyglotTTS.synthesize(sentence, lang);
                      if (audioData) {
                        await playAudioBuffer(audioData);
                      }
                    } catch (e) {
                      console.error("TTS Error", e);
                    }
                 }
               }
            }

            if (msg.serverContent?.interrupted) {
              console.log("Interrupted");
              sourcesRef.current.forEach(source => source.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              transcriptionBufferRef.current = "";
            }
          },
          onclose: () => {
            console.log("Session Closed");
            setVoiceStatus('disconnected');
          },
          onerror: (e) => {
            console.error("Session Error", e);
            setVoiceError("Connection lost. Please try again.");
            setVoiceStatus('disconnected');
          }
        }
      });
      
      sessionPromise.catch((err) => {
          console.error("Connection failed start:", err);
          if (isVoiceMode) {
             setVoiceError("Could not connect. Check internet.");
             setVoiceStatus('disconnected');
          }
      });

      sessionRef.current = sessionPromise;

    } catch (e: any) {
      console.error("Failed to start voice mode", e);
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
         setVoiceError("Microphone access denied. Please enable permissions.");
      } else {
         setVoiceError("Could not connect. Check internet/API keys.");
      }
      setVoiceStatus('disconnected');
    }
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    if (isVoiceMode && voiceStatus === 'connected') {
      stopVoiceMode();
      setTimeout(() => startVoiceMode(newLang), 500);
    }
  };

  return (
    <div className="flex flex-col relative h-[calc(100vh-140px)] md:h-[calc(100vh-80px)] max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      {/* Voice Mode Overlay */}
      {isVoiceMode && (
        <div className="absolute inset-0 z-50 bg-paddy-900 flex flex-col items-center justify-between py-12 px-6 text-white animate-fade-in">
          {/* Header */}
          <div className="text-center w-full relative">
            <h3 className="text-2xl font-bold mb-2">Voice Assistant</h3>
            <p className="text-paddy-200 text-sm mb-6 flex items-center justify-center gap-2">
              {voiceStatus === 'connecting' && <Loader2 size={16} className="animate-spin" />}
              {voiceStatus === 'connecting' ? 'Connecting to secure line...' : 
               voiceStatus === 'connected' ? 'Listening...' : 
               voiceError ? 'Status Alert' : 'Disconnected'}
            </p>

            {/* Error Message */}
            {voiceError && (
               <div className="w-full max-w-sm mx-auto bg-red-900/40 border border-red-400/30 p-4 rounded-2xl flex items-start gap-3 mb-6 animate-slide-up backdrop-blur-md shadow-lg">
                 <AlertCircle size={20} className="shrink-0 text-red-300 mt-0.5" />
                 <div className="flex-1 min-w-0">
                   <h4 className="text-red-200 font-bold text-sm mb-1">Connection Error</h4>
                   <p className="text-red-100/80 text-xs leading-relaxed break-words">{voiceError}</p>
                 </div>
               </div>
            )}

            {/* Language Selector in Overlay */}
            <div className="absolute top-0 right-0">
               <div className="relative inline-flex items-center">
                 <Globe size={16} className="absolute left-3 text-white pointer-events-none" />
                 <select 
                   value={selectedLanguage}
                   onChange={handleLanguageChange}
                   className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-white/50 text-white appearance-none cursor-pointer hover:bg-white/20 transition-colors"
                 >
                   {LANGUAGES.map(l => (
                     <option key={l.code} value={l.code} className="text-gray-900">{l.label}</option>
                   ))}
                 </select>
               </div>
            </div>
          </div>

          {/* Visualizer */}
          <div className="relative flex items-center justify-center h-64 w-64">
             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center z-10 shadow-xl transition-transform duration-300 transform hover:scale-105">
               <Bot size={40} className="text-paddy-900" />
             </div>
             
             {/* Pulsing Rings */}
             <div 
                className="absolute w-24 h-24 bg-white/20 rounded-full transition-transform duration-75 ease-out"
                style={{ transform: `scale(${1 + audioLevel * 5})` }}
             ></div>
             <div 
                className="absolute w-24 h-24 bg-white/10 rounded-full transition-transform duration-150 ease-out"
                style={{ transform: `scale(${1 + audioLevel * 8})` }}
             ></div>
             
             {voiceStatus === 'connecting' && !voiceError && (
               <div className="absolute inset-0 border-4 border-t-white border-white/20 rounded-full animate-spin"></div>
             )}
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-6 w-full max-w-xs">
             <div className="text-center text-paddy-200 text-xs">
                {voiceStatus === 'connected' ? (
                    <span>
                      Speaking <b>{selectedLanguage}</b> {isUsingAzure && <span className="text-xs bg-paddy-700 px-1 rounded ml-1">HD</span>}
                    </span>
                ) : voiceError ? "Check connection" : "Establishing connection..."}
             </div>
             
             <button
               onClick={stopVoiceMode}
               className="flex items-center justify-center gap-3 w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg"
             >
               <PhoneOff size={24} />
               <span>End Call</span>
             </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-50 mr-2 animate-pulse"></div>
          <div>
            <h3 className="font-semibold text-gray-700 text-sm md:text-base">Tax Paddy AI Assistant</h3>
            <p className="text-[10px] text-gray-400 flex items-center gap-1">
              <Lock size={10} /> {remainingQuota}/{DAILY_LIMIT} Free questions left today
            </p>
          </div>
        </div>
        
        {/* Voice Mode Toggle */}
        <button
          onClick={() => startVoiceMode(selectedLanguage)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            remainingQuota > 0 
              ? 'bg-paddy-100 hover:bg-paddy-200 text-paddy-900' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          disabled={remainingQuota <= 0}
        >
          <Mic size={14} />
          <span>Voice Mode</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-gray-900 text-white' : 'bg-paddy-100 text-paddy-900'
              }`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-white text-gray-900 border border-gray-200 shadow-sm rounded-tr-none' 
                  : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'
              } ${msg.isError ? 'bg-red-50 text-red-600 border-red-100' : ''}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
             <div className="flex max-w-[85%] flex-row items-start gap-3">
               <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-paddy-100 text-paddy-900">
                  <Bot size={16} />
               </div>
               <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 rounded-tl-none">
                 <Loader2 size={20} className="animate-spin text-gray-400" />
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={remainingQuota > 0 ? "Ask about PIT, VAT or Company Tax..." : "Daily limit reached."}
            className="w-full pl-4 pr-12 py-3.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-paddy-500 focus:border-paddy-500 outline-none transition-all disabled:opacity-50 disabled:bg-gray-100"
            disabled={isLoading || remainingQuota <= 0}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || remainingQuota <= 0}
            className={`absolute right-2 p-2 rounded-lg transition-colors ${
              input.trim() && !isLoading && remainingQuota > 0
                ? 'bg-paddy-900 text-white hover:bg-paddy-800' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-2">
          Tax Paddy can make mistakes. Please verify important tax information.
        </p>
      </div>
    </div>
  );
}