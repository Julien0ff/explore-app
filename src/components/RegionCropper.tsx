import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { clsx } from 'clsx';

interface RegionCropperProps {
  imageUrl: string;
  onCrop: (croppedBase64: string) => void;
  onCancel: () => void;
  language?: 'fr' | 'en';
}

export function RegionCropper({ imageUrl, onCrop, onCancel, language = 'en' }: RegionCropperProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [selection, setSelection] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getPos = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: e.clientX, y: e.clientY };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (selection) return; // Already selected, wait for confirm/cancel
    setIsDragging(true);
    const pos = getPos(e);
    setStartPos(pos);
    setCurrentPos(pos);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCurrentPos(getPos(e));
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width > 10 && height > 10) {
      setSelection({ x, y, width, height });
    } else {
      setSelection(null);
    }
  };

  const cropImage = () => {
    if (!selection || !imageRef.current) return;
    
    // Create a canvas to draw the cropped region
    const canvas = document.createElement('canvas');
    const img = imageRef.current;
    
    // Calculate the actual image scale
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    // Set canvas to selected dimensions
    canvas.width = selection.width * scaleX;
    canvas.height = selection.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw the specific region
    ctx.drawImage(
      img,
      selection.x * scaleX,
      selection.y * scaleY,
      selection.width * scaleX,
      selection.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    onCrop(canvas.toDataURL('image/png'));
  };

  const rectX = Math.min(startPos.x, currentPos.x);
  const rectY = Math.min(startPos.y, currentPos.y);
  const rectWidth = Math.abs(currentPos.x - startPos.x);
  const rectHeight = Math.abs(currentPos.y - startPos.y);

  const selectionBottom = selection ? selection.y + selection.height : rectY + rectHeight;
  const isNearBottom = selectionBottom > window.innerHeight - 120;

  return (
    <div 
         ref={containerRef}
         className="absolute inset-0 z-50 cursor-crosshair select-none overflow-hidden"
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
    >
      <img 
        ref={imageRef}
        src={imageUrl} 
        className="absolute inset-0 w-full h-full object-fill pointer-events-none opacity-100" 
        draggable={false} 
        alt="Screenshot" 
      />
      
      {!isDragging && !selection && (
        <div className="absolute inset-0 bg-black/60 pointer-events-none" />
      )}
      
      {(isDragging || selection) && (
        <div 
          className="absolute border-2 border-blue-400/80 bg-transparent rounded-2xl"
          style={{
            left: selection ? selection.x : rectX,
            top: selection ? selection.y : rectY,
            width: selection ? selection.width : rectWidth,
            height: selection ? selection.height : rectHeight,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 40px 10px rgba(59, 130, 246, 0.5), inset 0 0 40px 10px rgba(139, 92, 246, 0.4)'
          }}
        >
          {selection && (
            <div className={clsx("absolute right-0 flex items-center gap-2", isNearBottom ? "bottom-2 right-2" : "-bottom-12")}>
              <button 
                onClick={(e) => { e.stopPropagation(); setSelection(null); }}
                className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                title={language === 'fr' ? 'Annuler la sélection' : 'Cancel selection'}
              >
                <X className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); cropImage(); }}
                className="w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center shadow-lg transition-colors cursor-pointer"
                title={language === 'fr' ? 'Valider la capture' : 'Confirm capture'}
              >
                <Check className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {!isDragging && !selection && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="flex flex-col items-center gap-6">
            <div className="px-6 py-3 bg-black/80 backdrop-blur text-white rounded-full text-sm font-medium animate-pulse shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              {language === 'fr' ? 'Dessinez un rectangle pour capturer une zone' : 'Draw a rectangle to capture a region'}
            </div>
            <button 
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onCancel(); }}
              className="px-6 py-2.5 bg-red-500/90 hover:bg-red-500 text-white rounded-full text-sm font-medium transition-colors shadow-lg pointer-events-auto"
            >
              {language === 'fr' ? 'Annuler la capture' : 'Cancel screenshot'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
