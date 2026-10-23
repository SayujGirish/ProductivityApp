
import { useEffect, useState } from "react";
import "./TodoList.css";

type TaskStatus = "not-started" | "ongoing" | "completed";
type TaskPriority = "normal" | "high";

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  calendarDate: string;
  calendarType: "planned" | "deadline";
  createdAt: string;
  completedAt: string | null;
};

type Topic = {
  id: string;
  name: string;
  tasks: Task[];
  createdAt: string;
};

type Screen = "home" | "create" | "topics" | "detail";

const STORAGE_KEY = "productivity-topics";
const OLD_STORAGE_KEY = "productivity-tasks";

function createTask(title: string): Task {
  return {
    id: crypto.randomUUID(),
    title,
    status: "not-started",
    priority: "normal",
    calendarDate: "",
    calendarType: "planned",
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
}

function loadTopics(): Topic[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed.filter(
          (topic) =>
            topic &&
            typeof topic.id === "string" &&
            typeof topic.name === "string" &&
            Array.isArray(topic.tasks)
        );
      }
    }

    // Migrate tasks from the previous flat to-do list.
    const oldSaved = localStorage.getItem(OLD_STORAGE_KEY);

    if (oldSaved) {
      const oldTasks: unknown = JSON.parse(oldSaved);

      if (Array.isArray(oldTasks) && oldTasks.length > 0) {
        const validTasks = oldTasks.filter(
          (task) =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string"
        );

        if (validTasks.length > 0) {
          return [
            {
              id: crypto.randomUUID(),
              name: "My Previous Tasks",
              createdAt: new Date().toISOString(),
              tasks: validTasks.map((task) => ({
                id: task.id,
                title: task.title,
                status: task.status || "not-started",
                priority: task.priority || "normal",
                calendarDate: task.calendarDate || "",
                calendarType: task.calendarType || "planned",
                createdAt: task.createdAt || new Date().toISOString(),
                completedAt: task.completedAt || null,
              })),
            },
          ];
        }
      }
    }

    return [];
  } catch (error) {
    console.error("Could not load topics:", error);
    return [];
  }
}

export default function TodoList() {
  const [topics, setTopics] = useState<Topic[]>(loadTopics);
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(
    null
  );

  const [topicName, setTopicName] = useState("");
  const [draftTasks, setDraftTasks] = useState<Task[]>([]);
  const [taskInput, setTaskInput] = useState("");

  const [taskFilter, setTaskFilter] = useState<
    "all" | TaskStatus
  >("all");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(
    null
  );
  const [editTitle, setEditTitle] = useState("");

  const [isAddingTask, setIsAddingTask] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
    } catch (error) {
      console.error("Could not save topics:", error);
    }
  }, [topics]);

  const selectedTopic =
    topics.find((topic) => topic.id === selectedTopicId) ?? null;

  function startCreatingTopic() {
    setTopicName("");
    setDraftTasks([]);
    setTaskInput("");
    setScreen("create");
  }

  function addDraftTask() {
    const title = taskInput.trim();
    if (!title) return;

    setDraftTasks((prev) => [...prev, createTask(title)]);
    setTaskInput("");
  }

  function removeDraftTask(id: string) {
    setDraftTasks((prev) => prev.filter((task) => task.id !== id));
  }

  function saveTopic() {
    const name = topicName.trim();

    if (!name) {
      alert("Please enter a topic name.");
      return;
    }

    if (draftTasks.length === 0) {
      alert("Please add at least one task.");
      return;
    }

    const topic: Topic = {
      id: crypto.randomUUID(),
      name,
      tasks: draftTasks,
      createdAt: new Date().toISOString(),
    };

    setTopics((prev) => [topic, ...prev]);
    setSelectedTopicId(topic.id);
    setScreen("detail");
  }

  function openTopic(id: string) {
    setSelectedTopicId(id);
    setTaskFilter("all");
    setEditingTaskId(null);
    setScreen("detail");
  }

  function changeTaskStatus(
    topicId: string,
    taskId: string,
    status: TaskStatus
  ) {
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id !== topicId
          ? topic
          : {
              ...topic,
              tasks: topic.tasks.map((task) =>
                task.id !== taskId
                  ? task
                  : {
                      ...task,
                      status,
                      completedAt:
                        status === "completed"
                          ? task.completedAt ?? new Date().toISOString()
                          : null,
                    }
              ),
            }
      )
    );
  }

  function togglePriority(topicId: string, taskId: string) {
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id !== topicId
          ? topic
          : {
              ...topic,
              tasks: topic.tasks.map((task) =>
                task.id !== taskId
                  ? task
                  : {
                      ...task,
                      priority:
                        task.priority === "high" ? "normal" : "high",
                    }
              ),
            }
      )
    );
  }

  function addTaskToSavedTopic() {
    if (!selectedTopic || !taskInput.trim()) return;

    const task = createTask(taskInput.trim());

    setTopics((prev) =>
      prev.map((topic) =>
        topic.id !== selectedTopic.id
          ? topic
          : { ...topic, tasks: [...topic.tasks, task] }
      )
    );

    setTaskInput("");
    setIsAddingTask(false);
  }

  function deleteTask(topicId: string, taskId: string) {
    if (!window.confirm("Delete this task?")) return;

    setTopics((prev) =>
      prev.map((topic) =>
        topic.id !== topicId
          ? topic
          : {
              ...topic,
              tasks: topic.tasks.filter((task) => task.id !== taskId),
            }
      )
    );
  }

  function deleteTopic(topicId: string) {
    if (
      !window.confirm(
        "Delete this topic and all its tasks? This cannot be undone."
      )
    ) {
      return;
    }

    setTopics((prev) => prev.filter((topic) => topic.id !== topicId));
    setScreen("topics");
  }

  function renameTopic(topicId: string) {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;

    const updated = window.prompt("Rename topic:", topic.name);
    if (!updated?.trim()) return;

    setTopics((prev) =>
      prev.map((t) =>
        t.id === topicId ? { ...t, name: updated.trim() } : t
      )
    );
  }

  function updateTaskDate(
    topicId: string,
    taskId: string,
    calendarDate: string
  ) {
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id !== topicId
          ? topic
          : {
              ...topic,
              tasks: topic.tasks.map((task) =>
                task.id !== taskId
                  ? task
                  : { ...task, calendarDate }
              ),
            }
      )
    );
  }

  function updateCalendarType(
    topicId: string,
    taskId: string,
    calendarType: "planned" | "deadline"
  ) {
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id !== topicId
          ? topic
          : {
              ...topic,
              tasks: topic.tasks.map((task) =>
                task.id !== taskId
                  ? task
                  : { ...task, calendarType }
              ),
            }
      )
    );
  }

  function startEditing(task: Task) {
    setEditingTaskId(task.id);
    setEditTitle(task.title);
  }

  function saveTaskEdit(topicId: string, taskId: string) {
    const title = editTitle.trim();
    if (!title) return;

    setTopics((prev) =>
      prev.map((topic) =>
        topic.id !== topicId
          ? topic
          : {
              ...topic,
              tasks: topic.tasks.map((task) =>
                task.id !== taskId ? task : { ...task, title }
              ),
            }
      )
    );

    setEditingTaskId(null);
    setEditTitle("");
  }

  const visibleTasks =
    selectedTopic?.tasks.filter((task) =>
      taskFilter === "all" ? true : task.status === taskFilter
    ) ?? [];

  return (
    <main className="todo-page">
      <div key={screen} className="todo-screen-transition">
      {/* HOME */}
      {screen === "home" && (
        <>
          <header className="todo-header">
            <p className="todo-eyebrow">GET THINGS DONE</p>
            <h1>To-do List</h1>
            <p>Organize your work into topics and tasks.</p>
          </header>

          <section className="todo-home-actions">
            <button
              className="todo-home-card"
              onClick={() => setScreen("topics")}
            >
              <span className="todo-home-icon">▤</span>
              <span>
                <strong>View All Topics</strong>
                <small>Browse and manage your saved topics.</small>
              </span>
              <span className="todo-arrow">›</span>
            </button>

            <button
              className="todo-home-card"
              onClick={startCreatingTopic}
            >
              <span className="todo-home-icon">＋</span>
              <span>
                <strong>Create a Topic</strong>
                <small>Start a new topic and add its tasks.</small>
              </span>
              <span className="todo-arrow">›</span>
            </button>

          </section>
        </>
      )}

      {/* CREATE TOPIC */}
      {screen === "create" && (
        <>
          <button
            className="todo-back-button"
            onClick={() => setScreen("home")}
          >
            ← Back
          </button>

          <header className="todo-header">
            <p className="todo-eyebrow">NEW TOPIC</p>
            <h1>Create a Topic</h1>
            <p>Name your topic first, then add its tasks.</p>
          </header>

          <section className="todo-panel">
            <label className="todo-field">
              Topic name
              <input
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                placeholder="e.g. DSA, ECE, Personal"
                maxLength={100}
                autoFocus
              />
            </label>

            <h2>Tasks</h2>

            <form
              className="todo-task-add-row"
              onSubmit={(e) => {
                e.preventDefault();
                addDraftTask();
              }}
            >
              <input
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Enter a task..."
                maxLength={150}
              />
              <button type="submit" disabled={!taskInput.trim()}>
                Add task
              </button>
            </form>

            <div className="todo-list">
              {draftTasks.map((task) => (
                <article className="todo-item" key={task.id}>
                  <div className="todo-item-main">
                    <strong>{task.title}</strong>
                  </div>
                  <button
                    className="todo-delete-button"
                    onClick={() => removeDraftTask(task.id)}
                  >
                    Remove
                  </button>
                </article>
              ))}

              {draftTasks.length === 0 && (
                <p className="todo-empty">
                  No tasks added yet.
                </p>
              )}
            </div>

            <button
              className="todo-primary-button"
              onClick={saveTopic}
              disabled={!topicName.trim() || draftTasks.length === 0}
            >
              Save Topic
            </button>
          </section>
        </>
      )}

      {/* ALL TOPICS */}
      {screen === "topics" && (
        <>
          <button
            className="todo-back-button"
            onClick={() => setScreen("home")}
          >
            ← Back
          </button>

          <header className="todo-header">
            <p className="todo-eyebrow">YOUR ORGANIZATION</p>
            <h1>All Topics</h1>
            <p>Open a topic to manage its tasks.</p>
          </header>

          <section className="todo-list-panel">
            <div className="todo-list-heading">
              <h2>Saved Topics</h2>
              <button onClick={startCreatingTopic}>
                + New Topic
              </button>
            </div>

            <div className="todo-list">
              {topics.map((topic) => (
                <article
                  className="todo-topic-card"
                  key={topic.id}
                >
                  <button
                    className="todo-topic-open"
                    onClick={() => openTopic(topic.id)}
                  >
                    <span className="todo-topic-icon">▤</span>
                    <span className="todo-topic-info">
                      <strong>{topic.name}</strong>
                      <small>
                        {topic.tasks.length}{" "}
                        {topic.tasks.length === 1 ? "task" : "tasks"}
                      </small>
                    </span>
                    <span className="todo-arrow">›</span>
                  </button>

                  <button
                    className="todo-delete-button"
                    onClick={() => deleteTopic(topic.id)}
                  >
                    Delete
                  </button>
                </article>
              ))}

              {topics.length === 0 && (
                <p className="todo-empty">
                  No topics yet. Create your first topic!
                </p>
              )}
            </div>
          </section>
        </>
      )}

      {/* TOPIC DETAILS */}
      {screen === "detail" && selectedTopic && (
        <>
          <button
            className="todo-back-button"
            onClick={() => setScreen("topics")}
          >
            ← All Topics
          </button>

          <header className="todo-header">
            <p className="todo-eyebrow">TOPIC</p>
            <h1>{selectedTopic.name}</h1>
            <div className="todo-topic-header-actions">
              <button onClick={() => renameTopic(selectedTopic.id)}>
                Rename
              </button>
              <button
                className="todo-delete-button"
                onClick={() => deleteTopic(selectedTopic.id)}
              >
                Delete Topic
              </button>
            </div>
          </header>

          <section className="todo-list-panel">
            <div className="todo-list-heading">
              <h2>Tasks</h2>
              <select
                value={taskFilter}
                onChange={(e) =>
                  setTaskFilter(e.target.value as typeof taskFilter)
                }
                aria-label="Filter tasks"
              >
                <option value="all">All tasks</option>
                <option value="not-started">Not started</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <p className="todo-help">
              Double-click a task to toggle high priority.
            </p>

            <div className="todo-list">
              {visibleTasks.map((task) => (
                <article
                  key={task.id}
                  className={`todo-item ${
                    task.priority === "high" ? "todo-item-high" : ""
                  } ${
                    task.status === "completed"
                      ? "todo-item-completed"
                      : ""
                  }`}
                  onDoubleClick={() =>
                    togglePriority(selectedTopic.id, task.id)
                  }
                  title="Double-click to toggle high priority"
                >
                  <div className="todo-item-main">
                    {editingTaskId === task.id ? (
                      <form
                        className="todo-edit-form"
                        onSubmit={(e) => {
                          e.preventDefault();
                          saveTaskEdit(selectedTopic.id, task.id);
                        }}
                      >
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          maxLength={150}
                        />
                        <button type="submit">Save</button>
                        <button
                          type="button"
                          onClick={() => setEditingTaskId(null)}
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="todo-item-title-row">
                          <strong>{task.title}</strong>
                          {task.priority === "high" && (
                            <span className="todo-priority-badge">
                              HIGH
                            </span>
                          )}
                        </div>

                        {task.calendarDate && (
                          <div className="todo-item-meta">
                            <span className="todo-date">
                              {task.calendarDate} ·{" "}
                              {task.calendarType === "deadline"
                                ? "Deadline"
                                : "Planned"}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="todo-item-actions">
                    <select
                      value={task.status}
                      aria-label={`Status for ${task.title}`}
                      onChange={(e) =>
                        changeTaskStatus(
                          selectedTopic.id,
                          task.id,
                          e.target.value as TaskStatus
                        )
                      }
                    >
                      <option value="not-started">Not Started</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                    </select>

                    <button
                      onClick={() => {
                        const date = window.prompt(
                          "Calendar date (YYYY-MM-DD). Leave blank to unlink.",
                          task.calendarDate
                        );

                        if (date === null) return;

                        const cleanDate = date.trim();

                        if (
                          cleanDate &&
                          !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)
                        ) {
                          alert("Please use YYYY-MM-DD format.");
                          return;
                        }

                        updateTaskDate(
                          selectedTopic.id,
                          task.id,
                          cleanDate
                        );

                        if (cleanDate) {
                          const meaning = window.confirm(
                            "Use this date as a deadline?\n\nOK = Deadline\nCancel = Planned day"
                          );

                          updateCalendarType(
                            selectedTopic.id,
                            task.id,
                            meaning ? "deadline" : "planned"
                          );
                        }
                      }}
                    >
                      Date
                    </button>

                    <button onClick={() => startEditing(task)}>
                      Edit
                    </button>

                    <button
                      className="todo-delete-button"
                      onClick={() =>
                        deleteTask(selectedTopic.id, task.id)
                      }
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}

              {visibleTasks.length === 0 && (
                <p className="todo-empty">
                  No tasks match this filter.
                </p>
              )}
            </div>

            <div className="todo-add-saved-task">
              {isAddingTask ? (
                <form
                  className="todo-task-add-row"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addTaskToSavedTopic();
                  }}
                >
                  <input
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    placeholder="Enter a task..."
                    maxLength={150}
                    autoFocus
                  />
                  <button type="submit" disabled={!taskInput.trim()}>
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTask(false);
                      setTaskInput("");
                    }}
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  className="todo-primary-button"
                  onClick={() => setIsAddingTask(true)}
                >
                  + Add Task
                </button>
              )}
            </div>
          </section>
        </>
      )}
      </div>
    </main>
  );
}
