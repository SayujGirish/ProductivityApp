import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, Trash2, Plus, Clock3, CircleCheck, X } from "lucide-react";
import "./NotificationPanel.css";

type NoticeKind = "reminder" | "progress" | "system";
type Notice = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  kind: NoticeKind;
  reminderAt?: string;
  fired?: boolean;
};

const STORAGE_KEY = "personal-productivity-notifications-v1";

function loadNotices(): Notice[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Scheduled reminder";
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = { onClose?: () => void };

export default function NotificationPanel({ onClose }: Props) {
  const [notices, setNotices] = useState<Notice[]>(loadNotices);
  const [showComposer, setShowComposer] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderAt, setReminderAt] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
  }, [notices]);

  // Reminders fire in-app while this app is open. On reload, overdue reminders
  // are surfaced as notifications too.
  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      setNotices((current) => {
        let changed = false;
        const next = current.map((notice) => {
          if (
            notice.kind === "reminder" &&
            notice.reminderAt &&
            !notice.fired &&
            new Date(notice.reminderAt).getTime() <= now
          ) {
            changed = true;
            return {
              ...notice,
              fired: true,
              read: false,
              title: `Reminder: ${notice.title}`,
              message: notice.message || "Your scheduled reminder is due.",
              createdAt: new Date().toISOString(),
            };
          }
          return notice;
        });
        return changed ? next : current;
      });
    };

    checkReminders();
    const interval = window.setInterval(checkReminders, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const unreadCount = useMemo(
    () => notices.filter((notice) => !notice.read).length,
    [notices],
  );

  const addReminder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const date = new Date(reminderAt);
    if (!reminderTitle.trim() || Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      return;
    }

    const newNotice: Notice = {
      id: makeId(),
      title: reminderTitle.trim(),
      message: reminderMessage.trim() || "Your scheduled reminder is coming up.",
      createdAt: new Date().toISOString(),
      read: false,
      kind: "reminder",
      reminderAt: date.toISOString(),
      fired: false,
    };

    setNotices((current) => [newNotice, ...current]);
    setReminderTitle("");
    setReminderMessage("");
    setReminderAt("");
    setShowComposer(false);
  };

  const markAllRead = () => {
    setNotices((current) => current.map((notice) => ({ ...notice, read: true })));
  };

  const markRead = (id: string) => {
    setNotices((current) =>
      current.map((notice) => notice.id === id ? { ...notice, read: true } : notice),
    );
  };

  const deleteNotice = (id: string) => {
    setNotices((current) => current.filter((notice) => notice.id !== id));
  };

  const clearAll = () => setNotices([]);

  return (
    <section className="notification-panel" aria-label="Notifications">
      <div className="notification-panel-heading">
        <div>
          <div className="notification-title-line">
            <h3>Notifications</h3>
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </div>
          <p>{unreadCount ? `${unreadCount} unread` : "You're all caught up"}</p>
        </div>
        {onClose && (
          <button className="notification-icon-action" onClick={onClose} aria-label="Close notifications">
            <X size={17} />
          </button>
        )}
      </div>

      <div className="notification-toolbar">
        <button type="button" onClick={() => setShowComposer((value) => !value)}>
          <Plus size={15} /> New reminder
        </button>
        <div>
          <button type="button" onClick={markAllRead} disabled={unreadCount === 0} title="Mark all as read">
            <CheckCheck size={15} />
          </button>
          <button type="button" onClick={clearAll} disabled={notices.length === 0} title="Clear notifications">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {showComposer && (
        <form className="notification-composer" onSubmit={addReminder}>
          <label>
            Reminder
            <input
              value={reminderTitle}
              onChange={(event) => setReminderTitle(event.target.value)}
              placeholder="e.g. Revise Digital Communication"
              maxLength={100}
              required
            />
          </label>
          <label>
            Note (optional)
            <input
              value={reminderMessage}
              onChange={(event) => setReminderMessage(event.target.value)}
              placeholder="What do you need to remember?"
              maxLength={220}
            />
          </label>
          <label>
            Date and time
            <input
              type="datetime-local"
              value={reminderAt}
              onChange={(event) => setReminderAt(event.target.value)}
              min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
              required
            />
          </label>
          <div className="notification-form-actions">
            <button type="button" className="notification-secondary-button" onClick={() => setShowComposer(false)}>
              Cancel
            </button>
            <button type="submit" className="notification-primary-button">Save reminder</button>
          </div>
          <p className="notification-hint">Reminder alerts appear inside this app while it is open.</p>
        </form>
      )}

      {notices.length === 0 ? (
        <div className="notification-empty">
          <span className="notification-empty-icon"><Bell size={22} /></span>
          <strong>Nothing scheduled yet</strong>
          <p>Create a reminder to see it here.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notices.map((notice) => {
            const due = notice.kind === "reminder" && notice.reminderAt && !notice.fired;
            return (
              <article key={notice.id} className={`notification-item ${notice.read ? "is-read" : "is-unread"}`}>
                <span className="notification-item-icon">
                  {due ? <Clock3 size={17} /> : <CircleCheck size={17} />}
                </span>
                <button className="notification-item-body" onClick={() => markRead(notice.id)}>
                  <span className="notification-item-title">{notice.title}</span>
                  <span className="notification-item-message">{notice.message}</span>
                  <span className="notification-item-time">
                    {due ? `Due ${formatWhen(notice.reminderAt!)}` : formatWhen(notice.createdAt)}
                  </span>
                </button>
                {!notice.read && <span className="notification-unread-dot" aria-label="Unread" />}
                <button className="notification-delete" onClick={() => deleteNotice(notice.id)} aria-label={`Delete ${notice.title}`}>
                  <Trash2 size={15} />
                </button>
              </article>
            );
          })}
        </div>
      )}
      <div className="notification-panel-footer">
        <span>Saved on this device</span>
        <span>{notices.length} total</span>
      </div>
    </section>
  );
}
