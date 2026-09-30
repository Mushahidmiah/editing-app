import React, { useState } from 'react';
import {
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  Sliders,
  Trash2,
  RefreshCw,
  Sparkles,
  Layers,
  Palette,
  Move,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { PDFTextItem, PDFImageItem, PDFVectorItem, PDFSignatureItem, SelectedObject } from '../types/pdf';

interface PropertySidebarProps {
  selectedObjects: SelectedObject[];
  selectedObject: SelectedObject | null;
  textItem: PDFTextItem | null;
  imageItem: PDFImageItem | null;
  vectorItem: PDFVectorItem | null;
  signatureItem: PDFSignatureItem | null;
  onUpdateText: (updated: Partial<PDFTextItem>) => void;
  onBatchUpdateText: (updates: Partial<PDFTextItem> & { fontSizeDelta?: number }) => void;
  onBatchMove: (deltaX: number, deltaY: number) => void;
  onBatchAlign: (type: 'left' | 'center' | 'right' | 'top' | 'bottom') => void;
  onUpdateImage: (updated: Partial<PDFImageItem>) => void;
  onUpdateVector: (updated: Partial<PDFVectorItem>) => void;
  onUpdateSignature: (updated: Partial<PDFSignatureItem>) => void;
  onDeleteSelected: () => void;
  onResetToOriginalText?: () => void;
  onClearSelection: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const PropertySidebar: React.FC<PropertySidebarProps> = ({
  selectedObjects,
  selectedObject,
  textItem,
  imageItem,
  vectorItem,
  signatureItem,
  onUpdateText,
  onBatchUpdateText,
  onBatchMove,
  onBatchAlign,
  onUpdateImage,
  onUpdateVector,
  onUpdateSignature,
  onDeleteSelected,
  onResetToOriginalText,
  onClearSelection,
  isOpen,
  onClose
}) => {
  const [moveDelta, setMoveDelta] = useState<number>(10);

  if (!isOpen) return null;

  const isMultiSelect = selectedObjects.length > 1;

  const standardFonts = [
    { label: 'Helvetica / Sans-Serif', value: 'Helvetica' },
    { label: 'Times-Roman / Serif', value: 'Times-Roman' },
    { label: 'Courier / Monospace', value: 'Courier' },
    { label: 'Plus Jakarta Sans', value: 'Plus Jakarta Sans' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Arial', value: 'Arial' },
  ];

  // Counts of selected types
  const textCount = selectedObjects.filter(o => o.type === 'text').length;
  const vectorCount = selectedObjects.filter(o => o.type === 'vector').length;
  const imageCount = selectedObjects.filter(o => o.type === 'image').length;
  const sigCount = selectedObjects.filter(o => o.type === 'signature').length;

  return (
    <aside className="w-72 bg-white border-l border-[#E5E7EB] flex flex-col h-full select-none z-20 shrink-0 text-xs text-[#1F2937] shadow-xs">
      {/* Header */}
      <div className="h-11 px-4 border-b border-[#E5E7EB] flex items-center justify-between font-semibold text-[#0F5132]">
        <div className="flex items-center gap-2">
          {isMultiSelect ? (
            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
          ) : (
            <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
          )}
          <span>{isMultiSelect ? `Batch Properties (${selectedObjects.length})` : 'Object Properties'}</span>
        </div>
        <button
          onClick={onClose}
          className="text-[#9CA3AF] hover:text-[#1F2937] text-base p-1"
        >
          ×
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {selectedObjects.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center text-[#9CA3AF] px-4 space-y-2">
            <Layers className="w-8 h-8 text-[#CBD5E1]" />
            <p className="font-medium text-[#4B5563]">No object selected</p>
            <p className="text-[11px] text-[#6B7280]">
              Click or drag a marquee box over objects to select multiple items simultaneously. Hold Shift to toggle selection.
            </p>
          </div>
        ) : isMultiSelect ? (
          /* MULTI-SELECTION BATCH CONTROLS */
          <div className="space-y-4">
            {/* Overview Card */}
            <div className="bg-[#E8F5E9] border border-[#198754]/30 rounded-lg p-2.5 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#0F5132]">
                <span>{selectedObjects.length} Objects Selected</span>
                <button
                  onClick={onClearSelection}
                  className="text-[10px] text-[#4B5563] hover:text-[#1F2937] underline"
                >
                  Deselect All
                </button>
              </div>
              <div className="text-[10px] text-[#4B5563] flex gap-2 flex-wrap">
                {textCount > 0 && <span>• {textCount} text{textCount > 1 ? 's' : ''}</span>}
                {vectorCount > 0 && <span>• {vectorCount} vector{vectorCount > 1 ? 's' : ''}</span>}
                {imageCount > 0 && <span>• {imageCount} image{imageCount > 1 ? 's' : ''}</span>}
                {sigCount > 0 && <span>• {sigCount} signature{sigCount > 1 ? 's' : ''}</span>}
              </div>
            </div>

            {/* Batch Movement / Nudge */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>Batch Movement & Nudge</span>
              </label>

              <div className="flex items-center justify-between bg-[#F8F9FA] p-2 rounded border border-[#E5E7EB]">
                <span className="text-[11px] text-[#6B7280]">Step Size:</span>
                <div className="flex gap-1">
                  {[1, 5, 10, 25].map(step => (
                    <button
                      key={step}
                      onClick={() => setMoveDelta(step)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        moveDelta === step ? 'bg-[#0F5132] text-white' : 'bg-white text-[#374151] border border-[#E5E7EB]'
                      }`}
                    >
                      {step}pt
                    </button>
                  ))}
                </div>
              </div>

              {/* Directional Pad */}
              <div className="flex flex-col items-center gap-1 pt-1">
                <button
                  onClick={() => onBatchMove(0, -moveDelta)}
                  title={`Move Up by ${moveDelta}pt`}
                  className="p-1.5 bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[#1F2937] rounded transition-colors"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onBatchMove(-moveDelta, 0)}
                    title={`Move Left by ${moveDelta}pt`}
                    className="p-1.5 bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[#1F2937] rounded transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-[10px] text-[#6B7280] w-12 text-center">
                    ±{moveDelta}pt
                  </span>
                  <button
                    onClick={() => onBatchMove(moveDelta, 0)}
                    title={`Move Right by ${moveDelta}pt`}
                    className="p-1.5 bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[#1F2937] rounded transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => onBatchMove(0, moveDelta)}
                  title={`Move Down by ${moveDelta}pt`}
                  className="p-1.5 bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[#1F2937] rounded transition-colors"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Batch Alignment Tools */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider">
                Align Elements
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onBatchAlign('left')}
                  className="p-1.5 bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded text-center text-[10px] font-medium"
                >
                  Align Left
                </button>
                <button
                  onClick={() => onBatchAlign('center')}
                  className="p-1.5 bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded text-center text-[10px] font-medium"
                >
                  Center X
                </button>
                <button
                  onClick={() => onBatchAlign('right')}
                  className="p-1.5 bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded text-center text-[10px] font-medium"
                >
                  Align Right
                </button>
                <button
                  onClick={() => onBatchAlign('top')}
                  className="p-1.5 bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded text-center text-[10px] font-medium"
                >
                  Align Top
                </button>
                <button
                  onClick={() => onBatchAlign('bottom')}
                  className="p-1.5 bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded text-center text-[10px] font-medium"
                >
                  Align Bottom
                </button>
              </div>
            </div>

            {/* Batch Typography (If texts are in the selection) */}
            {textCount > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#E5E7EB]">
                <label className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider flex items-center justify-between">
                  <span>Batch Typography</span>
                  <span className="text-[10px] text-[#0F5132] font-semibold">({textCount} texts)</span>
                </label>

                {/* Font Family */}
                <div>
                  <select
                    onChange={e => onBatchUpdateText({ fontName: e.target.value, detectedFontMatch: e.target.value })}
                    className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded px-2 py-1 text-xs text-[#1F2937]"
                    defaultValue=""
                  >
                    <option value="" disabled>Change Font for All...</option>
                    {standardFonts.map(f => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                {/* Font Size delta & styling */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onBatchUpdateText({ fontSizeDelta: -1 })}
                      className="px-2 py-1 bg-[#F1F3F5] hover:bg-[#E5E7EB] rounded font-mono font-bold"
                    >
                      A-
                    </button>
                    <span className="text-[10px] text-[#6B7280]">Size</span>
                    <button
                      onClick={() => onBatchUpdateText({ fontSizeDelta: 1 })}
                      className="px-2 py-1 bg-[#F1F3F5] hover:bg-[#E5E7EB] rounded font-mono font-bold"
                    >
                      A+
                    </button>
                  </div>

                  <div className="flex items-center bg-[#F8F9FA] border border-[#E5E7EB] rounded p-0.5">
                    <button
                      onClick={() => onBatchUpdateText({ fontWeight: 'bold' })}
                      className="flex-1 py-1 rounded text-center font-bold text-[#4B5563] hover:bg-white"
                      title="Make Bold"
                    >
                      <Bold className="w-3 h-3 mx-auto" />
                    </button>
                    <button
                      onClick={() => onBatchUpdateText({ fontStyle: 'italic' })}
                      className="flex-1 py-1 rounded text-center italic text-[#4B5563] hover:bg-white"
                      title="Make Italic"
                    >
                      <Italic className="w-3 h-3 mx-auto" />
                    </button>
                  </div>
                </div>

                {/* Batch Text Alignment */}
                <div className="flex items-center bg-[#F8F9FA] border border-[#E5E7EB] rounded p-0.5">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button
                      key={align}
                      onClick={() => onBatchUpdateText({ alignment: align })}
                      className="flex-1 py-1 rounded text-center text-[#4B5563] hover:bg-white"
                      title={`Align ${align}`}
                    >
                      {align === 'left' && <AlignLeft className="w-3.5 h-3.5 mx-auto" />}
                      {align === 'center' && <AlignCenter className="w-3.5 h-3.5 mx-auto" />}
                      {align === 'right' && <AlignRight className="w-3.5 h-3.5 mx-auto" />}
                    </button>
                  ))}
                </div>

                {/* Batch Color */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-[#6B7280]">Text Color</span>
                    <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded p-1">
                      <input
                        type="color"
                        defaultValue="#1F2937"
                        onChange={e => onBatchUpdateText({ color: e.target.value })}
                        className="w-5 h-5 rounded border-0 cursor-pointer"
                      />
                      <span className="font-mono text-[10px]">Change</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-[#6B7280]">Mask Patch</span>
                    <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded p-1">
                      <input
                        type="color"
                        defaultValue="#FFFFFF"
                        onChange={e => onBatchUpdateText({ backgroundColor: e.target.value })}
                        className="w-5 h-5 rounded border-0 cursor-pointer"
                      />
                      <span className="font-mono text-[10px]">Patch</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Batch Delete */}
            <div className="pt-3 border-t border-[#E5E7EB]">
              <button
                onClick={onDeleteSelected}
                className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All {selectedObjects.length} Selected Objects</span>
              </button>
            </div>
          </div>
        ) : selectedObject?.type === 'text' && textItem ? (
          /* SINGLE TEXT OBJECT CONTROLS */
          <>
            {/* Font Matching Alert */}
            <div className="bg-[#F4EFEA] border border-[#D4AF37]/40 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#0F5132] mb-1">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>AI Font Detection & Match</span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-[#4B5563]">
                <span>Original Font:</span>
                <span className="font-mono font-medium text-[#1F2937] truncate max-w-[120px]">
                  {textItem.fontName || 'Helvetica'}
                </span>
              </div>
              <div className="flex justify-between items-center text-[10px] text-[#4B5563] mt-0.5">
                <span>Matched Match:</span>
                <span className="font-semibold text-[#0F5132]">
                  {textItem.detectedFontMatch || 'Helvetica'}
                </span>
              </div>
            </div>

            {/* Geometry: X, Y, Width, Height */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider">
                Position & Dimensions
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-[#F8F9FA] border border-[#E5E7EB] rounded px-2 py-1">
                  <span className="text-[#6B7280] font-mono text-[10px] mr-1.5">X</span>
                  <input
                    type="number"
                    value={Math.round(textItem.x)}
                    onChange={e => onUpdateText({ x: parseFloat(e.target.value) || 0, isModified: true })}
                    className="w-full bg-transparent font-mono text-xs focus:outline-hidden"
                  />
                  <span className="text-[#9CA3AF] text-[10px]">pt</span>
                </div>
                <div className="flex items-center bg-[#F8F9FA] border border-[#E5E7EB] rounded px-2 py-1">
                  <span className="text-[#6B7280] font-mono text-[10px] mr-1.5">Y</span>
                  <input
                    type="number"
                    value={Math.round(textItem.y)}
                    onChange={e => onUpdateText({ y: parseFloat(e.target.value) || 0, isModified: true })}
                    className="w-full bg-transparent font-mono text-xs focus:outline-hidden"
                  />
                  <span className="text-[#9CA3AF] text-[10px]">pt</span>
                </div>
                <div className="flex items-center bg-[#F8F9FA] border border-[#E5E7EB] rounded px-2 py-1">
                  <span className="text-[#6B7280] font-mono text-[10px] mr-1.5">W</span>
                  <input
                    type="number"
                    value={Math.round(textItem.width)}
                    onChange={e => onUpdateText({ width: parseFloat(e.target.value) || 0, isModified: true })}
                    className="w-full bg-transparent font-mono text-xs focus:outline-hidden"
                  />
                  <span className="text-[#9CA3AF] text-[10px]">pt</span>
                </div>
                <div className="flex items-center bg-[#F8F9FA] border border-[#E5E7EB] rounded px-2 py-1">
                  <span className="text-[#6B7280] font-mono text-[10px] mr-1.5">H</span>
                  <input
                    type="number"
                    value={Math.round(textItem.height)}
                    onChange={e => onUpdateText({ height: parseFloat(e.target.value) || 0, isModified: true })}
                    className="w-full bg-transparent font-mono text-xs focus:outline-hidden"
                  />
                  <span className="text-[#9CA3AF] text-[10px]">pt</span>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider">
                Typography
              </label>

              {/* Font Family */}
              <div>
                <select
                  value={textItem.detectedFontMatch || 'Helvetica'}
                  onChange={e => onUpdateText({ detectedFontMatch: e.target.value, fontName: e.target.value, isModified: true })}
                  className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded px-2 py-1.5 text-xs text-[#1F2937] focus:outline-hidden"
                >
                  {standardFonts.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Font Size & Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-[#F8F9FA] border border-[#E5E7EB] rounded px-2 py-1">
                  <span className="text-[#6B7280] text-[10px] mr-1.5">Size</span>
                  <input
                    type="number"
                    step="0.5"
                    value={textItem.fontSize}
                    onChange={e => onUpdateText({ fontSize: parseFloat(e.target.value) || 12, isModified: true })}
                    className="w-full bg-transparent font-mono text-xs focus:outline-hidden"
                  />
                  <span className="text-[#9CA3AF] text-[10px]">pt</span>
                </div>

                <div className="flex items-center bg-[#F8F9FA] border border-[#E5E7EB] rounded p-0.5">
                  <button
                    onClick={() => onUpdateText({
                      fontWeight: textItem.fontWeight === 'bold' ? 'normal' : 'bold',
                      isModified: true
                    })}
                    className={`flex-1 py-1 rounded text-center font-bold ${
                      textItem.fontWeight === 'bold' ? 'bg-[#0F5132] text-white' : 'text-[#4B5563] hover:bg-white'
                    }`}
                  >
                    <Bold className="w-3 h-3 mx-auto" />
                  </button>
                  <button
                    onClick={() => onUpdateText({
                      fontStyle: textItem.fontStyle === 'italic' ? 'normal' : 'italic',
                      isModified: true
                    })}
                    className={`flex-1 py-1 rounded text-center italic ${
                      textItem.fontStyle === 'italic' ? 'bg-[#0F5132] text-white' : 'text-[#4B5563] hover:bg-white'
                    }`}
                  >
                    <Italic className="w-3 h-3 mx-auto" />
                  </button>
                </div>
              </div>

              {/* Alignment */}
              <div className="flex items-center bg-[#F8F9FA] border border-[#E5E7EB] rounded p-0.5">
                {(['left', 'center', 'right'] as const).map(align => (
                  <button
                    key={align}
                    onClick={() => onUpdateText({ alignment: align, isModified: true })}
                    className={`flex-1 py-1 rounded text-center ${
                      textItem.alignment === align ? 'bg-[#0F5132] text-white' : 'text-[#4B5563] hover:bg-white'
                    }`}
                  >
                    {align === 'left' && <AlignLeft className="w-3.5 h-3.5 mx-auto" />}
                    {align === 'center' && <AlignCenter className="w-3.5 h-3.5 mx-auto" />}
                    {align === 'right' && <AlignRight className="w-3.5 h-3.5 mx-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider">
                Colors & Masking
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#6B7280]">Text Color</span>
                  <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded p-1">
                    <input
                      type="color"
                      value={textItem.color}
                      onChange={e => onUpdateText({ color: e.target.value, isModified: true })}
                      className="w-5 h-5 rounded border-0 cursor-pointer"
                    />
                    <span className="font-mono text-[10px]">{textItem.color}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[#6B7280]">Mask Patch</span>
                  <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded p-1">
                    <input
                      type="color"
                      value={textItem.backgroundColor || '#FFFFFF'}
                      onChange={e => onUpdateText({ backgroundColor: e.target.value, isModified: true })}
                      className="w-5 h-5 rounded border-0 cursor-pointer"
                    />
                    <span className="font-mono text-[10px]">{textItem.backgroundColor || '#FFFFFF'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Spacing & Opacity */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#4B5563]">Letter Spacing:</span>
                <span className="font-mono text-[10px]">{textItem.letterSpacing}px</span>
              </div>
              <input
                type="range"
                min="-2"
                max="8"
                step="0.5"
                value={textItem.letterSpacing}
                onChange={e => onUpdateText({ letterSpacing: parseFloat(e.target.value), isModified: true })}
                className="w-full accent-[#0F5132]"
              />

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#4B5563]">Opacity:</span>
                <span className="font-mono text-[10px]">{Math.round(textItem.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={textItem.opacity}
                onChange={e => onUpdateText({ opacity: parseFloat(e.target.value), isModified: true })}
                className="w-full accent-[#0F5132]"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-[#E5E7EB] flex items-center gap-2">
              {textItem.isModified && onResetToOriginalText && (
                <button
                  onClick={onResetToOriginalText}
                  className="flex-1 py-1.5 bg-[#F1F3F5] hover:bg-[#E5E7EB] text-[#374151] rounded font-medium text-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset Text</span>
                </button>
              )}
              <button
                onClick={onDeleteSelected}
                className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded font-medium text-xs flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </>
        ) : selectedObject?.type === 'signature' && signatureItem ? (
          /* SIGNATURE PROPERTIES */
          <div className="space-y-4">
            <div className="bg-[#E8F5E9] border border-[#198754]/30 rounded-lg p-2.5">
              <span className="text-xs font-semibold text-[#0F5132]">Digital Signature Layer</span>
              <p className="text-[10px] text-[#4B5563] mt-0.5">Embedded with transparent alpha channel</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider">
                Signature Bounds
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-[#F8F9FA] border border-[#E5E7EB] rounded px-2 py-1">
                  <span className="text-[#6B7280] font-mono text-[10px] mr-1.5">W</span>
                  <input
                    type="number"
                    value={Math.round(signatureItem.width)}
                    onChange={e => onUpdateSignature({ width: parseFloat(e.target.value) || 50 })}
                    className="w-full bg-transparent font-mono text-xs focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center bg-[#F8F9FA] border border-[#E5E7EB] rounded px-2 py-1">
                  <span className="text-[#6B7280] font-mono text-[10px] mr-1.5">H</span>
                  <input
                    type="number"
                    value={Math.round(signatureItem.height)}
                    onChange={e => onUpdateSignature({ height: parseFloat(e.target.value) || 20 })}
                    className="w-full bg-transparent font-mono text-xs focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={onDeleteSelected}
              className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Signature</span>
            </button>
          </div>
        ) : selectedObject?.type === 'image' && imageItem ? (
          /* IMAGE PROPERTIES */
          <div className="space-y-4">
            <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-2.5">
              <span className="text-xs font-semibold text-[#1F2937]">Image Object</span>
              <p className="text-[10px] text-[#6B7280] mt-0.5">
                {Math.round(imageItem.width)} × {Math.round(imageItem.height)} pt
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider">
                Fit Mode
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['fit', 'fill', 'stretch', 'crop'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => onUpdateImage({ fitMode: mode })}
                    className={`py-1 rounded text-center uppercase text-[10px] font-semibold ${
                      imageItem.fitMode === mode ? 'bg-[#0F5132] text-white' : 'bg-[#F8F9FA] text-[#4B5563]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={onDeleteSelected}
              className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Image</span>
            </button>
          </div>
        ) : selectedObject?.type === 'vector' && vectorItem ? (
          /* VECTOR PROPERTIES */
          <div className="space-y-4">
            <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-2.5">
              <span className="text-xs font-semibold text-[#1F2937] capitalize">{vectorItem.type} Object</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider">
                Stroke & Fill
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-[#6B7280]">Stroke</span>
                  <div className="flex items-center gap-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded p-1">
                    <input
                      type="color"
                      value={vectorItem.strokeColor}
                      onChange={e => onUpdateVector({ strokeColor: e.target.value })}
                      className="w-5 h-5 rounded border-0 cursor-pointer"
                    />
                    <span className="font-mono text-[10px]">{vectorItem.strokeColor}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B7280]">Width</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={vectorItem.strokeWidth}
                    onChange={e => onUpdateVector({ strokeWidth: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#F8F9FA] border border-[#E5E7EB] rounded px-2 py-1 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={onDeleteSelected}
              className="w-full py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded font-medium text-xs flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Shape</span>
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
};
