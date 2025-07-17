import { useNavigate, useParams } from "react-router"
import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NoteEditor } from "@/components/note-editor"
import { ArrowLeft } from "lucide-react"
import { useNotes } from "@/contexts/NotesContext"

export default function NotePage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { saveNote, loadNote, createNote } = useNotes()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(id || null)

  useEffect(() => {
    if (id) {
      // Load existing note from file system
      loadNote(id).then(note => {
        if (note) {
          setTitle(note.title)
          setContent(note.content)
          setCurrentNoteId(id)
        }
      })
    }
  }, [id, loadNote])

  const autoSave = useCallback(async () => {
    if (title.trim() || content.trim()) {
      try {
        if (currentNoteId) {
          // Update existing note
          await saveNote(currentNoteId, title || "Untitled", content)
        } else {
          // Create new note if we don't have an ID yet
          const newNoteId = await createNote()
          if (newNoteId) {
            setCurrentNoteId(newNoteId)
            await saveNote(newNoteId, title || "Untitled", content)
            // Update URL to reflect the new note ID
            navigate(`/note/${newNoteId}`, { replace: true })
          }
        }
      } catch (error) {
        console.error("Error auto-saving note:", error)
      }
    }
  }, [currentNoteId, title, content, saveNote, createNote, navigate])

  // Auto-save after 2 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(autoSave, 2000)
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
          key={currentNoteId || 'new'}
          onContentChange={handleContentChange}
        />
      </motion.div>
    </motion.div>
  )
}
