
import React, { forwardRef, useState, useRef, useCallback } from 'react';
import { CardData, CardType, Attribute } from '../types';
import { Sparkles, Move } from 'lucide-react';

interface CardFrameProps {
  card: CardData;
  isFlipped?: boolean;
  onUpdateOffset?: (x: number, y: number) => void;
  canReposition?: boolean;
}

const AttributeIcon: React.FC<{ attribute: Attribute }> = ({ attribute }) => {
  const colors: Record<Attribute, string> = {
    [Attribute.DARK]: 'bg-indigo-950 text-indigo-200 border-indigo-400',
    [Attribute.LIGHT]: 'bg-yellow-50 text-yellow-900 border-yellow-400',
    [Attribute.WATER]: 'bg-blue-600 text-blue-100 border-blue-300',
    [Attribute.FIRE]: 'bg-red-700 text-red-100 border-red-300',
    [Attribute.EARTH]: 'bg-amber-800 text-amber-100 border-amber-400',
    [Attribute.WIND]: 'bg-emerald-600 text-emerald-100 border-emerald-300',
    [Attribute.NONE]: 'bg-slate-700 text-slate-100 border-slate-500',
  };

  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${colors[attribute]}`}>
      <span className="text-[10px] font-black uppercase tracking-tighter drop-shadow-sm">
        {attribute.substring(0, 3)}
      </span>
    </div>
  );
};

const CardFrame = forwardRef<HTMLDivElement, CardFrameProps>(({ card, isFlipped, onUpdateOffset, canReposition }, ref) => {
  const isMonster = card.type === CardType.MONSTER;
  const levelCount = Math.max(0, Math.min(12, Number(card.level) || 0));

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canReposition || !onUpdateOffset || isFlipped) return;
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    startOffset.current = { x: card.artOffsetX || 0, y: card.artOffsetY || 0 };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !onUpdateOffset) return;
    const dx = e.clientX - dragStartPos.current.x;
    const dy = e.clientY - dragStartPos.current.y;
    onUpdateOffset(startOffset.current.x + dx, startOffset.current.y + dy);
  }, [isDragging, onUpdateOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getFontClass = (base: string) => {
    switch (card.fontFamily) {
      case 'Cinzel': return `${base} font-cinzel`;
      case 'Medieval': return `${base} font-medieval`;
      case 'Modern': return `${base} font-inter`;
      case 'Sci-Fi': return `${base} font-roboto`;
      case 'Elegant': return `${base} font-elegant`;
      default: return `${base} font-cinzel`;
    }
  };

  const bodyColor = card.bodyColor || '#161221';
  const frameColor = card.frameColor || '#D4AF37';
  const accentColor = card.accentColor || '#2E1A47';
  const artScale = card.artScale || 1;

  return (
    <div className="relative w-full h-full perspective-1000 group">
      <div 
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT SIDE */}
        <div 
          id="card-capture-area"
          ref={ref}
          className="absolute inset-0 w-full h-full backface-hidden rounded-[32px] overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.9)] border-[12px] ring-1 ring-white/10"
          style={{ 
            backfaceVisibility: 'hidden',
            backgroundColor: bodyColor,
            borderColor: frameColor
          }}
        >
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          <div className="absolute inset-0 border-[3px] border-white/10 pointer-events-none m-1 rounded-[20px]" />
          
          {/* Header */}
          <div 
            className="absolute top-5 left-5 right-5 flex justify-between items-center z-20 bg-black/60 backdrop-blur-xl px-4 py-2.5 rounded-2xl border shadow-xl"
            style={{ borderColor: `${frameColor}66` }}
          >
            <h2 className={getFontClass("text-xl font-black truncate text-yellow-100 pr-2 uppercase tracking-wide drop-shadow-md")}>
              {card.name || "UNNAMED"}
            </h2>
            <AttributeIcon attribute={card.attribute} />
          </div>

          {/* Level Stars */}
          {isMonster && levelCount > 0 && (
            <div className="absolute top-[84px] right-7 flex gap-1 z-20">
              {[...Array(levelCount)].map((_, i) => (
                <div key={i} className="w-5 h-5 bg-gradient-to-b from-orange-400 to-red-600 rounded-full border border-yellow-200 flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                  <span className="text-white text-[10px] leading-none font-bold">★</span>
                </div>
              ))}
            </div>
          )}

          {/* Main Art Window (Square) */}
          <div 
            onMouseDown={handleMouseDown}
            className={`absolute top-[88px] left-7 right-7 aspect-square border-[6px] bg-[#000] overflow-hidden rounded-xl shadow-[inset_0_5px_20px_rgba(0,0,0,1)] z-10 
              ${canReposition ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{ borderColor: accentColor }}
          >
            {card.imageUrl ? (
              <img 
                src={card.imageUrl} 
                alt={card.name} 
                draggable={false}
                className={`w-full h-full object-cover transition-transform ${isDragging ? '' : 'duration-[0.1s]'} ease-out`}
                style={{ 
                  transform: `translate(${card.artOffsetX || 0}px, ${card.artOffsetY || 0}px) scale(${artScale})`,
                  objectPosition: 'center'
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 bg-gradient-to-br from-black/20 to-black/40">
                 <Sparkles className="w-16 h-16 mb-4 opacity-10" />
                 <p className="font-cinzel text-[10px] uppercase font-black tracking-[0.4em] opacity-30">Awaiting Ritual</p>
              </div>
            )}
            
            {canReposition && !isFlipped && (
               <div className="absolute bottom-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg text-white/40 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                 <Move className="w-4 h-4" />
               </div>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-yellow-500/10 mix-blend-color-dodge opacity-50 pointer-events-none" />
          </div>

          {/* Info Panel */}
          <div 
            className="absolute bottom-7 left-7 right-7 h-[135px] border-2 rounded-2xl p-4 overflow-hidden backdrop-blur-md shadow-2xl z-20"
            style={{ 
              backgroundColor: `${accentColor}CC`,
              borderColor: `${frameColor}80`
            }}
          >
            <div className="flex justify-between items-start mb-2 border-b border-white/10 pb-2">
              <span className="font-cinzel text-[11px] text-yellow-500 font-black uppercase tracking-[0.2em]">
                [{card.type} / {card.attribute}]
              </span>
              {isMonster && (
                <span className="font-cinzel text-[10px] text-yellow-200/70 font-bold">LVL {card.level}</span>
              )}
            </div>
            <p className={`${getFontClass("text-[12px] leading-[1.3] text-gray-100 line-clamp-4 font-medium italic tracking-tight opacity-90")}`}>
              {card.description || "The cosmic essence of this card has yet to be revealed to the mortals."}
            </p>
            {isMonster && (
              <div 
                className="absolute bottom-3 right-4 flex gap-5 bg-black/40 px-3 py-1 rounded-lg border backdrop-blur-sm"
                style={{ borderColor: `${frameColor}33` }}
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="font-cinzel text-[9px] text-yellow-500/80 uppercase font-black tracking-tighter">ATK/</span>
                  <span className="font-cinzel text-base text-yellow-100 font-black tracking-tight">{card.atk}</span>
                </div>
                <div className="flex items-baseline gap-1.5 border-l border-white/10 pl-5">
                  <span className="font-cinzel text-[9px] text-yellow-500/80 uppercase font-black tracking-tighter">DEF/</span>
                  <span className="font-cinzel text-base text-yellow-100 font-black tracking-tight">{card.def}</span>
                </div>
              </div>
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none skew-x-12" />
        </div>

        {/* BACK SIDE */}
        <div 
          className="absolute inset-0 w-full h-full backface-hidden rounded-[32px] overflow-hidden shadow-2xl border-[12px] rotate-y-180"
          style={{ 
            backfaceVisibility: 'hidden', 
            transform: 'rotateY(180deg)',
            backgroundColor: bodyColor,
            borderColor: accentColor
          }}
        >
          {card.backImageUrl ? (
            <img 
              src={card.backImageUrl} 
              alt="Card Back" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-black/40 to-black/60 p-12">
               <div 
                 className="w-full h-full border-4 rounded-2xl flex items-center justify-center"
                 style={{ borderColor: `${frameColor}33` }}
               >
                  <div className="text-center opacity-20">
                    <div 
                      className="w-20 h-20 border-4 rounded-full mx-auto mb-4 flex items-center justify-center"
                      style={{ borderColor: frameColor }}
                    >
                      <div 
                        className="w-12 h-1 border-b-4 rotate-45"
                        style={{ borderColor: frameColor }}
                      ></div>
                    </div>
                    <p 
                      className="font-cinzel text-xs font-black uppercase tracking-widest"
                      style={{ color: frameColor }}
                    >Ancient Pattern</p>
                  </div>
               </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 via-transparent to-purple-500/10 pointer-events-none" />
          <div 
            className="absolute inset-0 border-4 rounded-[20px] m-1 pointer-events-none"
            style={{ borderColor: `${frameColor}33` }}
          />
        </div>
      </div>
    </div>
  );
});

export default CardFrame;
