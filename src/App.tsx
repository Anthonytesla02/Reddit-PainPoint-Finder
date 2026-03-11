import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Zap, 
  RefreshCw, 
  Loader2, 
  ExternalLink, 
  Check, 
  Copy, 
  Download, 
  Plus, 
  TrendingUp, 
  X,
  Lock,
  Mail,
  LogOut,
  Bookmark,
  Trash2,
  ArrowRight,
  Sparkles,
  Globe,
  Shield,
  Target,
  MessageSquare,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Layout,
  Settings,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  CreditCard,
  Bell,
  ShieldCheck,
  History,
  SortAsc,
  ArrowUpDown
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Platform = 'Reddit' | 'Quora';

interface PainPoint {
  id?: string;
  platform: Platform;
  source: string;
  postTitle: string;
  postUrl: string;
  postDate: string;
  painPoint: string;
  userQuote: string;
}

interface SaasIdea {
  id?: string;
  title: string;
  description: string;
  targetAudience: string;
  potentialFeatures: string[];
  complexity: 'Low' | 'Medium' | 'High';
  monetization: string;
  sourcePainPoint: string;
  platform: Platform;
}

interface AnalysisResult {
  painPoints: PainPoint[];
  saasIdeas: SaasIdea[];
}

const SUGGESTED_NICHES = [
  "E-commerce", "Developer Tools", "Health & Fitness", "Real Estate", 
  "Education", "Remote Work", "Mental Health", "Sustainability",
  "AI & Automation", "Finance", "Legal Tech", "Travel"
];

// --- Components ---

const TutorialTooltip = ({ 
  step, 
  currentStep, 
  title, 
  content, 
  onNext, 
  onSkip, 
  isVisible,
  position = "bottom" 
}: { 
  step: number; 
  currentStep: number; 
  title: string; 
  content: string; 
  onNext: () => void; 
  onSkip: () => void;
  isVisible: boolean;
  position?: "top" | "bottom" | "left" | "right";
}) => {
  if (!isVisible || step !== currentStep) return null;

  const posClasses = {
    top: "bottom-full mb-6 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-6 left-1/2 -translate-x-1/2",
    left: "right-full mr-6 top-1/2 -translate-y-1/2",
    right: "left-full ml-6 top-1/2 -translate-y-1/2",
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-[#141414] border-l-transparent border-r-transparent border-b-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-[#141414] border-l-transparent border-r-transparent border-t-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-l-[#141414] border-t-transparent border-b-transparent border-r-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-r-[#141414] border-t-transparent border-b-transparent border-l-transparent",
  };

  return (
    <div className={cn("absolute z-[9999] w-72 animate-in fade-in zoom-in duration-300 pointer-events-auto", posClasses[position])}>
      <div className="bg-[#141414] text-[#E4E3E0] p-5 shadow-[12px_12px_0px_0px_rgba(0,0,0,0.3)] border border-white/10 relative">
        <div className={cn("absolute border-[10px]", arrowClasses[position])}></div>
        <h4 className="font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
          <Sparkles size={14} className="text-amber-400" />
          {title}
        </h4>
        <p className="text-xs opacity-90 mb-5 leading-relaxed font-serif italic">{content}</p>
        <div className="flex justify-between items-center">
          <button 
            onClick={(e) => { e.stopPropagation(); onSkip(); }} 
            className="text-[10px] uppercase opacity-50 hover:opacity-100 transition-opacity p-1"
          >
            Skip Tutorial
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="bg-amber-400 text-[#141414] px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-300 transition-colors shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]"
          >
            {step === 4 ? "Finish" : "Next Step"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [view, setView] = useState<'landing' | 'auth' | 'app' | 'saved' | 'profile' | 'settings'>('landing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [manualInput, setManualInput] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['Reddit']);
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [savedItems, setSavedItems] = useState<AnalysisResult>({ painPoints: [], saasIdeas: [] });
  const [error, setError] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // Pagination State
  const [painPointsPage, setPainPointsPage] = useState(1);
  const [saasIdeasPage, setSaasIdeasPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Sorting State
  const [painPointSort, setPainPointSort] = useState<'relevance' | 'date'>('relevance');
  const [saasIdeaSort, setSaasIdeaSort] = useState<'relevance' | 'complexity'>('relevance');
  const [savedPainPointSort, setSavedPainPointSort] = useState<'date' | 'platform'>('date');
  const [savedSaasIdeaSort, setSavedSaasIdeaSort] = useState<'complexity' | 'title'>('complexity');

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const onboardingDone = localStorage.getItem(`onboarding_done_${user.email}`);
      if (!onboardingDone) {
        setShowOnboarding(true);
        setOnboardingStep(0);
      }
    } else {
      setShowOnboarding(false);
    }
  }, [user]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        setView('app');
        fetchSaved();
      }
    } catch (err) {
      console.error("Auth check failed", err);
    }
  };

  const fetchSaved = async () => {
    try {
      const res = await fetch('/api/saved');
      if (res.ok) {
        const data = await res.json();
        setSavedItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch saved items", err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setView('app');
        fetchSaved();
      } else {
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthError("Authentication failed");
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setView('landing');
  };

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform) 
        : [...prev, platform]
    );
  };

  const toggleSuggestedNiche = (niche: string) => {
    setSelectedNiches(prev => 
      prev.includes(niche) 
        ? prev.filter(n => n !== niche) 
        : [...prev, niche]
    );
  };

  const addManualNiche = () => {
    const trimmed = manualInput.trim();
    if (trimmed && !selectedNiches.includes(trimmed)) {
      setSelectedNiches(prev => [...prev, trimmed]);
      setManualInput('');
    }
  };

  const removeNiche = (niche: string) => {
    setSelectedNiches(prev => prev.filter(n => n !== niche));
  };

  const runAnalysis = async () => {
    if (selectedNiches.length === 0 || selectedPlatforms.length === 0) return;
    
    setIsScanning(true);
    setError(null);
    setResults(null);
    setPainPointsPage(1);
    setSaasIdeasPage(1);
    setPainPointSort('relevance');
    setSaasIdeaSort('relevance');
    setScanStep(isDeepSearch ? "Initiating deep analysis with Mistral..." : `Connecting to Mistral AI for analysis...`);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niches: selectedNiches,
          platforms: selectedPlatforms,
          isDeepSearch
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze with Mistral");
      }

      const data = await response.json();
      setResults(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while scanning platforms. Please try again.");
    } finally {
      setIsScanning(false);
      setScanStep('');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runAnalysis();
  };

  const nextOnboarding = () => {
    if (onboardingStep === 4) {
      setShowOnboarding(false);
      if (user) localStorage.setItem(`onboarding_done_${user.email}`, 'true');
    } else {
      setOnboardingStep(prev => prev + 1);
    }
  };

  const skipOnboarding = () => {
    setShowOnboarding(false);
    if (user) localStorage.setItem(`onboarding_done_${user.email}`, 'true');
  };

  const exportToJson = () => {
    if (!results) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `painpoint_ideas_${selectedNiches.join('_').replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const savePainPoint = async (item: PainPoint) => {
    setSavingId(item.postUrl);
    try {
      const res = await fetch('/api/save/pain-point', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) fetchSaved();
    } finally {
      setSavingId(null);
    }
  };

  const saveSaasIdea = async (item: SaasIdea) => {
    setSavingId(item.title);
    try {
      const res = await fetch('/api/save/saas-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) fetchSaved();
    } finally {
      setSavingId(null);
    }
  };

  const deleteSaved = async (type: 'pain-point' | 'saas-idea', id: string) => {
    const res = await fetch(`/api/saved/${type}/${id}`, { method: 'DELETE' });
    if (res.ok) fetchSaved();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
        <nav className="p-6 flex justify-between items-center border-b border-[#141414]">
          <div className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <Zap className="fill-current" size={24} />
            PAINPOINT AI
          </div>
          <div className="flex gap-4">
            <button onClick={() => { setAuthMode('login'); setView('auth'); }} className="px-4 py-2 font-mono text-sm uppercase hover:underline">Login</button>
            <button onClick={() => { setAuthMode('signup'); setView('auth'); }} className="px-6 py-2 bg-[#141414] text-[#E4E3E0] font-mono text-sm uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">Get Started</button>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block px-3 py-1 border border-[#141414] rounded-full text-xs font-mono uppercase tracking-widest">
                Now Powered by Mistral AI
              </div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.9]">
                FIND REAL <br />
                <span className="italic font-serif font-light">PROBLEMS</span> <br />
                WORTH SOLVING.
              </h1>
              <p className="text-xl font-serif italic opacity-70 max-w-lg">
                Stop guessing what to build. We scan Reddit and Quora to find actual human frustrations and turn them into validated Micro SaaS opportunities.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => { setAuthMode('signup'); setView('auth'); }}
                  className="px-8 py-4 bg-[#141414] text-[#E4E3E0] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,0.15)] transition-all"
                >
                  Start Generating <ArrowRight size={20} />
                </button>
                <div className="flex items-center gap-4 px-4 py-2 border border-[#141414]/20 rounded-lg">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#E4E3E0] bg-[#141414]/10 flex items-center justify-center overflow-hidden">
                        <img src={`https://picsum.photos/seed/user${i}/32/32`} alt="user" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-mono uppercase opacity-60">Joined by 500+ builders</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-amber-400/20 blur-3xl rounded-full"></div>
              <div className="relative border-4 border-[#141414] bg-white p-8 shadow-[16px_16px_0px_0px_rgba(20,20,20,0.1)]">
                <div className="flex items-center gap-2 mb-6 border-b border-[#141414] pb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <div className="ml-auto font-mono text-[10px] uppercase opacity-40">Live Analysis Preview</div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-[#141414]/5 border border-[#141414]/10 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase">Reddit / r/ecommerce</span>
                      <span className="text-[10px] font-mono opacity-40">2h ago</span>
                    </div>
                    <p className="text-sm font-bold mb-1">"I hate manually syncing inventory across 4 platforms..."</p>
                    <p className="text-xs opacity-60 italic">"I spend 3 hours every night just updating spreadsheets. There has to be a better way."</p>
                  </div>
                  <div className="p-4 border-2 border-dashed border-[#141414]/20 rounded flex flex-col items-center justify-center py-8">
                    <Sparkles className="text-amber-500 mb-2" size={24} />
                    <p className="text-xs font-mono uppercase font-bold">AI Idea Generated</p>
                    <p className="text-sm font-serif italic mt-1 text-center">"OmniSync: One-click inventory bridge for boutique sellers"</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-32 grid md:grid-cols-3 gap-8">
            <div className="p-8 border border-[#141414]/10 bg-white/50 space-y-4">
              <Globe className="text-[#141414]" size={32} />
              <h3 className="text-xl font-bold uppercase tracking-tight">Multi-Platform Scan</h3>
              <p className="text-sm opacity-60 font-serif">We crawl the deepest corners of Reddit and Quora to find problems that aren't visible on the surface.</p>
            </div>
            <div className="p-8 border border-[#141414]/10 bg-white/50 space-y-4">
              <TrendingUp className="text-[#141414]" size={32} />
              <h3 className="text-xl font-bold uppercase tracking-tight">Deep Search Mode</h3>
              <p className="text-sm opacity-60 font-serif">Our advanced analysis engine identifies 15+ opportunities per scan for those who want to go deeper.</p>
            </div>
            <div className="p-8 border border-[#141414]/10 bg-white/50 space-y-4">
              <Shield className="text-[#141414]" size={32} />
              <h3 className="text-xl font-bold uppercase tracking-tight">Validated Ideas</h3>
              <p className="text-sm opacity-60 font-serif">Every idea is linked back to a real user complaint, giving you immediate proof of demand.</p>
            </div>
          </div>
        </main>

        <footer className="p-12 border-t border-[#141414] text-center">
          <p className="font-mono text-[10px] uppercase opacity-40">© 2026 PainPoint AI • Built for Builders</p>
        </footer>
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-[#E4E3E0] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white border-4 border-[#141414] p-8 shadow-[16px_16px_0px_0px_rgba(20,20,20,0.1)]">
          <button onClick={() => setView('landing')} className="mb-8 flex items-center gap-2 text-xs font-mono uppercase opacity-40 hover:opacity-100">
            <X size={14} /> Back to Home
          </button>
          <div className="flex items-center gap-2 mb-8">
            <Zap className="fill-current" size={32} />
            <h2 className="text-3xl font-bold tracking-tighter uppercase">{authMode}</h2>
          </div>
          
          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase font-bold opacity-60">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-[#141414] py-3 pl-10 pr-4 font-mono focus:outline-none"
                  placeholder="builder@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase font-bold opacity-60">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border-2 border-[#141414] py-3 pl-10 pr-4 font-mono focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-mono">
                {authError}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-[#141414] text-[#E4E3E0] py-4 font-bold uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] transition-all"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-[#141414]/10 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-xs font-mono uppercase opacity-60 hover:opacity-100 hover:underline"
            >
              {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0] flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "border-r border-[#141414] bg-[#E4E3E0] flex flex-col transition-all duration-300 z-50",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="p-6 border-b border-[#141414] flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
              <Zap className="fill-current" size={20} />
              PAINPOINT
            </div>
          )}
          {sidebarCollapsed && <Zap className="fill-current mx-auto" size={24} />}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 hover:bg-[#141414]/5 rounded transition-colors"
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-6 space-y-2">
          {[
            { id: 'app', label: 'Dashboard', icon: Layout },
            { id: 'saved', label: 'Saved Vault', icon: Bookmark },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id as any)}
              className={cn(
                "w-full flex items-center gap-4 px-6 py-3 transition-all relative group",
                view === item.id ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
              )}
            >
              <item.icon size={20} className="shrink-0" />
              {!sidebarCollapsed && <span className="font-mono text-xs uppercase tracking-widest">{item.label}</span>}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-[#141414] text-[#E4E3E0] text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#141414] space-y-2">
          {!sidebarCollapsed && (
            <div className="px-2 py-1 mb-4">
              <p className="text-[10px] font-mono uppercase opacity-40 truncate">{user?.email}</p>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-4 px-2 py-3 text-red-600 hover:bg-red-50 transition-all rounded group relative",
              sidebarCollapsed ? "justify-center" : ""
            )}
          >
            <LogOut size={20} className="shrink-0" />
            {!sidebarCollapsed && <span className="font-mono text-xs uppercase tracking-widest">Logout</span>}
            {sidebarCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-red-600 text-white text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  Logout
                </div>
              )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-[#E4E3E0]/80 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold tracking-tighter uppercase">
              {view === 'app' ? 'Dashboard' : view === 'saved' ? 'Saved Vault' : view === 'profile' ? 'User Profile' : 'Settings'}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1 border border-[#141414] rounded uppercase opacity-40">Mistral Large</div>
            <div className="px-3 py-1 border border-[#141414] rounded uppercase bg-emerald-100 text-emerald-800">System Ready</div>
          </div>
        </header>

        <div className="p-6 md:p-12">
          {view === 'profile' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="flex justify-between items-end border-b-2 border-[#141414] pb-4">
                <h2 className="text-4xl font-bold tracking-tighter uppercase">User Profile</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white border-2 border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,0.05)]">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 bg-[#141414] text-[#E4E3E0] flex items-center justify-center rounded-full">
                      <User size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold uppercase">{user?.email.split('@')[0]}</h3>
                      <p className="text-xs font-mono opacity-40 uppercase">Member since March 2026</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-[#141414]/10">
                      <span className="text-xs font-mono uppercase opacity-40">Email</span>
                      <span className="text-xs font-mono">{user?.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#141414]/10">
                      <span className="text-xs font-mono uppercase opacity-40">Plan</span>
                      <span className="text-xs font-mono font-bold">Pro Builder</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-6 border-2 border-[#141414] bg-[#141414] text-[#E4E3E0]">
                    <h4 className="font-bold uppercase mb-2 flex items-center gap-2">
                      <CreditCard size={18} /> Billing
                    </h4>
                    <p className="text-xs opacity-60 mb-4">Your next billing date is April 11, 2026.</p>
                    <button className="w-full py-2 border border-[#E4E3E0] text-[10px] uppercase font-mono hover:bg-[#E4E3E0] hover:text-[#141414] transition-all">Manage Subscription</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'settings' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="flex justify-between items-end border-b-2 border-[#141414] pb-4">
                <h2 className="text-4xl font-bold tracking-tighter uppercase">Settings</h2>
              </div>
              <div className="max-w-2xl space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
                    <Bell size={20} /> Notifications
                  </h3>
                  <div className="space-y-2">
                    {['Email alerts for new pain points', 'Weekly summary reports', 'Product updates'].map(item => (
                      <label key={item} className="flex items-center justify-between p-4 bg-white border border-[#141414]/10 cursor-pointer hover:bg-[#141414]/5 transition-colors">
                        <span className="text-sm font-serif italic">{item}</span>
                        <input type="checkbox" defaultChecked className="w-4 h-4 accent-[#141414]" />
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={20} /> Security
                  </h3>
                  <button className="px-6 py-3 border-2 border-[#141414] font-mono text-xs uppercase hover:bg-[#141414] hover:text-[#E4E3E0] transition-all">
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'saved' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="flex justify-between items-end border-b-2 border-[#141414] pb-4">
                <h2 className="text-4xl font-bold tracking-tighter uppercase">Saved Vault</h2>
                <p className="font-mono text-xs opacity-40 uppercase">{savedItems.painPoints.length + savedItems.saasIdeas.length} Items Stored</p>
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
                      <Globe size={20} /> Saved Sources
                    </h3>
                    <select 
                      value={savedPainPointSort}
                      onChange={(e) => setSavedPainPointSort(e.target.value as any)}
                      className="bg-transparent border-none font-mono text-[10px] uppercase focus:ring-0 cursor-pointer"
                    >
                      <option value="date">Date Posted</option>
                      <option value="platform">Platform</option>
                    </select>
                  </div>
                  {savedItems.painPoints.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-[#141414]/20 rounded text-center opacity-40 font-serif italic">No sources saved yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {[...savedItems.painPoints]
                        .sort((a, b) => {
                          if (savedPainPointSort === 'date') return new Date(b.postDate).getTime() - new Date(a.postDate).getTime();
                          if (savedPainPointSort === 'platform') return a.platform.localeCompare(b.platform);
                          return 0;
                        })
                        .map((p) => (
                      <div key={p.id} className="bg-white border-2 border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] group">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono bg-[#141414] text-[#E4E3E0] px-2 py-0.5 rounded uppercase">{p.platform} / {p.source}</span>
                            <span className="text-[10px] font-mono opacity-40 uppercase flex items-center gap-1">
                              <Calendar size={10} />
                              {p.postDate}
                            </span>
                          </div>
                          <button onClick={() => deleteSaved('pain-point', p.id!)} className="opacity-0 group-hover:opacity-100 text-red-600 transition-all"><Trash2 size={14} /></button>
                        </div>
                        <h4 className="font-bold text-sm mb-2">{p.postTitle}</h4>
                        <p className="text-xs opacity-60 mb-3">{p.painPoint}</p>
                        <a href={p.postUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono uppercase flex items-center gap-1 hover:underline">
                          View Original <ExternalLink size={10} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={20} /> Saved Ideas
                    </h3>
                    <select 
                      value={savedSaasIdeaSort}
                      onChange={(e) => setSavedSaasIdeaSort(e.target.value as any)}
                      className="bg-transparent border-none font-mono text-[10px] uppercase focus:ring-0 cursor-pointer"
                    >
                      <option value="complexity">Complexity</option>
                      <option value="title">Title</option>
                    </select>
                  </div>
                  {savedItems.saasIdeas.length === 0 ? (
                    <div className="p-12 border-2 border-dashed border-[#141414]/20 rounded text-center opacity-40 font-serif italic">No ideas saved yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {[...savedItems.saasIdeas]
                        .sort((a, b) => {
                          if (savedSaasIdeaSort === 'complexity') {
                            const map = { 'Low': 1, 'Medium': 2, 'High': 3 };
                            return map[a.complexity] - map[b.complexity];
                          }
                          if (savedSaasIdeaSort === 'title') return a.title.localeCompare(b.title);
                          return 0;
                        })
                        .map((idea) => (
                      <div key={idea.id} className="bg-white border-2 border-[#141414] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] group">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-[10px] font-mono border border-[#141414] px-2 py-0.5 rounded uppercase">{idea.complexity} Complexity</span>
                          <button onClick={() => deleteSaved('saas-idea', idea.id!)} className="opacity-0 group-hover:opacity-100 text-red-600 transition-all"><Trash2 size={14} /></button>
                        </div>
                        <h4 className="font-bold text-sm mb-1">{idea.title}</h4>
                        <p className="text-xs opacity-60">{idea.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              </div>
            </div>
          )}

          {view === 'app' && (
            <div className="space-y-12 animate-in fade-in duration-500 relative">
              <TutorialTooltip 
                step={0} 
                currentStep={onboardingStep} 
                title="Welcome to PainPoint AI" 
                content="Let's find your next Micro SaaS opportunity. I'll guide you through the process." 
                onNext={nextOnboarding} 
                onSkip={skipOnboarding}
                isVisible={showOnboarding}
                position="bottom"
              />
              {/* Search Section */}
            <section className="bg-white border border-[#141414] p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 relative">
                  <TutorialTooltip 
                    step={1} 
                    currentStep={onboardingStep} 
                    title="1. Choose Platforms" 
                    content="Select where you want to look for pain points. Reddit and Quora are goldmines for user frustrations." 
                    onNext={nextOnboarding} 
                    onSkip={skipOnboarding}
                    isVisible={showOnboarding}
                    position="right"
                  />
                  <label className="font-serif italic text-sm uppercase tracking-wider opacity-60 flex items-center gap-2">
                    <Globe size={14} />
                    1. Select Platforms
                  </label>
                  <div className="flex gap-4">
                    {(['Reddit', 'Quora'] as Platform[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePlatform(p)}
                        className={cn(
                          "flex-1 py-3 border-2 border-[#141414] font-mono text-xs uppercase transition-all flex items-center justify-center gap-2",
                          selectedPlatforms.includes(p) 
                            ? "bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]" 
                            : "bg-transparent text-[#141414] opacity-40 hover:opacity-100"
                        )}
                      >
                        {selectedPlatforms.includes(p) && <Check size={14} />}
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 relative">
                    <TutorialTooltip 
                      step={2} 
                      currentStep={onboardingStep} 
                      title="2. Deep Search" 
                      content="Enable this for a more thorough analysis. It takes slightly longer but yields 10+ high-quality results." 
                      onNext={nextOnboarding} 
                      onSkip={skipOnboarding}
                      isVisible={showOnboarding}
                      position="bottom"
                    />
                    <button
                      type="button"
                      onClick={() => setIsDeepSearch(!isDeepSearch)}
                      className={cn(
                        "w-full py-2 border border-[#141414] font-mono text-[10px] uppercase transition-all flex items-center justify-center gap-2",
                        isDeepSearch 
                          ? "bg-amber-100 text-amber-900 border-amber-900" 
                          : "opacity-40 hover:opacity-100"
                      )}
                    >
                      <TrendingUp size={12} className={isDeepSearch ? "animate-pulse" : ""} />
                      {isDeepSearch ? "Deep Search Enabled (10+ Results)" : "Enable Deep Search"}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 relative">
                  <TutorialTooltip 
                    step={3} 
                    currentStep={onboardingStep} 
                    title="3. Pick Your Niches" 
                    content="Select from our suggestions or type your own. Be specific to find unique problems." 
                    onNext={nextOnboarding} 
                    onSkip={skipOnboarding}
                    isVisible={showOnboarding}
                    position="left"
                  />
                  <label className="font-serif italic text-sm uppercase tracking-wider opacity-60 flex items-center gap-2">
                    <Target size={14} />
                    2. Select or Enter Niches
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_NICHES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSuggestedNiche(s)}
                        className={cn(
                          "px-3 py-1 text-xs font-mono border border-[#141414] transition-colors",
                          selectedNiches.includes(s) ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/5"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 relative">
                  <TutorialTooltip 
                    step={4} 
                    currentStep={onboardingStep} 
                    title="4. Generate Ideas" 
                    content="Ready? Click here to start the AI analysis. We'll find pain points and suggest SaaS solutions." 
                    onNext={nextOnboarding} 
                    onSkip={skipOnboarding}
                    isVisible={showOnboarding}
                    position="top"
                  />
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 opacity-40" size={20} />
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addManualNiche())}
                      placeholder="Type a custom niche and press Enter..."
                      className="w-full bg-transparent border-2 border-[#141414] py-4 pl-12 pr-4 font-mono focus:outline-none focus:ring-0 focus:border-[#141414]"
                    />
                    <button
                      type="button"
                      onClick={addManualNiche}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-[#141414]/5 rounded transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <button
                    onClick={runAnalysis}
                    disabled={isScanning || selectedNiches.length === 0 || selectedPlatforms.length === 0}
                    className="bg-[#141414] text-[#E4E3E0] px-8 py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2a2a2a] transition-colors shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]"
                  >
                    {isScanning ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <RefreshCw size={20} className={isDeepSearch ? "text-amber-500" : ""} />
                        {isDeepSearch ? "Run Deep Search" : "Generate Ideas"}
                      </>
                    )}
                  </button>
                </div>

                {selectedNiches.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedNiches.map(n => (
                      <span key={n} className="flex items-center gap-1 bg-[#141414] text-[#E4E3E0] px-3 py-1 rounded-full text-xs font-mono">
                        {n}
                        <button onClick={() => removeNiche(n)} className="hover:text-red-400 transition-colors">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Status / Error */}
            {(isScanning || error) && (
              <div className={cn(
                "p-8 border-2 text-center space-y-4",
                error ? "border-red-500 bg-red-50" : "border-[#141414] border-dashed"
              )}>
                {isScanning ? (
                  <>
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin text-[#141414]" size={48} />
                    </div>
                    <p className="font-serif italic text-xl">{scanStep}</p>
                    <div className="w-full max-w-md mx-auto h-1 bg-[#141414]/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#141414] animate-[shimmer_2s_infinite_linear] w-1/3"></div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-red-600 font-bold uppercase tracking-widest">Analysis Failed</p>
                    <p className="text-sm opacity-60">{error}</p>
                    <button 
                      onClick={runAnalysis}
                      className="px-6 py-2 border-2 border-red-500 text-red-500 font-mono text-xs uppercase hover:bg-red-50 transition-colors"
                    >
                      Retry Analysis
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Results Section */}
            {results && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b-2 border-[#141414] pb-6">
                  <div>
                    <h2 className="text-5xl font-bold tracking-tighter uppercase">Analysis Results</h2>
                    <p className="font-serif italic opacity-60 mt-2">Found {results.painPoints.length} pain points and generated {results.saasIdeas.length} solutions.</p>
                  </div>
                  <button 
                    onClick={exportToJson}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-[#141414] font-mono text-xs uppercase hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                  >
                    <Download size={16} /> Export JSON
                  </button>
                </div>

                <div className="grid lg:grid-cols-[1fr_450px] gap-12 items-start">
                  {/* Pain Points List */}
                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-bold uppercase tracking-widest flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] flex items-center justify-center text-sm">01</div>
                        Identified Pain Points
                      </h3>
                      <div className="flex items-center gap-2">
                        <ArrowUpDown size={14} className="opacity-40" />
                        <select 
                          value={painPointSort}
                          onChange={(e) => setPainPointSort(e.target.value as any)}
                          className="bg-transparent border-none font-mono text-[10px] uppercase focus:ring-0 cursor-pointer"
                        >
                          <option value="relevance">Relevance</option>
                          <option value="date">Date Posted</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-6">
                      {results.painPoints
                        .sort((a, b) => {
                          if (painPointSort === 'date') {
                            return new Date(b.postDate).getTime() - new Date(a.postDate).getTime();
                          }
                          return 0; // Default order is relevance
                        })
                        .slice((painPointsPage - 1) * ITEMS_PER_PAGE, painPointsPage * ITEMS_PER_PAGE)
                        .map((p, idx) => (
                        <div key={p.postUrl || idx} className="bg-white border-2 border-[#141414] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,0.1)] transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[10px] font-mono px-2 py-0.5 rounded uppercase",
                                p.platform === 'Reddit' ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"
                              )}>
                                {p.platform}
                              </span>
                              <span className="text-[10px] font-mono opacity-40 uppercase">{p.source}</span>
                              <span className="text-[10px] font-mono opacity-40 uppercase flex items-center gap-1">
                                <Calendar size={10} />
                                {p.postDate}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button 
                                onClick={() => savePainPoint(p)}
                                disabled={savingId === p.postUrl}
                                className="p-2 hover:bg-[#141414]/5 rounded transition-colors"
                              >
                                {savedItems.painPoints.some(s => s.postUrl === p.postUrl) ? <Check size={16} className="text-emerald-600" /> : <Bookmark size={16} />}
                              </button>
                              <a href={p.postUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-[#141414]/5 rounded transition-colors">
                                <ExternalLink size={16} />
                              </a>
                            </div>
                          </div>
                          <h4 className="text-lg font-bold mb-2 leading-tight">{p.postTitle}</h4>
                          <p className="text-sm font-serif italic opacity-60 mb-4">"{p.userQuote}"</p>
                          <div className="pt-4 border-t border-[#141414]/5">
                            <p className="text-xs font-mono uppercase font-bold mb-1">Core Problem:</p>
                            <p className="text-sm">{p.painPoint}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pain Points Pagination */}
                    {results.painPoints.length > ITEMS_PER_PAGE && (
                      <div className="flex items-center justify-center gap-4 pt-4">
                        <button 
                          onClick={() => setPainPointsPage(p => Math.max(1, p - 1))}
                          disabled={painPointsPage === 1}
                          className="p-2 border border-[#141414] disabled:opacity-20 hover:bg-[#141414]/5 transition-colors"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <span className="font-mono text-[10px] uppercase tracking-widest">
                          Page {painPointsPage} / {Math.ceil(results.painPoints.length / ITEMS_PER_PAGE)}
                        </span>
                        <button 
                          onClick={() => setPainPointsPage(p => Math.min(Math.ceil(results.painPoints.length / ITEMS_PER_PAGE), p + 1))}
                          disabled={painPointsPage === Math.ceil(results.painPoints.length / ITEMS_PER_PAGE)}
                          className="p-2 border border-[#141414] disabled:opacity-20 hover:bg-[#141414]/5 transition-colors"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* SaaS Ideas List */}
                  <div className="space-y-8 lg:sticky lg:top-8">
                    <div className="flex justify-between items-center">
                      <h3 className="text-2xl font-bold uppercase tracking-widest flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#141414] text-[#E4E3E0] flex items-center justify-center text-sm">02</div>
                        SaaS Opportunities
                      </h3>
                      <div className="flex items-center gap-2">
                        <ArrowUpDown size={14} className="opacity-40" />
                        <select 
                          value={saasIdeaSort}
                          onChange={(e) => setSaasIdeaSort(e.target.value as any)}
                          className="bg-transparent border-none font-mono text-[10px] uppercase focus:ring-0 cursor-pointer"
                        >
                          <option value="relevance">Relevance</option>
                          <option value="complexity">Complexity</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-6">
                      {results.saasIdeas
                        .sort((a, b) => {
                          if (saasIdeaSort === 'complexity') {
                            const map = { 'Low': 1, 'Medium': 2, 'High': 3 };
                            return map[a.complexity] - map[b.complexity];
                          }
                          return 0;
                        })
                        .slice((saasIdeasPage - 1) * ITEMS_PER_PAGE, saasIdeasPage * ITEMS_PER_PAGE)
                        .map((idea, idx) => (
                        <div key={idea.title || idx} className="bg-[#141414] text-[#E4E3E0] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.1)]">
                          <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-mono border border-[#E4E3E0]/20 px-2 py-0.5 rounded uppercase">
                              {idea.complexity} Complexity
                            </span>
                            <button 
                              onClick={() => saveSaasIdea(idea)}
                              disabled={savingId === idea.title}
                              className="p-2 hover:bg-white/10 rounded transition-colors"
                            >
                              {savedItems.saasIdeas.some(s => s.title === idea.title) ? <Check size={16} className="text-emerald-400" /> : <Bookmark size={16} />}
                            </button>
                          </div>
                          <h4 className="text-xl font-bold mb-2 tracking-tight">{idea.title}</h4>
                          <p className="text-sm opacity-80 mb-6 font-serif italic">{idea.description}</p>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-mono uppercase opacity-40 mb-2">Key Features</p>
                              <ul className="grid gap-1">
                                {idea.potentialFeatures.map((f, i) => (
                                  <li key={i} className="text-xs flex items-center gap-2">
                                    <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-white/10">
                              <div className="text-[10px] font-mono uppercase">
                                <p className="opacity-40">Monetization</p>
                                <p>{idea.monetization}</p>
                              </div>
                              <button 
                                onClick={() => copyToClipboard(`${idea.title}: ${idea.description}`, `idea-${idx}`)}
                                className="flex items-center gap-1 text-[10px] font-mono uppercase hover:text-amber-400 transition-colors"
                              >
                                {copiedId === `idea-${idx}` ? <Check size={12} /> : <Copy size={12} />}
                                {copiedId === `idea-${idx}` ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* SaaS Ideas Pagination */}
                    {results.saasIdeas.length > ITEMS_PER_PAGE && (
                      <div className="flex items-center justify-center gap-4 pt-4">
                        <button 
                          onClick={() => setSaasIdeasPage(p => Math.max(1, p - 1))}
                          disabled={saasIdeasPage === 1}
                          className="p-2 border border-white/20 disabled:opacity-20 hover:bg-white/5 transition-colors"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                          Page {saasIdeasPage} / {Math.ceil(results.saasIdeas.length / ITEMS_PER_PAGE)}
                        </span>
                        <button 
                          onClick={() => setSaasIdeasPage(p => Math.min(Math.ceil(results.saasIdeas.length / ITEMS_PER_PAGE), p + 1))}
                          disabled={saasIdeasPage === Math.ceil(results.saasIdeas.length / ITEMS_PER_PAGE)}
                          className="p-2 border border-white/20 disabled:opacity-20 hover:bg-white/5 transition-colors"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        </div>

        <footer className="p-12 border-t border-[#141414] text-center mt-20">
          <div className="flex justify-center gap-8 mb-6 opacity-40">
            <Zap size={20} />
            <Search size={20} />
            <TrendingUp size={20} />
          </div>
          <p className="font-mono text-[10px] uppercase opacity-40 tracking-[0.2em]">
            PainPoint AI • Built for Builders • 2026
          </p>
        </footer>
      </div>
    </div>
  );
}
