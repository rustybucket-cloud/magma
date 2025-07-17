import { useNavigate } from "react-router"
import { motion } from "motion/react"
import { FolderOpen } from "lucide-react"
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FloatingActionButton } from "@/components/floating-action-button"
import { useNotes } from "@/contexts/NotesContext"

export default function Home() {
  const navigate = useNavigate()
  const { notes, notesFolder, selectFolder } = useNotes()

  const handleNoteClick = (noteTitle: string) => {
    navigate(`/note?title=${noteTitle}`)
  }

  // Show folder selection if no folder is selected
  if (!notesFolder) {
    return (
      <motion.main 
        className="container flex flex-col items-center justify-center min-h-screen"
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
      </motion.main>
    )
  }
  return (
    <motion.main 
      className="container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div>
          <h1 className="text-3xl font-semibold">Home</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {notesFolder}
          </p>
        </div>
        <Button variant="outline" onClick={selectFolder}>
          <FolderOpen className="h-4 w-4 mr-2" />
          Change Folder
        </Button>
      </motion.div>
      
      <motion.div 
        className="flex gap-4 items-end mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Input placeholder="Search notes..." className="h-12 px-4 py-2 max-w-md" />
        <Select>
          <SelectTrigger className="w-[180px] h-12 px-4 py-2 max-w-md">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="work">Work</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>
      
      {notes.length === 0 ? (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <p className="text-muted-foreground mb-4">No notes found in this folder</p>
          <p className="text-sm text-muted-foreground">
            Click the + button to create your first note
          </p>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
            {notes.map((note, index) => (
              <motion.div
                key={note.title}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.3, 
                  delay: 0.4 + (index * 0.1),
                  ease: "easeOut"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  whileHover={{ 
                    scale: 1.02, 
                    y: -2,
                    transition: { duration: 0.2 }
                  }}
                >
                  <Card 
                    className="volcanic-card cursor-pointer shadow-sm hover:shadow-lg transition-shadow"
                    onClick={() => handleNoteClick(note.title)}
                  >
                    <CardHeader>
                      <CardTitle className="text-xl">{note.title}</CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {note.content.substring(0, 100)}...
                      </p>
                    </CardHeader>
                    <CardFooter>
                      <span className="text-xs text-muted-foreground">
                        {note.updatedAt.toLocaleDateString()}
                      </span>
                    </CardFooter>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        )}
      
      <FloatingActionButton />
    </motion.main>
  );
}
