import React, { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import EmptyState from "./emptyStateComponent";

// ================= TYPES =================
type Note = {
  id: string;
  title: string;
  description: string;
  date: string;
  lastEdited: string;
  color: string;
  favorite: boolean;
  pinned: boolean;
  tags: string[];
  createdBy: string;
};
type SortableNoteProps = {
  note: Note;
  onEdit: (note: Note) => void;
  onToggleFav: (id: string) => void;
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onClone: (note: Note) => void;
  darkMode: boolean;
};

// ================= SORTABLE CARD =================
function SortableNote({
  note,
  onEdit,
  onToggleFav,
  onDelete,
  onPin,
  onClone,
  darkMode,
}: SortableNoteProps & {
  onDelete: (id: string) => void;
  onPin: (id: string) => void;
  onClone: (note: Note) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      className={`relative rounded-2xl p-5 pr-14 shadow group transition-all hover:shadow-lg ${
        darkMode ? "bg-gray-800 text-white" : `${note.color} text-gray-900`
      }`}
    >
      {/* 🔥 Top-right actions */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 z-20">
        <div className="flex gap-2 justify-end">
          {/* 📌 Pin */}
          {(note.pinned || true) && (
            <div className="group">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPin(note.id);
                }}
                className={`text-sm transition ${
                  note.pinned
                    ? "opacity-100"
                    : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                } hover:scale-110`}
              >
                {note.pinned ? "📌" : "📍"}
              </button>
            </div>
          )}

          {/* ⭐ Favorite */}
          {(note.favorite || true) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFav(note.id);
              }}
              className={`text-sm transition ${
                note.favorite
                  ? "text-yellow-600 opacity-100"
                  : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
              } hover:scale-110`}
            >
              {note.favorite ? "⭐" : "☆"}
            </button>
          )}

          {/* 🗑️ Delete */}
          <div className="group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="text-sm text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition hover:scale-110"
            >
              🗑️
            </button>
          </div>
        </div>
        {/* Row 2 */}
        <div className="flex gap-2 justify-end">
          {/* 📋 Clone */}
          <div className="group">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClone(note);
              }}
              className="text-sm opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition hover:scale-110"
            >
              📋
            </button>
          </div>

          {/* ✏️ Edit */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(note);
            }}
            className="bg-black text-white w-7 h-7 rounded-full text-xs opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition hover:scale-110"
          >
            ✏️
          </button>
        </div>
      </div>

      {/* 🧲 Drag */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab text-xs text-gray-600 mb-2 touch-none"
      >
        ⠿ Drag
      </div>

      {/* Title */}
      <h2 className="text-base font-semibold mb-1">{note.title}</h2>

      {/* Description */}
      <p
        className={`text-sm transition-all ${
          darkMode ? "text-gray-300" : "text-gray-700"
        } line-clamp-3 group-hover:line-clamp-none`}
      >
        {note.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mt-3">
        {note.tags.map((tag, i) => (
          <span
            key={i}
            className={`text-xs px-2 py-0.5 rounded ${
              darkMode ? "bg-white/10" : "bg-black/20"
            }`}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Dates */}
      <div className="mt-3 text-[11px] text-gray-700 opacity-70">
        <div
          className={`mt-3 text-[11px] ${
            darkMode ? "text-gray-400" : "text-gray-700"
          } opacity-70`}
        >
          📅 {note.date}
        </div>
        <div
          className={`mt-3 text-[11px] ${
            darkMode ? "text-gray-400" : "text-gray-700"
          } opacity-70`}
        >
          ✏️ {note.lastEdited}
        </div>
      </div>
      {/* 👤 Center Hover User Badge */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
        <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
          <div className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full shadow-md">
            {note.createdBy}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ================= MAIN APP =================
export default function App() {
  const [language, setLanguage] = useState<string>("en-US");
  const previousTextRef = React.useRef("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [showInfo, setShowInfo] = useState(false);
  const [search, setSearch] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("All");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) return JSON.parse(saved);

    // fallback → auto detect first time only
    const hour = new Date().getHours();
    return hour >= 18 || hour <= 6;
  });
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = React.useRef<any>(null);
  const [appendMode, setAppendMode] = useState(false);
  const [tourStep, setTourStep] = useState<number>(0);
  const [showTour, setShowTour] = useState(false);

  const [spotlight, setSpotlight] = useState<any>(null);

  const [showRegister, setShowRegister] = useState(false);
  const [showAccess, setShowAccess] = useState(false);

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    team: "",
    secret: "",
  });

  const [generatedLink, setGeneratedLink] = useState("");

  useEffect(() => {
    if (!showTour) return;

    const el = document.querySelector(steps[tourStep]?.selector);

    if (el) {
      const rect = el.getBoundingClientRect();

      setSpotlight({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
  }, [tourStep, showTour]);

  useEffect(() => {
    if (!showTour) return;

    const current = document.querySelector(steps[tourStep]?.selector);

    if (current) {
      current.classList.add("ring-4", "ring-blue-400");
    }

    return () => {
      if (current) {
        current.classList.remove("ring-4", "ring-blue-400");
      }
    };
  }, [tourStep, showTour]);

  useEffect(() => {
    const seenTour = localStorage.getItem("seenTour");
    if (seenTour) return;

    if (!showOnboarding) {
      setShowTour(true);
    }
  }, [showOnboarding]);

  const closeTour = () => {
    setShowTour(false);
  };

  useEffect(() => {
    const seen = localStorage.getItem("seenOnboarding");
    if (!seen) {
      setShowOnboarding(true);
    }
  }, []);

  const closeOnboarding = () => {
    localStorage.setItem("seenOnboarding", "true");
    setShowOnboarding(false);
    setShowTour(true); // 👈 start tour
  };

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += text + " ";
        } else {
          interimTranscript += text;
        }
      }

      setForm((prev) => ({
        ...prev,
        description: (
          previousTextRef.current +
          " " +
          finalTranscript +
          interimTranscript
        ).trim(),
      }));
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [language]);

  // persist
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const [form, setForm] = useState<{
    title: string;
    description: string;
    color: string;
    tags: string;
  }>({
    title: "",
    description: "",
    color: "bg-yellow-300",
    tags: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("notes");
    if (saved) {
      setNotes(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  // 📌 Pin
  const togglePin = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    );
  };

  // 🗑️ Delete
  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMic = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      previousTextRef.current = form.description; // ✅ store old text
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };

    if (showModal) {
      window.addEventListener("keydown", handleEsc);
    }

    return () => window.removeEventListener("keydown", handleEsc);
  }, [showModal]);

  useEffect(() => {
    if (!showModal && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [showModal]);

  // ================= FILTER =================
  const filteredNotes = useMemo(() => {
    const filtered = notes.filter((n) => {
      const matchSearch = n.title.toLowerCase().includes(search.toLowerCase());

      const matchTag = selectedTag === "All" || n.tags.includes(selectedTag);

      return matchSearch && matchTag;
    });

    // 📌 pinned first
    return [
      ...filtered.filter((n) => n.pinned),
      ...filtered.filter((n) => !n.pinned),
    ];
  }, [notes, search, selectedTag]);

  // ================= TAGS =================
  const allTags: string[] = [
    "All",
    ...Array.from(new Set(notes.flatMap((n) => n.tags))),
  ];

  // ================= ADD =================
  const handleAdd = () => {
    setEditingNote(null);
    setForm({
      title: "",
      description: "",
      color: "bg-yellow-300",
      tags: "",
    });
    setShowModal(true);
  };

  // ================= EDIT =================
  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setForm({
      title: note.title,
      description: note.description,
      color: note.color,
      tags: note.tags.join(","),
    });
    setShowModal(true);
  };

  // ================= SAVE =================
  const handleSave = () => {
    if (!form.title.trim()) return;

    const tagsArray = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingNote) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === editingNote.id
            ? {
                ...n,
                ...form,
                tags: tagsArray,
                lastEdited: new Date().toLocaleString(),
              }
            : n,
        ),
      );
    } else {
      setNotes((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          title: form.title,
          description: form.description,
          color: form.color,
          tags: tagsArray,
          date: new Date().toLocaleDateString(),
          lastEdited: new Date().toLocaleString(),
          favorite: false,
          pinned: false,
          createdBy: "Yasar",
        },
      ]);
    }

    setShowModal(false);
  };

  const cloneNote = (note: Note) => {
    const newNote: Note = {
      ...note,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      lastEdited: new Date().toLocaleString(),
      pinned: false,
      favorite: false,
    };

    setNotes((prev) => [...prev, newNote]);
  };

  // ================= FAVORITE =================
  const toggleFavorite = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, favorite: !n.favorite } : n)),
    );
  };

  // ================= DRAG =================
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setNotes((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleLanguageChange = (lang: any) => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    setLanguage(lang);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const hour = new Date().getHours();
      const autoDark = hour >= 18 || hour < 6;

      setDarkMode((prev) => {
        // only auto-switch if user didn't manually override
        return JSON.parse(localStorage.getItem("darkMode") ?? "null") === null
          ? autoDark
          : prev;
      });
    }, 60000); // every 1 min

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex h-screen transition-colors duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      {/* Sidebar */}
      <div
        className={`w-20 flex flex-col items-center py-4 shadow ${
          darkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        {/* 👤 Register */}
        <button
          onClick={() => setShowRegister(true)}
          className="mb-3 bg-blue-500 text-white w-10 h-10 rounded-full text-lg hover:scale-105 transition"
        >
          👤
        </button>

        {/* ➕ Add */}
        <button
          onClick={handleAdd}
          className="bg-black text-white w-10 h-10 rounded-full text-xl"
          id="add-btn"
        >
          +
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold whitespace-nowrap">
            SyncNotes
          </h1>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              id="search-input"
              placeholder="Search..."
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${
                darkMode
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-black"
              }`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <button
              onClick={() => setDarkMode((prev) => !prev)}
              id="theme-btn"
              className={`px-3 py-2 rounded-lg text-sm border transition ${
                darkMode
                  ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  : "bg-white hover:bg-gray-200"
              }`}
            >
              {darkMode ? "🌙" : "☀️"}
            </button>
            <button
              onClick={() => setShowInfo(true)}
              className={`px-3 py-2 rounded-lg text-sm border transition ${
                darkMode
                  ? "bg-gray-800 border-gray-700 hover:bg-gray-700"
                  : "bg-white hover:bg-gray-200"
              }`}
            >
              ℹ️
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 flex-wrap mb-6">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                selectedTag === tag
                  ? darkMode
                    ? "bg-white text-black"
                    : "bg-black text-white"
                  : darkMode
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Grid + Drag */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredNotes.map((n) => n.id)}
            strategy={rectSortingStrategy}
          >
            {filteredNotes.length === 0 ? (
              // ✅ CENTERED EMPTY STATE
              <div className="flex items-center justify-center h-[70vh] w-full">
                <EmptyState onAdd={handleAdd} darkMode={darkMode} />
              </div>
            ) : (
              // ✅ NORMAL GRID
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredNotes.map((note) => (
                  <SortableNote
                    key={note.id}
                    note={note}
                    onEdit={handleEdit}
                    onToggleFav={toggleFavorite}
                    onDelete={deleteNote}
                    onPin={togglePin}
                    onClone={cloneNote}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </DndContext>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className={`w-full max-w-md  shadow-xl overflow-hidden ${
            darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
          }`}
        >
          {/* 🔥 Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-lg font-semibold">
              {editingNote ? "Edit Note" : "Add Note"}
            </h2>

            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-black text-lg"
            >
              ✖
            </button>
          </div>

          {/* 🔥 Body */}
          <div className="p-5 space-y-4">
            {/* Title + Language (Top Row) */}
            <div className="flex gap-3 items-end">
              {/* Title */}
              <div className="flex-1">
                <label className="text-xs text-gray-500 mb-1 block">
                  Title
                </label>
                <input
                  placeholder="Enter title..."
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${
                    darkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-black"
                  }`}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Language */}
              <div className="w-32">
                <label className="text-xs text-gray-500 mb-1 block">Lang</label>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description + Mic */}
            <div className="relative">
              <label className="text-xs text-gray-500 mb-1 block">
                Description
              </label>

              <textarea
                placeholder={placeholders[language] || "Speak or type..."}
                className={`w-full border rounded-lg px-3 py-2 pr-10 text-sm resize-none ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-black"
                }`}
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              {/* 🎤 Mic */}
              <button
                type="button"
                onClick={handleMic}
                className={`absolute right-3 top-9 text-lg transition ${
                  isListening
                    ? "text-red-500 animate-pulse scale-110"
                    : "text-gray-400 hover:text-black"
                }`}
              >
                🎤
              </button>
            </div>

            {/* Tags */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tags</label>
              <input
                placeholder="tag1, tag2..."
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${
                  darkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-black"
                }`}
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </div>

            {/* Colors */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">
                Choose Color
              </label>

              <div className="flex gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full ${c} transition-all ${
                      form.color === c
                        ? "ring-2 ring-black scale-110"
                        : "hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* 🔥 Footer */}
          <div
            className={`flex gap-3 p-4 border-t ${
              darkMode ? "border-gray-700 bg-gray-800" : "bg-gray-50"
            }`}
          >
            {/* Cancel */}
            <button
              onClick={() => setShowModal(false)}
              className={`w-full py-2 rounded-lg border text-sm transition ${
                darkMode
                  ? "border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Cancel
            </button>

            {/* Save */}
            <button
              onClick={handleSave}
              className={`w-full py-2 rounded-lg text-sm font-medium transition ${
                darkMode
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              Save
            </button>
          </div>
        </div>
      )}
      {showInfo && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-lg rounded-xl shadow-xl ${
              darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b">
              <h2 className="text-lg font-semibold">App Features</h2>
              <button onClick={() => setShowInfo(false)}>✖</button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3 text-sm leading-relaxed">
              <p>📝 Create, edit, and delete notes easily</p>
              <p>📌 Pin important notes to the top</p>
              <p>⭐ Mark notes as favorites</p>
              <p>📋 Clone notes instantly</p>
              <p>🎤 Voice typing with multiple languages</p>
              <p>🔍 Search notes by title</p>
              <p>🏷️ Filter notes by tags</p>
              <p>🎨 Choose different note colors</p>
              <p>📅 Track created & last edited time</p>
              <p>🧲 Drag & drop to reorder notes</p>
              <p>🌙 Dark / Light mode toggle</p>
              <p>💾 Auto-save using local storage</p>
            </div>

            {/* Footer */}
            <div className="p-4 border-t">
              <button
                onClick={() => setShowInfo(false)}
                className="w-full py-2 rounded-lg bg-black text-white"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md rounded-xl p-6 ${
              darkMode ? "bg-gray-800 text-white" : "bg-white"
            }`}
          >
            <h2 className="text-xl font-bold mb-3">Welcome 👋</h2>

            <p className="text-sm mb-4">
              This is your smart sticky notes board. Here’s what you can do:
            </p>

            <ul className="text-sm space-y-2">
              <li>📝 Create & edit notes</li>
              <li>📌 Pin important notes</li>
              <li>⭐ Mark favorites</li>
              <li>🎤 Voice typing</li>
              <li>🧲 Drag & reorder</li>
            </ul>

            <button
              onClick={closeOnboarding}
              className="mt-5 w-full py-2 rounded-lg bg-black text-white"
            >
              Get Started 🚀
            </button>
          </div>
        </div>
      )}
      {showTour && spotlight && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/70" />

          {/* Highlight cut-out */}
          <div
            className="absolute border-2 border-blue-400 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] transition-all duration-300"
            style={{
              top: spotlight.top - 6,
              left: spotlight.left - 6,
              width: spotlight.width + 12,
              height: spotlight.height + 12,
            }}
          />
        </div>
      )}
      {showTour && spotlight && (
        <div
          className="fixed z-50 bg-black text-white px-4 py-3 rounded-lg shadow-lg w-64"
          style={{
            top: spotlight.top + spotlight.height + 12,
            left: spotlight.left,
          }}
        >
          <p className="text-sm">{steps[tourStep].text}</p>

          <div className="flex justify-between mt-2">
            <button
              onClick={() => setShowTour(false)}
              className="text-xs opacity-70"
            >
              Skip
            </button>

            <button
              onClick={() => {
                if (tourStep < steps.length - 1) {
                  setTourStep(tourStep + 1);
                } else {
                  localStorage.setItem("seenTour", "true");
                  setShowTour(false);
                }
              }}
              className="text-xs font-semibold"
            >
              Next →
            </button>
          </div>

          {/* Step indicator */}
          <p className="text-[10px] opacity-70 mt-1">
            Step {tourStep + 1} / {steps.length}
          </p>
        </div>
      )}
      {showRegister && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-md rounded-xl shadow-xl ${
              darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b">
              <h2 className="text-lg font-semibold">Create Workspace</h2>
              <button onClick={() => setShowRegister(false)}>✖</button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <input
                placeholder="Your Name"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
              />

              <input
                placeholder="Email"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm({ ...userForm, email: e.target.value })
                }
              />

              <input
                placeholder="Team / Workspace Name"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={userForm.team}
                onChange={(e) =>
                  setUserForm({ ...userForm, team: e.target.value })
                }
              />

              <input
                placeholder="Secret Code"
                type="password"
                className="w-full border rounded-lg px-3 py-2 text-sm"
                value={userForm.secret}
                onChange={(e) =>
                  setUserForm({ ...userForm, secret: e.target.value })
                }
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t">
              <button
                onClick={() => {
                  const link = `https://yoursite.com/board/${Date.now()}`;
                  setGeneratedLink(link);
                }}
                className="w-full py-2 rounded-lg bg-blue-600 text-white"
              >
                Generate Link 🔗
              </button>
            </div>

            {/* Link Preview */}
            {generatedLink && (
              <div className="p-4 border-t text-sm">
                <p className="mb-2">Share this link:</p>
                <div className="flex gap-2">
                  <input
                    value={generatedLink}
                    readOnly
                    className="flex-1 border px-2 py-1 rounded"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(generatedLink)}
                    className="px-2 bg-black text-white rounded"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {showAccess && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold mb-3">Enter Secret Code 🔐</h2>

            <input
              type="password"
              placeholder="Enter code..."
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
            />

            <button className="w-full bg-black text-white py-2 rounded-lg">
              Access Board
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const COLORS = [
  "bg-yellow-200",
  "bg-green-200",
  "bg-blue-200",
  "bg-pink-200",
  "bg-purple-200",
  "bg-orange-200",
];

const LANGUAGES = [
  { label: "English", code: "en-US" },
  { label: "हिंदी", code: "hi-IN" },
  { label: "தமிழ்", code: "ta-IN" },
  { label: "తెలుగు", code: "te-IN" },
  { label: "മലയാളം", code: "ml-IN" },
  { label: "ಕನ್ನಡ", code: "kn-IN" },
  { label: "বাংলা", code: "bn-IN" },
  { label: "ગુજરાતી", code: "gu-IN" },
  { label: "मराठी", code: "mr-IN" },
  { label: "ਪੰਜਾਬੀ", code: "pa-IN" },
  { label: "ଓଡ଼ିଆ", code: "or-IN" },
  { label: "অসমীয়া", code: "as-IN" },
  { label: "اردو", code: "ur-IN" },
  { label: "संस्कृत", code: "sa-IN" },
  { label: "नेपाली", code: "ne-NP" },
  { label: "සිංහල", code: "si-LK" },
  { label: "தமிழ் (SL)", code: "ta-LK" },
  { label: "English (UK)", code: "en-GB" },
];

const placeholders: Record<string, string> = {
  "en-US": "Speak something...",
  "hi-IN": "कुछ बोलिए...",
  "ta-IN": "ஏதாவது பேசுங்கள்...",
  "te-IN": "ఏదైనా మాట్లాడండి...",
  "ml-IN": "എന്തെങ്കിലും പറയൂ...",
};

const steps = [
  { text: "Click here to add a new note ➕", selector: "#add-btn" },
  { text: "Search your notes here 🔍", selector: "#search-input" },
  { text: "Toggle dark mode 🌙", selector: "#theme-btn" },
];
