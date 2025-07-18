import { Outlet } from "react-router";
import { NotesProvider } from "@/contexts/NotesContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSearchParams, useLocation } from "react-router";

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
  const [searchParams] = useSearchParams();

  if (location.pathname === "/") {
    return "Home";
  }

  if (location.pathname === "/note") {
    return searchParams.get("title") ?? "Untitled";
  }

  return null;
}
