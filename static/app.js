const noteInput = document.getElementById("note-input");
const charCount = document.getElementById("char-count");
const saveBtn = document.getElementById("save-btn");
const searchInput = document.getElementById("search-input");
const notesList = document.getElementById("notes-list");
const emptyState = document.getElementById("empty-state");
const noteTemplate = document.getElementById("note-template");
const themeToggle = document.getElementById("theme-toggle");

let notes = [];
let editingNoteId = null;

const THEME_KEY = "quick-notes-theme";

function formatDate(dateString) {
  const date = new Date(dateString.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }
  return date.toLocaleString();
}

function updateCounter() {
  charCount.textContent = `${noteInput.value.length} characters`;
}

function applySavedTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark") {
    document.body.classList.add("dark");
  }
}

function toggleTheme() {
  document.body.classList.toggle("dark");
  const active = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem(THEME_KEY, active);
}

async function fetchNotes() {
  const response = await fetch("/notes");
  if (!response.ok) {
    throw new Error("Failed to fetch notes");
  }
  notes = await response.json();
  renderNotes();
}

async function saveNote() {
  const content = noteInput.value.trim();
  if (!content) {
    alert("Please write a note before saving.");
    return;
  }

  const method = editingNoteId ? "PUT" : "POST";
  const endpoint = editingNoteId ? `/notes/${editingNoteId}` : "/notes";

  const response = await fetch(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    alert("Could not save note.");
    return;
  }

  editingNoteId = null;
  noteInput.value = "";
  updateCounter();
  saveBtn.textContent = "Save Note";
  await fetchNotes();
}

async function deleteNote(noteId) {
  const confirmed = confirm("Delete this note?");
  if (!confirmed) {
    return;
  }

  const response = await fetch(`/notes/${noteId}`, { method: "DELETE" });
  if (!response.ok) {
    alert("Could not delete note.");
    return;
  }

  if (editingNoteId === noteId) {
    editingNoteId = null;
    noteInput.value = "";
    saveBtn.textContent = "Save Note";
    updateCounter();
  }

  await fetchNotes();
}

async function copyNote(content) {
  try {
    await navigator.clipboard.writeText(content);
    alert("Note copied.");
  } catch (error) {
    alert("Clipboard copy failed.");
  }
}

function beginEdit(note) {
  editingNoteId = note.id;
  noteInput.value = note.content;
  saveBtn.textContent = "Update Note";
  updateCounter();
  noteInput.focus();
}

function renderNotes() {
  const query = searchInput.value.trim().toLowerCase();
  const filteredNotes = notes.filter((note) =>
    note.content.toLowerCase().includes(query)
  );

  notesList.innerHTML = "";

  if (filteredNotes.length === 0) {
    emptyState.style.display = "block";
    emptyState.textContent = query
      ? "No notes matched your search."
      : "No notes yet. Save your first one.";
    return;
  }

  emptyState.style.display = "none";

  filteredNotes.forEach((note, index) => {
    const fragment = noteTemplate.content.cloneNode(true);
    const noteItem = fragment.querySelector(".note-item");

    noteItem.style.animationDelay = `${index * 45}ms`;
    fragment.querySelector(".note-content").textContent = note.content;
    fragment.querySelector(".note-created").textContent = `Created: ${formatDate(note.created_at)}`;
    fragment.querySelector(".note-updated").textContent = `Updated: ${formatDate(note.updated_at)}`;

    fragment.querySelector(".edit-btn").addEventListener("click", () => beginEdit(note));
    fragment.querySelector(".delete-btn").addEventListener("click", () => deleteNote(note.id));
    fragment.querySelector(".copy-btn").addEventListener("click", () => copyNote(note.content));

    notesList.appendChild(fragment);
  });
}

noteInput.addEventListener("input", updateCounter);
saveBtn.addEventListener("click", saveNote);
searchInput.addEventListener("input", renderNotes);
themeToggle.addEventListener("click", toggleTheme);

applySavedTheme();
updateCounter();
fetchNotes().catch(() => {
  emptyState.style.display = "block";
  emptyState.textContent = "Could not load notes. Refresh to retry.";
});
