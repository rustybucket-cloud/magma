import { useNavigate, useSearchParams } from "react-router"
import { useState, useEffect, useCallback } from "react"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NoteEditor } from "@/components/note-editor"
import { ArrowLeft } from "lucide-react"
import { useNotes } from "@/contexts/NotesContext"

export default function NotePage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const title = searchParams.get('title') ?? 'Untitled'
  const { saveNote, loadNote, renameNote } = useNotes()
  const [content, setContent] = useState<string | null>(null)
  const [internalTitle, setInternalTitle] = useState<string>(title ?? '')

  useEffect(() => {
    if (title) {
      // Load existing note from file system
      loadNote(title).then(note => {
        console.log(note)
        if (note) {
          setContent(note.content)
        }
      })
    }
  }, [title, loadNote])

  console.log(content)

  const setTitle = async () => {
    try {
      await renameNote(title, internalTitle)
      setSearchParams({ title: internalTitle })
    } catch (error) {
      console.error('Error renaming note:', error)
    }
  }

  const handleContentChange = (newContent: string) => {
    console.log(newContent)
    if (content == null) return
    saveNote(title, newContent)
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
            value={internalTitle}
            onChange={(e) => setInternalTitle(e.target.value)}
            placeholder="Untitled"
            className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0"
            onBlur={() => setTitle()}
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
        {content ? (
          <NoteEditor 
            key={title || 'new'}
            onContentChange={handleContentChange}
            initialContent={content}
          />
        ) : null}
      </motion.div>
    </motion.div>
  )
}
