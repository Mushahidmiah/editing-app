import React, { useState } from 'react';
import {
  ImagePlus,
  Upload,
  X,
  Check,
  Maximize,
  Minimize
} from 'lucide-react';
import { PDFImageItem } from '../types/pdf';

interface ImageReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetImage: PDFImageItem | null;
  onConfirmReplace: (newSrc: string, fitMode: 'fit' | 'fill' | 'stretch' | 'crop') => void;
}

export const ImageReplaceModal: React.FC<ImageReplaceModalProps> = ({
  isOpen,
  onClose,
  targetImage,
  onConfirmReplace
}) => {
  const [newImageSrc, setNewImageSrc] = useState<string | null>(null);
  const [fitMode, setFitMode] = useState<'fit' | 'fill' | 'stretch' | 'crop'>('fit');

  if (!isOpen) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) setNewImageSrc(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    if (!newImageSrc) return;
    onConfirmReplace(newImageSrc, fitMode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-md overflow-hidden flex flex-col text-xs text-[#1F2937] animate-in zoom-in-95 duration-150">
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F5132] flex items-center justify-center text-white">
              <ImagePlus className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#0F5132]">Replace Image Object</h2>
              <p className="text-[11px] text-[#6B7280]">
                Inherits exact {Math.round(targetImage?.width || 100)} × {Math.round(targetImage?.height || 100)} pt bounds
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#9CA3AF] hover:text-[#1F2937] rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <label className="border-2 border-dashed border-[#CBD5E1] rounded-lg p-5 flex flex-col items-center justify-center cursor-pointer hover:border-[#0F5132] transition-colors bg-[#F8F9FA]">
            <Upload className="w-7 h-7 text-[#0F5132] mb-1.5" />
            <span className="font-semibold text-[#1F2937]">Select Replacement Image</span>
            <span className="text-[10px] text-[#6B7280]">PNG, JPG, WebP supported</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>

          {newImageSrc && (
            <div className="space-y-3">
              <div className="p-2 border border-[#E5E7EB] rounded-lg bg-[#FAFBFD] flex items-center justify-center h-36">
                <img
                  src={newImageSrc}
                  alt="Preview"
                  className={`max-h-full max-w-full ${
                    fitMode === 'fill' ? 'object-cover' : 'object-contain'
                  }`}
                />
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[#4B5563] block mb-1">
                  Aspect Ratio & Scaling Mode:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['fit', 'fill', 'stretch', 'crop'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setFitMode(mode)}
                      className={`py-1 rounded text-center uppercase font-semibold text-[10px] ${
                        fitMode === mode ? 'bg-[#0F5132] text-white' : 'bg-[#F1F3F5] text-[#4B5563]'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-[#CBD5E1] rounded text-[#374151] hover:bg-[#E5E7EB]"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!newImageSrc}
            className="px-4 py-1.5 bg-[#0F5132] hover:bg-[#198754] text-white font-semibold rounded disabled:opacity-40 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Replacement</span>
          </button>
        </div>
      </div>
    </div>
  );
};
