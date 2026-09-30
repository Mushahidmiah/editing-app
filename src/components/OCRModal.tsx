import React, { useState } from 'react';
import {
  ScanText,
  X,
  Check,
  Sparkles,
  Languages,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { PDFPageData, PDFTextItem } from '../types/pdf';
import { runOCROnPage } from '../utils/ocrEngine';

interface OCRModalProps {
  isOpen: boolean;
  onClose: () => void;
  page: PDFPageData;
  onOCRComplete: (pageNumber: number, newItems: PDFTextItem[]) => void;
}

export const OCRModal: React.FC<OCRModalProps> = ({
  isOpen,
  onClose,
  page,
  onOCRComplete
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedLangs, setSelectedLangs] = useState<{ [key: string]: boolean }>({
    en: true,
    bn: true,
    ar: true,
    num: true,
  });

  if (!isOpen) return null;

  const handleStartOCR = async () => {
    setIsRunning(true);
    setProgress(20);

    const timer1 = setTimeout(() => setProgress(55), 300);
    const timer2 = setTimeout(() => setProgress(85), 650);

    try {
      const activeLangs = (Object.keys(selectedLangs) as ('en' | 'bn' | 'ar' | 'num')[]).filter(
        l => selectedLangs[l]
      );
      const items = await runOCROnPage(page, null, activeLangs);
      setProgress(100);
      setTimeout(() => {
        setIsRunning(false);
        onOCRComplete(page.pageNumber, items);
        onClose();
      }, 200);
    } catch (e) {
      setIsRunning(false);
      console.error(e);
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-md overflow-hidden flex flex-col text-xs text-[#1F2937] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0F5132] flex items-center justify-center text-white">
              <ScanText className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#0F5132]">OCR Scanned PDF Reconstruction</h2>
              <p className="text-[11px] text-[#6B7280]">
                Page {page.pageNumber} · Converts scanned bitmap to editable vectors
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#9CA3AF] hover:text-[#1F2937] rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="p-3 bg-[#F4EFEA] border border-[#D4AF37]/30 rounded-lg flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
            <div className="text-[11px] text-[#4B5563] space-y-1">
              <span className="font-semibold text-[#0F5132] block">Intelligent Scan Edit Mode</span>
              <p>
                OCR extracts character bounding boxes without flattening or destroying the original page background. When text is edited, an adaptive color patch samples the surrounding aged paper grain.
              </p>
            </div>
          </div>

          {/* Languages selection */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-[#0F5132]" />
              <span>Multi-Lingual Recognition Engines</span>
            </span>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'en', label: 'English (Latin script)', tag: 'EN' },
                { id: 'bn', label: 'Bangla (বাংলা)', tag: 'BN' },
                { id: 'ar', label: 'Arabic (العربية)', tag: 'AR' },
                { id: 'num', label: 'Tabular Numbers & Currency', tag: '123' },
              ].map(lang => (
                <label
                  key={lang.id}
                  className="flex items-center gap-2 p-2 rounded-lg border border-[#E5E7EB] bg-[#F8F9FA] hover:bg-[#F1F3F5] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedLangs[lang.id]}
                    onChange={e => setSelectedLangs(prev => ({ ...prev, [lang.id]: e.target.checked }))}
                    className="rounded accent-[#0F5132]"
                  />
                  <div>
                    <span className="font-semibold text-[#1F2937] block text-[11px]">{lang.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Progress bar if running */}
          {isRunning && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#0F5132] font-semibold">Optical character detection in progress...</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="w-full bg-[#E5E7EB] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#0F5132] h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
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
            onClick={handleStartOCR}
            disabled={isRunning}
            className="px-4 py-1.5 bg-[#0F5132] hover:bg-[#198754] text-white font-semibold rounded disabled:opacity-40 flex items-center gap-1.5 shadow-xs"
          >
            <ScanText className="w-3.5 h-3.5" />
            <span>{isRunning ? 'Processing...' : 'Run OCR Detection'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
