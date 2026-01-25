import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSpring, animated } from '@react-spring/web';
import './App.css';
import { AnimatedNumberTicker } from './AnimatedNumberTicker';
import scoresData from './data/scores.json'



function App() {
  const [inputValue, setInputValue] = useState("");
  const [scalePercent, setScalePercent] = useState(Number(scoresData.aim));
  const [viewportWidth, setViewportWidth] = useState(() => (
    typeof window === 'undefined' ? 1000 : window.innerWidth
  ));
  const [dartsThrown, setDartsThrown] = useState(0);
  const [pendingDarts, setPendingDarts] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const pendingDartsRef = useRef(null);
  const inputRef = useRef(null);
  const prevScaleRef = useRef(scalePercent);
  const circleScaleRef = useRef(Math.max(0, scalePercent));
  const maxScaleRef = useRef(null);
  

  const isAnimating = pendingDarts !== null;
  const maxCirclePx = useMemo(() => (
    Math.max(0, viewportWidth * 0.5)
  ), [viewportWidth]);
  const minCirclePx = 20;
  const confettiPieces = useMemo(() => (
    Array.from({ length: 24 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 140 + Math.random() * 140;
      return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotation: Math.random() * 360,
        delay: Math.random() * 120,
        duration: 700 + Math.random() * 300,
        color: `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`,
      };
    })
  ), []);
  const getScaleT = (value) => {
    const maxScale = maxScaleRef.current ?? 100;
    const clamped = Math.min(maxScale, Math.max(0, value));
    return clamped / maxScale;
  };
  const getBaseColor = (value) => {
    const t = getScaleT(value);
    return {
      r: Math.round(204 * (1 - t) + 255 * t),
      g: Math.round(255 * (1 - t) + 204 * t),
      b: 204,
    };
  };

  // Main background circle animation
  const { springValue } = useSpring({
    springValue: scalePercent,
    config: { tension: 170, friction: 22 },
    onRest: () => {
      if (pendingDartsRef.current === null) {
        return;
      }

      const nextDarts = pendingDartsRef.current;
      pendingDartsRef.current = null;
      setPendingDarts(null);
      setDartsThrown(nextDarts);
    },
  });
  const { negativeLerp } = useSpring({
    negativeLerp: scalePercent < 0 ? 1 : 0,
    config: { tension: 120, friction: 18 },
  });



  const scoreLookup = useMemo(() => {
    const lookup = {};
    Object.entries(scoresData.stats).forEach(([key, value]) => {
      // .replace(/'/g, "") removes all single quotes
      const normalizedKey = key.toLowerCase().trim().replace(/'/g, "");
      lookup[normalizedKey] = value;
    });
    return lookup;
  }, []);

  // Indicator animations (Right circle disappears first, then middle, then left)
  const rightCircle = useSpring({ scale: dartsThrown >= 1 ? 0 : 1 });
  const middleCircle = useSpring({ scale: dartsThrown >= 2 ? 0 : 1 });
  const leftCircle = useSpring({ scale: dartsThrown >= 3 ? 0 : 1 });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isGameOver && !isAnimating) {
      e.preventDefault();
      
      // Normalize user input: lowercase, trim, and remove all types of single quotes
      const normalizedInput = inputValue
        .toLowerCase()
        .trim()
        .replace(/['‘’]/g, ""); // Removes standard and curly single quotes
  
      const scoreValue = scoreLookup[normalizedInput];
  
      if (scoreValue !== undefined) {
        const nextDarts = dartsThrown + 1;
        setScalePercent(prev => prev - scoreValue);
        pendingDartsRef.current = nextDarts;
        setPendingDarts(nextDarts);
        setInputValue("");
      } else {
        console.log("Invalid entry");
      }
    }
  };

  

  useEffect(() => {

    if (scalePercent < 0) {
      setIsGameOver(true); 
      const popupTimeout = setTimeout(() => setShowPopup(true), 1000);
      return () => clearTimeout(popupTimeout);
    }

    if (dartsThrown !== 3) {
      return undefined;
    }


    if (scalePercent < 10 && scalePercent >= 0) {
      setShowConfetti(true);
      const confettiTimeout = setTimeout(() => setShowConfetti(false), 1000);
      const popupTimeout = setTimeout(() => setShowPopup(true), 1100);
      return () => {
        clearTimeout(confettiTimeout);
        clearTimeout(popupTimeout);
      };
    }

    const popupTimeout = setTimeout(() => setShowPopup(true), 500);
    return () => clearTimeout(popupTimeout);
  }, [dartsThrown, scalePercent]);

  useEffect(() => {
    if (!isGameOver && !isAnimating) {
      inputRef.current?.focus();
    }
  }, [isGameOver, isAnimating]);

  useEffect(() => {
    if (maxScaleRef.current === null) {
      maxScaleRef.current = Math.max(0, scalePercent);
    }
  }, [scalePercent]);

  useEffect(() => {
    if (scalePercent >= 0) {
      circleScaleRef.current = scalePercent;
    }
  }, [scalePercent]);

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    prevScaleRef.current = scalePercent;
  }, [scalePercent]);

  const aimValue = Number(scoresData.aim);
  const finalScore = Math.round((1 - (scalePercent / aimValue)) * 100);

  return (
    <div className="app-container">
      {/* Top Indicators */}
      <div className="indicators-container">
        <div className="indicators-row">
          <span className="indicators-label">Darts Remaining:</span>
          <animated.div className="indicator" style={leftCircle} />
          <animated.div className="indicator" style={middleCircle} />
          <animated.div className="indicator" style={rightCircle} />
        </div>
        <div className="indicators-details">
          <span className="indicators-subtext">Category: {scoresData.score_name} ({scoresData.unit}s)</span>
        </div>
        
      </div>

      {/* Background Circle */}
      <animated.div 
        className="background-circle" 
        style={{
          width: springValue.to((v) => {
            const scaleForCircle = scalePercent < 0 ? circleScaleRef.current : v;
            const t = getScaleT(scaleForCircle);
            return `${minCirclePx + (maxCirclePx - minCirclePx) * t}px`;
          }),
          height: springValue.to((v) => {
            const scaleForCircle = scalePercent < 0 ? circleScaleRef.current : v;
            const t = getScaleT(scaleForCircle);
            return `${minCirclePx + (maxCirclePx - minCirclePx) * t}px`;
          }),
          transform: 'translate(-50%, -50%)',
          backgroundColor: scalePercent < 0
            ? negativeLerp.to((t) => {
              const base = getBaseColor(circleScaleRef.current);
              const target = { r: 220, g: 220, b: 220 };
              const lerp = (from, to) => Math.round(from + (to - from) * t);
              return `rgb(${lerp(base.r, target.r)}, ${lerp(base.g, target.g)}, ${lerp(base.b, target.b)})`;
            })
            : springValue.to((v) => {
              const { r, g, b } = getBaseColor(v);
              return `rgb(${r}, ${g}, ${b})`;
            })
        }} 
      />

      <div className="target-display">
        <AnimatedNumberTicker startValue={prevScaleRef.current} endValue={scalePercent} />
      </div>

      {showConfetti && (
        <div className="confetti-container">
          {confettiPieces.map((piece, index) => (
            <span
              key={`confetti-${index}`}
              className="confetti-piece"
              style={{
                '--x': `${piece.x}px`,
                '--y': `${piece.y}px`,
                '--rot': `${piece.rotation}deg`,
                '--delay': `${piece.delay}ms`,
                '--duration': `${piece.duration}ms`,
                backgroundColor: piece.color,
              }}
            />
          ))}
        </div>
      )}

<div className="input-wrapper">
  


    <textarea 
      className="country-input"
      placeholder={
        pendingDarts === 3 || isGameOver
          ? ""
          : `Enter a ${scoresData.group_name}…`
      }
      spellCheck="false"
      // Changed from numeric to text/default
      inputMode="text" 
      rows="1"
      value={inputValue}
      ref={inputRef}
      autoFocus
      onChange={(e) => setInputValue(e.target.value)}
      onKeyDown={handleKeyDown}
      disabled={isGameOver || isAnimating}
    />
  </div>

    {showPopup && (
      <div className="popup-overlay">
        <div className="popup-content">
          {scalePercent < 0 ? (
            <p className="final-value">Game over! You went over the target by {Math.abs(scalePercent)} {scoresData.unit}.</p>
          ) : finalScore >= 95 ? (
            <p className="final-value">Bullseye! Accuracy: {finalScore}%</p>
          ) : (
            <p className="final-value">Not close enough! Accuracy: {finalScore}%</p>
          )}
        </div>
      </div>
    )}
    </div>
  );
}

export default App;