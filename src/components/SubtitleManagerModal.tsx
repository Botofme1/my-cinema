import React, { useState } from 'react';
import { X, Upload, Check, Subtitles, AlertCircle, Clock, Type } from 'lucide-react';
import { decodeSubtitleBuffer, parseSrtOrVtt, SubtitleCue, isArabic } from '../utils/subtitleParser';

interface SubtitleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubtitlesLoaded: (cues: SubtitleCue[], trackName: string) => void;
  currentTrack: string;
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  setFontSize: (size: 'sm' | 'base' | 'lg' | 'xl') => void;
  delayOffset: number;
  setDelayOffset: React.Dispatch<React.SetStateAction<number>>;
  onToggleEnabled: (enabled: boolean) => void;
  isEnabled: boolean;
}

// Built-in Arabic demo subtitles for instant testing
const DEMO_ARABIC_SRT = `1
00:00:01,000 --> 00:00:05,000
مرحباً بكم في سين بلس، أفضل منصة لمشاهدة الأفلام والمسلسلات والأنمي بجودة عالية.

2
00:00:05,500 --> 00:00:10,000
الترجمة العربية تعمل الآن بدقة كاملة عبر ترميز UTF-8 بدون أي علامات استفهام أو رموز تالفة.

3
00:00:10,500 --> 00:00:15,000
استمتع بتجربة سينمائية فريدة مع خيارات تحكم مرنة وسريعة.
`;

const DEMO_ENGLISH_SRT = `1
00:00:01,000 --> 00:00:05,000
Welcome to CinePulse, the ultimate streaming destination for movies, series, and anime.

2
00:00:05,500 --> 00:00:10,000
Subtitles are fully synchronized with UTF-8 precision and clear typography.

3
00:00:10,500 --> 00:00:15,000
Enjoy a truly cinematic viewing experience with instant controls.
`;

export const SubtitleManagerModal: React.FC<SubtitleManagerModalProps> = ({
  isOpen,
  onClose,
  onSubtitlesLoaded,
  currentTrack,
  fontSize,
  setFontSize,
  delayOffset,
  setDelayOffset,
  onToggleEnabled,
  isEnabled,
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewSnippet, setPreviewSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle local file upload with guaranteed UTF-8 / Windows-1256 auto-decoding
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        if (!buffer) throw new Error('File buffer is empty');

        // Robust binary decoding with UTF-8 and Windows-1256 Arabic fallback
        const decodedText = decodeSubtitleBuffer(buffer);
        const parsedCues = parseSrtOrVtt(decodedText);

        if (parsedCues.length === 0) {
          setErrorMsg('No valid subtitle cues found in file. Ensure it is a valid .srt or .vtt file.');
          return;
        }

        const isArabicSubtitle = parsedCues.some((c) => c.isArabic);
        onSubtitlesLoaded(parsedCues, file.name);
        onToggleEnabled(true);
        setSuccessMsg(
          `Loaded ${parsedCues.length} subtitles (${isArabicSubtitle ? 'Arabic UTF-8 Detected' : 'UTF-8 Decoded'}).`
        );
        setPreviewSnippet(parsedCues[0]?.text || null);
      } catch (err: any) {
        console.error('Subtitle parse error:', err);
        setErrorMsg('Failed to decode subtitle file. Please try another file.');
      }
    };

    reader.onerror = () => {
      setErrorMsg('Failed to read file from disk.');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleSelectDemoArabic = () => {
    const cues = parseSrtOrVtt(DEMO_ARABIC_SRT);
    onSubtitlesLoaded(cues, 'Arabic (العربية) - UTF-8');
    onToggleEnabled(true);
    setSuccessMsg('Loaded Arabic demo subtitles with full UTF-8 Arabic text shaping.');
    setPreviewSnippet(cues[0]?.text || null);
  };

  const handleSelectDemoEnglish = () => {
    const cues = parseSrtOrVtt(DEMO_ENGLISH_SRT);
    onSubtitlesLoaded(cues, 'English - UTF-8');
    onToggleEnabled(true);
    setSuccessMsg('Loaded English demo subtitles.');
    setPreviewSnippet(cues[0]?.text || null);
  };

  const handleDisableSubtitles = () => {
    onToggleEnabled(false);
    onSubtitlesLoaded([], 'Off');
    setSuccessMsg('Subtitles disabled.');
    setPreviewSnippet(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#0d1322] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-5 text-slate-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Subtitles className="w-5 h-5 text-rose-500" />
            <h3 className="text-base font-bold text-white font-display">
              Subtitles & Arabic Encoding (UTF-8)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status & Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Track Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">Choose Subtitle Track</label>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={handleSelectDemoArabic}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                currentTrack.includes('Arabic') && isEnabled
                  ? 'bg-rose-950/40 border-rose-500 text-white'
                  : 'bg-[#141b2d] border-white/5 text-slate-300 hover:border-white/20 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-rose-400">AR</span>
                <span>Arabic (العربية) - Auto UTF-8 / Windows-1256</span>
              </div>
              {currentTrack.includes('Arabic') && isEnabled && (
                <Check className="w-4 h-4 text-rose-500" />
              )}
            </button>

            <button
              onClick={handleSelectDemoEnglish}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                currentTrack.includes('English') && isEnabled
                  ? 'bg-rose-950/40 border-rose-500 text-white'
                  : 'bg-[#141b2d] border-white/5 text-slate-300 hover:border-white/20 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-400">EN</span>
                <span>English Subtitles</span>
              </div>
              {currentTrack.includes('English') && isEnabled && (
                <Check className="w-4 h-4 text-rose-500" />
              )}
            </button>

            <button
              onClick={handleDisableSubtitles}
              className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                !isEnabled
                  ? 'bg-slate-800 border-white/20 text-white'
                  : 'bg-[#141b2d] border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              <span>Subtitles Off</span>
              {!isEnabled && <Check className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Upload Custom File */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
            <span>Upload Custom Subtitle (.srt / .vtt)</span>
            <span className="text-[11px] text-emerald-400">Auto UTF-8 Fix</span>
          </label>
          <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/20 bg-[#121829] hover:bg-slate-800/80 hover:border-rose-500/50 cursor-pointer transition-colors text-xs text-slate-300">
            <Upload className="w-4 h-4 text-rose-400" />
            <span>Select .SRT or .VTT file</span>
            <input
              type="file"
              accept=".srt,.vtt,text/plain"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <p className="text-[10px] text-slate-500 leading-normal">
            Supports UTF-8, UTF-8 BOM, and Windows-1256 Arabic encoding without question marks (?????).
          </p>
        </div>

        {/* Live Preview of Decoded Text */}
        {previewSnippet && (
          <div className="p-3 rounded-lg bg-[#080c14] border border-white/10 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Decoded Text Preview:</span>
            <p
              dir={isArabic(previewSnippet) ? 'rtl' : 'ltr'}
              className="text-xs text-slate-100 font-medium leading-relaxed font-sans"
            >
              {previewSnippet}
            </p>
          </div>
        )}

        {/* Customization: Size & Sync Offset */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 text-xs">
          {/* Font Size */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-slate-400">
              <Type className="w-3.5 h-3.5" />
              <span>Font Size</span>
            </div>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value as any)}
              className="w-full bg-[#141b2d] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-rose-500"
            >
              <option value="sm">Small</option>
              <option value="base">Normal</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </div>

          {/* Sync Offset */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>Sync Delay</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDelayOffset((prev) => Math.round((prev - 0.5) * 10) / 10)}
                className="px-2 py-1.5 bg-[#141b2d] border border-white/10 rounded text-slate-300 hover:text-white"
              >
                -0.5s
              </button>
              <span className="text-[11px] font-mono text-center flex-1 text-white">
                {delayOffset >= 0 ? `+${delayOffset}s` : `${delayOffset}s`}
              </span>
              <button
                onClick={() => setDelayOffset((prev) => Math.round((prev + 0.5) * 10) / 10)}
                className="px-2 py-1.5 bg-[#141b2d] border border-white/10 rounded text-slate-300 hover:text-white"
              >
                +0.5s
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg text-xs transition-colors shadow-md shadow-rose-950"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
