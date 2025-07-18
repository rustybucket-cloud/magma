import { useState, useRef, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  FileText,
  Edit,
  Trash2,
} from "lucide-react";
import { type FileTreeItem } from "@/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface FolderTreeProps {
  items: FileTreeItem[];
  onFileClick?: (path: string) => void;
  onCreateFolder?: (parentPath?: string) => void;
  onCreateNote?: (parentPath?: string) => void;
  onRename?: (
    oldPath: string,
    newName: string,
    isFile: boolean
  ) => Promise<boolean>;
  onDelete?: (path: string) => Promise<boolean>;
  level?: number;
}

interface FolderTreeItemProps {
  item: FileTreeItem;
  onFileClick?: (path: string) => void;
  onCreateFolder?: (parentPath?: string) => void;
  onCreateNote?: (parentPath?: string) => void;
  onRename?: (
    oldPath: string,
    newName: string,
    isFile: boolean
  ) => Promise<boolean>;
  onDelete?: (path: string) => Promise<boolean>;
  level: number;
  onToggle: (path: string) => void;
}

function FolderTreeItemComponent({
  item,
  onFileClick,
  onCreateFolder,
  onCreateNote,
  onRename,
  onDelete,
  level,
  onToggle,
}: FolderTreeItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(item.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (isEditing) return;

    if (item.type === "file") {
      onFileClick?.(item.path);
    } else {
      onToggle(item.path);
    }
  };

  const handleRename = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      if (editValue.trim() && editValue !== item.name && onRename) {
        const success = await onRename(
          item.path,
          editValue.trim(),
          item.type === "file"
        );

        if (success) {
          setIsEditing(false);
        } else {
          setEditValue(item.name); // Reset on failure
        }
      } else {
        setIsEditing(false);
        setEditValue(item.name);
      }
    } catch (error) {
      console.error("Error during rename:", error);
      setEditValue(item.name);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const handleCancel = () => {
    if (isSubmittingRef.current) return;
    setIsEditing(false);
    setEditValue(item.name);
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      await handleRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      handleCancel();
    }
  };

  const handleBlur = async () => {
    // Add a small delay to allow keydown to process first
    setTimeout(async () => {
      if (!isSubmittingRef.current && isEditing) {
        await handleRename();
      }
    }, 100);
  };

  const handleDelete = async () => {
    if (onDelete) {
      await onDelete(item.path);
    }
  };

  const paddingLeft = level * 16;

  const contextMenuContent = (
    <ContextMenuContent>
      {item.type === "folder" && (
        <>
          <ContextMenuItem onClick={() => onCreateNote?.(item.path)}>
            <FileText className="h-4 w-4" />
            New Note
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onCreateFolder?.(item.path)}>
            <Plus className="h-4 w-4" />
            New Folder
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}
      {item.type === "file" && (
        <>
          <ContextMenuItem onClick={() => onFileClick?.(item.path)}>
            <File className="h-4 w-4" />
            Open
          </ContextMenuItem>
          <ContextMenuSeparator />
        </>
      )}
      <ContextMenuItem onClick={() => setIsEditing(true)}>
        <Edit className="h-4 w-4" />
        Rename
      </ContextMenuItem>
      <ContextMenuItem onClick={handleDelete} variant="destructive">
        <Trash2 className="h-4 w-4" />
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  );

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={cn(
              "flex items-center gap-2 py-1 px-2 cursor-pointer hover:bg-accent rounded-sm text-sm",
              "transition-colors duration-150"
            )}
            style={{ paddingLeft }}
            onClick={handleClick}
          >
            {item.type === "folder" && (
              <div className="flex-shrink-0">
                {item.isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            )}

            <div className="flex-shrink-0">
              {item.type === "file" ? (
                <File className="h-4 w-4 text-muted-foreground" />
              ) : item.isExpanded ? (
                <FolderOpen className="h-4 w-4 text-blue-500" />
              ) : (
                <Folder className="h-4 w-4 text-blue-500" />
              )}
            </div>

            {isEditing ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="h-6 px-1 text-sm border-none shadow-none focus-visible:ring-1 focus-visible:ring-ring"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate">{item.name}</span>
            )}
          </div>
        </ContextMenuTrigger>
        {contextMenuContent}
      </ContextMenu>

      {item.type === "folder" && item.isExpanded && item.children && (
        <div>
          {item.children.map((child) => (
            <FolderTreeItemComponent
              key={child.path}
              item={child}
              onFileClick={onFileClick}
              onCreateFolder={onCreateFolder}
              onCreateNote={onCreateNote}
              onRename={onRename}
              onDelete={onDelete}
              level={level + 1}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({
  items,
  onFileClick,
  onCreateFolder,
  onCreateNote,
  onRename,
  onDelete,
  level = 0,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const handleToggle = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  // Update items with expansion state
  const updateItemsWithExpansion = (items: FileTreeItem[]): FileTreeItem[] => {
    return items.map((item) => ({
      ...item,
      isExpanded: expandedFolders.has(item.path),
      children: item.children
        ? updateItemsWithExpansion(item.children)
        : undefined,
    }));
  };

  const itemsWithExpansion = updateItemsWithExpansion(items);

  return (
    <div className="space-y-1">
      {itemsWithExpansion.map((item) => (
        <FolderTreeItemComponent
          key={item.path}
          item={item}
          onFileClick={onFileClick}
          onCreateFolder={onCreateFolder}
          onCreateNote={onCreateNote}
          onRename={onRename}
          onDelete={onDelete}
          level={level}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}
