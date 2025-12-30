import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

/**
 * Hybrid TTS for Nigerian Languages:
 * Ported from Python implementation to TypeScript/Browser.
 * - Cloud: Azure fallback to en-NG if indigenous not available.
 * - Local: Browser Speech API (fallback for MMS which requires heavy local models).
 */
export class NigerianPolyglotTTS {
  private speechConfig: SpeechSDK.SpeechConfig | null = null;
  
  // Updated routing: Use authentic Nigerian Neural voices
  private langConfig: Record<string, { type: 'cloud' | 'local'; voice: string }> = {
    'hausa': { type: 'cloud', voice: 'ha-NG-AminaNeural' }, 
    'igbo': { type: 'cloud', voice: 'ig-NG-EzinneNeural' },
    'yoruba': { type: 'cloud', voice: 'yo-NG-RejoiceNeural' },
    'pidgin': { type: 'cloud', voice: 'en-NG-AbeoNeural' }, // Pidgin often uses the English-Nigerian voice heavily
    'english': { type: 'cloud', voice: 'en-NG-AbeoNeural' } 
  };

  constructor() {
    this._initAzure();
  }

  private _initAzure() {
    try {
      // Safely access env vars with fallback to empty object to prevent crashes in strict envs
      const env = (typeof process !== 'undefined' && process.env) ? process.env : {};
      const key = env.AZURE_SPEECH_KEY;
      const region = env.AZURE_SPEECH_REGION;

      if (key && region) {
        this.speechConfig = SpeechSDK.SpeechConfig.fromSubscription(key, region);
        this.speechConfig.speechSynthesisOutputFormat = SpeechSDK.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;
      } else {
        // Silent warning - expected if user hasn't configured Azure
      }
    } catch (e) {
      console.warn("Azure init failed (safely handled):", e);
    }
  }

  public get isAvailable(): boolean {
    return this.speechConfig !== null;
  }

  /**
   * Synthesizes text to an ArrayBuffer (WAV/PCM)
   */
  public async synthesize(text: string, language: string): Promise<ArrayBuffer | null> {
    const langKey = language.toLowerCase();
    
    // Normalize key (handle "Nigerian Pidgin" vs "pidgin")
    let configKey = 'english';
    if (langKey.includes('hausa')) configKey = 'hausa';
    else if (langKey.includes('igbo')) configKey = 'igbo';
    else if (langKey.includes('yoruba')) configKey = 'yoruba';
    else if (langKey.includes('pidgin')) configKey = 'pidgin';

    const config = this.langConfig[configKey];

    if (config && config.type === 'cloud' && this.speechConfig) {
      return this._synthesizeAzure(text, config.voice);
    } else {
      return null;
    }
  }

  private _synthesizeAzure(text: string, voiceName: string): Promise<ArrayBuffer | null> {
    return new Promise((resolve) => {
      if (!this.speechConfig) {
        resolve(null);
        return;
      }

      try {
        const synthesizer = new SpeechSDK.SpeechSynthesizer(this.speechConfig, undefined); // undefined audioConfig prevents auto-play
        
        const locale = voiceName.substring(0, 5); // e.g., en-NG
        
        // Default SSML
        let ssml = `
          <speak version='1.0' xml:lang='${locale}' xmlns="http://www.w3.org/2001/10/synthesis">
              <voice name='${voiceName}'>
                  ${text}
              </voice>
          </speak>
        `;

        // Apply prosody for Yoruba to improve authentic intonation
        // Slowing down slightly and adjusting pitch often helps Neural voices sound more natural for tonal languages
        if (voiceName.includes('yo-NG')) {
           ssml = `
            <speak version='1.0' xml:lang='${locale}' xmlns="http://www.w3.org/2001/10/synthesis">
                <voice name='${voiceName}'>
                    <prosody rate="0.9" pitch="+2Hz">
                        ${text}
                    </prosody>
                </voice>
            </speak>
           `;
        }

        synthesizer.speakSsmlAsync(
          ssml,
          (result) => {
            if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
              resolve(result.audioData);
            } else {
              // Graceful failure
              resolve(null);
            }
            synthesizer.close();
          },
          (err) => {
            console.error("Azure synthesis error:", err);
            synthesizer.close();
            resolve(null);
          }
        );
      } catch (e) {
        console.error("Critical Azure synthesis error:", e);
        resolve(null);
      }
    });
  }
}

export const polyglotTTS = new NigerianPolyglotTTS();