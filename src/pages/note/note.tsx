import { useNavigate, useParams } from "react-router";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteEditor } from "@/components/note-editor";
import { ArrowLeft } from "lucide-react";
import { useNotes } from "@/contexts/NotesContext";

export default function NotePage() {
  const { notePath } = useParams<{ notePath: string }>();
  const path = notePath ? decodeURIComponent(notePath) : undefined;
  return <NotePageChild key={path} />;
}

// React router reuses the component when switching routes, so we need to use a key to force a re-render
function NotePageChild() {
  const navigate = useNavigate();
  const { notePath } = useParams<{ notePath: string }>();
  const path = notePath ? decodeURIComponent(notePath) : undefined;
  const { saveNote, loadNoteByPath, renameNote } = useNotes();
  const [content, setContent] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("Untitled");
  const [internalTitle, setInternalTitle] = useState<string>("Untitled");

  useEffect(() => {
    if (path) {
      // Load note by file path
      loadNoteByPath(path)
        .then((note) => {
          if (note) {
            setContent(note.content || "");
            setTitle(note.title);
            setInternalTitle(note.title);
          } else {
            setContent(""); // Set empty content if note not found
            setTitle("Untitled");
            setInternalTitle("Untitled");
          }
        })
        .catch((error) => {
          console.error("Error loading note by path:", error);
          setContent("");
          setTitle("Untitled");
          setInternalTitle("Untitled");
        });
    }
  }, [path, loadNoteByPath]);

  const handleTitleChange = async () => {
    try {
      await renameNote(title, internalTitle);
      setTitle(internalTitle);
    } catch (error) {
      console.error("Error renaming note:", error);
    }
  };

  const handleContentChange = (newContent: string) => {
    if (content == null) return;
    saveNote(title, newContent);
  };

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
        className="flex items-center gap-4 p-4 border-b bg-background rounded-xl"
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
            onBlur={() => handleTitleChange()}
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
        {content !== null ? (
          <NoteEditor
            onContentChange={handleContentChange}
            initialContent={content || ""}
            path={path ?? undefined}
            key={path}
          />
        ) : null}
      </motion.div>
    </motion.div>
  );
}
