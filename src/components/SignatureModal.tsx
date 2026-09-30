import React, { useRef, useState, useEffect } from 'react';
import {
  PenTool,
  Upload,
  X,
  RotateCcw,
  Check,
  Palette
} from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature
}) => {
  const [tab, setTab] = useState<'draw' | 'upload'>('draw');
  const [inkColor, setInkColor] = useState<string>('#0F5132');
  const [penSize, setPenSize] = useState<number>(2.5);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && tab === 'draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = penSize;
      }
    }
  }, [isOpen, tab, inkColor, penSize]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = evt => {
        if (evt.target?.result) {
          setUploadedDataUrl(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      onSaveSignature(canvas.toDataURL('image/png'));
    } else {
      if (!uploadedDataUrl) return;
      onSaveSignature(uploadedDataUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-md overflow-hidden flex flex-col text-xs text-[#1F2937] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F5132] flex items-center justify-center text-white">
              <PenTool className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#0F5132]">Digital Signature</h2>
              <p className="text-[11px] text-[#6B7280]">Creates authentic transparent signature layer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#9CA3AF] hover:text-[#1F2937] rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#E5E7EB] px-5 bg-white">
          <button
            onClick={() => setTab('draw')}
            className={`py-2 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'draw' ? 'border-[#0F5132] text-[#0F5132]' : 'border-transparent text-[#6B7280]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw Signature</span>
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`py-2 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              tab === 'upload' ? 'border-[#0F5132] text-[#0F5132]' : 'border-transparent text-[#6B7280]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {tab === 'draw' ? (
            <div className="space-y-3">
              {/* Drawing options: colors & pen size */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#6B7280] font-semibold">Ink:</span>
                  {[
                    { color: '#0F5132', label: 'Forest Green' },
                    { color: '#1E3A8A', label: 'Classic Blue' },
                    { color: '#1F2937', label: 'Black' },
                  ].map(c => (
                    <button
                      key={c.color}
                      onClick={() => setInkColor(c.color)}
                      style={{ backgroundColor: c.color }}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        inkColor === c.color ? 'scale-115 ring-2 ring-[#0F5132] ring-offset-1' : ''
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#6B7280]">Stroke:</span>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="0.5"
                    value={penSize}
                    onChange={e => setPenSize(parseFloat(e.target.value))}
                    className="w-16 accent-[#0F5132]"
                  />
                  <button
                    onClick={clearCanvas}
                    className="flex items-center gap-1 text-[11px] text-[#6B7280] hover:text-[#1F2937]"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
              </div>

              {/* Drawing Canvas */}
              <div className="border border-dashed border-[#CBD5E1] rounded-lg bg-[#FAFBFD] relative overflow-hidden h-40 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={380}
                  height={160}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="cursor-crosshair w-full h-full"
                />
                {!hasDrawn && (
                  <span className="absolute text-[#9CA3AF] pointer-events-none text-xs">
                    Sign with your mouse, trackpad, or pen here
                  </span>
                )}
                {/* Signature guideline line */}
                <div className="absolute bottom-6 left-6 right-6 border-b border-[#E5E7EB] pointer-events-none" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-[#CBD5E1] rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#0F5132] transition-colors bg-[#F8F9FA]">
                <Upload className="w-8 h-8 text-[#0F5132] mb-2" />
                <span className="font-semibold text-[#1F2937]">Upload signature image (PNG, JPG)</span>
                <span className="text-[11px] text-[#6B7280] mt-0.5">Transparent background recommended</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>

              {uploadedDataUrl && (
                <div className="p-2 border border-[#E5E7EB] rounded-lg bg-white flex items-center justify-center h-28">
                  <img src={uploadedDataUrl} alt="Preview" className="max-h-full object-contain" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-[#CBD5E1] rounded text-[#374151] hover:bg-[#E5E7EB]"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={tab === 'draw' ? !hasDrawn : !uploadedDataUrl}
            className="px-4 py-1.5 bg-[#0F5132] hover:bg-[#198754] text-white font-semibold rounded disabled:opacity-40 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Place on PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
