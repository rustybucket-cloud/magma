import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useNotes } from "@/contexts/NotesContext";
import { cn } from "@/lib/utils";
import Mountain from "@/components/icons/mountain";

interface FloatingActionButtonProps {
  className?: string;
}

export function FloatingActionButton({ className }: FloatingActionButtonProps) {
  const navigate = useNavigate();
  const { createNote } = useNotes();

  const handleClick = async () => {
    try {
      const notePath = await createNote();
      if (notePath) {
        navigate(`/note/${encodeURIComponent(notePath)}`);
      } else {
        // Fallback - create a default path
        const timestamp = Date.now();
        navigate(`/note/${encodeURIComponent(`Untitled-${timestamp}.md`)}`);
      }
    } catch (error) {
      console.error("Error creating note:", error);
      // Fallback - create a default path
      const timestamp = Date.now();
      navigate(`/note/${encodeURIComponent(`Untitled-${timestamp}.md`)}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, y: 100 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.8,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      whileHover={{
        scale: 1.1,
        transition: { duration: 0.2 },
      }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        onClick={handleClick}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow",
          className
        )}
        size="icon"
      >
        <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
          <Mountain style={{ width: "40px", height: "40px" }} />
        </motion.div>
        <span className="sr-only">Create new note</span>
      </Button>
    </motion.div>
  );
}
