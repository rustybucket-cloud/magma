import { Outlet } from "react-router";
import { NotesProvider } from "@/contexts/NotesContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useLocation, useParams } from "react-router";

export default function MainLayout() {
  return (
    <NotesProvider>
      <SidebarProvider>
        <AppSidebar />
        <div className="w-full h-screen">
          <Header />
          <main className="min-h-[calc(100vh-var(--header-height)-8px)] border-1 border-gray-600 rounded-lg m-1">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </NotesProvider>
  );
}

function Header() {
  return (
    <header className="h-[var(--header-height)] flex items-center pl-2 gap-2">
      <SidebarTrigger />
      <h1 className="text-lg">
        <HeaderText />
      </h1>
    </header>
  );
}

function HeaderText() {
  const location = useLocation();
  const { notePath } = useParams<{ notePath: string }>();

  if (location.pathname === "/") {
    return "Home";
  }

  if (location.pathname.startsWith("/note/")) {
    // Extract filename from path for display
    if (notePath) {
      const decodedPath = decodeURIComponent(notePath);
      const filename = decodedPath.split('/').pop()?.replace('.md', '') || "Untitled";
      return filename;
    }
    return "Untitled";
  }

  return null;
}
