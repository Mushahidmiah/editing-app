import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PDFDocumentData,
  PDFPageData,
  PDFTextItem,
  PDFImageItem,
  PDFVectorItem,
  PDFSignatureItem,
  ToolType,
  SelectedObject,
  EditHistoryEntry,
  VisualAccuracyReport,
  AICommandProposal
} from './types/pdf';
import {
  createSampleCertificatePDF,
  createSampleInvoicePDF,
  createSampleScannedPDF,
  parsePDFDocument,
  exportEditedPDF,
  checkVisualAccuracy
} from './utils/pdfEngine';
import { TopNav } from './components/TopNav';
import { ToolSidebar } from './components/ToolSidebar';
import { PropertySidebar } from './components/PropertySidebar';
import { PDFCanvas } from './components/PDFCanvas';
import { ThumbnailStrip } from './components/ThumbnailStrip';
import { SmartReplaceModal } from './components/SmartReplaceModal';
import { AIEditPanel } from './components/AIEditPanel';
import { CompareModal } from './components/CompareModal';
import { VisualAccuracyModal } from './components/VisualAccuracyModal';
import { SignatureModal } from './components/SignatureModal';
import { ImageReplaceModal } from './components/ImageReplaceModal';
import { OCRModal } from './components/OCRModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  // Document state
  const [docData, setDocData] = useState<PDFDocumentData | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.1);
  const [activeTool, setActiveTool] = useState<ToolType>('edit_text');
  const [selectedObjects, setSelectedObjects] = useState<SelectedObject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing Exact PDF Editor AI...');

  // Primary selected object for property sidebar single-view
  const selectedObject = useMemo(() => {
    return selectedObjects.length > 0 ? selectedObjects[selectedObjects.length - 1] : null;
  }, [selectedObjects]);

  // UI Panels & Layout
  const [isContinuousView, setIsContinuousView] = useState<boolean>(false);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isThumbnailOpen, setIsThumbnailOpen] = useState<boolean>(true);
  const [isPropertySidebarOpen, setIsPropertySidebarOpen] = useState<boolean>(true);

  // Modals state
  const [isSmartReplaceOpen, setIsSmartReplaceOpen] = useState<boolean>(false);
  const [isAIEditOpen, setIsAIEditOpen] = useState<boolean>(false);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);
  const [isAccuracyOpen, setIsAccuracyOpen] = useState<boolean>(false);
  const [accuracyReport, setAccuracyReport] = useState<VisualAccuracyReport | null>(null);
  const [isSignatureOpen, setIsSignatureOpen] = useState<boolean>(false);
  const [isImageReplaceOpen, setIsImageReplaceOpen] = useState<boolean>(false);
  const [isOCROpen, setIsOCROpen] = useState<boolean>(false);

  // Pending signature / image coordinates to place
  const [pendingPlacement, setPendingPlacement] = useState<{ pageIndex: number; x: number; y: number } | null>(null);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Push new state to history
  const pushHistory = useCallback((newDoc: PDFDocumentData, description: string) => {
    setHistory(prev => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      const newEntry: EditHistoryEntry = {
        id: `hist-${Date.now()}`,
        description,
        timestamp: Date.now(),
        snapshot: JSON.parse(JSON.stringify(newDoc)),
      };
      return [...upToCurrent, newEntry];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Initial document load (Default: Certificate of Achievement for immediate testability)
  useEffect(() => {
    async function loadInitial() {
      setIsLoading(true);
      setLoadingMessage('Loading Certificate sample document...');
      try {
        const certDoc = await createSampleCertificatePDF();
        setDocData(certDoc);
        setHistory([{
          id: `hist-0`,
          description: 'Document loaded',
          timestamp: Date.now(),
          snapshot: JSON.parse(JSON.stringify(certDoc)),
        }]);
        setHistoryIndex(0);
      } catch (err) {
        console.error('Failed to load initial PDF:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'v') {
        setActiveTool('select');
      } else if (e.key === 'e') {
        setActiveTool('edit_text');
      } else if (e.key === 't') {
        setActiveTool('text');
      } else if (e.key === 'r') {
        setIsSmartReplaceOpen(true);
      } else if (e.key === 's') {
        setIsSignatureOpen(true);
      } else if (e.key === 'k') {
        setIsAIEditOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevEntry = history[historyIndex - 1];
      setDocData(JSON.parse(JSON.stringify(prevEntry.snapshot)));
      setHistoryIndex(historyIndex - 1);
      setSelectedObjects([]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextEntry = history[historyIndex + 1];
      setDocData(JSON.parse(JSON.stringify(nextEntry.snapshot)));
      setHistoryIndex(historyIndex + 1);
      setSelectedObjects([]);
    }
  };

  // Open custom uploaded PDF
  const handleOpenPDF = async (file: File) => {
    setIsLoading(true);
    setLoadingMessage(`Analyzing "${file.name}" at object level...`);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = await parsePDFDocument(buffer, file.name);
      setDocData(parsed);
      setCurrentPageIndex(0);
      setSelectedObjects([]);
      setHistory([{
        id: `hist-0`,
        description: `Opened ${file.name}`,
        timestamp: Date.now(),
        snapshot: JSON.parse(JSON.stringify(parsed)),
      }]);
      setHistoryIndex(0);
    } catch (err) {
      console.error('Failed to parse uploaded PDF:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sample documents
  const handleLoadSample = async (type: 'certificate' | 'invoice' | 'scanned') => {
    setIsLoading(true);
    setLoadingMessage(`Loading ${type} template...`);
    try {
      let doc: PDFDocumentData;
      if (type === 'certificate') doc = await createSampleCertificatePDF();
      else if (type === 'invoice') doc = await createSampleInvoicePDF();
      else doc = await createSampleScannedPDF();

      setDocData(doc);
      setCurrentPageIndex(0);
      setSelectedObjects([]);
      setHistory([{
        id: `hist-0`,
        description: `Loaded ${type} template`,
        timestamp: Date.now(),
        snapshot: JSON.parse(JSON.stringify(doc)),
      }]);
      setHistoryIndex(0);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Select tool
  const handleSelectTool = (tool: ToolType) => {
    setActiveTool(tool);
    if (tool === 'replace_text') setIsSmartReplaceOpen(true);
    if (tool === 'ai_edit') setIsAIEditOpen(true);
    if (tool === 'ocr') setIsOCROpen(true);
    if (tool === 'signature') setIsSignatureOpen(true);
    if (tool === 'replace_image') setIsImageReplaceOpen(true);
  };

  // Update text item
  const handleUpdateTextItem = (pageIndex: number, textId: string, updates: Partial<PDFTextItem>) => {
    if (!docData) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    const targetPage = newDoc.pages[pageIndex];
    if (!targetPage) return;

    const item = targetPage.textItems.find(t => t.id === textId);
    if (item) {
      Object.assign(item, updates, { isModified: true });
      setDocData(newDoc);
      pushHistory(newDoc, `Edited text: "${item.text}"`);
    }
  };

  // Add vector annotation
  const handleAddVectorItem = (pageIndex: number, vector: PDFVectorItem) => {
    if (!docData) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    newDoc.pages[pageIndex].vectors.push(vector);
    setDocData(newDoc);
    pushHistory(newDoc, `Added ${vector.type}`);
  };

  // Add new text item
  const handleAddTextItem = (pageIndex: number, x: number, y: number) => {
    if (!docData) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    const newItem: PDFTextItem = {
      id: `new-text-${Date.now()}`,
      pageNumber: newDoc.pages[pageIndex].pageNumber,
      text: 'New Text',
      originalText: '',
      x: Math.round(x),
      y: Math.round(y),
      width: 80,
      height: 18,
      fontName: 'Helvetica',
      detectedFontMatch: 'Helvetica',
      fontSize: 14,
      originalFontSize: 14,
      fontWeight: 'normal',
      fontStyle: 'normal',
      color: '#0F5132',
      alignment: 'left',
      rotation: 0,
      letterSpacing: 0,
      lineSpacing: 1.2,
      opacity: 1,
      isModified: true,
      isDeleted: false,
      originalBoundingBox: { x, y, width: 80, height: 18 },
    };
    newDoc.pages[pageIndex].textItems.push(newItem);
    setDocData(newDoc);
    pushHistory(newDoc, 'Added new text object');
    setSelectedObjects([{ type: 'text', id: newItem.id, pageNumber: newItem.pageNumber }]);
  };

  // Signature placement
  const handleAddSignatureItem = (pageIndex: number, x: number, y: number) => {
    setPendingPlacement({ pageIndex, x, y });
    setIsSignatureOpen(true);
  };

  const handleSaveSignature = (dataUrl: string) => {
    if (!docData) return;
    const pageIdx = pendingPlacement?.pageIndex ?? currentPageIndex;
    const x = pendingPlacement?.x ?? 200;
    const y = pendingPlacement?.y ?? 400;

    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    const newSig: PDFSignatureItem = {
      id: `sig-${Date.now()}`,
      pageNumber: newDoc.pages[pageIdx].pageNumber,
      x,
      y,
      width: 140,
      height: 55,
      dataUrl,
      rotation: 0,
      opacity: 1,
    };

    newDoc.pages[pageIdx].signatures.push(newSig);
    setDocData(newDoc);
    pushHistory(newDoc, 'Placed digital signature');
    setSelectedObjects([{ type: 'signature', id: newSig.id, pageNumber: newSig.pageNumber }]);
    setPendingPlacement(null);
  };

  // Image placement
  const handleAddImageItem = (pageIndex: number, x: number, y: number) => {
    setPendingPlacement({ pageIndex, x, y });
    setIsImageReplaceOpen(true);
  };

  const handleConfirmReplaceImage = (newSrc: string, fitMode: 'fit' | 'fill' | 'stretch' | 'crop') => {
    if (!docData) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));

    if (selectedObject?.type === 'image') {
      const page = newDoc.pages[currentPageIndex];
      const img = page.images.find(i => i.id === selectedObject.id);
      if (img) {
        img.src = newSrc;
        img.fitMode = fitMode;
        img.isReplaced = true;
        setDocData(newDoc);
        pushHistory(newDoc, 'Replaced image object');
        return;
      }
    }

    // Otherwise place new image
    const pageIdx = pendingPlacement?.pageIndex ?? currentPageIndex;
    const x = pendingPlacement?.x ?? 150;
    const y = pendingPlacement?.y ?? 250;

    const newImg: PDFImageItem = {
      id: `img-${Date.now()}`,
      pageNumber: newDoc.pages[pageIdx].pageNumber,
      x,
      y,
      width: 160,
      height: 120,
      src: newSrc,
      originalSrc: newSrc,
      rotation: 0,
      opacity: 1,
      aspectRatio: 160 / 120,
      fitMode,
      isReplaced: false,
      isDeleted: false,
    };
    newDoc.pages[pageIdx].images.push(newImg);
    setDocData(newDoc);
    pushHistory(newDoc, 'Inserted image');
    setSelectedObjects([{ type: 'image', id: newImg.id, pageNumber: newImg.pageNumber }]);
    setPendingPlacement(null);
  };

  // OCR Completion
  const handleOCRComplete = (pageNumber: number, newItems: PDFTextItem[]) => {
    if (!docData) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    const targetPage = newDoc.pages.find(p => p.pageNumber === pageNumber);
    if (targetPage) {
      targetPage.hasOCRRun = true;
      targetPage.textItems = [...targetPage.textItems, ...newItems];
      setDocData(newDoc);
      pushHistory(newDoc, `Ran OCR on Page ${pageNumber}`);
    }
  };

  // Smart Replace execution
  const handleApplySmartReplace = (
    matches: { pageNumber: number; textId: string; newText: string; newFontSize: number }[]
  ) => {
    if (!docData || matches.length === 0) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));

    matches.forEach(m => {
      const page = newDoc.pages.find(p => p.pageNumber === m.pageNumber);
      if (page) {
        const item = page.textItems.find(t => t.id === m.textId);
        if (item) {
          item.text = m.newText;
          item.fontSize = m.newFontSize;
          item.isModified = true;
          item.isSmartReplaced = true;
        }
      }
    });

    setDocData(newDoc);
    pushHistory(newDoc, `AI Smart Replaced ${matches.length} occurrence(s)`);
  };

  // AI Edit Natural Language execution
  const handleApplyAIProposals = (proposals: AICommandProposal[]) => {
    if (!docData || proposals.length === 0) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));

    proposals.forEach(prop => {
      const page = newDoc.pages.find(p => p.pageNumber === prop.pageNumber);
      if (page && prop.targetId) {
        const item = page.textItems.find(t => t.id === prop.targetId);
        if (item) {
          item.text = prop.proposedText;
          item.isModified = true;
          item.isSmartReplaced = true;
        }
      }
    });

    setDocData(newDoc);
    pushHistory(newDoc, `Applied AI Command: "${proposals[0].command}"`);
  };

  // Visual Accuracy Check
  const handleCheckAccuracy = () => {
    if (!docData) return;
    const report = checkVisualAccuracy(docData);
    setAccuracyReport(report);
    setIsAccuracyOpen(true);
  };

  // PDF Export
  const handleExport = async (format: 'exact_vector' | 'flattened' | 'project_json') => {
    if (!docData) return;
    if (format === 'project_json') {
      const jsonStr = JSON.stringify(docData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docData.filename.replace('.pdf', '')}_project.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Compiling exact vector PDF document...');
    try {
      const bytes = await exportEditedPDF(docData);
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${docData.filename.replace('.pdf', '')}_exact_edited.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Page management
  const handleAddPage = () => {
    if (!docData) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    const newPageNum = newDoc.pages.length + 1;
    newDoc.pages.push({
      pageNumber: newPageNum,
      width: 595,
      height: 842,
      rotation: 0,
      isScanned: false,
      hasOCRRun: false,
      textItems: [],
      images: [],
      vectors: [],
      signatures: [],
      tables: [],
    });
    newDoc.totalPages = newDoc.pages.length;
    setDocData(newDoc);
    pushHistory(newDoc, `Added Page ${newPageNum}`);
    setCurrentPageIndex(newPageNum - 1);
  };

  const handleDuplicatePage = (idx: number) => {
    if (!docData) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    const sourcePage = newDoc.pages[idx];
    const cloned = JSON.parse(JSON.stringify(sourcePage));
    cloned.pageNumber = newDoc.pages.length + 1;
    newDoc.pages.splice(idx + 1, 0, cloned);
    newDoc.pages.forEach((p, i) => (p.pageNumber = i + 1));
    newDoc.totalPages = newDoc.pages.length;
    setDocData(newDoc);
    pushHistory(newDoc, `Duplicated Page ${idx + 1}`);
    setCurrentPageIndex(idx + 1);
  };

  const handleDeletePage = (idx: number) => {
    if (!docData || docData.pages.length <= 1) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    newDoc.pages.splice(idx, 1);
    newDoc.pages.forEach((p, i) => (p.pageNumber = i + 1));
    newDoc.totalPages = newDoc.pages.length;
    setDocData(newDoc);
    pushHistory(newDoc, `Deleted Page ${idx + 1}`);
    setCurrentPageIndex(Math.max(0, idx - 1));
  };

  const handleRotatePage = (idx: number) => {
    if (!docData) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    newDoc.pages[idx].rotation = (newDoc.pages[idx].rotation + 90) % 360;
    setDocData(newDoc);
    pushHistory(newDoc, `Rotated Page ${idx + 1}`);
  };

  const handleMovePage = (idx: number, direction: 'up' | 'down') => {
    if (!docData) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= docData.pages.length) return;

    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    const [moved] = newDoc.pages.splice(idx, 1);
    newDoc.pages.splice(targetIdx, 0, moved);
    newDoc.pages.forEach((p, i) => (p.pageNumber = i + 1));
    setDocData(newDoc);
    pushHistory(newDoc, `Reordered Page ${idx + 1}`);
    setCurrentPageIndex(targetIdx);
  };

  // Selected object retrieval
  const activeSelectedText = useMemo(() => {
    if (selectedObject?.type !== 'text' || !docData) return null;
    for (const p of docData.pages) {
      const found = p.textItems.find(t => t.id === selectedObject.id);
      if (found) return found;
    }
    return null;
  }, [selectedObject, docData]);

  const activeSelectedImage = useMemo(() => {
    if (selectedObject?.type !== 'image' || !docData) return null;
    for (const p of docData.pages) {
      const found = p.images.find(i => i.id === selectedObject.id);
      if (found) return found;
    }
    return null;
  }, [selectedObject, docData]);

  const activeSelectedVector = useMemo(() => {
    if (selectedObject?.type !== 'vector' || !docData) return null;
    for (const p of docData.pages) {
      const found = p.vectors.find(v => v.id === selectedObject.id);
      if (found) return found;
    }
    return null;
  }, [selectedObject, docData]);

  const activeSelectedSignature = useMemo(() => {
    if (selectedObject?.type !== 'signature' || !docData) return null;
    for (const p of docData.pages) {
      const found = p.signatures.find(s => s.id === selectedObject.id);
      if (found) return found;
    }
    return null;
  }, [selectedObject, docData]);

  // Batch movement of all selected objects
  const handleBatchMoveSelected = (pageIndex: number, deltaX: number, deltaY: number) => {
    if (!docData || selectedObjects.length === 0) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    const page = newDoc.pages[pageIndex];
    if (!page) return;

    selectedObjects.forEach(sel => {
      if (sel.pageNumber !== page.pageNumber) return;
      if (sel.type === 'text') {
        const item = page.textItems.find(t => t.id === sel.id);
        if (item) {
          item.x = Math.round((item.x + deltaX) * 10) / 10;
          item.y = Math.round((item.y + deltaY) * 10) / 10;
          item.isModified = true;
        }
      } else if (sel.type === 'vector') {
        const vec = page.vectors.find(v => v.id === sel.id);
        if (vec) {
          vec.x = Math.round((vec.x + deltaX) * 10) / 10;
          vec.y = Math.round((vec.y + deltaY) * 10) / 10;
          if (vec.points) {
            vec.points = vec.points.map(p => ({
              x: Math.round((p.x + deltaX) * 10) / 10,
              y: Math.round((p.y + deltaY) * 10) / 10,
            }));
          }
        }
      } else if (sel.type === 'image') {
        const img = page.images.find(i => i.id === sel.id);
        if (img) {
          img.x = Math.round((img.x + deltaX) * 10) / 10;
          img.y = Math.round((img.y + deltaY) * 10) / 10;
          img.isReplaced = true;
        }
      } else if (sel.type === 'signature') {
        const sig = page.signatures.find(s => s.id === sel.id);
        if (sig) {
          sig.x = Math.round((sig.x + deltaX) * 10) / 10;
          sig.y = Math.round((sig.y + deltaY) * 10) / 10;
        }
      }
    });

    setDocData(newDoc);
    pushHistory(newDoc, `Moved ${selectedObjects.length} selected objects`);
  };

  // Batch alignment of selected objects on the current page
  const handleBatchAlign = (alignmentType: 'left' | 'center' | 'right' | 'top' | 'bottom') => {
    if (!docData || selectedObjects.length <= 1) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    const page = newDoc.pages[currentPageIndex];
    if (!page) return;

    // Gather bounding boxes of all selected items on this page
    const itemsOnPage: { sel: SelectedObject; x: number; y: number; width: number; height: number; ref: any }[] = [];

    selectedObjects.forEach(sel => {
      if (sel.pageNumber !== page.pageNumber) return;
      if (sel.type === 'text') {
        const t = page.textItems.find(item => item.id === sel.id);
        if (t && !t.isDeleted) itemsOnPage.push({ sel, x: t.x, y: t.y, width: t.width, height: t.height, ref: t });
      } else if (sel.type === 'vector') {
        const v = page.vectors.find(item => item.id === sel.id);
        if (v && !v.isDeleted) itemsOnPage.push({ sel, x: v.x, y: v.y, width: v.width, height: v.height, ref: v });
      } else if (sel.type === 'image') {
        const i = page.images.find(item => item.id === sel.id);
        if (i && !i.isDeleted) itemsOnPage.push({ sel, x: i.x, y: i.y, width: i.width, height: i.height, ref: i });
      } else if (sel.type === 'signature') {
        const s = page.signatures.find(item => item.id === sel.id);
        if (s) itemsOnPage.push({ sel, x: s.x, y: s.y, width: s.width, height: s.height, ref: s });
      }
    });

    if (itemsOnPage.length <= 1) return;

    const minX = Math.min(...itemsOnPage.map(i => i.x));
    const maxX = Math.max(...itemsOnPage.map(i => i.x + i.width));
    const minY = Math.min(...itemsOnPage.map(i => i.y));
    const maxY = Math.max(...itemsOnPage.map(i => i.y + i.height));
    const centerX = (minX + maxX) / 2;

    itemsOnPage.forEach(item => {
      if (alignmentType === 'left') {
        item.ref.x = minX;
      } else if (alignmentType === 'center') {
        item.ref.x = Math.round(centerX - item.width / 2);
      } else if (alignmentType === 'right') {
        item.ref.x = Math.round(maxX - item.width);
      } else if (alignmentType === 'top') {
        item.ref.y = minY;
      } else if (alignmentType === 'bottom') {
        item.ref.y = Math.round(maxY - item.height);
      }
      if (item.sel.type === 'text') item.ref.isModified = true;
    });

    setDocData(newDoc);
    pushHistory(newDoc, `Aligned ${itemsOnPage.length} objects to ${alignmentType}`);
  };

  // Batch update text properties for all selected text items
  const handleBatchUpdateText = (updates: Partial<PDFTextItem> & { fontSizeDelta?: number }) => {
    if (!docData || selectedObjects.length === 0) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    let modifiedCount = 0;

    newDoc.pages.forEach(p => {
      p.textItems.forEach(t => {
        const isSel = selectedObjects.some(s => s.type === 'text' && s.id === t.id);
        if (isSel) {
          if (updates.fontSizeDelta) {
            t.fontSize = Math.max(6, Math.round((t.fontSize + updates.fontSizeDelta) * 10) / 10);
          }
          if (updates.fontName) {
            t.fontName = updates.fontName;
            t.detectedFontMatch = updates.fontName;
          }
          if (updates.fontWeight) t.fontWeight = updates.fontWeight;
          if (updates.fontStyle) t.fontStyle = updates.fontStyle;
          if (updates.color) t.color = updates.color;
          if (updates.backgroundColor) t.backgroundColor = updates.backgroundColor;
          if (updates.alignment) t.alignment = updates.alignment;
          if (updates.opacity !== undefined) t.opacity = updates.opacity;
          t.isModified = true;
          modifiedCount++;
        }
      });
    });

    if (modifiedCount > 0) {
      setDocData(newDoc);
      pushHistory(newDoc, `Batch updated properties for ${modifiedCount} text items`);
    }
  };

  // Batch object deletion
  const handleDeleteSelected = () => {
    if (selectedObjects.length === 0 || !docData) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));

    newDoc.pages.forEach(page => {
      selectedObjects.forEach(sel => {
        if (sel.pageNumber === page.pageNumber) {
          if (sel.type === 'text') {
            const t = page.textItems.find(item => item.id === sel.id);
            if (t) t.isDeleted = true;
          } else if (sel.type === 'image') {
            const img = page.images.find(item => item.id === sel.id);
            if (img) img.isDeleted = true;
          } else if (sel.type === 'vector') {
            const v = page.vectors.find(item => item.id === sel.id);
            if (v) v.isDeleted = true;
          } else if (sel.type === 'signature') {
            page.signatures = page.signatures.filter(s => s.id !== sel.id);
          }
        }
      });
    });

    const deletedCount = selectedObjects.length;
    setDocData(newDoc);
    pushHistory(newDoc, `Removed ${deletedCount} object(s)`);
    setSelectedObjects([]);
  };

  // Reset text back to original
  const handleResetToOriginal = () => {
    if (!selectedObject || selectedObject.type !== 'text' || !docData) return;
    const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
    const page = newDoc.pages[currentPageIndex];
    const t = page.textItems.find(item => item.id === selectedObject.id);
    if (t) {
      t.text = t.originalText;
      t.fontSize = t.originalFontSize;
      t.isModified = false;
      t.isSmartReplaced = false;
      t.isDeleted = false;
      setDocData(newDoc);
      pushHistory(newDoc, `Reset text to original`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F8F9FA] text-[#1F2937]">
      {/* Top Navigation */}
      <TopNav
        filename={docData?.filename || 'Untitled.pdf'}
        zoom={zoom}
        onZoomChange={setZoom}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenPDF={handleOpenPDF}
        onLoadSample={handleLoadSample}
        onSave={() => handleExport('project_json')}
        onSaveAs={() => handleExport('project_json')}
        onExport={handleExport}
        onToggleCompare={() => setIsCompareOpen(true)}
        onCheckVisualAccuracy={handleCheckAccuracy}
        onToggleFullScreen={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullScreen(true);
          } else {
            document.exitFullscreen();
            setIsFullScreen(false);
          }
        }}
        isFullScreen={isFullScreen}
        editMode={docData?.recommendedMode || 'exact_object'}
      />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Leftmost Tool Sidebar */}
        <ToolSidebar
          activeTool={activeTool}
          onSelectTool={handleSelectTool}
          isScannedDoc={docData?.pages[currentPageIndex]?.isScanned || false}
        />

        {/* Page Thumbnails Drawer */}
        {docData && (
          <ThumbnailStrip
            pages={docData.pages}
            currentPageIndex={currentPageIndex}
            onSelectPage={setCurrentPageIndex}
            onAddPage={handleAddPage}
            onDuplicatePage={handleDuplicatePage}
            onDeletePage={handleDeletePage}
            onRotatePage={handleRotatePage}
            onMovePage={handleMovePage}
            isOpen={isThumbnailOpen}
            onToggleOpen={() => setIsThumbnailOpen(!isThumbnailOpen)}
          />
        )}

        {/* Center Canvas Area */}
        {docData ? (
          <PDFCanvas
            pages={docData.pages}
            currentPageIndex={currentPageIndex}
            onPageChange={setCurrentPageIndex}
            zoom={zoom}
            activeTool={activeTool}
            selectedObjects={selectedObjects}
            onSelectObjects={objs => {
              setSelectedObjects(objs);
              if (objs.length > 0 && !isPropertySidebarOpen) setIsPropertySidebarOpen(true);
            }}
            onUpdateTextItem={handleUpdateTextItem}
            onBatchMoveSelected={handleBatchMoveSelected}
            onBatchDeleteSelected={handleDeleteSelected}
            onAddVectorItem={handleAddVectorItem}
            onAddTextItem={handleAddTextItem}
            onAddSignatureItem={handleAddSignatureItem}
            onAddImageItem={handleAddImageItem}
            onOpenSmartReplace={() => setIsSmartReplaceOpen(true)}
            onOpenOCR={() => setIsOCROpen(true)}
            originalBytes={docData.originalBytes}
            isContinuousView={isContinuousView}
            onToggleContinuousView={() => setIsContinuousView(!isContinuousView)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-[#EBECEF]">
            <Loader2 className="w-8 h-8 text-[#0F5132] animate-spin" />
          </div>
        )}

        {/* Right Object Properties Sidebar */}
        <PropertySidebar
          selectedObjects={selectedObjects}
          selectedObject={selectedObject}
          textItem={activeSelectedText}
          imageItem={activeSelectedImage}
          vectorItem={activeSelectedVector}
          signatureItem={activeSelectedSignature}
          onUpdateText={updates => {
            if (activeSelectedText) {
              handleUpdateTextItem(currentPageIndex, activeSelectedText.id, updates);
            }
          }}
          onBatchUpdateText={handleBatchUpdateText}
          onBatchMove={(dx, dy) => handleBatchMoveSelected(currentPageIndex, dx, dy)}
          onBatchAlign={handleBatchAlign}
          onUpdateImage={updates => {
            if (activeSelectedImage && docData) {
              const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
              const img = newDoc.pages[currentPageIndex].images.find(i => i.id === activeSelectedImage.id);
              if (img) {
                Object.assign(img, updates);
                setDocData(newDoc);
              }
            }
          }}
          onUpdateVector={updates => {
            if (activeSelectedVector && docData) {
              const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
              const vec = newDoc.pages[currentPageIndex].vectors.find(v => v.id === activeSelectedVector.id);
              if (vec) {
                Object.assign(vec, updates);
                setDocData(newDoc);
              }
            }
          }}
          onUpdateSignature={updates => {
            if (activeSelectedSignature && docData) {
              const newDoc: PDFDocumentData = JSON.parse(JSON.stringify(docData));
              const sig = newDoc.pages[currentPageIndex].signatures.find(s => s.id === activeSelectedSignature.id);
              if (sig) {
                Object.assign(sig, updates);
                setDocData(newDoc);
              }
            }
          }}
          onDeleteSelected={handleDeleteSelected}
          onResetToOriginalText={handleResetToOriginal}
          onClearSelection={() => setSelectedObjects([])}
          isOpen={isPropertySidebarOpen}
          onClose={() => setIsPropertySidebarOpen(false)}
        />
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-2xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 flex items-center gap-3.5 border border-[#E5E7EB]">
            <Loader2 className="w-6 h-6 text-[#0F5132] animate-spin" />
            <div>
              <p className="font-semibold text-xs text-[#0F5132]">Exact PDF Engine</p>
              <p className="text-[11px] text-[#6B7280]">{loadingMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Feature Modals */}
      {docData && (
        <>
          <SmartReplaceModal
            isOpen={isSmartReplaceOpen}
            onClose={() => setIsSmartReplaceOpen(false)}
            docData={docData}
            onApplyReplace={handleApplySmartReplace}
          />

          <AIEditPanel
            isOpen={isAIEditOpen}
            onClose={() => setIsAIEditOpen(false)}
            docData={docData}
            onApplyProposals={handleApplyAIProposals}
            onUndoLastAI={handleUndo}
            canUndo={historyIndex > 0}
          />

          <CompareModal
            isOpen={isCompareOpen}
            onClose={() => setIsCompareOpen(false)}
            docData={docData}
            currentPageIndex={currentPageIndex}
          />

          <VisualAccuracyModal
            isOpen={isAccuracyOpen}
            onClose={() => setIsAccuracyOpen(false)}
            report={accuracyReport}
          />

          <SignatureModal
            isOpen={isSignatureOpen}
            onClose={() => setIsSignatureOpen(false)}
            onSaveSignature={handleSaveSignature}
          />

          <ImageReplaceModal
            isOpen={isImageReplaceOpen}
            onClose={() => setIsImageReplaceOpen(false)}
            targetImage={activeSelectedImage}
            onConfirmReplace={handleConfirmReplaceImage}
          />

          <OCRModal
            isOpen={isOCROpen}
            onClose={() => setIsOCROpen(false)}
            page={docData.pages[currentPageIndex]}
            onOCRComplete={handleOCRComplete}
          />
        </>
      )}
    </div>
  );
}
