import { useState } from "react"
import { useNavigate } from "react-router"
import { motion } from "motion/react"
import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FloatingActionButton } from "@/components/floating-action-button"
import { type Note } from "@/types"

export default function Home() {
  const navigate = useNavigate()
  const [notes] = useState<Note[]>([
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
  ])

  const handleNoteClick = (noteId: string) => {
    navigate(`/note/${noteId}`)
  }
  return (
    <motion.main 
      className="container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.h1 
        className="text-3xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        Home
      </motion.h1>
      
      <motion.div 
        className="flex gap-4 items-end"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Input placeholder="Search..." className="h-12 px-4 py-2 mt-4 max-w-md" />
        <Select>
          <SelectTrigger className="w-[180px] h-12 px-4 py-2 mt-4 max-w-md">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="work">Work</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>
      
      <motion.div 
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {notes.map((note, index) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.3, 
              delay: 0.4 + (index * 0.1),
              ease: "easeOut"
            }}
            whileHover={{ 
              scale: 1.02, 
              y: -4,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="volcanic-card cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-200"
              onClick={() => handleNoteClick(note.id)}
            >
              <CardHeader>
                <CardTitle className="text-xl">{note.title}</CardTitle>
              </CardHeader>
              <CardFooter>
                {note.category.name}
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      
      <FloatingActionButton />
    </motion.main>
  );
}
