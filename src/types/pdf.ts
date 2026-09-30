/**
 * Exact PDF Editor AI - Type Definitions
 */

export type ToolType =
  | 'select'
  | 'text'
  | 'edit_text'
  | 'add_text'
  | 'replace_text'
  | 'image'
  | 'replace_image'
  | 'signature'
  | 'draw'
  | 'highlight'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'eraser'
  | 'whiteout'
  | 'ocr'
  | 'ai_edit';

export type EditMode = 'exact_object' | 'smart_ocr' | 'visual_overlay';

export interface PDFTextItem {
  id: string;
  pageNumber: number;
  text: string;
  originalText: string;
  x: number; // PDF points from left
  y: number; // PDF points from top (normalized)
  width: number;
  height: number;
  fontName: string;
  detectedFontMatch?: string;
  fontSize: number;
  originalFontSize: number;
  fontWeight: 'normal' | 'bold' | '600' | '700' | string;
  fontStyle: 'normal' | 'italic' | string;
  color: string; // hex or rgb
  backgroundColor?: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
  rotation: number;
  letterSpacing: number; // px
  lineSpacing: number; // ratio
  opacity: number;
  isModified: boolean;
  isDeleted: boolean;
  isOCR?: boolean;
  isSmartReplaced?: boolean;
  originalBoundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PDFImageItem {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string; // data URL or base64
  originalSrc: string;
  rotation: number;
  opacity: number;
  aspectRatio: number;
  fitMode: 'fit' | 'fill' | 'stretch' | 'crop';
  isReplaced: boolean;
  isDeleted: boolean;
}

export interface PDFVectorItem {
  id: string;
  pageNumber: number;
  type: 'rectangle' | 'circle' | 'line' | 'highlight' | 'whiteout' | 'draw';
  x: number;
  y: number;
  width: number;
  height: number;
  points?: { x: number; y: number }[]; // for freehand draw / line
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  isDeleted?: boolean;
}

export interface PDFSignatureItem {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
  rotation: number;
  opacity: number;
}

export interface PDFTableItem {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rows: number;
  cols: number;
  cells: {
    row: number;
    col: number;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
  }[];
}

export interface PDFPageData {
  pageNumber: number;
  width: number; // in PDF points (e.g. 595.28 for A4)
  height: number; // in PDF points (e.g. 841.89 for A4)
  rotation: number; // 0, 90, 180, 270
  isScanned: boolean;
  hasOCRRun: boolean;
  textItems: PDFTextItem[];
  images: PDFImageItem[];
  vectors: PDFVectorItem[];
  signatures: PDFSignatureItem[];
  tables: PDFTableItem[];
  renderedCanvasDataUrl?: string;
  originalCanvasDataUrl?: string;
}

export interface PDFDocumentData {
  filename: string;
  fileSize: number;
  originalBytes?: Uint8Array;
  totalPages: number;
  pages: PDFPageData[];
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creator?: string;
    producer?: string;
    creationDate?: string;
    modificationDate?: string;
  };
  recommendedMode: EditMode;
}

export interface SelectedObject {
  type: 'text' | 'image' | 'vector' | 'signature';
  id: string;
  pageNumber: number;
}

export interface BatchTransform {
  deltaX?: number;
  deltaY?: number;
  color?: string;
  backgroundColor?: string;
  fontName?: string;
  fontSize?: number;
  fontSizeDelta?: number;
  fontWeight?: string;
  fontStyle?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  opacity?: number;
}

export interface EditHistoryEntry {
  id: string;
  description: string;
  timestamp: number;
  snapshot: PDFDocumentData;
}

export interface VisualAccuracyReport {
  pageReports: {
    pageNumber: number;
    textChanges: number;
    layoutChanges: number;
    imageChanges: number;
    vectorChanges: number;
    details: string[];
    fidelityPercentage: number;
  }[];
  totalModifications: number;
  overallFidelityScore: number;
  verifiedTimestamp: string;
}

export interface AICommandProposal {
  id: string;
  command: string;
  actionType: 'replace_text' | 'change_date' | 'change_number' | 'replace_all' | 'custom';
  pageNumber: number;
  targetId?: string;
  originalText: string;
  proposedText: string;
  explanation: string;
  isApplied: boolean;
}
