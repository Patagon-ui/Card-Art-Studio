
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  CardData, CardType, Attribute, GenerationMode, VariationStrength, GenerationState 
} from './types';
import { generateCardArt } from './services/geminiService';
import CardFrame from './components/CardFrame';
import { toPng } from 'html-to-image';
import { 
  Download, Sparkles, History, 
  RotateCcw, Copy, Trash2, ArrowRightLeft, Layers, SlidersHorizontal, Dice5, Check, X,
  Frame, Image as ImageIcon, Upload, FileImage, Trash, Type, Palette, Zap, Info,
  Plus, Minus, Maximize
} from 'lucide-react';

const INITIAL_CARD: CardData = {
  id: 'preview',
  name: 'Solara the Eternal',
  type: CardType.MONSTER,
  attribute: Attribute.LIGHT,
  level: 8,
  description: 'A radiant warrior of pure light who guards the cosmic gates. Her presence blinds those with darkness in their hearts.',
  atk: '2800',
  def: '2400',
  imageUrl: '',
  prompt: '',
  timestamp: Date.now(),
  fontFamily: 'Cinzel',
  bodyColor: '#161221',
  frameColor: '#D4AF37',
  accentColor: '#2E1A47',
  artOffsetX: 0,
  artOffsetY: 0,
  artScale: 1
};

const RANDOM_TEMPLATES = [
  { name: 'Void Reaver', type: CardType.MONSTER, attr: Attribute.DARK, desc: 'A creature born from the absence of matter, consuming all light in its path.', atk: '2400', def: '1200', lvl: 6, colors: { body: '#0a0a14', frame: '#4a3a6b', accent: '#1a1a2e' } },
  { name: 'Inferno Burst', type: CardType.SPELL, attr: Attribute.FIRE, desc: 'Unleash a devastating wave of molten lava that incinerates everything in the field.', atk: '0', def: '0', lvl: 1, colors: { body: '#1a0505', frame: '#ff4d4d', accent: '#4a0000' } },
  { name: 'Tidal Guardian', type: CardType.MONSTER, attr: Attribute.WATER, desc: 'A colossal leviathan that commands the currents and protects the sunken cities.', atk: '1800', def: '3000', lvl: 7, colors: { body: '#051a1a', frame: '#4dffff', accent: '#004a4a' } },
  { name: 'Zephyr Shard', type: CardType.TRAP, attr: Attribute.WIND, desc: 'When an opponent attacks, return the attacking monster to their hand.', atk: '0', def: '0', lvl: 1, colors: { body: '#051a05', frame: '#4dff4d', accent: '#004a00' } },
  { name: 'Gaia Behemoth', type: CardType.MONSTER, attr: Attribute.EARTH, desc: 'A living mountain that shakes the world with every step it takes.', atk: '3200', def: '3200', lvl: 10, colors: { body: '#1a1a05', frame: '#ffff4d', accent: '#4a4a4a' } },
  { name: 'Lunar Oracle', type: CardType.MONSTER, attr: Attribute.LIGHT, desc: 'Sees through the veil of time to predict the enemy\'s next strategic move.', atk: '1200', def: '2800', lvl: 4, colors: { body: '#1a1a1a', frame: '#fcfcfc', accent: '#4a4a4a' } },
];

const FONT_OPTIONS = [
  { label: 'Classic (Cinzel)', value: 'Cinzel' },
  { label: 'Medieval (Sharp)', value: 'Medieval' },
  { label: 'Modern (Minimal)', value: 'Modern' },
  { label: 'Sci-Fi (Mono)', value: 'Sci-Fi' },
  { label: 'Elegant (Serif)', value: 'Elegant' },
];

const ExportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onExport: (type: 'full' | 'artwork') => void;
  isExporting: boolean;
}> = ({ isOpen, onClose, onExport, isExporting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1a1528] w-full max-w-md rounded-[32px] border border-yellow-500/30 p-8 shadow-[0_0_50px_rgba(212,175,55,0.2)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50" />
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-cinzel text-xl font-black text-yellow-500 tracking-widest uppercase">Export Selection</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 mb-8 text-center">Select your preferred manifestation format</p>

        <div className="grid grid-cols-1 gap-4">
          <button 
            disabled={isExporting}
            onClick={() => onExport('full')}
            className="group flex items-center gap-6 p-6 rounded-2xl bg-[#0f0b1a] border border-white/5 hover:border-yellow-500/50 transition-all text-left relative overflow-hidden disabled:opacity-50"
          >
            <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform">
              <Frame className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-cinzel font-bold text-lg text-white group-hover:text-yellow-500 transition-colors">FULL CARD</h4>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Export the complete card with frame and stats</p>
            </div>
          </button>

          <button 
            disabled={isExporting}
            onClick={() => onExport('artwork')}
            className="group flex items-center gap-6 p-6 rounded-2xl bg-[#0f0b1a] border border-white/5 hover:border-purple-500/50 transition-all text-left relative overflow-hidden disabled:opacity-50"
          >
            <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-cinzel font-bold text-lg text-white group-hover:text-purple-400 transition-colors">ARTWORK ONLY</h4>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Export only the inner AI-generated illustration</p>
            </div>
          </button>
        </div>

        {isExporting && (
          <div className="mt-8 flex flex-col items-center animate-pulse">
            <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Synthesizing High-Res Output...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ImageUploadZone: React.FC<{
  onImageUploaded: (base64: string) => void;
  currentImage?: string;
  onClear: () => void;
}> = ({ onImageUploaded, currentImage, onClear }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onImageUploaded(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div 
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`relative h-24 mt-2 rounded-xl border-2 border-dashed transition-all flex items-center justify-center overflow-hidden
        ${isDragging ? 'border-yellow-500 bg-yellow-500/5' : 'border-white/10 bg-[#0f0b1a] hover:border-white/20'}`}
    >
      {currentImage ? (
        <div className="absolute inset-0 group">
          <img src={currentImage} className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-yellow-500 text-black rounded-lg hover:scale-110 transition-transform"
              title="Replace Image"
            >
              <Upload className="w-4 h-4" />
            </button>
            <button 
              onClick={onClear}
              className="p-2 bg-red-500 text-white rounded-lg hover:scale-110 transition-transform"
              title="Remove Image"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-[8px] font-black text-yellow-500 uppercase tracking-widest">Active Reference</div>
        </div>
      ) : (
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center gap-1 text-gray-500 group-hover:text-gray-400 transition-colors"
        >
          <Upload className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-black uppercase tracking-widest">Drag or Click to Upload</span>
        </button>
      )}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden" 
        accept="image/*"
      />
    </div>
  );
};

const App: React.FC = () => {
  const [card, setCard] = useState<CardData>(INITIAL_CARD);
  const [history, setHistory] = useState<CardData[]>([]);
  const [genState, setGenState] = useState<GenerationState & { useDirectly: boolean }>({
    isGenerating: false,
    error: null,
    mode: GenerationMode.NEW,
    strength: VariationStrength.MODERATE,
    customPrompt: '',
    variationChanges: '',
    uploadedImage: undefined,
    useDirectly: false
  });
  const [showBack, setShowBack] = useState(false);
  const [alsoGenerateBack, setAlsoGenerateBack] = useState(false);
  const [backPrompt, setBackPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);

  // Load history from local storage safely
  useEffect(() => {
    const saved = localStorage.getItem('card_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      } catch (e) {
        console.error("Failed to load history:", e);
      }
    }
  }, []);

  // Save history to local storage safely
  useEffect(() => {
    try {
      localStorage.setItem('card_history', JSON.stringify(history.slice(0, 8)));
    } catch (e) {
      console.warn("Local storage limit reached.", e);
    }
  }, [history]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCard(prev => ({ ...prev, [name]: value }));
  };

  const handleRandomize = () => {
    const template = RANDOM_TEMPLATES[Math.floor(Math.random() * RANDOM_TEMPLATES.length)];
    setCard(prev => ({
      ...prev,
      name: template.name,
      type: template.type,
      attribute: template.attr,
      description: template.desc,
      atk: template.atk,
      def: template.def,
      level: template.lvl,
      bodyColor: template.colors.body,
      frameColor: template.colors.frame,
      accentColor: template.colors.accent,
      artOffsetX: 0,
      artOffsetY: 0,
      artScale: 1
    }));
  };

  const handleUpdateOffset = (x: number, y: number) => {
    setCard(prev => ({ ...prev, artOffsetX: x, artOffsetY: y }));
  };

  const handleZoom = (delta: number) => {
    setCard(prev => ({
      ...prev,
      artScale: Math.max(0.1, Math.min(5, (prev.artScale || 1) + delta))
    }));
  };

  const handleAutoFit = () => {
    setCard(prev => ({
      ...prev,
      artOffsetX: 0,
      artOffsetY: 0,
      artScale: 1
    }));
  };

  const handleGenerate = async () => {
    if (genState.isGenerating) return;
    
    setShowBack(false);
    setGenState(prev => ({ ...prev, isGenerating: true, error: null }));
    
    try {
      let artUrl = card.imageUrl;
      
      // If "Use Directly" is selected and we have an uploaded image, bypass Gemini
      if (genState.useDirectly && genState.uploadedImage) {
        artUrl = genState.uploadedImage;
      } else {
        artUrl = await generateCardArt({
          cardType: card.type,
          attribute: card.attribute,
          name: card.name,
          description: card.description,
          customPrompt: genState.customPrompt,
          isVariation: genState.mode === GenerationMode.VARIATION,
          baseImageBase64: genState.mode === GenerationMode.VARIATION ? card.imageUrl : undefined,
          userImageBase64: genState.uploadedImage,
          variationStrength: genState.strength,
          variationChanges: genState.variationChanges
        });
      }

      let backUrl = card.backImageUrl;
      if (alsoGenerateBack) {
        backUrl = await generateCardArt({
          cardType: card.type,
          attribute: card.attribute,
          name: card.name,
          description: card.description,
          customPrompt: backPrompt,
          isBack: true
        });
      }

      const newCard: CardData = {
        ...card,
        id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        imageUrl: artUrl,
        backImageUrl: backUrl,
        timestamp: Date.now(),
        artOffsetX: 0, 
        artOffsetY: 0,
        artScale: 1
      };

      setCard(newCard);
      setHistory(prev => [newCard, ...prev]);
      
      if (genState.mode === GenerationMode.NEW && !genState.useDirectly) {
        setGenState(prev => ({ ...prev, mode: GenerationMode.VARIATION }));
      }
    } catch (err: any) {
      setGenState(prev => ({ ...prev, error: err.message || "The manifestation ritual failed." }));
    } finally {
      setGenState(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const useAsBase = (historicalCard: CardData) => {
    setCard({ ...historicalCard });
    setGenState(prev => ({ ...prev, mode: GenerationMode.VARIATION }));
    setShowBack(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const clearAllHistory = () => {
    if (window.confirm("Banish all cards in your collection history?")) {
      setHistory([]);
      localStorage.removeItem('card_history');
    }
  };

  const startFresh = () => {
    setCard(INITIAL_CARD);
    setGenState({
      isGenerating: false,
      error: null,
      mode: GenerationMode.NEW,
      strength: VariationStrength.MODERATE,
      customPrompt: '',
      variationChanges: '',
      uploadedImage: undefined,
      useDirectly: false
    });
    setBackPrompt('');
    setAlsoGenerateBack(false);
    setShowBack(false);
  };

  const performExport = async (type: 'full' | 'artwork') => {
    setIsExporting(true);
    try {
      if (type === 'artwork') {
        if (!card.imageUrl) return;
        const link = document.createElement('a');
        link.href = card.imageUrl;
        link.download = `${card.name.replace(/\s+/g, '_')}_artwork.png`;
        link.click();
      } else {
        if (!cardRef.current) return;
        
        const wasFlipped = showBack;
        if (wasFlipped) setShowBack(false);
        
        await new Promise(r => setTimeout(r, wasFlipped ? 800 : 50));

        const dataUrl = await toPng(cardRef.current, {
          quality: 1,
          pixelRatio: 2,
        });
        
        const link = document.createElement('a');
        link.download = `${card.name.replace(/\s+/g, '_')}_full_card.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Manifestation failed. The canvas could not be captured.');
    } finally {
      setIsExporting(false);
      setIsExportModalOpen(false);
    }
  };

  const copyPrompt = () => {
    const directive = genState.mode === GenerationMode.NEW ? genState.customPrompt : genState.variationChanges;
    const promptText = `Card: ${card.name} (${card.type})\nAttribute: ${card.attribute}\nEffect: ${card.description}\nMode: ${genState.mode}\nDirective: ${directive || 'Default'}`;
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0f0b1a] p-4 md:p-8 selection:bg-yellow-500 selection:text-black">
      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)} 
        onExport={performExport}
        isExporting={isExporting}
      />

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-black font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-yellow-200 to-yellow-600 tracking-tighter drop-shadow-sm">
            CARD ART STUDIO
          </h1>
          <p className="text-yellow-500/60 font-medium tracking-[0.3em] text-[10px] uppercase mt-2 flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Professional AI Forge
          </p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleRandomize}
             className="px-5 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl flex items-center gap-2 text-sm transition-all text-yellow-500 font-bold"
           >
             <Dice5 className="w-4 h-4" /> Randomize
           </button>
           <button 
             onClick={startFresh}
             className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-2 text-sm transition-all text-gray-300"
           >
             <RotateCcw className="w-4 h-4" /> Reset
           </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        {/* Left Panel: Controls */}
        <section className="lg:col-span-5 flex flex-col gap-6 order-2 lg:order-1">
          <div className="bg-[#1a1528] rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-yellow-500 to-purple-600" />
            
            <h3 className="text-xl font-cinzel font-bold text-white mb-8 flex items-center gap-3">
              <SlidersHorizontal className="w-6 h-6 text-yellow-500" /> Card Manifest
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={card.name} 
                  onChange={handleInputChange}
                  className="w-full bg-[#0f0b1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Type</label>
                <select 
                  name="type" 
                  value={card.type} 
                  onChange={handleInputChange}
                  className="w-full bg-[#0f0b1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value={CardType.MONSTER}>Monster/Creature</option>
                  <option value={CardType.SPELL}>Spell/Magic</option>
                  <option value={CardType.TRAP}>Trap/Action</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-5">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Attribute</label>
                <select 
                  name="attribute" 
                  value={card.attribute} 
                  onChange={handleInputChange}
                  className="w-full bg-[#0f0b1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  {Object.values(Attribute).map(attr => (
                    <option key={attr} value={attr}>{attr}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Level / Stars</label>
                <input 
                  type="number" 
                  name="level" 
                  min="0" 
                  max="12"
                  value={card.level} 
                  onChange={handleInputChange}
                  className="w-full bg-[#0f0b1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Visual Customization Section */}
            <div className="p-5 bg-[#0f0b1a]/40 rounded-2xl border border-white/5 mb-5 space-y-6">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Visual Essence
                </h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-gray-500 flex items-center gap-2">
                    <Type className="w-3 h-3" /> Font Family
                  </label>
                  <select 
                    name="fontFamily" 
                    value={card.fontFamily || 'Cinzel'} 
                    onChange={handleInputChange}
                    className="w-full bg-[#0f0b1a] border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-yellow-500 outline-none appearance-none cursor-pointer"
                  >
                    {FONT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Frame Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      name="frameColor" 
                      value={card.frameColor || '#D4AF37'} 
                      onChange={handleInputChange}
                      className="w-10 h-10 bg-transparent rounded cursor-pointer border-none"
                    />
                    <input 
                      type="text" 
                      name="frameColor" 
                      value={card.frameColor || '#D4AF37'} 
                      onChange={handleInputChange}
                      className="flex-1 bg-[#0f0b1a] border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono uppercase focus:border-yellow-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Body Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      name="bodyColor" 
                      value={card.bodyColor || '#161221'} 
                      onChange={handleInputChange}
                      className="w-10 h-10 bg-transparent rounded cursor-pointer border-none"
                    />
                    <input 
                      type="text" 
                      name="bodyColor" 
                      value={card.bodyColor || '#161221'} 
                      onChange={handleInputChange}
                      className="flex-1 bg-[#0f0b1a] border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono uppercase focus:border-yellow-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Accent Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      name="accentColor" 
                      value={card.accentColor || '#2E1A47'} 
                      onChange={handleInputChange}
                      className="w-10 h-10 bg-transparent rounded cursor-pointer border-none"
                    />
                    <input 
                      type="text" 
                      name="accentColor" 
                      value={card.accentColor || '#2E1A47'} 
                      onChange={handleInputChange}
                      className="flex-1 bg-[#0f0b1a] border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono uppercase focus:border-yellow-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {card.type === CardType.MONSTER && (
              <div className="grid grid-cols-2 gap-5 mb-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Attack</label>
                  <input 
                    type="text" 
                    name="atk" 
                    value={card.atk} 
                    onChange={handleInputChange}
                    className="w-full bg-[#0f0b1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Defense</label>
                  <input 
                    type="text" 
                    name="def" 
                    value={card.def} 
                    onChange={handleInputChange}
                    className="w-full bg-[#0f0b1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 mb-8">
              <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Ability / Lore</label>
              <textarea 
                name="description" 
                value={card.description} 
                onChange={handleInputChange}
                rows={3}
                className="w-full bg-[#0f0b1a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none resize-none transition-all"
              />
            </div>

            {/* Reference Image Upload Section */}
            <div className="mb-8 p-4 bg-[#0f0b1a]/40 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-2 px-1">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                  <FileImage className="w-3 h-3" /> External Reference
                </h4>
              </div>
              <ImageUploadZone 
                currentImage={genState.uploadedImage}
                onImageUploaded={(b64) => setGenState(prev => ({ ...prev, uploadedImage: b64 }))}
                onClear={() => setGenState(prev => ({ ...prev, uploadedImage: undefined, useDirectly: false }))}
              />
              
              {genState.uploadedImage && (
                <div className="mt-4 px-1 flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" className="sr-only peer" 
                        checked={genState.useDirectly}
                        onChange={(e) => setGenState(prev => ({ ...prev, useDirectly: e.target.checked }))}
                      />
                      <div className="w-9 h-5 bg-[#0f0b1a] rounded-full peer peer-checked:bg-purple-600 transition-colors border border-white/10"></div>
                      <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                    </div>
                    <span className="text-[9px] font-black text-gray-400 group-hover:text-purple-400 transition-colors uppercase tracking-[0.2em] flex items-center gap-2">
                      <Zap className={`w-3 h-3 ${genState.useDirectly ? 'text-purple-400 fill-purple-400' : ''}`} /> Use Image Directly (Skip AI Generation)
                    </span>
                  </label>
                  <div className="flex items-start gap-2 text-yellow-500/50 bg-yellow-500/5 p-2 rounded-lg border border-yellow-500/10">
                     <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                     <p className="text-[8px] leading-tight uppercase tracking-wider">Drag image on the card preview to reposition it within the square frame.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Generation Mode Selector */}
            <div className={`mb-8 p-6 bg-[#0f0b1a] rounded-2xl border shadow-inner transition-colors duration-500 ${genState.useDirectly ? 'border-purple-500/30 opacity-60 pointer-events-none' : 'border-yellow-500/10'}`}>
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-500">Creative Engine</h4>
                <div className="flex bg-[#1a1528] p-1.5 rounded-xl border border-white/5">
                  <button 
                    onClick={() => setGenState(prev => ({ ...prev, mode: GenerationMode.NEW }))}
                    className={`px-4 py-2 text-[10px] uppercase font-black rounded-lg transition-all ${genState.mode === GenerationMode.NEW ? 'bg-yellow-500 text-black' : 'text-gray-500 hover:text-white'}`}
                  >
                    New Design
                  </button>
                  <button 
                    onClick={() => setGenState(prev => ({ ...prev, mode: GenerationMode.VARIATION }))}
                    disabled={!card.imageUrl}
                    className={`px-4 py-2 text-[10px] uppercase font-black rounded-lg transition-all ${genState.mode === GenerationMode.VARIATION ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'} disabled:opacity-20`}
                  >
                    Variation
                  </button>
                </div>
              </div>

              {genState.mode === GenerationMode.VARIATION ? (
                <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-400">
                  <div className="flex gap-4 items-center p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="w-14 h-18 rounded-lg border border-white/10 overflow-hidden flex-shrink-0 shadow-md">
                      <img src={card.imageUrl} className="w-full h-full object-cover" alt="Reference" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Base Reference Active</p>
                      <p className="text-[10px] text-gray-500 leading-relaxed">Maintaining character identity and art style.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Intensity</label>
                      <span className="text-[10px] font-black text-purple-400 uppercase bg-purple-400/10 px-2 py-0.5 rounded">{genState.strength}</span>
                    </div>
                    <input 
                      type="range" min="0" max="2" step="1"
                      value={genState.strength === VariationStrength.SUBTLE ? 0 : genState.strength === VariationStrength.MODERATE ? 1 : 2}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setGenState(prev => ({ 
                          ...prev, 
                          strength: val === 0 ? VariationStrength.SUBTLE : val === 1 ? VariationStrength.MODERATE : val === 2 ? VariationStrength.SIGNIFICANT : VariationStrength.MODERATE
                        }));
                      }}
                      className="w-full h-2 bg-[#1a1528] rounded-full appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Evolution Directives</label>
                    <input 
                      type="text"
                      value={genState.variationChanges}
                      onChange={(e) => setGenState(prev => ({ ...prev, variationChanges: e.target.value }))}
                      placeholder="e.g. Action pose, magical aura, night theme..."
                      className="w-full bg-[#1a1528] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none transition-all"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-gray-500">Art Direction (Optional)</label>
                  <textarea 
                    value={genState.customPrompt}
                    onChange={(e) => setGenState(prev => ({ ...prev, customPrompt: e.target.value }))}
                    rows={2}
                    placeholder="e.g. Masterpiece quality, cinematic lighting, epic scenery..."
                    className="w-full bg-[#1a1528] border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-yellow-500 outline-none resize-none shadow-inner"
                  />
                </div>
              )}
            </div>

            {/* Ritual Back Side Toggle */}
            <div className="mb-8 p-5 bg-[#251f38]/30 rounded-2xl border border-white/5">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className="relative">
                  <input 
                    type="checkbox" className="sr-only peer" 
                    checked={alsoGenerateBack}
                    onChange={(e) => setAlsoGenerateBack(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-[#0f0b1a] rounded-full peer peer-checked:bg-yellow-500 transition-colors border border-white/10"></div>
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                </div>
                <span className="text-[10px] font-black text-gray-400 group-hover:text-white transition-colors uppercase tracking-[0.2em]">Forge Custom Card Back</span>
              </label>

              {alsoGenerateBack && (
                <div className="mt-5 animate-in fade-in slide-in-from-top-1 duration-300">
                  <textarea 
                    value={backPrompt}
                    onChange={(e) => setBackPrompt(e.target.value)}
                    placeholder="Describe the card back symbols..."
                    className="w-full bg-[#0f0b1a] border border-white/10 rounded-xl px-4 py-3 text-xs focus:border-yellow-500 outline-none shadow-inner"
                  />
                </div>
              )}
            </div>

            <button 
              onClick={handleGenerate}
              disabled={genState.isGenerating}
              className={`w-full py-5 rounded-2xl font-cinzel font-black text-xl tracking-[0.2em] transition-all flex items-center justify-center gap-4 shadow-2xl relative overflow-hidden group
                ${genState.isGenerating 
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50' 
                  : genState.useDirectly
                    ? 'bg-gradient-to-r from-purple-700 via-indigo-500 to-purple-700 text-white'
                    : genState.mode === GenerationMode.NEW 
                      ? 'bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-600 text-black' 
                      : 'bg-gradient-to-r from-purple-700 via-purple-500 to-purple-700 text-white'}`}
            >
              {genState.isGenerating ? (
                <>
                  <div className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
                  MANIFESTING...
                </>
              ) : (
                <>
                  {genState.useDirectly ? <Zap className="w-6 h-6" /> : genState.mode === GenerationMode.NEW ? <Sparkles className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                  {genState.useDirectly ? 'APPLY IMAGE' : genState.mode === GenerationMode.NEW ? 'MANIFEST CARD' : 'FORGE EVOLUTION'}
                </>
              )}
            </button>
            
            {genState.error && (
              <div className="mt-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                 <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                 <p className="text-[10px] text-red-400 font-bold uppercase tracking-tight leading-relaxed">{genState.error}</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Panel: Preview Area */}
        <section className="lg:col-span-7 flex flex-col gap-6 order-1 lg:order-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <h3 className="text-2xl font-cinzel font-black text-white tracking-widest uppercase">The Altar</h3>
            </div>
            
            <div className="flex gap-3">
               <button 
                 onClick={copyPrompt}
                 className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all"
                 title="Copy Prompt"
               >
                 {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
               </button>
               {(card.backImageUrl || alsoGenerateBack) && (
                 <button 
                   onClick={() => setShowBack(!showBack)}
                   className={`p-3 rounded-xl border transition-all ${showBack ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-white/5 text-gray-400 border-white/10'}`}
                   title="Flip Card"
                 >
                   <ArrowRightLeft className="w-5 h-5" />
                 </button>
               )}
               <button 
                 onClick={() => setIsExportModalOpen(true)}
                 disabled={!card.imageUrl}
                 className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-10"
                 title="Export Options"
               >
                 <Download className="w-5 h-5" />
               </button>
            </div>
          </div>

          <div className="relative flex flex-col items-center">
             <div className="relative aspect-[2.5/3.5] max-w-[480px] w-full group select-none">
                {genState.isGenerating && (
                  <div className="absolute inset-0 z-50 bg-[#0f0b1a]/90 backdrop-blur-md rounded-[32px] flex flex-col items-center justify-center p-10 text-center border-4 border-yellow-500/20 shadow-2xl">
                     <div className="relative w-32 h-32 mb-8">
                       <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                       <div className="absolute inset-0 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                       <Sparkles className="absolute inset-0 m-auto w-12 h-12 text-yellow-500 animate-pulse" />
                     </div>
                     <h4 className="text-2xl font-cinzel font-black text-yellow-500 mb-4 tracking-widest">TRANSMUTING...</h4>
                     <p className="text-[10px] text-gray-500 max-w-xs uppercase tracking-widest leading-loose">Extracting artistic energy from the digital void.</p>
                  </div>
                )}
                
                <CardFrame 
                  ref={cardRef} 
                  card={card} 
                  isFlipped={showBack} 
                  onUpdateOffset={handleUpdateOffset}
                  canReposition={!!card.imageUrl}
                />
                <div className="absolute -inset-10 bg-yellow-500/5 blur-[100px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
             </div>

             {/* Manipulation Controls */}
             {card.imageUrl && !showBack && (
               <div className="mt-8 flex items-center gap-3 bg-[#1a1528] p-3 rounded-2xl border border-white/5 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                 <button 
                   onClick={() => handleZoom(-0.1)}
                   className="p-2.5 rounded-xl bg-[#0f0b1a] hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-500 transition-all border border-white/5"
                   title="Zoom Out"
                 >
                   <Minus className="w-5 h-5" />
                 </button>
                 <div className="px-4 py-2 bg-[#0f0b1a] rounded-xl border border-white/5 min-w-[80px] text-center">
                    <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                      {Math.round((card.artScale || 1) * 100)}%
                    </span>
                 </div>
                 <button 
                   onClick={() => handleZoom(0.1)}
                   className="p-2.5 rounded-xl bg-[#0f0b1a] hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-500 transition-all border border-white/5"
                   title="Zoom In"
                 >
                   <Plus className="w-5 h-5" />
                 </button>
                 <div className="w-px h-6 bg-white/10 mx-1" />
                 <button 
                   onClick={handleAutoFit}
                   className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border border-purple-500/20 font-black text-[10px] uppercase tracking-widest transition-all"
                   title="Auto Fit & Center"
                 >
                   <Maximize className="w-4 h-4" /> Auto Fit
                 </button>
               </div>
             )}
          </div>

          {/* History Gallery */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 flex items-center gap-3">
                <History className="w-4 h-4" /> Codex History
              </h4>
              <button onClick={clearAllHistory} className="text-[8px] text-red-500/50 hover:text-red-500 font-black uppercase tracking-widest transition-colors">Banish History</button>
            </div>
            
            {history.length > 0 ? (
              <div className="flex gap-5 overflow-x-auto pb-6 px-1 no-scrollbar scroll-smooth">
                {history.map((h) => (
                  <div 
                    key={h.id} 
                    className="flex-shrink-0 w-28 aspect-[2.5/3.5] rounded-xl border-2 border-white/5 hover:border-yellow-500/50 transition-all cursor-pointer overflow-hidden group relative shadow-lg"
                    onClick={() => useAsBase(h)}
                  >
                    <img src={h.imageUrl} alt={h.name} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                       <Layers className="text-yellow-500 w-6 h-6 mb-2" />
                       <span className="text-[8px] font-black text-white uppercase tracking-widest">Manifest</span>
                    </div>
                    <button 
                      onClick={(e) => deleteHistoryItem(h.id, e)}
                      className="absolute top-1 right-1 p-1.5 rounded-lg bg-black/80 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60 backdrop-blur-sm">
                       <p className="text-[8px] font-bold text-white truncate text-center uppercase tracking-tighter">{h.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-16 rounded-[32px] border-2 border-dashed border-white/5 text-center bg-white/[0.02]">
                 <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">No manifestations recorded in this timeline.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto mt-24 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-[9px] text-gray-600 font-black uppercase tracking-[0.4em] gap-6 pb-12">
        <div className="flex items-center gap-4">
          <p>© 2025 CARD ART STUDIO</p>
          <div className="w-1 h-1 rounded-full bg-gray-800" />
          <p>FORGED WITH GEMINI AI</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
