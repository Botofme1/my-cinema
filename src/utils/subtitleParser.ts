export interface SubtitleCue {
  id: string | number;
  start: number; // in seconds
  end: number; // in seconds
  text: string;
  isArabic?: boolean;
}

/**
 * Checks if a string contains Arabic characters
 */
export function isArabic(text: string): boolean {
  const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicPattern.test(text);
}

/**
 * Robust Subtitle Byte Decoder
 * Automatically detects UTF-8 (with/without BOM), Windows-1256 (Arabic Windows code page),
 * UTF-16, and ISO-8859-6 to guarantee Arabic subtitles never show up as question marks (?????)
 */
export function decodeSubtitleBuffer(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  // 1. Check for Byte Order Marks (BOM)
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    // UTF-8 BOM
    return new TextDecoder('utf-8').decode(bytes.slice(3));
  }

  if (bytes.length >= 2 && bytes[0] === 0xFF && bytes[1] === 0xFE) {
    // UTF-16 LE
    return new TextDecoder('utf-16le').decode(bytes.slice(2));
  }

  if (bytes.length >= 2 && bytes[0] === 0xFE && bytes[1] === 0xFF) {
    // UTF-16 BE
    return new TextDecoder('utf-16be').decode(bytes.slice(2));
  }

  // 2. Try Strict UTF-8 decoding
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
    const text = utf8Decoder.decode(bytes);

    // If UTF-8 contains replacement chars (\uFFFD) or lots of question marks, check if windows-1256 is better
    if (!text.includes('\uFFFD')) {
      return text;
    }
  } catch {
    // Strict UTF-8 failed, likely Windows-1256 Arabic or legacy encoding
  }

  // 3. Fallback to Windows-1256 (Common for Arabic .srt files downloaded on Windows)
  try {
    const win1256Decoder = new TextDecoder('windows-1256');
    const winText = win1256Decoder.decode(bytes);
    if (isArabic(winText)) {
      return winText;
    }
  } catch (err) {
    console.warn('Windows-1256 decoding failed:', err);
  }

  // 4. Fallback to ISO-8859-6 (Arabic ISO)
  try {
    const isoDecoder = new TextDecoder('iso-8859-6');
    const isoText = isoDecoder.decode(bytes);
    if (isArabic(isoText)) {
      return isoText;
    }
  } catch {}

  // 5. Ultimate Fallback: Non-fatal UTF-8
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

/**
 * Parses time string like "00:01:23,456" or "01:23.456" to seconds
 */
export function parseSubtitleTime(timeStr: string): number {
  if (!timeStr) return 0;
  const cleaned = timeStr.trim().replace(',', '.');
  const parts = cleaned.split(':');
  
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]) || 0;
    const minutes = parseFloat(parts[1]) || 0;
    const seconds = parseFloat(parts[2]) || 0;
    return hours * 3600 + minutes * 60 + seconds;
  }
  
  if (parts.length === 2) {
    const minutes = parseFloat(parts[0]) || 0;
    const seconds = parseFloat(parts[1]) || 0;
    return minutes * 60 + seconds;
  }

  return parseFloat(cleaned) || 0;
}

/**
 * Strips HTML formatting tags from subtitle cues
 */
export function cleanSubtitleText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '') // strip HTML tags <i>, <b>, <font>, etc.
    .replace(/\{[^\}]*\}/g, '') // strip SSA/ASS style tags
    .replace(/&rlm;/gi, '') // strip invisible direction markers
    .replace(/&lrm;/gi, '')
    .trim();
}

/**
 * Parses SRT or WebVTT content into structured SubtitleCue objects
 */
export function parseSrtOrVtt(content: string): SubtitleCue[] {
  if (!content) return [];

  // Normalize line breaks
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);
  const cues: SubtitleCue[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block || block === 'WEBVTT' || block.startsWith('NOTE') || block.startsWith('STYLE')) {
      continue;
    }

    const lines = block.split('\n');
    let timeLineIndex = -1;

    for (let j = 0; j < lines.length; j++) {
      if (lines[j].includes('-->')) {
        timeLineIndex = j;
        break;
      }
    }

    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const [startStr, endStr] = timeLine.split('-->');

    if (!startStr || !endStr) continue;

    const start = parseSubtitleTime(startStr.trim().split(' ')[0]);
    const end = parseSubtitleTime(endStr.trim().split(' ')[0]);

    const textLines = lines.slice(timeLineIndex + 1);
    const rawText = textLines.join('\n');
    const text = cleanSubtitleText(rawText);

    if (text && end > start) {
      cues.push({
        id: i + 1,
        start,
        end,
        text,
        isArabic: isArabic(text),
      });
    }
  }

  return cues;
}
