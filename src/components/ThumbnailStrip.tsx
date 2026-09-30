import React from 'react';
import {
  Plus,
  Copy,
  Trash2,
  RotateCw,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import { PDFPageData } from '../types/pdf';

interface ThumbnailStripProps {
  pages: PDFPageData[];
  currentPageIndex: number;
  onSelectPage: (idx: number) => void;
  onAddPage: () => void;
  onDuplicatePage: (idx: number) => void;
  onDeletePage: (idx: number) => void;
  onRotatePage: (idx: number) => void;
  onMovePage: (idx: number, direction: 'up' | 'down') => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const ThumbnailStrip: React.FC<ThumbnailStripProps> = ({
  pages,
  currentPageIndex,
  onSelectPage,
  onAddPage,
  onDuplicatePage,
  onDeletePage,
  onRotatePage,
  onMovePage,
  isOpen,
  onToggleOpen
}) => {
  return (
    <div
      className={`bg-white border-r border-[#E5E7EB] flex flex-col transition-all duration-200 select-none z-15 shrink-0 ${
        isOpen ? 'w-48' : 'w-7'
      }`}
    >
      {/* Header / Toggle Tab */}
      <div className="h-10 px-2 border-b border-[#E5E7EB] flex items-center justify-between text-xs text-[#4B5563] font-medium">
        {isOpen && (
          <div className="flex items-center gap-1.5 font-semibold text-[#0F5132] truncate">
            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Pages ({pages.length})</span>
          </div>
        )}
        <button
          onClick={onToggleOpen}
          title={isOpen ? 'Collapse Pages' : 'Expand Pages'}
          className="p-1 hover:bg-[#F1F3F5] rounded text-[#6B7280] ml-auto"
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <>
          {/* Page list */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {pages.map((page, idx) => {
              const isSelected = idx === currentPageIndex;
              const ratio = page.height / page.width;

              return (
                <div
                  key={page.pageNumber}
                  onClick={() => onSelectPage(idx)}
                  className={`group relative flex flex-col items-center cursor-pointer transition-all ${
                    isSelected ? 'scale-[1.02]' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Miniature representation */}
                  <div
                    className={`w-32 bg-white border rounded shadow-xs relative overflow-hidden transition-all ${
                      isSelected
                        ? 'border-[#0F5132] ring-2 ring-[#0F5132]/20'
                        : 'border-[#E5E7EB] hover:border-[#CBD5E1]'
                    }`}
                    style={{ height: `${Math.round(128 * Math.min(1.4, ratio))}px` }}
                  >
                    {/* Simulated page content lines */}
                    <div className="p-2 space-y-1.5 opacity-60">
                      <div className="h-1.5 bg-[#0F5132]/40 rounded w-3/4" />
                      <div className="h-1 bg-slate-300 rounded w-full" />
                      <div className="h-1 bg-slate-200 rounded w-5/6" />
                      <div className="h-1 bg-slate-200 rounded w-2/3" />
                      {page.isScanned && (
                        <div className="mt-2 text-[8px] text-amber-700 bg-amber-50 px-1 py-0.5 rounded text-center">
                          SCAN
                        </div>
                      )}
                    </div>

                    {/* Page Number Badge */}
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.2 rounded font-mono">
                      {page.pageNumber}
                    </div>
                  </div>

                  {/* Page Controls Toolbar */}
                  <div className="mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onRotatePage(idx);
                      }}
                      title="Rotate 90°"
                      className="p-1 text-[#4B5563] hover:text-[#0F5132] hover:bg-[#F1F3F5] rounded"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onDuplicatePage(idx);
                      }}
                      title="Duplicate Page"
                      className="p-1 text-[#4B5563] hover:text-[#0F5132] hover:bg-[#F1F3F5] rounded"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {idx > 0 && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onMovePage(idx, 'up');
                        }}
                        title="Move Up"
                        className="p-1 text-[#4B5563] hover:bg-[#F1F3F5] rounded"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                    )}
                    {idx < pages.length - 1 && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onMovePage(idx, 'down');
                        }}
                        title="Move Down"
                        className="p-1 text-[#4B5563] hover:bg-[#F1F3F5] rounded"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                    )}
                    {pages.length > 1 && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onDeletePage(idx);
                        }}
                        title="Delete Page"
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Page Button */}
          <div className="p-3 border-t border-[#E5E7EB]">
            <button
              onClick={onAddPage}
              className="w-full py-1.5 bg-[#F8F9FA] hover:bg-[#F1F3F5] border border-[#E5E7EB] text-[#0F5132] text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Page</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
