import { motion } from "motion/react";
import { FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FloatingActionButton } from "@/components/floating-action-button";
import { useNotes } from "@/contexts/NotesContext";
import NoteCard from "./components/note-card";
import { useMemo } from "react";
import { Note } from "@/types";

export default function Home() {
  const { notes, notesFolder, selectFolder } = useNotes();

  const notesByDate = useMemo(() => {
    const dates = new Map();
    notes.forEach((note) => {
      const date = note.updatedAt.toDateString();
      if (!dates.has(date)) {
        dates.set(date, []);
      }
      dates.get(date)?.push(note);
    });
    return dates;
  }, [notes]);

  // Show folder selection if no folder is selected
  if (!notesFolder) {
    return (
      <motion.div
        className="container flex flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="text-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-semibold mb-2">Welcome to Magma</h1>
            <p className="text-muted-foreground mb-6">
              Select a folder where your notes will be stored
            </p>
          </div>
          <Button onClick={selectFolder} size="lg">
            <FolderOpen className="h-5 w-5 mr-2" />
            Select Notes Folder
          </Button>
        </motion.div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container max-w-screen-md mt-4"
    >
      <motion.div
        className="flex flex-col gap-4 w-full mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Input placeholder="Search notes..." className="h-12 px-4 py-2" />
      </motion.div>

      {notes.length === 0 ? (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <p className="text-muted-foreground mb-4">
            No notes found in this folder
          </p>
          <p className="text-sm text-muted-foreground">
            Click the + button to create your first note
          </p>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {Array.from(notesByDate.entries()).map(([date, notes]) => (
            <>
              <h3 key={date} className="text-sm">
                {date}
              </h3>
              {notes.map((note: Note, noteIndex: number) => (
                <motion.div
                  key={note.title}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.4 + noteIndex * 0.1,
                    ease: "easeOut",
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <NoteCard note={note} />
                </motion.div>
              ))}
            </>
          ))}
        </motion.div>
      )}

      <FloatingActionButton />
    </motion.div>
  );
}
