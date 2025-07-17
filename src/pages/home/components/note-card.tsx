import { useState, useRef, useEffect } from "react";
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
  const [isRenaming, setIsRenaming] = useState(false);
  const cardTitleRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (isRenaming) return;
    navigate(`/note?title=${note.title}`);
  };

  useEffect(() => {
    if (cardTitleRef.current && isRenaming) {
      requestAnimationFrame(() => {
        cardTitleRef.current?.focus();
      });
    }
  }, [isRenaming]);

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
              <CardTitle
                className="text-xl"
                contentEditable={isRenaming}
                ref={cardTitleRef}
                onClick={(e) => {
                  if (isRenaming) {
                    e.stopPropagation();
                    e.preventDefault();
                  }
                }}
                onBlur={(e) => {
                  console.log(e.target.textContent);
                  setIsRenaming(false);
                }}
                defaultValue={note.title}
                suppressContentEditableWarning
              >
                {!isRenaming && note.title}
              </CardTitle>
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
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setIsRenaming(true);
            }}
          >
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
