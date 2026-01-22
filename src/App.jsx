import { useEffect, useRef, useState } from 'react'
import infoData from './data/info.json'
import dart from './assets/dart.svg'
import './App.css'

const STORAGE_KEY = 'infoData'
const OVERLAY_DELAY_MS = 800
function App() {
  const [info, setInfo] = useState(null)
  const [aim, setAim] = useState(null)
  const [currentScore, setCurrentScore] = useState(null)
  const [dartsThrown, setDartsThrown] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [selected, setSelected] = useState([])
  const [entries, setEntries] = useState([])
  const [overlayDismissed, setOverlayDismissed] = useState(false)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const toastTimerRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (!parsed?.desc || !parsed?.unit || parsed?.aim == null) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(infoData))
          setInfo(infoData)
        } else {
          setInfo(parsed)
        }
        return
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(infoData))
    setInfo(infoData)
  }, [])

  useEffect(() => {
    if (info?.aim == null) return
    setAim(info.aim)
    setCurrentScore((prev) => (prev == null ? info.aim : prev))
  }, [info])

  const statsKeys = info?.stats
    ? Object.keys(info.stats)
        .sort((a, b) => a.localeCompare(b))
        .filter((key) => !selected.includes(key))
    : []

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return
    const key = inputValue.trim()
    if (!key || !info?.stats) return

    const value = info.stats[key]
    if (value == null) return

    setSelected((prev) => (prev.includes(key) ? prev : [...prev, key]))
    setEntries((prev) => [...prev, { key, value }])
    setCurrentScore((prev) => {
      const base = prev ?? aim
      return base == null ? null : base - value
    })
    setDartsThrown((prev) => prev + 1)
    setInputValue('')
  }

  const formattedCurrentScore =
    typeof currentScore === 'number' ? currentScore.toFixed(2) : currentScore
  const slabEntries = Array.from({ length: 3 }, (_, index) => entries[index])

  const shareText =
    `Brain Darts\n` +
    `Today's game: ${infoData.desc} ${aim ?? infoData.aim} ${
      infoData.units ?? infoData.unit ?? ''
    }\n` +
    ` 🎯 Dart 1: ${entries[0]?.key ?? ''} ${entries[0]?.value?.toFixed?.(2) ?? ''}\n` +
    ` 🎯 Dart 2: ${entries[1]?.key ?? ''} ${entries[1]?.value?.toFixed?.(2) ?? ''}\n` +
    ` 🎯 Dart 3: ${entries[2]?.key ?? ''} ${entries[2]?.value?.toFixed?.(2) ?? ''}\n` +
    `Score: ${formattedCurrentScore ?? ''}`
  const handleShareCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setShowToast(true)
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
      toastTimerRef.current = setTimeout(() => {
        setShowToast(false)
      }, 1000)
    } catch {
      // Ignore clipboard failures (e.g. unsupported or blocked)
    }
  }

  const scoreRatio =
    aim && typeof currentScore === 'number' && aim !== 0 ? currentScore / aim : null
  const scorePercent =
    scoreRatio != null ? Math.max(0, Math.min(1, scoreRatio)) : 0
  const innerBull = scoreRatio != null && currentScore > 0 && scoreRatio <= 0.1
  const overlayCondition =
    currentScore != null && (currentScore < 0 || dartsThrown === 3)

  useEffect(() => {
    if (overlayDismissed || !overlayCondition) {
      setOverlayVisible(false)
      return
    }

    const timer = setTimeout(() => {
      setOverlayVisible(true)
    }, OVERLAY_DELAY_MS)

    return () => clearTimeout(timer)
  }, [overlayDismissed, overlayCondition])

  return (
    <div>
      {showToast && <div className="toast">Results copied to clipboard</div>}
      <h1 className="title">
        {info?.desc && aim != null && (info?.units || info?.unit)
          ? `${info.desc} ${aim} ${info.units ?? info.unit}`
          : `${infoData.desc} ${infoData.aim} ${infoData.units ?? infoData.unit}`}
      </h1>
      <div className="score-slab" aria-label="Current score">
        <div
          className="score-fill"
          style={{ width: `${scorePercent * 100}%` }}
        />
        <span className="score-text">
          {formattedCurrentScore ?? 'Loading...'}
        </span>
      </div>
      <div className="slabs">
        {slabEntries.map((entry, index) => (
          <div className="slab" key={`${entry?.key ?? 'empty'}-${index}`}>
            <span>{entry?.key ?? ''}</span>
            <span>
              {typeof entry?.value === 'number'
                ? entry.value.toFixed(2)
                : ''}
            </span>
          </div>
        ))}
      </div>
      <label className="input-row">
        <input
          list="stats-keys"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={
            overlayVisible ||
            dartsThrown === 3 ||
            (currentScore != null && currentScore < 0)
          }
        />
      </label>
      <datalist id="stats-keys">
        {statsKeys.map((key) => (
          <option key={key} value={key} />
        ))}
      </datalist>
      {overlayVisible && (
        <div className="overlay">
          <button
            className="overlay-close"
            type="button"
            onClick={() => setOverlayDismissed(true)}
            aria-label="Close"
          >
            ×
          </button>
          {currentScore < 0 ? (
            <p>You went over by {(-currentScore).toFixed(2)}! Try again tomorrow!</p>
          ) : innerBull ? (
            <div className="bull-message">
              <div className="bull-target" aria-hidden="true">
                <span className="bull-circle">
                  <span className="bull-confetti">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </span>
                </span>
                <img className="bull-dart" src={dart} alt="" />
              </div>
              <p>Bullseye!</p>
            </div>
          ) : (
            <p>Rats! You were {formattedCurrentScore} away from the bullseye. Try again tomorrow!</p>
          )}
          {dartsThrown === 3 && (
            <button className="overlay-share" type="button" onClick={handleShareCopy}>
              Share Results
            </button>
          )}
          
        </div>
      )}
    </div>
  )
}

export default App



