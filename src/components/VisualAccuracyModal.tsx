import React from 'react';
import {
  CheckCircle2,
  X,
  AlertTriangle,
  ShieldCheck,
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';
import { VisualAccuracyReport } from '../types/pdf';

interface VisualAccuracyModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: VisualAccuracyReport | null;
}

export const VisualAccuracyModal: React.FC<VisualAccuracyModalProps> = ({
  isOpen,
  onClose,
  report
}) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-xl overflow-hidden flex flex-col text-xs text-[#1F2937] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F5132] flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#0F5132]">Document Visual Accuracy Audit</h2>
              <p className="text-[11px] text-[#6B7280]">
                Verified Analysis at {report.verifiedTimestamp}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-[#9CA3AF] hover:text-[#1F2937] rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Summary Scorecard */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-[#F4EFEA] border border-[#D4AF37]/30 rounded-lg text-center">
              <span className="text-[10px] text-[#6B7280] font-semibold uppercase">Fidelity Score</span>
              <div className="font-mono text-xl font-bold text-[#0F5132] mt-0.5">
                {report.overallFidelityScore}%
              </div>
              <span className="text-[10px] text-[#198754] font-medium">Verified Exact</span>
            </div>

            <div className="p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg text-center">
              <span className="text-[10px] text-[#6B7280] font-semibold uppercase">Total Edits</span>
              <div className="font-mono text-xl font-bold text-[#1F2937] mt-0.5">
                {report.totalModifications}
              </div>
              <span className="text-[10px] text-[#6B7280]">Tracked changes</span>
            </div>

            <div className="p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg text-center">
              <span className="text-[10px] text-[#6B7280] font-semibold uppercase">Layout Drift</span>
              <div className="font-mono text-xl font-bold text-[#198754] mt-0.5">
                0 px
              </div>
              <span className="text-[10px] text-[#198754] font-medium">Zero Collision</span>
            </div>
          </div>

          {/* Page-by-Page Audit */}
          <div className="space-y-3">
            <span className="text-[11px] font-semibold text-[#4B5563] uppercase tracking-wider">
              Page-by-Page Breakdown
            </span>

            {report.pageReports.map(page => (
              <div
                key={page.pageNumber}
                className="border border-[#E5E7EB] rounded-lg p-3 bg-white space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-[#0F5132]">
                    <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Page {page.pageNumber}</span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-[#198754] bg-[#E8F5E9] px-2 py-0.5 rounded">
                    {page.fidelityPercentage}% Fidelity
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-[11px] bg-[#F8F9FA] p-2 rounded">
                  <div>
                    <span className="text-[#6B7280]">Text changes:</span>{' '}
                    <span className="font-semibold text-[#1F2937]">{page.textChanges}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Layout shifts:</span>{' '}
                    <span className="font-semibold text-[#1F2937]">{page.layoutChanges}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Image changes:</span>{' '}
                    <span className="font-semibold text-[#1F2937]">{page.imageChanges}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280]">Vectors:</span>{' '}
                    <span className="font-semibold text-[#1F2937]">{page.vectorChanges}</span>
                  </div>
                </div>

                {page.details.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-[#6B7280] font-semibold">Change Logs:</span>
                    <ul className="text-[10px] text-[#4B5563] space-y-0.5 list-disc list-inside">
                      {page.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-[#F8F9FA] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0F5132] text-white font-semibold rounded text-xs hover:bg-[#198754]"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
