import React, { useMemo } from 'react';
import { SubtitleCue } from '../utils/subtitleParser';

interface SubtitlesOverlayProps {
  currentTime: number;
  cues: SubtitleCue[];
  isEnabled: boolean;
  fontSize?: 'sm' | 'base' | 'lg' | 'xl';
  delayOffset?: number; // in seconds
  bottomOffsetPercent?: number; // 8% to 15% from bottom
}

export const SubtitlesOverlay: React.FC<SubtitlesOverlayProps> = ({
  currentTime,
  cues,
  isEnabled,
  fontSize = 'base',
  delayOffset = 0,
  bottomOffsetPercent = 8,
}) => {
  // Find current active subtitle cue
  const activeCue = useMemo(() => {
    if (!isEnabled || !cues || cues.length === 0) return null;
    const adjustedTime = currentTime + delayOffset;
    return cues.find((cue) => adjustedTime >= cue.start && adjustedTime <= cue.end) || null;
  }, [cues, currentTime, delayOffset, isEnabled]);

  if (!activeCue) return null;

  // Font size mapping
  const fontSizeClass = {
    sm: 'text-sm sm:text-base',
    base: 'text-base sm:text-lg',
    lg: 'text-lg sm:text-xl',
    xl: 'text-xl sm:text-2xl',
  }[fontSize];

  return (
    <div
      className="absolute left-0 right-0 z-30 pointer-events-none flex justify-center px-4 transition-all duration-150"
      style={{ bottom: `${bottomOffsetPercent}%` }}
    >
      <div
        dir={activeCue.isArabic ? 'rtl' : 'ltr'}
        className={`max-w-3xl text-center font-medium leading-relaxed tracking-wide select-none ${fontSizeClass}`}
        style={{
          fontFamily: activeCue.isArabic
            ? "'Plus Jakarta Sans', 'Segoe UI', 'Noto Sans Arabic', 'Amiri', 'Tahoma', 'Arial', sans-serif"
            : 'inherit',
        }}
      >
        <span
          className="inline-block px-3 py-1.5 rounded-lg bg-black/80 text-white border border-black/50 shadow-2xl backdrop-blur-[2px]"
          style={{
            textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.8), 2px 2px 3px #000',
          }}
        >
          {activeCue.text.split('\n').map((line, idx) => (
            <React.Fragment key={idx}>
              {line}
              {idx < activeCue.text.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </span>
      </div>
    </div>
  );
};
