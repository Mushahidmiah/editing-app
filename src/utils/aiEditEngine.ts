/**
 * AI Edit Engine - Smart Natural Language Document Parsing & Precision Replacement
 */
import { PDFDocumentData, PDFTextItem, AICommandProposal } from '../types/pdf';

/**
 * Smart Replace Auto-Fit:
 * If new text is longer than original, calculate fitted font size so it doesn't collide
 * with neighboring layout or wrap unpredictably.
 */
export function calculateSmartFitFontSize(
  originalText: string,
  newText: string,
  originalFontSize: number,
  originalWidth: number
): { fontSize: number; width: number; wasScaled: boolean } {
  const origLen = Math.max(1, originalText.length);
  const newLen = Math.max(1, newText.length);

  if (newLen <= origLen) {
    // Shorter or equal: keep original font size
    const estimatedWidth = (originalWidth / origLen) * newLen;
    return { fontSize: originalFontSize, width: Math.max(originalWidth * 0.7, estimatedWidth), wasScaled: false };
  }

  // Longer: calculate ratio
  const ratio = origLen / newLen;
  // Intelligently scale down font size by max 25% to preserve bounds without becoming illegible
  const scaleFactor = Math.max(0.78, Math.min(1.0, ratio * 1.05));
  const newFontSize = Math.round(originalFontSize * scaleFactor * 10) / 10;
  const newWidth = Math.round(originalWidth * (1 / scaleFactor) * 0.95);

  return {
    fontSize: newFontSize,
    width: Math.max(originalWidth, newWidth),
    wasScaled: scaleFactor < 0.98,
  };
}

/**
 * Parse natural language user instruction and generate change proposals
 */
export function parseAICommand(
  prompt: string,
  docData: PDFDocumentData
): AICommandProposal[] {
  const trimmed = prompt.trim();
  const proposals: AICommandProposal[] = [];
  const lower = trimmed.toLowerCase();

  // Helper to gather all active text items across all pages
  const allItems: { item: PDFTextItem; pageNumber: number }[] = [];
  docData.pages.forEach(p => {
    p.textItems.forEach(t => {
      if (!t.isDeleted) allItems.push({ item: t, pageNumber: p.pageNumber });
    });
  });

  // 1. "Change name to [X]" or "Change the name to [X]"
  const nameMatch = trimmed.match(/change\s+(?:the\s+)?name\s+(?:from\s+[^to]+\s+)?to\s+([^,.]+)/i);
  if (nameMatch) {
    const newName = nameMatch[1].trim();
    // Search for existing name fields (e.g. "Md. Rahim", "Abdul Rahim", or items following "presented to:" or "Name:")
    const candidate = allItems.find(i =>
      i.item.text.includes('Rahim') ||
      i.item.text.toLowerCase().includes('name') ||
      i.item.fontSize >= 20 ||
      i.item.id.includes('text-3')
    );

    if (candidate) {
      proposals.push({
        id: `ai-prop-${Date.now()}-1`,
        command: prompt,
        actionType: 'replace_text',
        pageNumber: candidate.pageNumber,
        targetId: candidate.item.id,
        originalText: candidate.item.text,
        proposedText: candidate.item.text.includes(':')
          ? candidate.item.text.split(':')[0] + ': ' + newName
          : newName,
        explanation: `Preserve original ${candidate.item.fontSize}pt font, color, and baseline for recipient name`,
        isApplied: false,
      });
      return proposals;
    }
  }

  // 2. "Change date to [X]" or "Change the date to [X]"
  const dateMatch = trimmed.match(/change\s+(?:the\s+)?date\s+(?:from\s+[^to]+\s+)?to\s+([^,.]+)/i);
  if (dateMatch) {
    const newDate = dateMatch[1].trim();
    const candidate = allItems.find(i =>
      /\b(january|february|march|april|may|june|july|august|september|october|november|december|\d{4})\b/i.test(i.item.text) ||
      i.item.text.toLowerCase().includes('date')
    );

    if (candidate) {
      const orig = candidate.item.text;
      let rep = newDate;
      if (orig.toLowerCase().includes('date:')) {
        rep = orig.split(':')[0] + ': ' + newDate;
      } else if (orig.toLowerCase().includes('issue date:')) {
        rep = 'Issue Date: ' + newDate;
      }

      proposals.push({
        id: `ai-prop-${Date.now()}-2`,
        command: prompt,
        actionType: 'change_date',
        pageNumber: candidate.pageNumber,
        targetId: candidate.item.id,
        originalText: candidate.item.text,
        proposedText: rep,
        explanation: `Update document issue/due date while maintaining typography and layout`,
        isApplied: false,
      });
      return proposals;
    }
  }

  // 3. "Change amount from [X] to [Y]" or "Change amount to [Y]"
  const amountMatch = trimmed.match(/change\s+(?:the\s+)?amount\s+(?:from\s+([^\s]+)\s+)?to\s+([^,.]+)/i);
  if (amountMatch) {
    const newAmount = amountMatch[2].trim();
    const candidate = allItems.find(i =>
      i.item.text.includes('25,000') ||
      i.item.text.includes('$') ||
      i.item.text.toLowerCase().includes('amount') ||
      i.item.text.toLowerCase().includes('total')
    );

    if (candidate) {
      const orig = candidate.item.text;
      const formatted = newAmount.startsWith('$') ? newAmount : `$${newAmount}`;
      const rep = orig.replace(/\$?[0-9,]+/, formatted);

      proposals.push({
        id: `ai-prop-${Date.now()}-3`,
        command: prompt,
        actionType: 'change_number',
        pageNumber: candidate.pageNumber,
        targetId: candidate.item.id,
        originalText: candidate.item.text,
        proposedText: rep,
        explanation: `Update financial sum to ${formatted} with exact tabular alignment`,
        isApplied: false,
      });
      return proposals;
    }
  }

  // 4. "Replace phone number" or "Replace the phone number with [X]"
  if (lower.includes('phone')) {
    const phoneCandidate = allItems.find(i =>
      i.item.text.toLowerCase().includes('phone') ||
      /\+?[0-9]{2,4}[\s\-]?[0-9]{3,4}/.test(i.item.text)
    );
    const withMatch = trimmed.match(/with\s+([^,.]+)/i) || trimmed.match(/to\s+([^,.]+)/i);
    const newPhone = withMatch ? withMatch[1].trim() : '+1 (555) 019-2834';

    if (phoneCandidate) {
      proposals.push({
        id: `ai-prop-${Date.now()}-4`,
        command: prompt,
        actionType: 'replace_text',
        pageNumber: phoneCandidate.pageNumber,
        targetId: phoneCandidate.item.id,
        originalText: phoneCandidate.item.text,
        proposedText: phoneCandidate.item.text.includes(':')
          ? phoneCandidate.item.text.split(':')[0] + ': ' + newPhone
          : newPhone,
        explanation: `Update contact phone number with preserved styling`,
        isApplied: false,
      });
      return proposals;
    }
  }

  // 5. "Replace address" or "Change address to [X]"
  if (lower.includes('address') || lower.includes('location')) {
    const addressCandidate = allItems.find(i =>
      i.item.text.toLowerCase().includes('dhaka') ||
      i.item.text.toLowerCase().includes('gulshan') ||
      i.item.text.toLowerCase().includes('address') ||
      i.item.text.toLowerCase().includes('location')
    );
    const withMatch = trimmed.match(/with\s+([^,.]+)/i) || trimmed.match(/to\s+([^,.]+)/i);
    const newAddress = withMatch ? withMatch[1].trim() : 'Chittagong, Bangladesh';

    if (addressCandidate) {
      proposals.push({
        id: `ai-prop-${Date.now()}-5`,
        command: prompt,
        actionType: 'replace_text',
        pageNumber: addressCandidate.pageNumber,
        targetId: addressCandidate.item.id,
        originalText: addressCandidate.item.text,
        proposedText: addressCandidate.item.text.includes(':')
          ? addressCandidate.item.text.split(':')[0] + ': ' + newAddress
          : newAddress,
        explanation: `Update address while preventing line spillover`,
        isApplied: false,
      });
      return proposals;
    }
  }

  // 6. "Change all occurrences of [X] to [Y]" or "Replace [X] with [Y]"
  const replaceAllMatch =
    trimmed.match(/change\s+(?:all\s+occurrences\s+of\s+)?["']?([^"']+)["']?\s+to\s+["']?([^"']+)["']?/i) ||
    trimmed.match(/replace\s+["']?([^"']+)["']?\s+with\s+["']?([^"']+)["']?/i);

  if (replaceAllMatch) {
    const findWord = replaceAllMatch[1].trim();
    const replaceWord = replaceAllMatch[2].trim();

    allItems.forEach((entry, idx) => {
      if (entry.item.text.toLowerCase().includes(findWord.toLowerCase())) {
        const regex = new RegExp(findWord, 'gi');
        const replaced = entry.item.text.replace(regex, replaceWord);
        proposals.push({
          id: `ai-prop-${Date.now()}-${idx}`,
          command: prompt,
          actionType: 'replace_all',
          pageNumber: entry.pageNumber,
          targetId: entry.item.id,
          originalText: entry.item.text,
          proposedText: replaced,
          explanation: `Matched "${findWord}" → "${replaceWord}" on page ${entry.pageNumber}`,
          isApplied: false,
        });
      }
    });

    if (proposals.length > 0) return proposals;
  }

  // Fallback: search any word match in all text items
  const tokens = trimmed.split(' ').filter(w => w.length > 3 && !['change', 'replace', 'make', 'update', 'with', 'from', 'this', 'that', 'into'].includes(w.toLowerCase()));
  for (const token of tokens) {
    const found = allItems.find(i => i.item.text.toLowerCase().includes(token.toLowerCase()));
    if (found) {
      proposals.push({
        id: `ai-prop-${Date.now()}-fallback`,
        command: prompt,
        actionType: 'replace_text',
        pageNumber: found.pageNumber,
        targetId: found.item.id,
        originalText: found.item.text,
        proposedText: found.item.text.replace(new RegExp(token, 'i'), 'Updated Content'),
        explanation: `Matched phrase containing "${token}"`,
        isApplied: false,
      });
      break;
    }
  }

  return proposals;
}
