import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  X,
  Check,
  CheckCheck,
  Undo2,
  HelpCircle,
  ArrowRight,
  Bot
} from 'lucide-react';
import { PDFDocumentData, AICommandProposal } from '../types/pdf';
import { parseAICommand } from '../utils/aiEditEngine';

interface AIEditPanelProps {
  isOpen: boolean;
  onClose: () => void;
  docData: PDFDocumentData;
  onApplyProposals: (proposals: AICommandProposal[]) => void;
  onUndoLastAI: () => void;
  canUndo: boolean;
}

export const AIEditPanel: React.FC<AIEditPanelProps> = ({
  isOpen,
  onClose,
  docData,
  onApplyProposals,
  onUndoLastAI,
  canUndo
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [pendingProposals, setPendingProposals] = useState<AICommandProposal[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'Change the name to Md. Karim',
    'Change the date to 30 September 2026',
    'Change the amount from 25,000 to 30,000',
    'Replace the phone number with +1 555-0199',
    'Replace the address with 742 Evergreen Terrace',
    'Change all occurrences of Dhaka to Chittagong',
  ];

  const handleRunCommand = (textToRun?: string) => {
    const query = textToRun || promptInput;
    if (!query.trim()) return;

    setIsProcessing(true);
    setTimeout(() => {
      const results = parseAICommand(query, docData);
      setPendingProposals(results);
      setIsProcessing(false);
    }, 300);
  };

  const handleApplySingle = (proposal: AICommandProposal) => {
    onApplyProposals([proposal]);
    setPendingProposals(prev => prev.filter(p => p.id !== proposal.id));
  };

  const handleApplyAll = () => {
    if (pendingProposals.length === 0) return;
    onApplyProposals(pendingProposals);
    setPendingProposals([]);
    onClose();
  };

  const handleDismiss = () => {
    setPendingProposals([]);
  };

  return (
    <div className="fixed top-16 right-4 w-96 bg-white rounded-xl shadow-2xl border border-[#E5E7EB] z-40 overflow-hidden flex flex-col text-xs text-[#1F2937] animate-in slide-in-from-top-4 duration-150">
      {/* Header */}
      <div className="px-4 py-3 bg-[#0F5132] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="font-bold text-xs tracking-tight">AI Edit Assistant</h3>
            <p className="text-[10px] text-white/70">Natural Language Document Manipulation</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
        {/* Command Input */}
        <div className="relative">
          <input
            type="text"
            value={promptInput}
            onChange={e => setPromptInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRunCommand();
            }}
            placeholder='e.g. "Change the name to Md. Karim"'
            className="w-full bg-[#F8F9FA] border border-[#CBD5E1] rounded-lg pl-3 pr-9 py-2 text-xs focus:outline-hidden focus:border-[#0F5132]"
          />
          <button
            onClick={() => handleRunCommand()}
            disabled={!promptInput.trim() || isProcessing}
            className="absolute right-1.5 top-1.5 p-1 bg-[#0F5132] text-white rounded hover:bg-[#198754] disabled:opacity-40 transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>

        {/* Quick Example Prompts */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">
            Quick Command Actions
          </span>
          <div className="flex flex-col gap-1">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setPromptInput(q);
                  handleRunCommand(q);
                }}
                className="text-left px-2.5 py-1.5 rounded bg-[#F8F9FA] hover:bg-[#F1F3F5] text-[#374151] hover:text-[#0F5132] transition-colors border border-[#E5E7EB] flex items-center justify-between group"
              >
                <span className="truncate">{q}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#0F5132] shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Pending Proposals / Previews */}
        {pendingProposals.length > 0 ? (
          <div className="pt-2 border-t border-[#E5E7EB] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0F5132] text-[11px] flex items-center gap-1">
                <Bot className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Proposed Edits ({pendingProposals.length})</span>
              </span>
              <button
                onClick={handleDismiss}
                className="text-[10px] text-[#6B7280] hover:text-[#1F2937]"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2">
              {pendingProposals.map(prop => (
                <div
                  key={prop.id}
                  className="p-2.5 bg-[#F4EFEA] border border-[#D4AF37]/40 rounded-lg space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px] text-[#4B5563]">
                    <span className="font-semibold text-[#0F5132]">Page {prop.pageNumber}</span>
                    <span className="italic truncate max-w-[180px]">{prop.explanation}</span>
                  </div>

                  <div className="bg-white p-2 rounded border border-[#E5E7EB] space-y-1">
                    <div className="flex items-center gap-1.5 text-red-700">
                      <span className="text-[10px] uppercase font-bold text-red-500">Old:</span>
                      <span className="line-through">{prop.originalText}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#0F5132]">
                      <span className="text-[10px] uppercase font-bold text-[#198754]">New:</span>
                      <span className="font-semibold">{prop.proposedText}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => handleApplySingle(prop)}
                      className="px-2 py-0.5 bg-[#0F5132] text-white rounded text-[10px] font-semibold hover:bg-[#198754] flex items-center gap-1"
                    >
                      <Check className="w-2.5 h-2.5" />
                      <span>Apply</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isProcessing ? (
          <div className="py-6 text-center text-[#6B7280]">
            <Sparkles className="w-5 h-5 mx-auto text-[#D4AF37] animate-spin mb-1" />
            <p>Analyzing document structure...</p>
          </div>
        ) : null}
      </div>

      {/* Footer Controls */}
      <div className="p-3 bg-[#F8F9FA] border-t border-[#E5E7EB] flex items-center justify-between">
        <button
          onClick={onUndoLastAI}
          disabled={!canUndo}
          className="text-[#4B5563] hover:text-[#1F2937] text-xs flex items-center gap-1 disabled:opacity-40"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Undo Last</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onClose}
            className="px-2.5 py-1 border border-[#CBD5E1] rounded text-[#4B5563] hover:bg-[#E5E7EB]"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyAll}
            disabled={pendingProposals.length === 0}
            className="px-3 py-1 bg-[#0F5132] hover:bg-[#198754] text-white font-semibold rounded disabled:opacity-40 flex items-center gap-1"
          >
            <CheckCheck className="w-3 h-3" />
            <span>Apply All</span>
          </button>
        </div>
      </div>
    </div>
  );
};
