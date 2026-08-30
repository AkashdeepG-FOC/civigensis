import React, { useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { ActiveSpeech } from '../../systems/speech/SpeechSystem';
import { CitizenId } from '../../types/citizen';

interface SpeechBubble3DProps {
  citizenId: CitizenId;
  speech: ActiveSpeech;
}

export const SpeechBubble3D: React.FC<SpeechBubble3DProps> = ({ citizenId, speech }) => {
  const [displayedText, setDisplayedText] = useState('');

  // Character theme palette setup
  const themeColors: Record<CitizenId, { border: string; bg: string; badge: string; shadow: string }> = {
    ben: {
      border: 'rgba(16, 185, 129, 0.6)',
      bg: 'rgba(6, 30, 22, 0.85)',
      badge: '#10b981',
      shadow: 'rgba(16, 185, 129, 0.3)',
    },
    julie: {
      border: 'rgba(236, 72, 153, 0.6)',
      bg: 'rgba(30, 6, 24, 0.85)',
      badge: '#ec4899',
      shadow: 'rgba(236, 72, 153, 0.3)',
    },
    ravi: {
      border: 'rgba(245, 158, 11, 0.6)',
      bg: 'rgba(30, 20, 6, 0.85)',
      badge: '#f59e0b',
      shadow: 'rgba(245, 158, 11, 0.3)',
    },
  };

  const theme = themeColors[citizenId] || themeColors.ben;

  // Typewriter effect for speech text
  useEffect(() => {
    if (!speech.text) {
      setDisplayedText('');
      return;
    }

    const totalChars = speech.text.length;
    let charIndex = 0;
    const intervalTime = Math.max(15, Math.min(50, Math.floor(speech.durationMs / totalChars)));

    const timer = setInterval(() => {
      charIndex++;
      setDisplayedText(speech.text.slice(0, charIndex));
      if (charIndex >= totalChars) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [speech.text, speech.durationMs]);

  return (
    <Html
      position={[0, 2.35, 0]}
      center
      distanceFactor={18}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div style={styles.bubbleContainer}>
        <div
          style={{
            ...styles.bubbleCard,
            borderColor: theme.border,
            backgroundColor: theme.bg,
            boxShadow: `0 8px 32px ${theme.shadow}, 0 2px 8px rgba(0, 0, 0, 0.5)`,
          }}
        >
          {/* Header Row: Speaker Badge & Equalizer */}
          <div style={styles.headerRow}>
            <span style={{ ...styles.speakerBadge, backgroundColor: theme.badge }}>
              💬 {speech.speakerName.toUpperCase()}
            </span>

            {/* Equalizer Soundwave Animation Bars */}
            <div style={styles.equalizerRow}>
              <span style={{ ...styles.eqBar, animationDelay: '0ms', backgroundColor: theme.badge }} />
              <span style={{ ...styles.eqBar, animationDelay: '150ms', backgroundColor: theme.badge }} />
              <span style={{ ...styles.eqBar, animationDelay: '300ms', backgroundColor: theme.badge }} />
              <span style={{ ...styles.eqBar, animationDelay: '100ms', backgroundColor: theme.badge }} />
            </div>
          </div>

          {/* Spoken Text Body */}
          <div style={styles.speechText}>
            "{displayedText}"
          </div>
        </div>

        {/* Speech Bubble Pointer / Tail pointing downward towards character head */}
        <div
          style={{
            ...styles.bubbleTail,
            borderTopColor: theme.border,
          }}
        />
      </div>

      {/* Embedded CSS for animations */}
      <style>{`
        @keyframes eqPulse {
          0%, 100% { height: 4px; opacity: 0.4; }
          50% { height: 14px; opacity: 1; }
        }
        @keyframes bubbleFadeIn {
          from { opacity: 0; transform: translateY(8px) scale(0.92); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </Html>
  );
};

const styles: Record<string, React.CSSProperties> = {
  bubbleContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '260px',
    animation: 'bubbleFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    userSelect: 'none',
  },
  bubbleCard: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '14px',
    border: '1.5px solid',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxSizing: 'border-box',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  speakerBadge: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: '10px',
    letterSpacing: '0.6px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  equalizerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '3px',
    height: '14px',
  },
  eqBar: {
    width: '3px',
    borderRadius: '2px',
    animation: 'eqPulse 0.6s infinite ease-in-out',
  },
  speechText: {
    color: '#f8fafc',
    fontSize: '12px',
    lineHeight: '1.45',
    fontWeight: 500,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    wordBreak: 'break-word',
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.8)',
  },
  bubbleTail: {
    width: 0,
    height: 0,
    borderLeft: '7px solid transparent',
    borderRight: '7px solid transparent',
    borderTop: '9px solid',
    marginTop: '-1px',
  },
};
