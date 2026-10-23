
import { useEffect, useState } from "react";

import DecisionWheel from "./features/decision-wheel/DecisionWheel";
import TodoList from "./features/tasks/TodoList";
import CalendarView from "./features/calendar/CalendarView";
import NotificationPanel from "./features/notifications/NotificationPanel";
import StudySession from "./features/study-session/StudySession";

import {
  Bell,
  Timer,
  CircleDot,
  ListChecks,
  CalendarDays,
  ArrowUpRight,
  Clock3,
  Brain,
  X,
  ArrowLeft,
} from "lucide-react";

import "./App.css";

type Page =
  | "home"
  | "wheel"
  | "todo"
  | "calendar"
  | "study";

function App() {
  const [currentPage, setCurrentPage] =
    useState<Page>("home");

  const [time, setTime] = useState(new Date());

  const [activeMenu, setActiveMenu] = useState<
    "notifications" | "study" | null
  >(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formattedTime = time.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const formattedDate = time.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Shared header for feature pages
  const featureHeader = (
    <header className="topbar">
      <button
        className="icon-button"
        onClick={() => {
          setCurrentPage("home");
          setActiveMenu(null);
        }}
        aria-label="Back to Home"
        title="Back to Home"
      >
        <ArrowLeft size={21} />
      </button>

      <div className="clock">
        <div className="clock-time">
          <Clock3 size={24} />
          <h2>{formattedTime}</h2>
        </div>
        <p>{formattedDate}</p>
      </div>

      <div className="header-actions">
        <a
          className="chatgpt-button"
          href="https://chatgpt.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open ChatGPT"
          title="Study with ChatGPT"
        >
          <svg
            viewBox="0 0 24 24"
            width="21"
            height="21"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12.002 2a7.5 7.5 0 0 0-6.8 4.33A5.5 5.5 0 0 0 2.3 14.1a5.5 5.5 0 0 0 4.8 7.5 7.5 7.5 0 0 0 9.9-1.1 5.5 5.5 0 0 0 4.7-7.5 5.5 5.5 0 0 0-4.8-7.5A7.5 7.5 0 0 0 12.002 2Zm0 2a5.5 5.5 0 0 1 4.8 2.8l-.2.1-4.8 2.8-4.8-2.8A5.5 5.5 0 0 1 12.002 4ZM5.2 8.5l4.8 2.8v5.5l-4.8-2.8a3.5 3.5 0 0 1 0-5.5Zm13.6 0a3.5 3.5 0 0 1 0 5.5l-4.8 2.8v-5.5l4.8-2.8ZM12 12.5l4.8-2.8v5.5a5.5 5.5 0 0 1-9.6 0V9.7l4.8 2.8Z" />
          </svg>
        </a>
      </div>
    </header>
  );

  // Decision Wheel page
  if (currentPage === "wheel") {
    return (
      <main className="dashboard">
        {featureHeader}
        <DecisionWheel />
      </main>
    );
  }

  // To-do List page
  if (currentPage === "todo") {
    return (
      <main className="dashboard">
        {featureHeader}
        <TodoList />
      </main>
    );
  }

  // Calendar page
  if (currentPage === "calendar") {
    return (
      <main className="dashboard">
        {featureHeader}
        <CalendarView />
      </main>
    );
  }

  // Study Session page
  if (currentPage === "study") {
    return (
      <main className="dashboard">
        {featureHeader}
        <StudySession />
      </main>
    );
  }

  // Home dashboard
  return (
    <main className="dashboard">
      <header className="topbar">
        <div className="clock">
          <div className="clock-time">
            <Clock3 size={24} />
            <h2>{formattedTime}</h2>
          </div>
          <p>{formattedDate}</p>
        </div>

        <div className="header-actions">
          <a
            className="chatgpt-button"
            href="https://chatgpt.com/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open ChatGPT"
            title="Study with ChatGPT"
          >
            <svg
              viewBox="0 0 24 24"
              width="21"
              height="21"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12.002 2a7.5 7.5 0 0 0-6.8 4.33A5.5 5.5 0 0 0 2.3 14.1a5.5 5.5 0 0 0 4.8 7.5 7.5 7.5 0 0 0 9.9-1.1 5.5 5.5 0 0 0 4.7-7.5 5.5 5.5 0 0 0-4.8-7.5A7.5 7.5 0 0 0 12.002 2Zm0 2a5.5 5.5 0 0 1 4.8 2.8l-.2.1-4.8-2.8A5.5 5.5 0 0 1 12.002 4ZM5.2 8.5l4.8 2.8v5.5l-4.8-2.8a3.5 3.5 0 0 1 0-5.5Zm13.6 0a3.5 3.5 0 0 1 0 5.5l-4.8 2.8v-5.5l-4.8 2.8ZM12 12.5l4.8-2.8v5.5a5.5 5.5 0 0 1-9.6 0V9.7l4.8 2.8Z" />
            </svg>
          </a>

          {/* Notifications */}
          <div className="menu-wrapper">
            <button
              className="icon-button"
              aria-label="Notifications"
              aria-expanded={
                activeMenu === "notifications"
              }
              onClick={() =>
                setActiveMenu(
                  activeMenu === "notifications"
                    ? null
                    : "notifications"
                )
              }
            >
              <Bell size={21} />
            </button>

            {activeMenu === "notifications" && (
              <div className="notification-dropdown">
                <NotificationPanel onClose={() => setActiveMenu(null)} />
              </div>
            )}
          </div>

          {/* Study Session menu */}
          <div className="menu-wrapper">
            <button
              className="study-button"
              aria-expanded={activeMenu === "study"}
              onClick={() =>
                setActiveMenu(
                  activeMenu === "study"
                    ? null
                    : "study"
                )
              }
            >
              <Timer size={19} />
              <span>Study Session</span>
            </button>

            {activeMenu === "study" && (
              <div className="dropdown study-dropdown">
                <div className="dropdown-heading">
                  <h3>Study Session</h3>

                  <button
                    className="close-button"
                    onClick={() => setActiveMenu(null)}
                    aria-label="Close study menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                <button
                  className="tool-option"
                  onClick={() => {
                    setActiveMenu(null);
                    setCurrentPage("study");
                  }}
                >
                  <Brain size={20} />

                  <span>
                    <strong>Focus Session</strong>
                    <small>Deep work timer</small>
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Welcome section */}
      <section className="welcome">
        <span className="eyebrow">
          YOUR PERSONAL WORKSPACE
        </span>

        <h1>
          Good{" "}
          {time.getHours() < 12
            ? "morning"
            : time.getHours() < 17
              ? "afternoon"
              : "evening"}
          !
        </h1>

        <p>What would you like to work on?</p>
      </section>

      {/* Dashboard feature cards */}
      <section className="dashboard-grid">
        <button
          className="feature-card"
          onClick={() => {
            setActiveMenu(null);
            setCurrentPage("wheel");
          }}
        >
          <div className="card-icon purple">
            <CircleDot size={25} />
          </div>

          <div className="card-content">
            <h3>Decision Wheel</h3>
            <p>Let fate pick your next move.</p>
          </div>

          <ArrowUpRight
            className="card-arrow"
            size={20}
          />
        </button>

        <button
          className="feature-card"
          onClick={() => {
            setActiveMenu(null);
            setCurrentPage("todo");
          }}
        >
          <div className="card-icon blue">
            <ListChecks size={25} />
          </div>

          <div className="card-content">
            <h3>To-do List</h3>
            <p>Organize your tasks and goals.</p>
          </div>

          <ArrowUpRight
            className="card-arrow"
            size={20}
          />
        </button>

        <button
          className="feature-card calendar-card"
          onClick={() => {
            setActiveMenu(null);
            setCurrentPage("calendar");
          }}
        >
          <div className="card-icon green">
            <CalendarDays size={25} />
          </div>

          <div className="card-content">
            <h3>Calendar</h3>
            <p>Plan ahead. Reflect on your progress.</p>
          </div>

          <ArrowUpRight
            className="card-arrow"
            size={20}
          />
        </button>
      </section>

      <footer className="dashboard-footer">
        <span>One step at a time.</span>
        <span>PERSONAL PRODUCTIVITY</span>
      </footer>
    </main>
  );
}

export default App;
