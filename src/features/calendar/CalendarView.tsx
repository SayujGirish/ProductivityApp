import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import "./CalendarView.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function CalendarView() {
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay(); // Sun=0
    const mondayOffset = (firstWeekday + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: mondayOffset }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];
  }, [visibleMonth]);

  const selectedDateLabel = useMemo(() => {
    const date = new Date(`${selectedDate}T12:00:00`);
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  const moveMonth = (amount: number) => {
    setVisibleMonth(
      (current) => new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  };

  const goToToday = () => {
    setVisibleMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(toDateKey(today));
  };

  return (
    <main className="calendar-page">
      <header className="calendar-heading">
        <div>
          <div className="calendar-eyebrow">
            <CalendarDays size={17} aria-hidden="true" />
            PLANNER
          </div>
          <h1>Calendar</h1>
          <p>See your days. Make your progress visible.</p>
        </div>
        <button className="calendar-today-button" onClick={goToToday}>
          Today
        </button>
      </header>

      <section className="calendar-panel" aria-label="Monthly calendar">
        <div className="calendar-month-bar">
          <h2>{getMonthLabel(visibleMonth)}</h2>
          <div className="calendar-month-controls">
            <button
              className="calendar-icon-button"
              aria-label="Previous month"
              onClick={() => moveMonth(-1)}
            >
              <ChevronLeft size={20} />
            </button>
            <button
              className="calendar-icon-button"
              aria-label="Next month"
              onClick={() => moveMonth(1)}
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <div className="calendar-grid" role="grid" aria-label={getMonthLabel(visibleMonth)}>
          {WEEKDAYS.map((weekday) => (
            <div className="calendar-weekday" role="columnheader" key={weekday}>
              {weekday}
            </div>
          ))}

          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div className="calendar-cell calendar-cell-empty" key={`empty-${index}`} />;
            }

            const date = new Date(
              visibleMonth.getFullYear(),
              visibleMonth.getMonth(),
              day,
            );
            const dateKey = toDateKey(date);
            const isToday = dateKey === toDateKey(today);
            const isSelected = dateKey === selectedDate;

            return (
              <button
                key={dateKey}
                type="button"
                role="gridcell"
                aria-label={date.toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                aria-pressed={isSelected}
                className={[
                  "calendar-cell",
                  isToday ? "is-today" : "",
                  isSelected ? "is-selected" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedDate(dateKey)}
              >
                <span>{day}</span>
                {isToday && <span className="calendar-today-dot" aria-label="Today" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="calendar-day-panel" aria-live="polite">
        <div className="calendar-day-title">
          <div>
            <span className="calendar-section-label">SELECTED DAY</span>
            <h2>{selectedDateLabel}</h2>
          </div>
        </div>
        <div className="calendar-empty-state">
          <div className="calendar-empty-icon">
            <CalendarDays size={23} />
          </div>
          <div>
            <h3>Your day, at a glance</h3>
            <p>
              Your planned tasks and completion progress will appear here once
              we connect the calendar to your To-do topics.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
