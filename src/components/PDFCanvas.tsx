import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  PDFPageData,
  PDFTextItem,
  PDFImageItem,
  PDFVectorItem,
  PDFSignatureItem,
  SelectedObject,
  ToolType
} from '../types/pdf';
import { renderPageToCanvas } from '../utils/pdfEngine';
import { sampleBackgroundColor } from '../utils/ocrEngine';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  X,
  Layers,
  Move,
  Trash2
} from 'lucide-react';

interface PDFCanvasProps {
  pages: PDFPageData[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  zoom: number;
  activeTool: ToolType;
  selectedObjects: SelectedObject[];
  onSelectObjects: (objs: SelectedObject[]) => void;
  onUpdateTextItem: (pageIndex: number, textId: string, updates: Partial<PDFTextItem>) => void;
  onBatchMoveSelected: (pageIndex: number, deltaX: number, deltaY: number) => void;
  onBatchDeleteSelected?: () => void;
  onAddVectorItem: (pageIndex: number, vector: PDFVectorItem) => void;
  onAddTextItem: (pageIndex: number, x: number, y: number) => void;
  onAddSignatureItem: (pageIndex: number, x: number, y: number) => void;
  onAddImageItem: (pageIndex: number, x: number, y: number) => void;
  onOpenSmartReplace: () => void;
  onOpenOCR: () => void;
  originalBytes?: Uint8Array;
  isContinuousView: boolean;
  onToggleContinuousView: () => void;
}

export const PDFCanvas: React.FC<PDFCanvasProps> = ({
  pages,
  currentPageIndex,
  onPageChange,
  zoom,
  activeTool,
  selectedObjects,
  onSelectObjects,
  onUpdateTextItem,
  onBatchMoveSelected,
  onBatchDeleteSelected,
  onAddVectorItem,
  onAddTextItem,
  onAddSignatureItem,
  onAddImageItem,
  onOpenSmartReplace,
  onOpenOCR,
  originalBytes,
  isContinuousView,
  onToggleContinuousView
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // State for in-place text editing
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [editingTextVal, setEditingTextVal] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // State for interactive vector drawing (line, rectangle, circle, highlight, draw)
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [tempRect, setTempRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Marquee Selection Box state
  const [isMarquee, setIsMarquee] = useState(false);
  const [marqueeStart, setMarqueeStart] = useState<{ x: number; y: number } | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [marqueeShift, setMarqueeShift] = useState(false);

  // Batch Dragging state
  const [isBatchDragging, setIsBatchDragging] = useState(false);
  const [batchDragStart, setBatchDragStart] = useState<{ x: number; y: number } | null>(null);
  const [batchDragOffset, setBatchDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });

  // Fast lookup for whether an item is selected
  const isItemSelected = useCallback((type: SelectedObject['type'], id: string) => {
    return selectedObjects.some(o => o.type === type && o.id === id);
  }, [selectedObjects]);

  // Render PDF pages on canvas when originalBytes or zoom changes
  useEffect(() => {
    if (!originalBytes || originalBytes.byteLength === 0) return;

    pages.forEach((page, idx) => {
      const canvas = canvasRefs.current[idx];
      if (canvas) {
        renderPageToCanvas(originalBytes, page.pageNumber, canvas, zoom * 1.5);
      }
    });
  }, [originalBytes, pages.length, zoom]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingTextId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTextId]);

  const handleStartEditText = (item: PDFTextItem, pageIdx: number) => {
    onSelectObjects([{ type: 'text', id: item.id, pageNumber: item.pageNumber }]);
    setEditingTextId(item.id);
    setEditingTextVal(item.text);

    // If item doesn't have a background color yet, sample it from the rendered canvas
    if (!item.backgroundColor && canvasRefs.current[pageIdx]) {
      const ctx = canvasRefs.current[pageIdx]?.getContext('2d');
      if (ctx) {
        const sampled = sampleBackgroundColor(
          ctx,
          item.x * zoom * 1.5,
          item.y * zoom * 1.5,
          item.width * zoom * 1.5,
          item.height * zoom * 1.5
        );
        onUpdateTextItem(pageIdx, item.id, { backgroundColor: sampled });
      }
    }
  };

  const handleSaveEditText = (pageIdx: number, textId: string) => {
    if (editingTextVal !== null) {
      onUpdateTextItem(pageIdx, textId, {
        text: editingTextVal,
        isModified: true,
      });
    }
    setEditingTextId(null);
  };

  const handleCancelEditText = () => {
    setEditingTextId(null);
  };

  // Generic object click handler with Shift support
  const handleObjectClick = (
    e: React.MouseEvent,
    type: SelectedObject['type'],
    id: string,
    pageNumber: number
  ) => {
    e.stopPropagation();

    // If editing text, don't interrupt
    if (editingTextId) return;

    const clickedObj: SelectedObject = { type, id, pageNumber };

    if (e.shiftKey) {
      const alreadySelected = isItemSelected(type, id);
      if (alreadySelected) {
        onSelectObjects(selectedObjects.filter(o => !(o.type === type && o.id === id)));
      } else {
        onSelectObjects([...selectedObjects, clickedObj]);
      }
    } else {
      // If clicking an object that is already selected among multiple, keep the multi-selection
      // so the user can immediately batch drag without losing the group
      if (!isItemSelected(type, id)) {
        onSelectObjects([clickedObj]);
      }
    }
  };

  // Mousedown on an object to initiate batch dragging
  const handleObjectMouseDown = (
    e: React.MouseEvent,
    type: SelectedObject['type'],
    id: string,
    pageNumber: number
  ) => {
    if (activeTool !== 'select' && activeTool !== 'edit_text') return;
    if (editingTextId === id) return;

    // If this object is not yet selected and user did not hold shift, select it
    if (!isItemSelected(type, id) && !e.shiftKey) {
      onSelectObjects([{ type, id, pageNumber }]);
    }

    const rect = e.currentTarget.closest('[data-page-container]')?.getBoundingClientRect();
    if (!rect) return;

    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    setIsBatchDragging(true);
    setBatchDragStart({ x: clickX, y: clickY });
    setBatchDragOffset({ dx: 0, dy: 0 });
  };

  // Canvas interaction handlers
  const handlePageMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    pageIdx: number,
    page: PDFPageData
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    if (activeTool === 'add_text') {
      onAddTextItem(pageIdx, clickX, clickY);
      return;
    }

    if (activeTool === 'signature') {
      onAddSignatureItem(pageIdx, clickX, clickY);
      return;
    }

    if (activeTool === 'image') {
      onAddImageItem(pageIdx, clickX, clickY);
      return;
    }

    if (activeTool === 'replace_text') {
      onOpenSmartReplace();
      return;
    }

    if (activeTool === 'ocr') {
      onOpenOCR();
      return;
    }

    // Vector drawing tools
    if (['rectangle', 'circle', 'line', 'highlight', 'whiteout', 'draw'].includes(activeTool)) {
      setIsDrawing(true);
      setDrawStart({ x: clickX, y: clickY });
      setCurrentDrawPoints([{ x: clickX, y: clickY }]);
      return;
    }

    // Select Tool: Clicked on empty page space
    if (activeTool === 'select') {
      // Start Marquee Selection Box
      setIsMarquee(true);
      setMarqueeStart({ x: clickX, y: clickY });
      setMarqueeRect({ x: clickX, y: clickY, width: 0, height: 0 });
      setMarqueeShift(e.shiftKey);

      if (!e.shiftKey) {
        onSelectObjects([]);
        setEditingTextId(null);
      }
    }
  };

  const handlePageMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    page: PDFPageData
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) / zoom;
    const currentY = (e.clientY - rect.top) / zoom;

    // 1. Vector Drawing
    if (isDrawing && drawStart) {
      if (activeTool === 'draw') {
        setCurrentDrawPoints(prev => [...prev, { x: currentX, y: currentY }]);
      } else {
        const x = Math.min(drawStart.x, currentX);
        const y = Math.min(drawStart.y, currentY);
        const width = Math.abs(currentX - drawStart.x);
        const height = Math.abs(currentY - drawStart.y);
        setTempRect({ x, y, width, height });
      }
      return;
    }

    // 2. Marquee Selection
    if (isMarquee && marqueeStart) {
      const x = Math.min(marqueeStart.x, currentX);
      const y = Math.min(marqueeStart.y, currentY);
      const width = Math.abs(currentX - marqueeStart.x);
      const height = Math.abs(currentY - marqueeStart.y);
      setMarqueeRect({ x, y, width, height });
      return;
    }

    // 3. Batch Dragging Selected Elements
    if (isBatchDragging && batchDragStart) {
      const dx = Math.round((currentX - batchDragStart.x) * 10) / 10;
      const dy = Math.round((currentY - batchDragStart.y) * 10) / 10;
      setBatchDragOffset({ dx, dy });
    }
  };

  const handlePageMouseUp = (
    pageIdx: number,
    page: PDFPageData
  ) => {
    // 1. Finish Drawing
    if (isDrawing && drawStart) {
      if (activeTool === 'draw' && currentDrawPoints.length > 1) {
        onAddVectorItem(pageIdx, {
          id: `draw-${Date.now()}`,
          pageNumber: page.pageNumber,
          type: 'draw',
          x: Math.min(...currentDrawPoints.map(p => p.x)),
          y: Math.min(...currentDrawPoints.map(p => p.y)),
          width: 10,
          height: 10,
          points: currentDrawPoints,
          strokeColor: '#0F5132',
          fillColor: 'transparent',
          strokeWidth: 2,
          opacity: 1,
          rotation: 0,
        });
      } else if (tempRect && tempRect.width > 5 && tempRect.height > 5) {
        const type = activeTool as 'rectangle' | 'circle' | 'line' | 'highlight' | 'whiteout';
        onAddVectorItem(pageIdx, {
          id: `vec-${Date.now()}`,
          pageNumber: page.pageNumber,
          type,
          x: tempRect.x,
          y: tempRect.y,
          width: tempRect.width,
          height: tempRect.height,
          strokeColor: type === 'whiteout' ? '#FFFFFF' : type === 'highlight' ? '#FACC15' : '#0F5132',
          fillColor: type === 'whiteout' ? '#FFFFFF' : type === 'highlight' ? '#FEF08A' : 'transparent',
          strokeWidth: type === 'whiteout' ? 0 : 2,
          opacity: type === 'highlight' ? 0.45 : 1,
          rotation: 0,
        });
      }
      setIsDrawing(false);
      setDrawStart(null);
      setCurrentDrawPoints([]);
      setTempRect(null);
      return;
    }

    // 2. Finish Marquee Selection
    if (isMarquee && marqueeRect) {
      if (marqueeRect.width > 4 || marqueeRect.height > 4) {
        // Helper to check 2D AABB intersection
        const intersects = (box: { x: number; y: number; width: number; height: number }) => {
          return (
            box.x < marqueeRect.x + marqueeRect.width &&
            box.x + box.width > marqueeRect.x &&
            box.y < marqueeRect.y + marqueeRect.height &&
            box.y + box.height > marqueeRect.y
          );
        };

        const newlySelected: SelectedObject[] = [];

        // Check text items
        page.textItems.forEach(t => {
          if (!t.isDeleted && intersects(t)) {
            newlySelected.push({ type: 'text', id: t.id, pageNumber: page.pageNumber });
          }
        });

        // Check vector items
        page.vectors.forEach(v => {
          if (!v.isDeleted && intersects(v)) {
            newlySelected.push({ type: 'vector', id: v.id, pageNumber: page.pageNumber });
          }
        });

        // Check image items
        page.images.forEach(img => {
          if (!img.isDeleted && intersects(img)) {
            newlySelected.push({ type: 'image', id: img.id, pageNumber: page.pageNumber });
          }
        });

        // Check signatures
        page.signatures.forEach(sig => {
          if (intersects(sig)) {
            newlySelected.push({ type: 'signature', id: sig.id, pageNumber: page.pageNumber });
          }
        });

        if (marqueeShift) {
          // Merge unique
          const combined = [...selectedObjects];
          newlySelected.forEach(n => {
            if (!combined.some(c => c.type === n.type && c.id === n.id)) {
              combined.push(n);
            }
          });
          onSelectObjects(combined);
        } else {
          onSelectObjects(newlySelected);
        }
      }
      setIsMarquee(false);
      setMarqueeStart(null);
      setMarqueeRect(null);
      return;
    }

    // 3. Finish Batch Dragging
    if (isBatchDragging) {
      if (Math.abs(batchDragOffset.dx) > 1 || Math.abs(batchDragOffset.dy) > 1) {
        onBatchMoveSelected(pageIdx, batchDragOffset.dx, batchDragOffset.dy);
      }
      setIsBatchDragging(false);
      setBatchDragStart(null);
      setBatchDragOffset({ dx: 0, dy: 0 });
    }
  };

  const pagesToRender = isContinuousView ? pages : [pages[currentPageIndex] || pages[0]];

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-[#EBECEF] overflow-auto flex flex-col items-center py-6 px-4 relative select-none"
    >
      {/* Floating View Mode & Page Navigator */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xs border border-[#E5E7EB] shadow-lg rounded-full px-4 py-1.5 flex items-center gap-3 z-30 text-xs font-medium text-[#1F2937]">
        <button
          onClick={() => onPageChange(Math.max(0, currentPageIndex - 1))}
          disabled={currentPageIndex === 0}
          className="p-1 hover:bg-[#F1F3F5] rounded-full disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="font-mono text-xs">
          Page {currentPageIndex + 1} of {pages.length}
        </span>

        <button
          onClick={() => onPageChange(Math.min(pages.length - 1, currentPageIndex + 1))}
          disabled={currentPageIndex >= pages.length - 1}
          className="p-1 hover:bg-[#F1F3F5] rounded-full disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="w-px h-3.5 bg-[#E5E7EB]" />

        <button
          onClick={onToggleContinuousView}
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
            isContinuousView ? 'bg-[#0F5132] text-white' : 'text-[#4B5563] hover:bg-[#F1F3F5]'
          }`}
        >
          {isContinuousView ? 'Continuous' : 'Single Page'}
        </button>
      </div>

      {/* Floating Multi-Selection Action Pill when > 1 object selected */}
      {selectedObjects.length > 1 && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 bg-[#0F5132] text-white shadow-xl rounded-full px-4 py-1.5 flex items-center gap-3 z-40 text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-150 border border-[#D4AF37]/50">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>{selectedObjects.length} objects selected</span>
          </div>

          <span className="text-white/60 text-[10px]">· Hold Shift to toggle · Drag to move</span>

          <div className="w-px h-3 bg-white/20" />

          {onBatchDeleteSelected && (
            <button
              onClick={onBatchDeleteSelected}
              className="text-red-300 hover:text-white flex items-center gap-1 text-[11px] transition-colors"
              title="Delete all selected"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          )}

          <button
            onClick={() => onSelectObjects([])}
            className="text-white/80 hover:text-white text-[11px] underline ml-1"
          >
            Clear
          </button>
        </div>
      )}

      {/* Pages Container */}
      <div className="flex flex-col gap-8 items-center">
        {pagesToRender.map((page, renderIdx) => {
          const actualPageIdx = isContinuousView ? renderIdx : currentPageIndex;
          const isCurrentActive = actualPageIdx === currentPageIndex;

          return (
            <div
              key={page.pageNumber}
              data-page-container="true"
              className={`relative bg-white shadow-xl transition-shadow ${
                isCurrentActive ? 'ring-2 ring-[#0F5132]/40' : 'opacity-95'
              }`}
              style={{
                width: page.width * zoom,
                height: page.height * zoom,
              }}
              onMouseDown={e => handlePageMouseDown(e, actualPageIdx, page)}
              onMouseMove={e => handlePageMouseMove(e, page)}
              onMouseUp={() => handlePageMouseUp(actualPageIdx, page)}
            >
              {/* Underlying Rendered PDF Page Canvas */}
              <canvas
                ref={el => {
                  canvasRefs.current[actualPageIdx] = el;
                }}
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  width: `${page.width * zoom}px`,
                  height: `${page.height * zoom}px`,
                }}
              />

              {/* Scanned Document Badge if applicable */}
              {page.isScanned && (
                <div className="absolute top-3 right-3 bg-amber-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs flex items-center gap-1 z-20 pointer-events-none">
                  <Sparkles className="w-3 h-3" />
                  <span>Scanned Document (OCR Enabled)</span>
                </div>
              )}

              {/* Whiteout / Background Mask Layer for Modified Text Items */}
              {page.textItems.map(item => {
                if (!item.isModified && !item.isSmartReplaced && !item.isDeleted) return null;
                const maskBg = item.backgroundColor || '#FFFFFF';

                return (
                  <div
                    key={`mask-${item.id}`}
                    className="absolute z-10 pointer-events-none"
                    style={{
                      left: item.originalBoundingBox.x * zoom,
                      top: item.originalBoundingBox.y * zoom,
                      width: Math.max(item.originalBoundingBox.width, item.width) * zoom,
                      height: item.originalBoundingBox.height * zoom,
                      backgroundColor: maskBg,
                    }}
                  />
                );
              })}

              {/* Interactive Vector Objects Layer */}
              {page.vectors.map(vector => {
                if (vector.isDeleted) return null;
                const isSelected = isItemSelected('vector', vector.id);
                const transformStyle =
                  isSelected && isBatchDragging
                    ? `translate(${batchDragOffset.dx * zoom}px, ${batchDragOffset.dy * zoom}px)`
                    : undefined;

                return (
                  <div
                    key={vector.id}
                    onClick={e => handleObjectClick(e, 'vector', vector.id, page.pageNumber)}
                    onMouseDown={e => handleObjectMouseDown(e, 'vector', vector.id, page.pageNumber)}
                    className={`absolute z-15 cursor-move ${
                      isSelected
                        ? 'ring-2 ring-[#0F5132] ring-offset-1 shadow-xs'
                        : 'hover:ring-1 hover:ring-[#0F5132]/60'
                    }`}
                    style={{
                      left: vector.x * zoom,
                      top: vector.y * zoom,
                      width: vector.width * zoom,
                      height: vector.height * zoom,
                      transform: transformStyle,
                    }}
                  >
                    {isSelected && (
                      <>
                        <span className="absolute -top-1 -left-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                        <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                        <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                      </>
                    )}
                    {vector.type === 'rectangle' && (
                      <div
                        className="w-full h-full"
                        style={{
                          border: `${vector.strokeWidth}px solid ${vector.strokeColor}`,
                          backgroundColor: vector.fillColor,
                          opacity: vector.opacity,
                        }}
                      />
                    )}
                    {vector.type === 'circle' && (
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          border: `${vector.strokeWidth}px solid ${vector.strokeColor}`,
                          backgroundColor: vector.fillColor,
                          opacity: vector.opacity,
                        }}
                      />
                    )}
                    {vector.type === 'highlight' && (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: vector.fillColor || '#FEF08A',
                          opacity: vector.opacity || 0.4,
                        }}
                      />
                    )}
                    {vector.type === 'whiteout' && (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: vector.fillColor || '#FFFFFF',
                        }}
                      />
                    )}
                    {vector.type === 'draw' && vector.points && (
                      <svg className="w-full h-full overflow-visible pointer-events-none">
                        <polyline
                          points={vector.points.map(p => `${(p.x - vector.x) * zoom},${(p.y - vector.y) * zoom}`).join(' ')}
                          fill="none"
                          stroke={vector.strokeColor}
                          strokeWidth={vector.strokeWidth}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                );
              })}

              {/* Interactive Signatures Layer */}
              {page.signatures.map(sig => {
                const isSelected = isItemSelected('signature', sig.id);
                const transformStyle =
                  isSelected && isBatchDragging
                    ? `translate(${batchDragOffset.dx * zoom}px, ${batchDragOffset.dy * zoom}px)`
                    : undefined;

                return (
                  <div
                    key={sig.id}
                    onClick={e => handleObjectClick(e, 'signature', sig.id, page.pageNumber)}
                    onMouseDown={e => handleObjectMouseDown(e, 'signature', sig.id, page.pageNumber)}
                    className={`absolute z-18 cursor-move group ${
                      isSelected
                        ? 'ring-2 ring-[#0F5132] ring-offset-1 shadow-xs'
                        : 'hover:ring-1 hover:ring-[#198754]'
                    }`}
                    style={{
                      left: sig.x * zoom,
                      top: sig.y * zoom,
                      width: sig.width * zoom,
                      height: sig.height * zoom,
                      transform: transformStyle,
                    }}
                  >
                    {isSelected && (
                      <>
                        <span className="absolute -top-1 -left-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                        <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                        <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                      </>
                    )}
                    <img
                      src={sig.dataUrl}
                      alt="Signature"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                );
              })}

              {/* Interactive Images Layer */}
              {page.images.map(img => {
                if (img.isDeleted) return null;
                const isSelected = isItemSelected('image', img.id);
                const transformStyle =
                  isSelected && isBatchDragging
                    ? `translate(${batchDragOffset.dx * zoom}px, ${batchDragOffset.dy * zoom}px)`
                    : undefined;

                return (
                  <div
                    key={img.id}
                    onClick={e => handleObjectClick(e, 'image', img.id, page.pageNumber)}
                    onMouseDown={e => handleObjectMouseDown(e, 'image', img.id, page.pageNumber)}
                    className={`absolute z-16 cursor-move ${
                      isSelected
                        ? 'ring-2 ring-[#0F5132] ring-offset-1 shadow-xs'
                        : 'hover:ring-1 hover:ring-[#0F5132]/50'
                    }`}
                    style={{
                      left: img.x * zoom,
                      top: img.y * zoom,
                      width: img.width * zoom,
                      height: img.height * zoom,
                      transform: transformStyle,
                    }}
                  >
                    {isSelected && (
                      <>
                        <span className="absolute -top-1 -left-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                        <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                        <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                      </>
                    )}
                    <img
                      src={img.src}
                      alt="PDF Image"
                      className={`w-full h-full ${
                        img.fitMode === 'fill' ? 'object-cover' : 'object-contain'
                      }`}
                    />
                  </div>
                );
              })}

              {/* Exact Text Objects Layer */}
              {page.textItems.map(item => {
                if (item.isDeleted) return null;
                const isSelected = isItemSelected('text', item.id);
                const isEditing = editingTextId === item.id;

                const fontFam = item.detectedFontMatch || item.fontName || 'sans-serif';
                const fSize = item.fontSize * zoom;
                const transformStyle =
                  isSelected && isBatchDragging
                    ? `translate(${batchDragOffset.dx * zoom}px, ${batchDragOffset.dy * zoom}px)`
                    : undefined;

                return (
                  <div
                    key={item.id}
                    onClick={e => {
                      if (activeTool === 'edit_text' && !e.shiftKey && selectedObjects.length <= 1) {
                        handleStartEditText(item, actualPageIdx);
                      } else {
                        handleObjectClick(e, 'text', item.id, page.pageNumber);
                      }
                    }}
                    onMouseDown={e => handleObjectMouseDown(e, 'text', item.id, page.pageNumber)}
                    onDoubleClick={e => {
                      e.stopPropagation();
                      handleStartEditText(item, actualPageIdx);
                    }}
                    className={`absolute z-20 group cursor-move transition-all ${
                      isSelected
                        ? 'ring-2 ring-[#0F5132] bg-[#0F5132]/10 shadow-xs'
                        : item.isModified || item.isSmartReplaced
                        ? 'hover:ring-1 hover:ring-[#198754] bg-[#198754]/5'
                        : 'hover:bg-blue-50/40'
                    }`}
                    style={{
                      left: item.x * zoom,
                      top: item.y * zoom,
                      minWidth: Math.max(20, item.width * zoom),
                      height: Math.max(14, item.height * zoom),
                      letterSpacing: `${item.letterSpacing * zoom}px`,
                      opacity: item.opacity,
                      transform: transformStyle,
                    }}
                  >
                    {/* Corner anchors for selected text */}
                    {isSelected && !isEditing && (
                      <>
                        <span className="absolute -top-1 -left-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                        <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                        <span className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#D4AF37] border border-white rounded-2xs" />
                      </>
                    )}

                    {isEditing ? (
                      /* In-Place Exact Text Editor */
                      <div className="absolute inset-0 -top-1 -left-1 flex items-center z-50 bg-white shadow-xl rounded px-1 border border-[#0F5132]">
                        <input
                          ref={inputRef}
                          type="text"
                          value={editingTextVal}
                          onChange={e => setEditingTextVal(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEditText(actualPageIdx, item.id);
                            if (e.key === 'Escape') handleCancelEditText();
                          }}
                          className="bg-transparent focus:outline-hidden text-[#1F2937] w-full"
                          style={{
                            fontFamily: fontFam,
                            fontSize: `${fSize}px`,
                            fontWeight: item.fontWeight as any,
                            fontStyle: item.fontStyle,
                            color: item.color,
                          }}
                        />
                        <div className="flex items-center gap-1 pl-1 ml-1 border-l border-[#E5E7EB]">
                          <button
                            onClick={() => handleSaveEditText(actualPageIdx, item.id)}
                            className="p-1 text-white bg-[#0F5132] hover:bg-[#198754] rounded"
                            title="Apply (Enter)"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={handleCancelEditText}
                            className="p-1 text-[#6B7280] hover:bg-[#F1F3F5] rounded"
                            title="Cancel (Esc)"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Rendered Text Element */
                      <span
                        className="inline-block whitespace-nowrap leading-none select-none"
                        style={{
                          fontFamily: fontFam,
                          fontSize: `${fSize}px`,
                          fontWeight: item.fontWeight as any,
                          fontStyle: item.fontStyle,
                          color: item.color,
                        }}
                      >
                        {item.text}
                      </span>
                    )}

                    {/* Badge indicator on modified text */}
                    {item.isModified && !isEditing && (
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#198754]" />
                    )}
                  </div>
                );
              })}

              {/* Temporary Vector Drawing Box while dragging */}
              {isDrawing && tempRect && (
                <div
                  className="absolute border border-dashed border-[#0F5132] bg-[#0F5132]/10 pointer-events-none z-30"
                  style={{
                    left: tempRect.x * zoom,
                    top: tempRect.y * zoom,
                    width: tempRect.width * zoom,
                    height: tempRect.height * zoom,
                  }}
                />
              )}

              {/* Marquee Drag Selection Box */}
              {isMarquee && marqueeRect && (
                <div
                  className="absolute border border-[#0F5132] bg-[#0F5132]/15 pointer-events-none z-40 rounded-xs"
                  style={{
                    left: marqueeRect.x * zoom,
                    top: marqueeRect.y * zoom,
                    width: marqueeRect.width * zoom,
                    height: marqueeRect.height * zoom,
                    boxShadow: '0 0 0 1px rgba(212, 175, 55, 0.4)',
                  }}
                >
                  <span className="absolute -top-4 left-0 bg-[#0F5132] text-white text-[9px] px-1 py-0.2 rounded font-mono font-medium shadow-xs">
                    {Math.round(marqueeRect.width)} × {Math.round(marqueeRect.height)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
