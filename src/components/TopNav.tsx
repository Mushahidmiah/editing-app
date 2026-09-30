import React, { useRef, useState } from 'react';
import {
  FileText,
  FolderOpen,
  Save,
  Download,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Columns,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  FileCode,
  Layers
} from 'lucide-react';

interface TopNavProps {
  filename: string;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenPDF: (file: File) => void;
  onLoadSample: (type: 'certificate' | 'invoice' | 'scanned') => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExport: (format: 'exact_vector' | 'flattened' | 'project_json') => void;
  onToggleCompare: () => void;
  onCheckVisualAccuracy: () => void;
  onToggleFullScreen: () => void;
  isFullScreen: boolean;
  editMode: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  filename,
  zoom,
  onZoomChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenPDF,
  onLoadSample,
  onSave,
  onSaveAs,
  onExport,
  onToggleCompare,
  onCheckVisualAccuracy,
  onToggleFullScreen,
  isFullScreen,
  editMode
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showOpenMenu, setShowOpenMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showZoomMenu, setShowZoomMenu] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onOpenPDF(e.target.files[0]);
    }
  };

  const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <header className="h-14 bg-white border-b border-[#E5E7EB] px-4 flex items-center justify-between select-none shrink-0 z-30 shadow-xs">
      {/* Zone 1: Brand & Current File */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[#0F5132]">
          <div className="w-8 h-8 rounded-lg bg-[#0F5132] flex items-center justify-center text-white shadow-xs">
            <FileText className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <span className="font-bold text-base tracking-tight text-[#0F5132]">
            Exact PDF Editor <span className="text-[#D4AF37] text-xs font-semibold px-1.5 py-0.5 rounded bg-[#F4EFEA] border border-[#D4AF37]/30">AI</span>
          </span>
        </div>

        <div className="h-5 w-px bg-[#E5E7EB] mx-1" />

        <div className="flex items-center gap-2 max-w-xs truncate text-xs text-[#4B5563]" title={filename}>
          <span className="font-medium text-[#1F2937] truncate">{filename}</span>
          <span className="text-[10px] text-[#0F5132] font-semibold bg-[#E8F5E9] px-2 py-0.5 rounded-full">
            {editMode === 'smart_ocr' ? 'OCR Mode' : 'Exact Object Mode'}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation & Document Actions */}
      <div className="flex items-center gap-1.5">
        {/* Open PDF with Sample Templates Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowOpenMenu(!showOpenMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1F2937] bg-[#F8F9FA] hover:bg-[#E5E7EB] border border-[#E5E7EB] rounded-md transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#0F5132]" />
            <span>Open PDF</span>
            <ChevronDown className="w-3 h-3 text-[#6B7280]" />
          </button>

          {showOpenMenu && (
            <div className="absolute left-0 mt-1 w-60 bg-white border border-[#E5E7EB] rounded-lg shadow-lg py-1.5 z-50 text-xs">
              <button
                onClick={() => {
                  setShowOpenMenu(false);
                  fileInputRef.current?.click();
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#F8F9FA] flex items-center gap-2 font-medium text-[#1F2937]"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#0F5132]" />
                <span>Upload PDF from Computer</span>
              </button>

              <div className="h-px bg-[#E5E7EB] my-1" />
              <div className="px-3 py-1 text-[11px] font-semibold text-[#6B7280]">
                PRELOADED SAMPLES
              </div>

              <button
                onClick={() => {
                  setShowOpenMenu(false);
                  onLoadSample('certificate');
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#F8F9FA] flex items-center gap-2 text-[#374151]"
              >
                <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                <div>
                  <div className="font-medium">Certificate (Md. Rahim)</div>
                  <div className="text-[10px] text-[#6B7280]">Exact text formatting & ID</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowOpenMenu(false);
                  onLoadSample('invoice');
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#F8F9FA] flex items-center gap-2 text-[#374151]"
              >
                <FileText className="w-3.5 h-3.5 text-[#198754]" />
                <div>
                  <div className="font-medium">Invoice & Agreement ($25,000)</div>
                  <div className="text-[10px] text-[#6B7280]">Tables, monetary sums & dates</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowOpenMenu(false);
                  onLoadSample('scanned');
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#F8F9FA] flex items-center gap-2 text-[#374151]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#0F5132]" />
                <div>
                  <div className="font-medium">Scanned Dispatch Letter</div>
                  <div className="text-[10px] text-[#6B7280]">Tests OCR & background reconstruction</div>
                </div>
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Save & Save As */}
        <button
          onClick={onSave}
          title="Save project (Ctrl+S)"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1F2937] hover:bg-[#F1F3F5] rounded-md transition-colors"
        >
          <Save className="w-3.5 h-3.5 text-[#0F5132]" />
          <span>Save</span>
        </button>

        <button
          onClick={onSaveAs}
          title="Save as new copy"
          className="hidden md:flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#4B5563] hover:bg-[#F1F3F5] rounded-md transition-colors"
        >
          <span>Save As</span>
        </button>

        <div className="h-4 w-px bg-[#E5E7EB] mx-1" />

        {/* Undo / Redo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 text-[#374151] hover:bg-[#F1F3F5] disabled:opacity-40 disabled:hover:bg-transparent rounded-md transition-colors"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 text-[#374151] hover:bg-[#F1F3F5] disabled:opacity-40 disabled:hover:bg-transparent rounded-md transition-colors"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[#E5E7EB] mx-1" />

        {/* Zoom Controls */}
        <div className="flex items-center bg-[#F8F9FA] border border-[#E5E7EB] rounded-md p-0.5">
          <button
            onClick={() => onZoomChange(Math.max(0.4, Math.round((zoom - 0.15) * 100) / 100))}
            title="Zoom Out"
            className="p-1 text-[#374151] hover:bg-white rounded transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowZoomMenu(!showZoomMenu)}
              className="px-2 py-0.5 text-xs font-mono font-medium text-[#1F2937] hover:bg-white rounded transition-colors flex items-center gap-1 min-w-[54px] justify-center"
            >
              <span>{Math.round(zoom * 100)}%</span>
              <ChevronDown className="w-2.5 h-2.5 text-[#6B7280]" />
            </button>

            {showZoomMenu && (
              <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-white border border-[#E5E7EB] rounded-md shadow-lg py-1 w-24 z-50 text-xs">
                {zoomLevels.map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => {
                      onZoomChange(lvl);
                      setShowZoomMenu(false);
                    }}
                    className={`w-full text-center py-1 hover:bg-[#F1F3F5] font-mono ${
                      Math.abs(zoom - lvl) < 0.05 ? 'font-bold text-[#0F5132] bg-[#E8F5E9]' : 'text-[#374151]'
                    }`}
                  >
                    {Math.round(lvl * 100)}%
                  </button>
                ))}
                <div className="h-px bg-[#E5E7EB] my-1" />
                <button
                  onClick={() => {
                    onZoomChange(1.0);
                    setShowZoomMenu(false);
                  }}
                  className="w-full text-center py-1 hover:bg-[#F1F3F5] text-[11px] text-[#6B7280]"
                >
                  Fit 100%
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => onZoomChange(Math.min(2.5, Math.round((zoom + 0.15) * 100) / 100))}
            title="Zoom In"
            className="p-1 text-[#374151] hover:bg-white rounded transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullScreen}
          title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          className="p-1.5 text-[#4B5563] hover:bg-[#F1F3F5] rounded-md transition-colors"
        >
          {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Zone 3: Verification & Export Actions */}
      <div className="flex items-center gap-2">
        {/* Visual Compare Mode */}
        <button
          onClick={onToggleCompare}
          title="Compare Original vs Edited PDF"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F5132] bg-[#F4EFEA] hover:bg-[#EBE2D5] border border-[#D4AF37]/50 rounded-md transition-all shadow-2xs"
        >
          <Columns className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Compare</span>
        </button>

        {/* Check Visual Accuracy */}
        <button
          onClick={onCheckVisualAccuracy}
          title="Inspect Layout Drift, Typography & Object Fidelity"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1F2937] bg-white hover:bg-[#F8F9FA] border border-[#E5E7EB] rounded-md transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[#198754]" />
          <span>Accuracy Report</span>
        </button>

        {/* Export PDF Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#0F5132] hover:bg-[#198754] rounded-md transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
            <ChevronDown className="w-3 h-3 text-white/80" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-1 w-64 bg-white border border-[#E5E7EB] rounded-lg shadow-xl py-1.5 z-50 text-xs">
              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onExport('exact_vector');
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-[#F8F9FA] flex items-start gap-2.5 text-[#1F2937]"
              >
                <FileText className="w-4 h-4 text-[#0F5132] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#0F5132]">Exact Vector PDF (Recommended)</div>
                  <div className="text-[11px] text-[#6B7280] leading-snug">
                    Preserves original vector text, font baseline, high-res images & small file size
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onExport('flattened');
                }}
                className="w-full text-left px-3 py-2.5 hover:bg-[#F8F9FA] flex items-start gap-2.5 text-[#1F2937]"
              >
                <Layers className="w-4 h-4 text-[#4B5563] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-[#374151]">Export Flattened PDF</div>
                  <div className="text-[11px] text-[#6B7280] leading-snug">
                    Bakes all annotations and masks into locked image layer
                  </div>
                </div>
              </button>

              <div className="h-px bg-[#E5E7EB] my-1" />

              <button
                onClick={() => {
                  setShowExportMenu(false);
                  onExport('project_json');
                }}
                className="w-full text-left px-3 py-2 hover:bg-[#F8F9FA] flex items-center gap-2.5 text-[#374151]"
              >
                <FileCode className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="font-medium">Save Project JSON (Editable State)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
