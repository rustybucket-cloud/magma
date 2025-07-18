import { motion } from "motion/react";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { type Note } from "@/types";
import { useNavigate } from "react-router";

export default function NoteCard({ note }: { note: Note }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (note.path) {
      // Use path for notes loaded from file system
      navigate(`/note?title=${encodeURIComponent(note.title)}&path=${encodeURIComponent(note.path)}`);
    } else {
      // Fallback for notes without path
      navigate(`/note?title=${encodeURIComponent(note.title)}`);
    }
  };

  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        y: -2,
        transition: { duration: 0.2 },
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger>
          <Card
            className="volcanic-card cursor-pointer shadow-sm hover:shadow-lg transition-shadow"
            onClick={handleClick}
          >
            <CardHeader>
              <CardTitle className="text-xl">{note.title}</CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {note.content.replace(/---[\s\S]*?---/g, "").length > 100
                  ? `${note.content
                      .replace(/---[\s\S]*?---/g, "")
                      .substring(0, 100)}...`
                  : note.content.replace(/---[\s\S]*?---/g, "")}
              </p>
            </CardHeader>
            <CardFooter>
              <span className="text-xs text-muted-foreground">
                {note.updatedAt.toLocaleDateString()}
              </span>
            </CardFooter>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleClick}>Open</ContextMenuItem>
          <ContextMenuItem onClick={() => console.log("Rename")}>
            Rename
          </ContextMenuItem>
          <ContextMenuItem onClick={() => console.log("Delete")}>
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </motion.div>
  );
}
