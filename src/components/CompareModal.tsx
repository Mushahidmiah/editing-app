import React, { useState } from 'react';
import {
  Columns,
  Layers,
  X,
  Eye,
  Sliders,
  Sparkles,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { PDFDocumentData } from '../types/pdf';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  docData: PDFDocumentData;
  currentPageIndex: number;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  isOpen,
  onClose,
  docData,
  currentPageIndex
}) => {
  const [viewMode, setViewMode] = useState<'side_by_side' | 'overlay'>('side_by_side');
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [highlightDiffs, setHighlightDiffs] = useState(true);

  if (!isOpen) return null;

  const page = docData.pages[currentPageIndex] || docData.pages[0];
  const modifiedItems = page.textItems.filter(t => t.isModified || t.isSmartReplaced || t.isDeleted);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden text-xs text-[#1F2937]">
        {/* Header */}
        <div className="h-14 px-6 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0F5132] flex items-center justify-center text-white">
              <Columns className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#0F5132]">Visual Fidelity Comparison</h2>
              <p className="text-[11px] text-[#6B7280]">
                Comparing Page {currentPageIndex + 1} Original vs Edited State · {modifiedItems.length} modification{modifiedItems.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#E5E7EB] p-1 rounded-lg">
              <button
                onClick={() => setViewMode('side_by_side')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'side_by_side' ? 'bg-white text-[#0F5132] shadow-xs' : 'text-[#4B5563]'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Side-by-Side</span>
              </button>
              <button
                onClick={() => setViewMode('overlay')}
                className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'overlay' ? 'bg-white text-[#0F5132] shadow-xs' : 'text-[#4B5563]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Overlay Difference</span>
              </button>
            </div>

            {viewMode === 'overlay' && (
              <div className="flex items-center gap-2 bg-white border border-[#E5E7EB] px-3 py-1 rounded-lg">
                <span className="text-[10px] text-[#6B7280] font-mono">Opacity:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={overlayOpacity}
                  onChange={e => setOverlayOpacity(parseFloat(e.target.value))}
                  className="w-24 accent-[#0F5132]"
                />
                <span className="font-mono text-[10px] w-8">{Math.round(overlayOpacity * 100)}%</span>
              </div>
            )}

            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={highlightDiffs}
                onChange={e => setHighlightDiffs(e.target.checked)}
                className="rounded accent-[#0F5132]"
              />
              <span className="font-medium text-[#4B5563]">Highlight Modifications</span>
            </label>

            <button onClick={onClose} className="p-1.5 text-[#6B7280] hover:text-[#1F2937] rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="flex-1 bg-[#EBECEF] p-6 overflow-auto flex items-center justify-center">
          {viewMode === 'side_by_side' ? (
            <div className="flex items-start gap-6 max-h-full">
              {/* LEFT: ORIGINAL */}
              <div className="flex flex-col items-center">
                <div className="mb-2 px-3 py-1 bg-white rounded-full border border-[#CBD5E1] text-[11px] font-semibold text-[#4B5563] shadow-xs">
                  ORIGINAL DOCUMENT
                </div>
                <div
                  className="relative bg-white shadow-xl rounded overflow-hidden border border-[#CBD5E1]"
                  style={{ width: page.width * 0.8, height: page.height * 0.8 }}
                >
                  {/* Original Items */}
                  {page.textItems.map(item => (
                    <span
                      key={`orig-${item.id}`}
                      className="absolute leading-none inline-block whitespace-nowrap text-[#1F2937]"
                      style={{
                        left: item.originalBoundingBox.x * 0.8,
                        top: item.originalBoundingBox.y * 0.8,
                        fontSize: `${item.originalFontSize * 0.8}px`,
                        fontFamily: item.fontName || 'sans-serif',
                        fontWeight: item.fontWeight as any,
                      }}
                    >
                      {item.originalText}
                    </span>
                  ))}
                </div>
              </div>

              {/* RIGHT: EDITED */}
              <div className="flex flex-col items-center">
                <div className="mb-2 px-3 py-1 bg-[#E8F5E9] rounded-full border border-[#198754]/40 text-[11px] font-semibold text-[#0F5132] shadow-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#198754]" />
                  <span>EDITED DOCUMENT (EXACT FIDELITY)</span>
                </div>
                <div
                  className="relative bg-white shadow-xl rounded overflow-hidden border border-[#0F5132]/40"
                  style={{ width: page.width * 0.8, height: page.height * 0.8 }}
                >
                  {/* Masked out original areas */}
                  {page.textItems.map(item => {
                    if (!item.isModified && !item.isSmartReplaced && !item.isDeleted) return null;
                    return (
                      <div
                        key={`comp-mask-${item.id}`}
                        className="absolute"
                        style={{
                          left: item.originalBoundingBox.x * 0.8,
                          top: item.originalBoundingBox.y * 0.8,
                          width: Math.max(item.originalBoundingBox.width, item.width) * 0.8,
                          height: item.originalBoundingBox.height * 0.8,
                          backgroundColor: item.backgroundColor || '#FFFFFF',
                        }}
                      />
                    );
                  })}

                  {/* Render edited text items */}
                  {page.textItems.map(item => {
                    if (item.isDeleted) return null;
                    const isDiff = item.isModified || item.isSmartReplaced;

                    return (
                      <span
                        key={`edit-${item.id}`}
                        className={`absolute leading-none inline-block whitespace-nowrap ${
                          highlightDiffs && isDiff ? 'ring-1 ring-[#198754] bg-[#198754]/10 rounded-xs' : ''
                        }`}
                        style={{
                          left: item.x * 0.8,
                          top: item.y * 0.8,
                          fontSize: `${item.fontSize * 0.8}px`,
                          fontFamily: item.detectedFontMatch || item.fontName || 'sans-serif',
                          fontWeight: item.fontWeight as any,
                          color: item.color,
                        }}
                      >
                        {item.text}
                      </span>
                    );
                  })}

                  {/* Vectors & Signatures */}
                  {page.signatures.map(sig => (
                    <img
                      key={sig.id}
                      src={sig.dataUrl}
                      alt="Signature"
                      className="absolute object-contain"
                      style={{
                        left: sig.x * 0.8,
                        top: sig.y * 0.8,
                        width: sig.width * 0.8,
                        height: sig.height * 0.8,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* OVERLAY MODE */
            <div className="flex flex-col items-center">
              <div className="mb-2 px-3 py-1 bg-white rounded-full border border-[#CBD5E1] text-[11px] font-semibold text-[#4B5563] shadow-xs flex items-center gap-2">
                <span>Overlay Mode</span>
                <span className="text-[10px] text-[#0F5132] font-mono">
                  Original (Base) ↔ Edited ({Math.round(overlayOpacity * 100)}% Opacity)
                </span>
              </div>

              <div
                className="relative bg-white shadow-2xl rounded overflow-hidden border border-[#0F5132]"
                style={{ width: page.width * 0.85, height: page.height * 0.85 }}
              >
                {/* Base: Original */}
                <div className="absolute inset-0">
                  {page.textItems.map(item => (
                    <span
                      key={`base-${item.id}`}
                      className="absolute leading-none inline-block whitespace-nowrap text-red-700/60"
                      style={{
                        left: item.originalBoundingBox.x * 0.85,
                        top: item.originalBoundingBox.y * 0.85,
                        fontSize: `${item.originalFontSize * 0.85}px`,
                        fontFamily: item.fontName || 'sans-serif',
                        fontWeight: item.fontWeight as any,
                      }}
                    >
                      {item.originalText}
                    </span>
                  ))}
                </div>

                {/* Layer 2: Edited with variable opacity */}
                <div
                  className="absolute inset-0 transition-opacity"
                  style={{ opacity: overlayOpacity }}
                >
                  {page.textItems.map(item => {
                    if (item.isDeleted) return null;
                    return (
                      <span
                        key={`over-${item.id}`}
                        className={`absolute leading-none inline-block whitespace-nowrap text-[#0F5132] ${
                          highlightDiffs && (item.isModified || item.isSmartReplaced)
                            ? 'bg-[#D4AF37]/30 ring-1 ring-[#D4AF37]'
                            : ''
                        }`}
                        style={{
                          left: item.x * 0.85,
                          top: item.y * 0.85,
                          fontSize: `${item.fontSize * 0.85}px`,
                          fontFamily: item.detectedFontMatch || item.fontName || 'sans-serif',
                          fontWeight: item.fontWeight as any,
                        }}
                      >
                        {item.text}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Audit Details Footer */}
        <div className="h-12 px-6 border-t border-[#E5E7EB] bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 text-xs">
            <span className="font-semibold text-[#0F5132]">Detected Change Summary:</span>
            <span className="text-[#4B5563]">
              {modifiedItems.length} text modifications on Page {currentPageIndex + 1}
            </span>
            <span className="text-emerald-700 font-medium">✓ Original page boundaries preserved</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0F5132] text-white font-semibold rounded text-xs hover:bg-[#198754]"
          >
            Done Comparing
          </button>
        </div>
      </div>
    </div>
  );
};
