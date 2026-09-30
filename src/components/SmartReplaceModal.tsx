import React, { useState } from 'react';
import {
  Replace,
  X,
  Sparkles,
  Check,
  AlertCircle,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { PDFDocumentData, PDFTextItem } from '../types/pdf';
import { calculateSmartFitFontSize } from '../utils/aiEditEngine';

interface SmartReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  docData: PDFDocumentData;
  onApplyReplace: (
    matches: { pageNumber: number; textId: string; newText: string; newFontSize: number }[]
  ) => void;
}

export const SmartReplaceModal: React.FC<SmartReplaceModalProps> = ({
  isOpen,
  onClose,
  docData,
  onApplyReplace
}) => {
  const [findText, setFindText] = useState('Md. Rahim');
  const [replaceText, setReplaceText] = useState('Md. Karim');
  const [matchCase, setMatchCase] = useState(false);
  const [autoFitFont, setAutoFitFont] = useState(true);

  if (!isOpen) return null;

  // Find all matches across the document
  const matches: { item: PDFTextItem; pageNumber: number; fitResult: ReturnType<typeof calculateSmartFitFontSize> }[] = [];

  if (findText.trim().length > 0) {
    docData.pages.forEach(page => {
      page.textItems.forEach(item => {
        if (item.isDeleted) return;
        const needle = matchCase ? findText : findText.toLowerCase();
        const haystack = matchCase ? item.text : item.text.toLowerCase();

        if (haystack.includes(needle)) {
          const fitResult = autoFitFont
            ? calculateSmartFitFontSize(item.text, replaceText, item.originalFontSize || item.fontSize, item.originalBoundingBox.width)
            : { fontSize: item.fontSize, width: item.width, wasScaled: false };

          matches.push({ item, pageNumber: page.pageNumber, fitResult });
        }
      });
    });
  }

  const handleReplaceAll = () => {
    if (matches.length === 0) return;
    const updates = matches.map(m => {
      let finalStr = m.item.text;
      if (matchCase) {
        finalStr = finalStr.split(findText).join(replaceText);
      } else {
        const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        finalStr = finalStr.replace(regex, replaceText);
      }
      return {
        pageNumber: m.pageNumber,
        textId: m.item.id,
        newText: finalStr,
        newFontSize: m.fitResult.fontSize,
      };
    });
    onApplyReplace(updates);
    onClose();
  };

  const handleReplaceFirst = () => {
    if (matches.length === 0) return;
    const m = matches[0];
    let finalStr = m.item.text;
    if (matchCase) {
      finalStr = finalStr.replace(findText, replaceText);
    } else {
      const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      finalStr = finalStr.replace(regex, replaceText);
    }
    onApplyReplace([{
      pageNumber: m.pageNumber,
      textId: m.item.id,
      newText: finalStr,
      newFontSize: m.fitResult.fontSize,
    }]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 text-xs text-[#1F2937]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2 text-[#0F5132]">
            <div className="w-7 h-7 rounded-lg bg-[#0F5132] flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#0F5132]">AI Smart Text Replacement</h2>
              <p className="text-[11px] text-[#6B7280]">
                Detects exact bounding boxes & auto-fits replacement text without moving surrounding elements
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#9CA3AF] hover:text-[#1F2937] rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#374151] flex items-center justify-between">
              <span>Find Original Text</span>
              <span className="font-mono text-[#0F5132] font-semibold">
                {matches.length} occurrence{matches.length === 1 ? '' : 's'} found
              </span>
            </label>
            <input
              type="text"
              value={findText}
              onChange={e => setFindText(e.target.value)}
              placeholder="e.g. Md. Rahim"
              className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-[#374151]">
              Replace With New Text
            </label>
            <input
              type="text"
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              placeholder="e.g. Md. Karim"
              className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-lg px-3 py-2 text-xs focus:outline-hidden focus:border-[#0F5132] focus:ring-1 focus:ring-[#0F5132]"
            />
          </div>

          {/* Quick presets for testing */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-[#6B7280]">Presets:</span>
            {[
              { oldT: 'Md. Rahim', newT: 'Md. Karim' },
              { oldT: '12 January 2026', newT: '30 September 2026' },
              { oldT: '12345', newT: '67890' },
              { oldT: '$25,000', newT: '$30,000' },
              { oldT: 'Dhaka', newT: 'Chittagong' },
            ].map(p => (
              <button
                key={p.oldT}
                onClick={() => {
                  setFindText(p.oldT);
                  setReplaceText(p.newT);
                }}
                className="text-[10px] bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[#374151] px-2 py-0.5 rounded transition-colors"
              >
                {p.oldT} → {p.newT}
              </button>
            ))}
          </div>

          {/* Options */}
          <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-3 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoFitFont}
                onChange={e => setAutoFitFont(e.target.checked)}
                className="rounded accent-[#0F5132]"
              />
              <span className="font-medium text-[#1F2937]">Intelligent Font Auto-Fit (Preserve Bounds)</span>
            </label>
            <p className="text-[10px] text-[#6B7280] pl-5">
              If replacement text is longer, reduces font size slightly to fit the original bounding box without displacing adjacent text.
            </p>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={e => setMatchCase(e.target.checked)}
                className="rounded accent-[#0F5132]"
              />
              <span className="text-[#374151]">Match Case Exactly</span>
            </label>
          </div>

          {/* Matches Preview */}
          {matches.length > 0 && (
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              <span className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider">
                Preview Detected Targets:
              </span>
              <div className="space-y-1">
                {matches.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-[#F4EFEA] border border-[#D4AF37]/30 rounded flex items-center justify-between text-[11px]"
                  >
                    <div className="truncate max-w-[280px]">
                      <span className="text-red-700 line-through mr-1.5">{m.item.text}</span>
                      <ChevronRight className="w-3 h-3 inline text-[#6B7280] mx-0.5" />
                      <span className="text-[#0F5132] font-semibold ml-1.5">{replaceText}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.fitResult.wasScaled && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded font-mono">
                          Auto-scaled {m.fitResult.fontSize}pt
                        </span>
                      )}
                      <span className="font-mono text-[#6B7280] text-[10px]">Page {m.pageNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-[#CBD5E1] rounded text-[#374151] hover:bg-[#E5E7EB] font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleReplaceFirst}
            disabled={matches.length === 0}
            className="px-3.5 py-1.5 bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[#0F5132] font-semibold rounded disabled:opacity-40"
          >
            Replace Once
          </button>
          <button
            onClick={handleReplaceAll}
            disabled={matches.length === 0}
            className="px-4 py-1.5 bg-[#0F5132] hover:bg-[#198754] text-white font-semibold rounded shadow-xs disabled:opacity-40 flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Replace All ({matches.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
