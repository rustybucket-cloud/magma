import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import NoteCard from "../note-card";
import { Note } from "@/types";

// Mock motion/react
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock UI components
vi.mock("@/components/ui/card", () => ({
  Card: ({ children, onClick, className, ...props }: any) => (
    <div
      data-testid="note-card"
      onClick={onClick}
      className={className}
      {...props}
    >
      {children}
    </div>
  ),
  CardHeader: ({ children }: any) => (
    <div data-testid="card-header">{children}</div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 data-testid="card-title" className={className}>
      {children}
    </h3>
  ),
  CardFooter: ({ children }: any) => (
    <div data-testid="card-footer">{children}</div>
  ),
}));

vi.mock("@/components/ui/context-menu", () => ({
  ContextMenu: ({ children }: any) => (
    <div data-testid="context-menu">{children}</div>
  ),
  ContextMenuTrigger: ({ children }: any) => (
    <div data-testid="context-menu-trigger">{children}</div>
  ),
  ContextMenuContent: ({ children }: any) => (
    <div data-testid="context-menu-content">{children}</div>
  ),
  ContextMenuItem: ({ children, onClick }: any) => (
    <button data-testid="context-menu-item" onClick={onClick}>
      {children}
    </button>
  ),
}));

// Mock react-router
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

// Helper function to render component with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Sample notes for testing
const sampleNote: Note = {
  title: "Test Note",
  content: "This is a test note content",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  category: { id: "1", name: "General" },
  path: "test-note.md",
};

const noteWithoutPath: Note = {
  title: "Note Without Path",
  content: "This note has no path",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  category: { id: "1", name: "General" },
};

const noteWithLongContent: Note = {
  title: "Long Content Note",
  content:
    "This is a very long note content that should be truncated when displayed in the card view because it exceeds the 100 character limit that is set for the preview text in the note card component",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  category: { id: "1", name: "General" },
  path: "long-note.md",
};

const noteWithFrontmatter: Note = {
  title: "Frontmatter Note",
  content:
    "---\ntitle: Frontmatter Note\nauthor: Test Author\n---\nThis is the actual content after frontmatter",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  category: { id: "1", name: "General" },
  path: "frontmatter-note.md",
};

describe("NoteCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders note title and content", () => {
    renderWithRouter(<NoteCard note={sampleNote} />);

    expect(screen.getByTestId("card-title")).toHaveTextContent("Test Note");
    expect(screen.getByText("This is a test note content")).toBeInTheDocument();
  });

  it("renders note updated date", () => {
    renderWithRouter(<NoteCard note={sampleNote} />);

    const expectedDate = sampleNote.updatedAt.toLocaleDateString();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it("renders all card components", () => {
    renderWithRouter(<NoteCard note={sampleNote} />);

    expect(screen.getByTestId("note-card")).toBeInTheDocument();
    expect(screen.getByTestId("card-header")).toBeInTheDocument();
    expect(screen.getByTestId("card-title")).toBeInTheDocument();
    expect(screen.getByTestId("card-footer")).toBeInTheDocument();
    expect(screen.getByTestId("context-menu")).toBeInTheDocument();
  });

  it("has correct CSS classes", () => {
    renderWithRouter(<NoteCard note={sampleNote} />);

    const card = screen.getByTestId("note-card");
    expect(card).toHaveClass(
      "volcanic-card",
      "cursor-pointer",
      "shadow-sm",
      "hover:shadow-lg",
      "transition-shadow"
    );

    const title = screen.getByTestId("card-title");
    expect(title).toHaveClass("text-xl");
  });

  describe("navigation", () => {
    it("navigates to note with path when clicked", () => {
      renderWithRouter(<NoteCard note={sampleNote} />);

      const card = screen.getByTestId("note-card");
      fireEvent.click(card);

      expect(mockNavigate).toHaveBeenCalledWith("/note/test-note.md");
    });

    it("navigates with fallback path when note has no path", () => {
      renderWithRouter(<NoteCard note={noteWithoutPath} />);

      const card = screen.getByTestId("note-card");
      fireEvent.click(card);

      expect(mockNavigate).toHaveBeenCalledWith(
        "/note/Note%20Without%20Path.md"
      );
    });

    it("properly encodes special characters in path", () => {
      const noteWithSpecialChars: Note = {
        ...sampleNote,
        path: "folder/note with spaces & symbols.md",
      };

      renderWithRouter(<NoteCard note={noteWithSpecialChars} />);

      const card = screen.getByTestId("note-card");
      fireEvent.click(card);

      expect(mockNavigate).toHaveBeenCalledWith(
        "/note/folder%2Fnote%20with%20spaces%20%26%20symbols.md"
      );
    });
  });

  describe("content handling", () => {
    it("truncates long content with ellipsis", () => {
      renderWithRouter(<NoteCard note={noteWithLongContent} />);

      const contentElement = screen.getByText(
        /This is a very long note content/
      );
      expect(contentElement.textContent).toMatch(/\.\.\.$/);
      expect(contentElement.textContent?.length).toBeLessThanOrEqual(103); // 100 chars + "..."
    });

    it("does not truncate short content", () => {
      renderWithRouter(<NoteCard note={sampleNote} />);

      const contentElement = screen.getByText("This is a test note content");
      expect(contentElement.textContent).not.toMatch(/\.\.\.$/);
    });

    it("strips frontmatter from content display", () => {
      renderWithRouter(<NoteCard note={noteWithFrontmatter} />);

      // Should not show the frontmatter
      expect(
        screen.queryByText(/title: Frontmatter Note/)
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/author: Test Author/)).not.toBeInTheDocument();

      // Should show the actual content
      expect(
        screen.getByText("This is the actual content after frontmatter")
      ).toBeInTheDocument();
    });

    it("handles empty content after frontmatter removal", () => {
      const noteWithOnlyFrontmatter: Note = {
        ...sampleNote,
        content: "---\ntitle: Only Frontmatter\n---\n",
      };

      renderWithRouter(<NoteCard note={noteWithOnlyFrontmatter} />);

      // Should render without crashing
      expect(screen.getByTestId("note-card")).toBeInTheDocument();
    });
  });

  describe("context menu", () => {
    it("renders context menu items", () => {
      renderWithRouter(<NoteCard note={sampleNote} />);

      const contextMenuItems = screen.getAllByTestId("context-menu-item");
      expect(contextMenuItems).toHaveLength(3);

      expect(screen.getByText("Open")).toBeInTheDocument();
      expect(screen.getByText("Rename")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toBeInTheDocument();
    });

    it("navigates when Open context menu item is clicked", () => {
      renderWithRouter(<NoteCard note={sampleNote} />);

      const openItem = screen.getByText("Open");
      fireEvent.click(openItem);

      expect(mockNavigate).toHaveBeenCalledWith("/note/test-note.md");
    });

    it("logs to console when Rename is clicked", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      renderWithRouter(<NoteCard note={sampleNote} />);

      const renameItem = screen.getByText("Rename");
      fireEvent.click(renameItem);

      expect(consoleSpy).toHaveBeenCalledWith("Rename");
      consoleSpy.mockRestore();
    });

    it("logs to console when Delete is clicked", () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      renderWithRouter(<NoteCard note={sampleNote} />);

      const deleteItem = screen.getByText("Delete");
      fireEvent.click(deleteItem);

      expect(consoleSpy).toHaveBeenCalledWith("Delete");
      consoleSpy.mockRestore();
    });
  });

  describe("accessibility", () => {
    it("has cursor pointer for clickable card", () => {
      renderWithRouter(<NoteCard note={sampleNote} />);

      const card = screen.getByTestId("note-card");
      expect(card).toHaveClass("cursor-pointer");
    });

    it("renders semantic HTML structure", () => {
      renderWithRouter(<NoteCard note={sampleNote} />);

      // Title should be in an h3 element
      const title = screen.getByTestId("card-title");
      expect(title.tagName).toBe("H3");
    });
  });
});
