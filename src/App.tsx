/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  Search, 
  Zap, 
  TrendingUp, 
  MessageSquare, 
  ExternalLink, 
  Loader2, 
  AlertCircle,
  ChevronRight,
  Lightbulb,
  Target,
  Filter,
  RefreshCw,
  Download,
  Copy,
  Check,
  Calendar
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface PainPoint {
  subreddit: string;
  postTitle: string;
  postUrl: string;
  postDate: string;
  painPoint: string;
  userQuote: string;
}

interface SaasIdea {
  title: string;
  description: string;
  targetAudience: string;
  potentialFeatures: string[];
  complexity: 'Low' | 'Medium' | 'High';
  monetization: string;
  sourcePainPoint: string;
}

interface AnalysisResult {
  painPoints: PainPoint[];
  saasIdeas: SaasIdea[];
}

// --- Constants ---
const SUGGESTED_NICHES = [
  "E-commerce",
  "Remote Work",
  "Content Creation",
  "Real Estate",
  "Health & Fitness",
  "Developer Tools",
  "Marketing Automation",
  "Education Tech"
];

const SUBREDDITS = [
  "r/Entrepreneur",
  "r/smallbusiness",
  "r/SaaS",
  "r/startups",
  "r/marketing",
  "r/programming",
  "r/ecommerce"
];

export default function App() {
  const [niche, setNiche] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const runAnalysis = async (searchNiche: string) => {
    if (!searchNiche) return;
    
    setIsScanning(true);
    setError(null);
    setResults(null);
    setScanStep('Searching Reddit for pain points...');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";

      const prompt = `
        Search Reddit (subreddits like ${SUBREDDITS.join(', ')}) for real problems, frustrations, and "wish I had a tool for" posts related to the niche: "${searchNiche}".
        
        Analyze the search results and identify 5 distinct pain points. For each pain point, generate a Micro SaaS idea that solves it.
        
        CRITICAL: Ensure all "postUrl" values are ABSOLUTE URLs starting with https://www.reddit.com.
        
        Return the data in a structured JSON format with the following schema:
        {
          "painPoints": [
            {
              "subreddit": "string",
              "postTitle": "string",
              "postUrl": "string (MUST BE ABSOLUTE URL)",
              "postDate": "string (e.g. '2024-03-10' or '2 days ago')",
              "painPoint": "string (the core problem identified)",
              "userQuote": "string (a short relevant snippet from the post/comment)"
            }
          ],
          "saasIdeas": [
            {
              "title": "string (catchy name)",
              "description": "string (one sentence explanation)",
              "targetAudience": "string",
              "potentialFeatures": ["string"],
              "complexity": "Low | Medium | High",
              "monetization": "string",
              "sourcePainPoint": "string (matching the 'painPoint' from the list above)"
            }
          ]
        }
      `;

      setScanStep('Analyzing discussions and generating ideas...');
      
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              painPoints: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    subreddit: { type: Type.STRING },
                    postTitle: { type: Type.STRING },
                    postUrl: { type: Type.STRING },
                    postDate: { type: Type.STRING },
                    painPoint: { type: Type.STRING },
                    userQuote: { type: Type.STRING },
                  },
                  required: ["subreddit", "postTitle", "postUrl", "postDate", "painPoint", "userQuote"]
                }
              },
              saasIdeas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    targetAudience: { type: Type.STRING },
                    potentialFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
                    complexity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                    monetization: { type: Type.STRING },
                    sourcePainPoint: { type: Type.STRING },
                  },
                  required: ["title", "description", "targetAudience", "potentialFeatures", "complexity", "monetization", "sourcePainPoint"]
                }
              }
            },
            required: ["painPoints", "saasIdeas"]
          }
        },
      });

      const data = JSON.parse(response.text);
      setResults(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while scanning Reddit. Please try again.");
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis(niche);
  };

  const exportToJson = () => {
    if (!results) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `reddit_ideas_${niche.replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Header */}
      <header className="border-b border-[#141414] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter flex items-center gap-2">
            <Zap className="fill-current" size={28} />
            REDDIT PAINPOINT AI
          </h1>
          <p className="font-serif italic text-sm opacity-60 mt-1 uppercase tracking-widest">
            Micro SaaS Idea Generator • Powered by Gemini 3
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-2 py-1 border border-[#141414] rounded uppercase">Status: Online</div>
          <div className="px-2 py-1 border border-[#141414] rounded uppercase bg-[#141414] text-[#E4E3E0]">Free Tier</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Search Section */}
        <section className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="space-y-2">
              <label className="font-serif italic text-sm uppercase tracking-wider opacity-60 flex items-center gap-2">
                <Target size={14} />
                Select or Enter a Niche
              </label>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_NICHES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNiche(s)}
                    className={cn(
                      "px-3 py-1 text-xs font-mono border border-[#141414] transition-colors",
                      niche === s ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={20} />
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="e.g. 'Shopify App Store' or 'Real Estate Agents'"
                  className="w-full bg-transparent border-2 border-[#141414] py-4 pl-12 pr-4 font-mono focus:outline-none focus:ring-0 focus:border-[#141414]"
                />
              </div>
              <button
                disabled={isScanning || !niche}
                className="bg-[#141414] text-[#E4E3E0] px-8 py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2a2a] transition-colors"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Scanning...
                  </>
                ) : (
                  <>
                    <RefreshCw size={20} />
                    Generate Ideas
                  </>
                )}
              </button>
            </div>
          </form>

          {isScanning && (
            <div className="mt-6 p-4 border border-dashed border-[#141414] flex items-center gap-4 animate-pulse">
              <div className="w-2 h-2 bg-[#141414] rounded-full animate-ping" />
              <span className="font-mono text-sm uppercase tracking-widest">{scanStep}</span>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-500 text-red-700 flex items-center gap-3">
              <AlertCircle size={20} />
              <span className="text-sm font-mono">{error}</span>
            </div>
          )}
        </section>

        {results && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button 
                onClick={exportToJson}
                className="flex items-center gap-2 px-4 py-2 border border-[#141414] font-mono text-xs uppercase hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors"
              >
                <Download size={14} />
                Export to JSON
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Pain Points Column */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold uppercase tracking-tighter flex items-center gap-2 border-b border-[#141414] pb-2">
                  <MessageSquare size={20} />
                  Reddit Pain Points
                </h2>
                <div className="space-y-4">
                  {results.painPoints.map((pp, idx) => (
                    <div key={idx} className="bg-white border border-[#141414] p-5 group hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-wrap gap-2">
                          <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-current opacity-60">
                            {pp.subreddit}
                          </span>
                          <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-current opacity-60 flex items-center gap-1">
                            <Calendar size={10} />
                            {pp.postDate}
                          </span>
                        </div>
                        <a 
                          href={pp.postUrl.startsWith('http') ? pp.postUrl : `https://www.reddit.com${pp.postUrl.startsWith('/') ? '' : '/'}${pp.postUrl}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="opacity-40 hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      <h3 className="font-bold text-lg leading-tight mb-2">{pp.postTitle}</h3>
                      <p className="font-serif italic text-sm opacity-80 mb-4">"{pp.userQuote}"</p>
                      <div className="pt-4 border-t border-current border-opacity-20">
                        <p className="text-xs font-mono uppercase tracking-widest opacity-60 mb-1">Identified Problem:</p>
                        <p className="text-sm font-medium">{pp.painPoint}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SaaS Ideas Column */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold uppercase tracking-tighter flex items-center gap-2 border-b border-[#141414] pb-2">
                  <Lightbulb size={20} />
                  Micro SaaS Solutions
                </h2>
                <div className="space-y-4">
                  {results.saasIdeas.map((idea, idx) => {
                    const ideaId = `idea-${idx}`;
                    const ideaText = `${idea.title}\n${idea.description}\n\nTarget: ${idea.targetAudience}\nMonetization: ${idea.monetization}\n\nFeatures:\n${idea.potentialFeatures.map(f => `- ${f}`).join('\n')}`;
                    
                    return (
                      <div key={idx} className="bg-white border border-[#141414] p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] relative group">
                        <button 
                          onClick={() => copyToClipboard(ideaText, ideaId)}
                          className="absolute top-4 right-4 p-2 border border-[#141414] opacity-0 group-hover:opacity-100 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                          title="Copy to clipboard"
                        >
                          {copiedId === ideaId ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                        
                        <div className="flex justify-between items-start mb-4 pr-10">
                          <div>
                            <h3 className="text-xl font-bold tracking-tight">{idea.title}</h3>
                            <p className="text-sm opacity-70 font-serif italic">{idea.description}</p>
                          </div>
                          <div className={cn(
                            "px-2 py-1 text-[10px] font-mono uppercase border shrink-0",
                            idea.complexity === 'Low' ? "border-green-500 text-green-600" :
                            idea.complexity === 'Medium' ? "border-yellow-500 text-yellow-600" :
                            "border-red-500 text-red-600"
                          )}>
                            {idea.complexity}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                            <div>
                              <p className="uppercase opacity-50 mb-1">Target Audience</p>
                              <p className="font-bold">{idea.targetAudience}</p>
                            </div>
                            <div>
                              <p className="uppercase opacity-50 mb-1">Monetization</p>
                              <p className="font-bold">{idea.monetization}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-mono uppercase opacity-50 mb-2">Key Features</p>
                            <ul className="space-y-1">
                              {idea.potentialFeatures.map((f, fIdx) => (
                                <li key={fIdx} className="text-sm flex items-center gap-2">
                                  <ChevronRight size={12} className="opacity-40" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="pt-4 border-t border-[#141414]/10">
                            <p className="text-[10px] font-mono uppercase opacity-50 mb-1 flex items-center gap-1">
                              <TrendingUp size={10} />
                              Solving Pain Point:
                            </p>
                            <p className="text-xs italic opacity-80">{idea.sourcePainPoint}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {!results && !isScanning && (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block p-4 border-2 border-dashed border-[#141414] opacity-20">
              <Search size={48} className="mx-auto" />
            </div>
            <h2 className="text-2xl font-bold uppercase tracking-tighter opacity-40">Ready to scan the front page of the internet?</h2>
            <p className="font-serif italic opacity-40 max-w-md mx-auto">
              Enter a niche above to find real problems people are discussing on Reddit and turn them into profitable Micro SaaS ideas.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#141414] p-8 mt-20 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-left">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-40">Built with</p>
            <p className="font-bold text-sm">Google AI Studio • Gemini 3 • React</p>
          </div>
          <div className="flex gap-8 font-mono text-[10px] uppercase tracking-widest opacity-40">
            <span>No Reddit API Required</span>
            <span>Real-time Search</span>
            <span>AI Powered Analysis</span>
          </div>
          <p className="text-[10px] font-mono opacity-40">© 2026 PAINPOINT AI</p>
        </div>
      </footer>
    </div>
  );
}
