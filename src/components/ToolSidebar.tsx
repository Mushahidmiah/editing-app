import React from 'react';
import {
  MousePointer,
  Type,
  FileEdit,
  PlusSquare,
  Replace,
  Image as ImageIcon,
  ImagePlus,
  PenTool,
  Pencil,
  Highlighter,
  Square,
  Circle,
  Minus,
  Eraser,
  SquareDashedBottomCode,
  ScanText,
  Sparkles,
} from 'lucide-react';
import { ToolType } from '../types/pdf';

interface ToolSidebarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  isScannedDoc: boolean;
}

interface ToolDefinition {
  id: ToolType;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  category: 'cursor' | 'text' | 'media' | 'shape' | 'erase' | 'ai';
  highlight?: boolean;
}

export const ToolSidebar: React.FC<ToolSidebarProps> = ({
  activeTool,
  onSelectTool,
  isScannedDoc,
}) => {
  const tools: ToolDefinition[] = [
    // Cursor & Selection
    { id: 'select', label: 'Select Object', icon: MousePointer, shortcut: 'V', category: 'cursor' },

    // Text tools
    { id: 'edit_text', label: 'Edit Text (In-Place)', icon: FileEdit, shortcut: 'E', category: 'text', highlight: true },
    { id: 'text', label: 'Text Cursor', icon: Type, shortcut: 'T', category: 'text' },
    { id: 'add_text', label: 'Add New Text', icon: PlusSquare, shortcut: 'A', category: 'text' },
    { id: 'replace_text', label: 'AI Smart Replace', icon: Replace, shortcut: 'R', category: 'text', highlight: true },

    // Media & Signature
    { id: 'signature', label: 'Signature', icon: PenTool, shortcut: 'S', category: 'media', highlight: true },
    { id: 'image', label: 'Insert Image', icon: ImageIcon, shortcut: 'I', category: 'media' },
    { id: 'replace_image', label: 'Replace Image', icon: ImagePlus, category: 'media' },

    // Drawing & Annotations
    { id: 'draw', label: 'Draw Pen', icon: Pencil, shortcut: 'P', category: 'shape' },
    { id: 'highlight', label: 'Highlight Text', icon: Highlighter, shortcut: 'H', category: 'shape' },
    { id: 'whiteout', label: 'Exact Whiteout Patch', icon: SquareDashedBottomCode, category: 'erase' },
    { id: 'eraser', label: 'Eraser', icon: Eraser, shortcut: 'X', category: 'erase' },

    // Vector Shapes
    { id: 'rectangle', label: 'Rectangle', icon: Square, shortcut: 'U', category: 'shape' },
    { id: 'circle', label: 'Circle', icon: Circle, category: 'shape' },
    { id: 'line', label: 'Line', icon: Minus, shortcut: 'L', category: 'shape' },

    // Intelligent AI & OCR
    { id: 'ocr', label: 'OCR Scanned Text', icon: ScanText, shortcut: 'O', category: 'ai', highlight: isScannedDoc },
    { id: 'ai_edit', label: 'AI Edit Panel', icon: Sparkles, shortcut: 'K', category: 'ai', highlight: true },
  ];

  return (
    <aside className="w-14 bg-white border-r border-[#E5E7EB] flex flex-col items-center py-2.5 gap-1 select-none z-20 shrink-0 overflow-y-auto">
      {tools.map((t, idx) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        const showSeparator =
          idx === 0 || idx === 4 || idx === 7 || idx === 11 || idx === 14;

        return (
          <React.Fragment key={t.id}>
            {showSeparator && <div className="w-8 h-px bg-[#E5E7EB] my-1" />}
            <button
              onClick={() => onSelectTool(t.id)}
              title={`${t.label} ${t.shortcut ? `(${t.shortcut})` : ''}`}
              className={`relative group w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-[#0F5132] text-white shadow-xs'
                  : 'text-[#4B5563] hover:bg-[#F1F3F5] hover:text-[#0F5132]'
              }`}
            >
              <Icon className="w-4 h-4" />

              {/* Special indicator for AI / Core features */}
              {t.highlight && !isActive && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
              )}

              {/* Desktop Tooltip */}
              <div className="absolute left-14 ml-1 px-2.5 py-1 bg-[#1F2937] text-white text-[11px] rounded shadow-md whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50 flex items-center gap-1.5">
                <span>{t.label}</span>
                {t.shortcut && (
                  <span className="text-[10px] text-[#9CA3AF] bg-[#374151] px-1 py-0.5 rounded font-mono">
                    {t.shortcut}
                  </span>
                )}
              </div>
            </button>
          </React.Fragment>
        );
      })}
    </aside>
  );
};
