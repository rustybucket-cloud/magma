import { useNavigate, useParams } from "react-router"
import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NoteEditor } from "@/components/note-editor"
import { ArrowLeft } from "lucide-react"
import { type Note, type Category } from "@/types"

// Mock data - in a real app this would come from a store/API
const mockNotes: Note[] = [
  {
    title: "Note 1",
    content: "This is a note",
    createdAt: new Date(),
    updatedAt: new Date(),
    id: "1",
    category: {
      id: "1",
      name: "Personal",
    },
  },
  {
    title: "Note 2",
    content: "This is another note",
    createdAt: new Date(),
    updatedAt: new Date(),
    id: "2",
    category: {
      id: "2",
      name: "Work",
    },
  },
]

export default function NotePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [existingNote, setExistingNote] = useState<Note | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const isEditing = Boolean(id)

  useEffect(() => {
    if (id) {
      // In a real app, fetch note by ID from store/API
      const note = mockNotes.find(n => n.id === id)
      if (note) {
        setExistingNote(note)
        setTitle(note.title)
        setContent(note.content)
      }
    }
  }, [id])

  const autoSave = useCallback(() => {
    const defaultCategory: Category = {
      id: "1",
      name: "Personal"
    }

    if (isEditing && existingNote) {
      // Update existing note
      const updatedNote: Note = {
        ...existingNote,
        title,
        content,
        updatedAt: new Date(),
      }
      console.log("Auto-saving note:", updatedNote)
    } else if (title.trim() || content.trim()) {
      // Create new note only if there's content
      const newNote: Note = {
        title: title || "Untitled",
        content,
        category: defaultCategory,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      console.log("Auto-saving new note:", newNote)
    }
  }, [title, content, isEditing, existingNote])

  // Auto-save after 1 second of inactivity
  useEffect(() => {
    const timer = setTimeout(autoSave, 1000)
    return () => clearTimeout(timer)
  }, [autoSave])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
  }

  return (
    <motion.div 
      className="h-screen flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {/* Header */}
      <motion.header 
        className="flex items-center gap-4 p-4 border-b bg-background"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
          className="h-10 w-10"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="sr-only">Back to notes</span>
        </Button>
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled"
            className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0"
          />
        </motion.div>
      </motion.header>

      {/* Note Editor - Full height */}
      <motion.div 
        className="flex-1 overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <NoteEditor 
          initialContent={content}
          onContentChange={handleContentChange}
        />
      </motion.div>
    </motion.div>
  )
}
