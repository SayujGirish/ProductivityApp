
import { useEffect, useMemo, useState } from "react";
import {
  Play,
  Pause,
  Square,
  Clock3,
  BookOpen,
  Trash2,
} from "lucide-react";
import "./StudySession.css";

type StudyRecord = {
  id: string;
  subject: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
};

type ActiveSession = {
  subject: string;
  startedAt: string;
  elapsedBeforePause: number;
  runningSince: number | null;
};

const ACTIVE_KEY = "personal-productivity-active-study-session-v1";
const HISTORY_KEY = "personal-productivity-study-history-v1";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function formatDuration(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return [h, m, s]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function formatDate(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudySession() {
  const [subject, setSubject] = useState("");

  const [active, setActive] =
    useState<ActiveSession | null>(() =>
      readJSON<ActiveSession | null>(ACTIVE_KEY, null)
    );

  const [history, setHistory] =
    useState<StudyRecord[]>(() =>
      readJSON<StudyRecord[]>(HISTORY_KEY, [])
    );

  const [now, setNow] = useState(Date.now());

  // Refresh the displayed timer every second.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  // Persist active session.
  useEffect(() => {
    localStorage.setItem(
      ACTIVE_KEY,
      JSON.stringify(active)
    );
  }, [active]);

  // Persist study history.
  useEffect(() => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(history)
    );
  }, [history]);

  // Calculate current elapsed time.
  const elapsed = useMemo(() => {
    if (!active) return 0;

    const live =
      active.runningSince === null
        ? 0
        : Math.max(
            0,
            Math.floor(
              (now - active.runningSince) / 1000
            )
          );

    return active.elapsedBeforePause + live;
  }, [active, now]);

  const totalStudied = history.reduce(
    (sum, item) => sum + item.durationSeconds,
    0
  );

  const todayStudied = history
    .filter(
      (item) =>
        new Date(item.endedAt).toDateString() ===
        new Date().toDateString()
    )
    .reduce(
      (sum, item) => sum + item.durationSeconds,
      0
    );

  function startSession() {
    const chosen = subject.trim();

    if (!chosen || active) return;

    setActive({
      subject: chosen,
      startedAt: new Date().toISOString(),
      elapsedBeforePause: 0,
      runningSince: Date.now(),
    });

    setSubject("");
  }

  function pauseSession() {
    if (!active || active.runningSince === null)
      return;

    const added = Math.max(
      0,
      Math.floor(
        (Date.now() - active.runningSince) / 1000
      )
    );

    setActive({
      ...active,
      elapsedBeforePause:
        active.elapsedBeforePause + added,
      runningSince: null,
    });
  }

  function resumeSession() {
    if (!active || active.runningSince !== null)
      return;

    setActive({
      ...active,
      runningSince: Date.now(),
    });
  }

  function endSession() {
    if (!active) return;

    const finalDuration = elapsed;

    if (finalDuration > 0) {
      const record: StudyRecord = {
        id: crypto.randomUUID(),
        subject: active.subject,
        startedAt: active.startedAt,
        endedAt: new Date().toISOString(),
        durationSeconds: finalDuration,
      };

      setHistory((prev) => [record, ...prev]);
    }

    setActive(null);
  }

  function clearHistory() {
    if (
      window.confirm(
        "Clear all study session history?"
      )
    ) {
      setHistory([]);
    }
  }

  return (
    <section className="study-session">
      <header className="study-session__heading">
        <div>
          <p className="study-session__eyebrow">
            FOCUS MODE
          </p>
          <h2>Study Session</h2>
          <p className="study-session__subheading">
            Track focused time, one session at a time.
          </p>
        </div>

        <div className="study-session__icon">
          <BookOpen size={22} />
        </div>
      </header>

      <div className="study-session__stats">
        <div className="study-session__stat">
          <span>Today tracked</span>
          <strong>
            {formatDuration(todayStudied)}
          </strong>
        </div>

        <div className="study-session__stat">
          <span>All-time tracked</span>
          <strong>
            {formatDuration(totalStudied)}
          </strong>
        </div>
      </div>

      <div className="study-session__timer-card">
        {active ? (
          <>
            <span className="study-session__status">
              <span
                className={
                  active.runningSince === null
                    ? "is-paused"
                    : ""
                }
              />
              {active.runningSince === null
                ? "Paused"
                : "Session in progress"}
            </span>

            <p className="study-session__active-subject">
              {active.subject}
            </p>

            <div className="study-session__clock">
              {formatDuration(elapsed)}
            </div>

            <div className="study-session__controls">
              {active.runningSince !== null ? (
                <button
                  className="study-session__button study-session__button--secondary"
                  onClick={pauseSession}
                >
                  <Pause size={17} /> Pause
                </button>
              ) : (
                <button
                  className="study-session__button study-session__button--primary"
                  onClick={resumeSession}
                >
                  <Play size={17} /> Resume
                </button>
              )}

              <button
                className="study-session__button study-session__button--danger"
                onClick={endSession}
              >
                <Square size={15} /> End session
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="study-session__status study-session__status--idle">
              <Clock3 size={15} />
              Ready when you are
            </span>

            <div className="study-session__clock study-session__clock--idle">
              00:00:00
            </div>

            <form
              className="study-session__start-form"
              onSubmit={(event) => {
                event.preventDefault();
                startSession();
              }}
            >
              <label htmlFor="study-subject">
                What are you studying?
              </label>

              <input
                id="study-subject"
                value={subject}
                onChange={(event) =>
                  setSubject(event.target.value)
                }
                placeholder="e.g. DSA, MP, CNN project"
                maxLength={90}
                required
              />

              <button
                className="study-session__button study-session__button--primary"
                type="submit"
              >
                <Play size={17} /> Start session
              </button>
            </form>
          </>
        )}
      </div>

      <div className="study-session__history">
        <div className="study-session__history-heading">
          <div>
            <h3>Recent sessions</h3>
            <p>Your saved study log</p>
          </div>

          {history.length > 0 && (
            <button
              className="study-session__clear"
              onClick={clearHistory}
              title="Clear history"
            >
              <Trash2 size={15} /> Clear
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="study-session__empty">
            <Clock3 size={20} />
            <span>
              Your completed sessions will show up here.
            </span>
          </div>
        ) : (
          <ul className="study-session__records">
            {history.slice(0, 8).map((record) => (
              <li
                key={record.id}
                className="study-session__record"
              >
                <div className="study-session__record-main">
                  <strong>{record.subject}</strong>
                  <span>
                    {formatDate(record.endedAt)}
                  </span>
                </div>

                <strong className="study-session__duration">
                  {formatDuration(
                    record.durationSeconds
                  )}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
