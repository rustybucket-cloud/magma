import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "./ui/sidebar";
import { FolderTree } from "./folder-tree";
import { useNotes } from "@/contexts/NotesContext";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { FolderOpen, Plus, FolderPlus, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router";

export default function AppSidebar() {
  const {
    fileTree,
    notesFolder,
    selectFolder,
    openFile,
    createNote,
    createFolder,
    renameFileOrFolder,
    deleteFileOrFolder,
  } = useNotes();
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [createFolderParentPath, setCreateFolderParentPath] = useState<
    string | undefined
  >();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteItemPath, setDeleteItemPath] = useState<string>("");
  const [deleteItemName, setDeleteItemName] = useState<string>("");

  const navigate = useNavigate();

  const handleFileClick = async (path: string) => {
    await openFile(path);
    navigate(`/note/${encodeURIComponent(path)}`);
  };

  const handleCreateNote = async (parentPath?: string) => {
    await createNote(parentPath);
  };

  const handleCreateFolder = async (parentPath?: string) => {
    setCreateFolderParentPath(parentPath);
    setIsCreateFolderOpen(true);
  };

  const handleConfirmCreateFolder = async () => {
    if (newFolderName.trim()) {
      const success = await createFolder(
        newFolderName.trim(),
        createFolderParentPath
      );
      if (success) {
        setIsCreateFolderOpen(false);
        setNewFolderName("");
        setCreateFolderParentPath(undefined);
      }
    }
  };

  const handleCancelCreateFolder = () => {
    setIsCreateFolderOpen(false);
    setNewFolderName("");
    setCreateFolderParentPath(undefined);
  };

  const handleRename = async (
    oldPath: string,
    newName: string,
    isFile: boolean
  ) => {
    return await renameFileOrFolder(oldPath, newName, isFile);
  };

  const handleDelete = async (path: string) => {
    // Extract name from path for confirmation dialog
    const pathParts = path.split("/");
    const name = pathParts[pathParts.length - 1];

    setDeleteItemPath(path);
    setDeleteItemName(name);
    setDeleteConfirmOpen(true);

    return false; // Don't delete immediately, wait for confirmation
  };

  const handleConfirmDelete = async () => {
    const success = await deleteFileOrFolder(deleteItemPath);
    setDeleteConfirmOpen(false);
    setDeleteItemPath("");
    setDeleteItemName("");
    return success;
  };

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false);
    setDeleteItemPath("");
    setDeleteItemName("");
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader className="border-b pb-4">
          <div className="flex justify-between">
            <h1 className="text-2xl font-bold">Magma</h1>

            {!notesFolder ? (
              <Button
                onClick={selectFolder}
                variant="outline"
                className="w-full"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                Select Notes Folder
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleCreateNote()}>
                    <FileText className="h-4 w-4" />
                    New Note
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateFolder()}>
                    <FolderPlus className="h-4 w-4" />
                    New Folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </SidebarHeader>

        <div className="flex-1 overflow-auto p-2">
          {notesFolder && fileTree.length > 0 ? (
            <FolderTree
              items={fileTree}
              onFileClick={handleFileClick}
              onCreateNote={handleCreateNote}
              onCreateFolder={handleCreateFolder}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ) : notesFolder ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No files found in selected folder
            </p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Select a folder to view your notes
            </p>
          )}
        </div>

        <SidebarFooter className="border-t pt-4">
          {notesFolder && (
            <div className="flex gap-2">
              <Button
                onClick={selectFolder}
                variant="outline"
                size="sm"
                className="flex-1 hover:bg-gray-600 hover:text-gray-100 hover:cursor-pointer"
              >
                <FolderOpen className="h-4 w-4 mr-2" />
                <span className="text-xs">
                  {getShortenedFolderName(notesFolder)}
                </span>
              </Button>
            </div>
          )}
        </SidebarFooter>
      </SidebarContent>

      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder
              {createFolderParentPath ? ` in "${createFolderParentPath}"` : ""}.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleConfirmCreateFolder();
              } else if (e.key === "Escape") {
                handleCancelCreateFolder();
              }
            }}
            autoFocus
          />

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelCreateFolder}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete "{deleteItemName}"</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}

function getShortenedFolderName(notesFolder: string) {
  if (notesFolder.length < 25) {
    return notesFolder;
  }
  return "..." + notesFolder.substring(notesFolder.length - 25);
}
