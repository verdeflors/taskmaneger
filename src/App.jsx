import { useState, useEffect, useRef } from 'react'
import './App.css'

const TASK_KEY = 'task-checker-data'
const NOTE_KEY = 'task-checker-notes'

const CATEGORIES = [
  { id: 'all', label: 'All', icon: '◉' },
  { id: 'work', label: 'Work', icon: '⚡' },
  { id: 'personal', label: 'Personal', icon: '☀' },
  { id: 'habit', label: 'Habits', icon: '♻' },
  { id: 'urgent', label: 'Urgent', icon: '🔺' },
]

const PRIORITY_COLORS = { low: '#6ec47e', medium: '#e8b84a', high: '#e85d5d' }
const PRIORITY_ORDER  = { high: 0, medium: 1, low: 2 }
const NOTE_COLORS     = ['#2a2438', '#1e2d38', '#1e3228', '#2d2218', '#2d1e2e']

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round((target - today) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  if (diff > 1 && diff <= 6) return d.toLocaleDateString('en', { weekday: 'long' })
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function timeAgo(isoStr) {
  const diff = Math.floor((Date.now() - new Date(isoStr)) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function TaskForm({ title, setTitle, desc, setDesc, priority, setPriority,
  category, setCategory, dueDate, setDueDate, onSubmit, submitLabel, titleRef }) {
  return (
    <>
      <input ref={titleRef} className="task-input" placeholder="Task title *"
        value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()} />
      <input className="task-input task-input-desc" placeholder="Description (optional)"
        value={desc} onChange={e => setDesc(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()} />

      <label className="form-label">Priority</label>
      <div className="pill-group">
        {['low', 'medium', 'high'].map(p => (
          <button key={p} className={`pill ${priority === p ? 'pill-active' : ''}`}
            style={priority === p ? { background: PRIORITY_COLORS[p] } : {}}
            onClick={() => setPriority(p)}>{p}</button>
        ))}
      </div>

      <label className="form-label">Category</label>
      <div className="pill-group">
        {CATEGORIES.filter(c => c.id !== 'all').map(c => (
          <button key={c.id}
            className={`pill ${category === c.id ? 'pill-active pill-cat' : ''}`}
            onClick={() => setCategory(c.id)}>{c.icon} {c.label}</button>
        ))}
      </div>

      <label className="form-label">Due date</label>
      <input type="date" className="date-input" value={dueDate}
        onChange={e => setDueDate(e.target.value)} />

      <button className="submit-btn" onClick={onSubmit}>{submitLabel}</button>
    </>
  )
}

export default function App() {
  const [view, setView] = useState('tasks')

  // tasks
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(TASK_KEY)) || [] } catch { return [] }
  })
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery]     = useState('')
  const [showCompleted, setShowCompleted] = useState(true)
  const [sortBy, setSortBy]               = useState('created')
  const [selectedTask, setSelectedTask]   = useState(null)   // shown in right panel
  const [showAddTask, setShowAddTask]     = useState(false)
  const [editTask, setEditTask]           = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const [newTitle, setNewTitle]       = useState('')
  const [newDesc, setNewDesc]         = useState('')
  const [newPriority, setNewPriority] = useState('medium')
  const [newCategory, setNewCategory] = useState('work')
  const [newDueDate, setNewDueDate]   = useState('')

  const [editTitle, setEditTitle]       = useState('')
  const [editDesc, setEditDesc]         = useState('')
  const [editPriority, setEditPriority] = useState('medium')
  const [editCategory, setEditCategory] = useState('work')
  const [editDueDate, setEditDueDate]   = useState('')

  const addTitleRef  = useRef(null)
  const editTitleRef = useRef(null)

  // notes
  const [notes, setNotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(NOTE_KEY)) || [] } catch { return [] }
  })
  const [showAddNote, setShowAddNote]       = useState(false)
  const [editNote, setEditNote]             = useState(null)
  const [selectedNote, setSelectedNote]     = useState(null)
  const [confirmDeleteNote, setConfirmDeleteNote] = useState(null)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody]   = useState('')
  const [noteColor, setNoteColor] = useState(0)
  const noteTitleRef = useRef(null)

  useEffect(() => { localStorage.setItem(TASK_KEY, JSON.stringify(tasks)) }, [tasks])
  useEffect(() => { localStorage.setItem(NOTE_KEY, JSON.stringify(notes)) }, [notes])
  useEffect(() => { if (showAddTask  && addTitleRef.current)  addTitleRef.current.focus()  }, [showAddTask])
  useEffect(() => { if (editTask     && editTitleRef.current) editTitleRef.current.focus() }, [editTask])
  useEffect(() => { if (showAddNote  && noteTitleRef.current) noteTitleRef.current.focus() }, [showAddNote])

  // ── task actions ─────────────────────────────────────────────────────────
  const openAddTask = () => {
    setNewTitle(''); setNewDesc(''); setNewPriority('medium')
    setNewCategory('work'); setNewDueDate('')
    setShowAddTask(true)
  }

  const addTask = () => {
    if (!newTitle.trim()) return
    const t = {
      id: generateId(), title: newTitle.trim(), text: newDesc.trim(),
      completed: false, priority: newPriority, category: newCategory,
      dueDate: newDueDate || null, createdAt: new Date().toISOString(),
    }
    setTasks(prev => [t, ...prev])
    setShowAddTask(false)
  }

  const openEditTask = task => {
    setEditTask(task)
    setEditTitle(task.title || task.text)
    setEditDesc(task.title ? task.text : '')
    setEditPriority(task.priority)
    setEditCategory(task.category)
    setEditDueDate(task.dueDate || '')
  }

  const saveEditTask = () => {
    if (!editTitle.trim()) return
    const updated = { ...editTask, title: editTitle.trim(), text: editDesc.trim(),
      priority: editPriority, category: editCategory, dueDate: editDueDate || null }
    setTasks(prev => prev.map(t => t.id === editTask.id ? updated : t))
    if (selectedTask?.id === editTask.id) setSelectedTask(updated)
    setEditTask(null)
  }

  const toggleTask = id => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
    if (selectedTask?.id === id) setSelectedTask(prev => ({ ...prev, completed: !prev.completed }))
  }

  const doDeleteTask = () => {
    setTasks(prev => prev.filter(t => t.id !== confirmDeleteId))
    if (selectedTask?.id === confirmDeleteId) setSelectedTask(null)
    setConfirmDeleteId(null)
  }

  const clearCompleted = () => setTasks(prev => prev.filter(t => !t.completed))

  // ── note actions ─────────────────────────────────────────────────────────
  const openAddNote = () => { setNoteTitle(''); setNoteBody(''); setNoteColor(0); setShowAddNote(true) }

  const addNote = () => {
    if (!noteTitle.trim()) return
    setNotes(prev => [{ id: generateId(), title: noteTitle.trim(), body: noteBody.trim(),
      color: noteColor, createdAt: new Date().toISOString() }, ...prev])
    setShowAddNote(false)
  }

  const openEditNote = note => { setEditNote(note); setNoteTitle(note.title); setNoteBody(note.body); setNoteColor(note.color) }

  const saveEditNote = () => {
    if (!noteTitle.trim()) return
    const updated = { ...editNote, title: noteTitle.trim(), body: noteBody.trim(), color: noteColor }
    setNotes(prev => prev.map(n => n.id === editNote.id ? updated : n))
    if (selectedNote?.id === editNote.id) setSelectedNote(updated)
    setEditNote(null)
  }

  const doDeleteNote = () => {
    setNotes(prev => prev.filter(n => n.id !== confirmDeleteNote))
    if (selectedNote?.id === confirmDeleteNote) setSelectedNote(null)
    setConfirmDeleteNote(null)
  }

  // ── filter + sort ─────────────────────────────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]

  const sortFn = (a, b) => {
    if (sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (sortBy === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return a.dueDate.localeCompare(b.dueDate)
    }
    return new Date(b.createdAt) - new Date(a.createdAt)
  }

  const filtered = tasks.filter(t => {
    if (activeCategory !== 'all' && t.category !== activeCategory) return false
    if (!showCompleted && t.completed) return false
    if (searchQuery && !`${t.title || ''} ${t.text}`.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  }).sort(sortFn)

  const pending   = filtered.filter(t => !t.completed)
  const completed = filtered.filter(t => t.completed)
  const totalDone    = tasks.filter(t => t.completed).length
  const totalPending = tasks.filter(t => !t.completed).length
  const overdue      = tasks.filter(t => !t.completed && t.dueDate && t.dueDate < todayStr).length

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="layout">

      {/* ══════════ LEFT SIDEBAR ══════════ */}
      <aside className="sidebar">
        {/* Nav */}
        <div className="top-nav">
          <button className={`nav-tab ${view === 'tasks' ? 'active' : ''}`} onClick={() => { setView('tasks'); setSelectedTask(null); setSelectedNote(null) }}>
            ☑ Tasks
          </button>
          <button className={`nav-tab ${view === 'notes' ? 'active' : ''}`} onClick={() => { setView('notes'); setSelectedTask(null); setSelectedNote(null) }}>
            📝 Notes
          </button>
        </div>

        {/* Greeting */}
        <div className="sidebar-greeting">
          <div className="greeting">{getGreeting()} ✦</div>
          <div className="subtitle">
            {totalPending === 0 ? 'All clear!' : `${totalPending} task${totalPending > 1 ? 's' : ''} to tackle`}
            {overdue > 0 && <span className="overdue-count"> · {overdue} overdue</span>}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          {[{ num: totalDone, label: 'Done' }, { num: totalPending, label: 'Left' }, { num: tasks.length, label: 'Total' }].map(({ num, label }) => (
            <div key={label} className="stat-box">
              <div className="stat-num">{num}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {view === 'tasks' && (
          <>
            {/* Search */}
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input className="search-input" placeholder="Search..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              {searchQuery && <button className="clear-search" onClick={() => setSearchQuery('')}>✕</button>}
            </div>

            {/* Sort */}
            <div className="sort-wrap">
              <span className="sort-icon">⇅</span>
              <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="created">Newest</option>
                <option value="priority">Priority</option>
                <option value="dueDate">Due date</option>
              </select>
            </div>

            {/* Categories */}
            <div className="cat-list">
              {CATEGORIES.map(c => (
                <button key={c.id}
                  className={`cat-item ${activeCategory === c.id ? 'active' : ''}`}
                  onClick={() => setActiveCategory(c.id)}>
                  <span className="cat-icon">{c.icon}</span>
                  <span className="cat-label">{c.label}</span>
                  <span className="cat-count">
                    {c.id === 'all' ? tasks.filter(t => !t.completed).length
                      : tasks.filter(t => t.category === c.id && !t.completed).length}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {view === 'notes' && (
          <div className="sidebar-notes-info">
            <div className="notes-count">{notes.length} note{notes.length !== 1 ? 's' : ''}</div>
          </div>
        )}

        {/* Add button */}
        <button className="sidebar-add-btn" onClick={view === 'tasks' ? openAddTask : openAddNote}>
          + New {view === 'tasks' ? 'Task' : 'Note'}
        </button>
      </aside>

      {/* ══════════ RIGHT PANEL ══════════ */}
      <main className="main-panel">

        {/* ── TASKS LIST ── */}
        {view === 'tasks' && !selectedTask && (
          <div className="task-list-panel">
            <div className="panel-header">
              <h2 className="panel-title">
                {activeCategory === 'all' ? 'All Tasks' : CATEGORIES.find(c => c.id === activeCategory)?.label}
              </h2>
            </div>

            {pending.length === 0 && completed.length === 0 && (
              <div className="empty">
                <div className="empty-icon">📋</div>
                <p>{searchQuery ? 'No tasks match your search' : 'No tasks yet — click "+ New Task" to add one!'}</p>
              </div>
            )}

            {/* Pending */}
            {pending.map(task => (
              <div key={task.id}
                className="task-row"
                onClick={() => setSelectedTask(task)}>
                <div className={`checkbox ${task.completed ? 'checked' : ''}`}
                  onClick={e => { e.stopPropagation(); toggleTask(task.id) }}>
                  {task.completed ? '✓' : ''}
                </div>
                <div className="task-row-content">
                  <span className="task-row-title">{task.title || task.text}</span>
                  <div className="task-row-meta">
                    <span className="priority-dot" style={{ background: PRIORITY_COLORS[task.priority] }} />
                    {task.dueDate && (
                      <span className={`meta-label due ${task.dueDate < todayStr ? 'overdue' : task.dueDate === todayStr ? 'today' : ''}`}>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="task-row-arrow">›</span>
              </div>
            ))}

            {/* Completed */}
            {completed.length > 0 && (
              <>
                <div className="section-header">
                  <button className="toggle-completed" onClick={() => setShowCompleted(!showCompleted)}>
                    {showCompleted ? '▾' : '▸'} Completed ({completed.length})
                  </button>
                  <button className="clear-btn" onClick={clearCompleted}>Clear all</button>
                </div>
                {showCompleted && completed.map(task => (
                  <div key={task.id} className="task-row completed-row"
                    onClick={() => setSelectedTask(task)}>
                    <div className="checkbox checked"
                      onClick={e => { e.stopPropagation(); toggleTask(task.id) }}>✓</div>
                    <div className="task-row-content">
                      <span className="task-row-title done">{task.title || task.text}</span>
                    </div>
                    <span className="task-row-arrow">›</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── TASK DETAIL ── */}
        {view === 'tasks' && selectedTask && (
          <div className="detail-panel">
            <div className="detail-panel-header">
              <button className="back-btn" onClick={() => setSelectedTask(null)}>‹ Back</button>
              <div className="detail-panel-actions">
                <button className="action-btn edit-btn" onClick={() => { openEditTask(selectedTask); setSelectedTask(null) }}>✎ Edit</button>
                <button className="action-btn delete-btn" onClick={() => { setConfirmDeleteId(selectedTask.id); setSelectedTask(null) }}>🗑 Delete</button>
              </div>
            </div>

            <div className="detail-badge" style={{ background: PRIORITY_COLORS[selectedTask.priority] }}>
              {selectedTask.priority}
            </div>

            <h1 className="detail-title">{selectedTask.title || selectedTask.text}</h1>

            {selectedTask.title && selectedTask.text && (
              <p className="detail-desc">{selectedTask.text}</p>
            )}

            <div className="detail-meta-grid">
              <div className="detail-meta-item">
                <span className="detail-meta-label">Category</span>
                <span className="detail-meta-value">
                  {CATEGORIES.find(c => c.id === selectedTask.category)?.icon} {CATEGORIES.find(c => c.id === selectedTask.category)?.label}
                </span>
              </div>
              <div className="detail-meta-item">
                <span className="detail-meta-label">Status</span>
                <span className="detail-meta-value">{selectedTask.completed ? '✓ Done' : '○ Pending'}</span>
              </div>
              {selectedTask.dueDate && (
                <div className="detail-meta-item">
                  <span className="detail-meta-label">Due date</span>
                  <span className={`detail-meta-value ${selectedTask.dueDate < todayStr ? 'overdue' : selectedTask.dueDate === todayStr ? 'today' : ''}`}>
                    {formatDate(selectedTask.dueDate)}
                  </span>
                </div>
              )}
              <div className="detail-meta-item">
                <span className="detail-meta-label">Added</span>
                <span className="detail-meta-value">{timeAgo(selectedTask.createdAt)}</span>
              </div>
            </div>

            <button className="submit-btn"
              style={{ background: selectedTask.completed ? 'rgba(255,255,255,0.06)' : '#7b6ff0', marginTop: 24 }}
              onClick={() => toggleTask(selectedTask.id)}>
              {selectedTask.completed ? 'Mark as Pending' : '✓ Mark as Complete'}
            </button>
          </div>
        )}

        {/* ── NOTES GRID ── */}
        {view === 'notes' && !selectedNote && (
          <div className="task-list-panel">
            <div className="panel-header">
              <h2 className="panel-title">My Notes</h2>
            </div>

            {notes.length === 0 && (
              <div className="empty">
                <div className="empty-icon">📝</div>
                <p>No notes yet — click "+ New Note" to add a reminder!</p>
              </div>
            )}

            {notes.map(note => (
              <div key={note.id} className="note-row" style={{ borderLeftColor: NOTE_COLORS[note.color] }}
                onClick={() => setSelectedNote(note)}>
                <div className="note-row-dot" style={{ background: NOTE_COLORS[note.color] }} />
                <div className="task-row-content">
                  <span className="task-row-title">{note.title}</span>
                  {note.body && <span className="note-row-preview">{note.body}</span>}
                </div>
                <span className="task-row-arrow">›</span>
              </div>
            ))}
          </div>
        )}

        {/* ── NOTE DETAIL ── */}
        {view === 'notes' && selectedNote && (
          <div className="detail-panel" style={{ background: NOTE_COLORS[selectedNote.color] }}>
            <div className="detail-panel-header">
              <button className="back-btn" onClick={() => setSelectedNote(null)}>‹ Back</button>
              <div className="detail-panel-actions">
                <button className="action-btn edit-btn" onClick={() => { openEditNote(selectedNote); setSelectedNote(null) }}>✎ Edit</button>
                <button className="action-btn delete-btn" onClick={() => { setConfirmDeleteNote(selectedNote.id); setSelectedNote(null) }}>🗑 Delete</button>
              </div>
            </div>
            <span className="note-detail-tag">📝 Note</span>
            <h1 className="detail-title" style={{ marginTop: 12 }}>{selectedNote.title}</h1>
            {selectedNote.body && <p className="note-detail-body">{selectedNote.body}</p>}
            <p className="note-detail-time">Added {timeAgo(selectedNote.createdAt)}</p>
          </div>
        )}
      </main>

      {/* ══ ADD TASK MODAL ══ */}
      {showAddTask && (
        <div className="overlay" onClick={() => setShowAddTask(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">New Task</div>
              <button className="modal-close" onClick={() => setShowAddTask(false)}>✕</button>
            </div>
            <TaskForm title={newTitle} setTitle={setNewTitle} desc={newDesc} setDesc={setNewDesc}
              priority={newPriority} setPriority={setNewPriority} category={newCategory} setCategory={setNewCategory}
              dueDate={newDueDate} setDueDate={setNewDueDate} onSubmit={addTask}
              submitLabel="Add Task" titleRef={addTitleRef} />
          </div>
        </div>
      )}

      {/* ══ EDIT TASK MODAL ══ */}
      {editTask && (
        <div className="overlay" onClick={() => setEditTask(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Edit Task</div>
              <button className="modal-close" onClick={() => setEditTask(null)}>✕</button>
            </div>
            <TaskForm title={editTitle} setTitle={setEditTitle} desc={editDesc} setDesc={setEditDesc}
              priority={editPriority} setPriority={setEditPriority} category={editCategory} setCategory={setEditCategory}
              dueDate={editDueDate} setDueDate={setEditDueDate} onSubmit={saveEditTask}
              submitLabel="Save Changes" titleRef={editTitleRef} />
          </div>
        </div>
      )}

      {/* ══ ADD NOTE MODAL ══ */}
      {showAddNote && (
        <div className="overlay" onClick={() => setShowAddNote(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">New Note</div>
              <button className="modal-close" onClick={() => setShowAddNote(false)}>✕</button>
            </div>
            <input ref={noteTitleRef} className="task-input" placeholder="Note title *"
              value={noteTitle} onChange={e => setNoteTitle(e.target.value)} />
            <textarea className="note-textarea" placeholder="Write your reminder here..."
              value={noteBody} onChange={e => setNoteBody(e.target.value)} rows={5} />
            <label className="form-label">Color</label>
            <div className="color-row">
              {NOTE_COLORS.map((c, i) => (
                <button key={i} className={`color-dot ${noteColor === i ? 'color-dot-active' : ''}`}
                  style={{ background: c }} onClick={() => setNoteColor(i)} />
              ))}
            </div>
            <button className="submit-btn" onClick={addNote}>Add Note</button>
          </div>
        </div>
      )}

      {/* ══ EDIT NOTE MODAL ══ */}
      {editNote && (
        <div className="overlay" onClick={() => setEditNote(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Edit Note</div>
              <button className="modal-close" onClick={() => setEditNote(null)}>✕</button>
            </div>
            <input className="task-input" placeholder="Note title *"
              value={noteTitle} onChange={e => setNoteTitle(e.target.value)} />
            <textarea className="note-textarea" placeholder="Write your reminder here..."
              value={noteBody} onChange={e => setNoteBody(e.target.value)} rows={5} />
            <label className="form-label">Color</label>
            <div className="color-row">
              {NOTE_COLORS.map((c, i) => (
                <button key={i} className={`color-dot ${noteColor === i ? 'color-dot-active' : ''}`}
                  style={{ background: c }} onClick={() => setNoteColor(i)} />
              ))}
            </div>
            <button className="submit-btn" onClick={saveEditNote}>Save Note</button>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM (task) ══ */}
      {confirmDeleteId && (
        <div className="overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">🗑</div>
            <div className="confirm-title">Delete this task?</div>
            <p className="confirm-sub">This can't be undone.</p>
            <div className="confirm-btns">
              <button className="confirm-cancel" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="confirm-delete" onClick={doDeleteTask}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM (note) ══ */}
      {confirmDeleteNote && (
        <div className="overlay" onClick={() => setConfirmDeleteNote(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">📝</div>
            <div className="confirm-title">Delete this note?</div>
            <p className="confirm-sub">This can't be undone.</p>
            <div className="confirm-btns">
              <button className="confirm-cancel" onClick={() => setConfirmDeleteNote(null)}>Cancel</button>
              <button className="confirm-delete" onClick={doDeleteNote}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
