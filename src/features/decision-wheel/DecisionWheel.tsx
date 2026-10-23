
import { useEffect, useRef, useState } from "react";
import "./DecisionWheel.css";


const STORAGE_KEY = "productivity-decision-wheel";
const SPIN_DURATION = 3500;
const SIZE = 400;
const CENTER = SIZE / 2;
const RADIUS = 190;


const COLORS = [
  "#8b5cf6",
  "#312e81",
  "#6366f1",
  "#4338ca",
  "#7c3aed",
  "#272044",
  "#a78bfa",
  "#3730a3",
];

function getInitialOptions(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (
        Array.isArray(parsed) &&
        parsed.every((item) => typeof item === "string")
      ) {
        return parsed;
      }
    }
  } catch {
    // Use the default options if stored data is invalid.
  }

  return ["DSA", "ECE", "Project", "Break"];
}

// Convert an angle into SVG coordinates.
// 0 degrees points upward.
function getPoint(angle: number, radius: number) {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

function getSegmentPath(
  index: number,
  total: number
): string {
  const slice = 360 / total;
  const startAngle = index * slice;
  const endAngle = (index + 1) * slice;

  const start = getPoint(startAngle, RADIUS);
  const end = getPoint(endAngle, RADIUS);

  const largeArc = slice > 180 ? 1 : 0;

  return [
    `M ${CENTER} ${CENTER}`,
    `L ${start.x} ${start.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

export default function DecisionWheel() {
  const [options, setOptions] = useState<string[]>(getInitialOptions);
  const [newOption, setNewOption] = useState("");
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const counterRotation = -rotation;

  const spinTimer = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  }, [options]);

  useEffect(() => {
    return () => {
      if (spinTimer.current !== null) {
        window.clearTimeout(spinTimer.current);
      }
    };
  }, []);

  const winner =
    winnerIndex !== null ? options[winnerIndex] ?? "" : "";

  function addOption() {
    const value = newOption.trim();

    if (!value || spinning) return;

    setOptions((prev) => [...prev, value]);
    setNewOption("");
    setWinnerIndex(null);
  }

  function deleteOption(index: number) {
    if (spinning) return;

    setOptions((prev) => prev.filter((_, i) => i !== index));
    setWinnerIndex(null);
  }

  function spinWheel() {
    if (spinning || options.length < 2) return;

    const total = options.length;
    const slice = 360 / total;

    // Pick the winning option.
    const selectedIndex = Math.floor(Math.random() * total);

    // The pointer is at -90 degrees (top).
    // Each segment starts at 0 degrees from the top.
    // Align the selected segment's center with the pointer.
    const selectedCenter = (selectedIndex + 0.5) * slice;

    const currentNormalized =
      ((rotation % 360) + 360) % 360;

    const targetNormalized =
      ((-selectedCenter % 360) + 360) % 360;

    const alignmentRotation =
      (targetNormalized - currentNormalized + 360) % 360;

    // Add 5 complete turns, then the exact alignment angle.
    const finalRotation =
      rotation + 1800 + alignmentRotation;

    setSpinning(true);
    setWinnerIndex(null);
    setRotation(finalRotation);

    spinTimer.current = window.setTimeout(() => {
      setWinnerIndex(selectedIndex);
      setSpinning(false);
      spinTimer.current = null;
    }, SPIN_DURATION);
  }

  return (
    <main className="wheel-page">
      <header className="wheel-header">
        <div>
          <p className="wheel-eyebrow">MAKE A CHOICE</p>
          <h1>Decision Wheel</h1>
          <p className="wheel-subtitle">
            Can't decide? Let the wheel choose.
          </p>
        </div>
      </header>

      <div className="wheel-layout">
        <section className="wheel-panel">
          <div className="wheel-stage">
            <div className="wheel-pointer" />

            <div
              className={`wheel-disc ${
                winnerIndex !== null ? "wheel-finished" : ""
              }`}
              style={{
                transform: `rotate(${rotation}deg)`,
              }}
            >
              <svg
                className="wheel-svg"
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                role="img"
                aria-label={`Decision wheel with ${options.length} options`}
              >
                {options.map((option, index) => {
                  const slice = 360 / options.length;
                  const middleAngle = (index + 0.5) * slice;

                  const labelPosition = getPoint(
                    middleAngle,
                    RADIUS * 0.70
                  );

                  const isWinner = winnerIndex === index;

                  return (
                    <g key={`${index}-${option}`}>
                      <path
                        d={getSegmentPath(index, options.length)}
                        fill={
                          isWinner
                            ? "#16a34a"
                            : COLORS[index % COLORS.length]
                        }
                        stroke={isWinner ? "#bbf7d0" : "#18181b"}
                        strokeWidth={isWinner ? 5 : 2}
                        className={
                          isWinner ? "wheel-winning-segment" : ""
                        }
                      />

                      <text
                        x={labelPosition.x}
                        y={labelPosition.y}
                        className="wheel-segment-number"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${
                          middleAngle > 90 && middleAngle < 270
                            ? middleAngle + 180
                            : middleAngle
                        } ${labelPosition.x} ${labelPosition.y})`}
                      >
                        {index + 1}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="wheel-disc-text"
              style={{ transform: `translate(-50%, -50%) rotate(${counterRotation}deg)` }}>
                {spinning
                  ? "SPINNING..."
                  : winnerIndex !== null
                    ? "WINNER!"
                    : "LET'S GO"}
              </div>
            </div>
          </div>

          <button
            className="wheel-spin-button"
            onClick={spinWheel}
            disabled={spinning || options.length < 2}
          >
            {spinning ? "Spinning..." : "SPIN THE WHEEL"}
          </button>

          {options.length < 2 && (
            <p className="wheel-hint">
              Add at least 2 options to spin.
            </p>
          )}

          {winnerIndex !== null && winner && (
            <div className="wheel-result" aria-live="polite">
              <p>THE WHEEL CHOSE</p>
              <h2>{winner}</h2>
              <span className="wheel-result-number">
                Option {winnerIndex + 1}
              </span>
            </div>
          )}
        </section>

        <section className="wheel-options-panel">
          <div className="wheel-options-heading">
            <div>
              <h2>Your options</h2>
              <p>
                Add the choices you want to decide between.
              </p>
            </div>

            <span className="wheel-count">
              {options.length}
            </span>
          </div>

          <form
            className="wheel-add-form"
            onSubmit={(event) => {
              event.preventDefault();
              addOption();
            }}
          >
            <input
              value={newOption}
              onChange={(event) => setNewOption(event.target.value)}
              placeholder="Enter an option..."
              maxLength={60}
              disabled={spinning}
              aria-label="New option"
            />

            <button
              type="submit"
              disabled={spinning || !newOption.trim()}
            >
              Add
            </button>
          </form>

          <div className="wheel-options-list">
            {options.map((option, index) => (
              <div
                className={`wheel-option ${
                  winnerIndex === index ? "wheel-option-winner" : ""
                }`}
                key={index}
              >
                <span className="wheel-option-number">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="wheel-option-name">
                  {option}
                </span>

                {winnerIndex === index && (
                  <span className="wheel-winner-tag">
                    WINNER
                  </span>
                )}

                <button
                  type="button"
                  className="wheel-delete-button"
                  onClick={() => deleteOption(index)}
                  disabled={spinning}
                  aria-label={`Delete ${option}`}
                  title="Delete option"
                >
                  ×
                </button>
              </div>
            ))}

            {options.length === 0 && (
              <p className="wheel-empty">
                No options yet. Add some above!
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
