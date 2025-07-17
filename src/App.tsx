import { RouterProvider, createBrowserRouter } from "react-router";
import { NotesProvider } from "@/contexts/NotesContext";
import homeRouter from "@/pages/home/router";
import "./index.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/app-sidebar";

const router = createBrowserRouter([...homeRouter]);

function App() {
  return (
    <NotesProvider>
      <SidebarProvider>
        <AppSidebar />
        <div className="w-full h-screen">
          <header className="h-[var(--header-height)]">
            <SidebarTrigger />
          </header>
          <main className="min-h-[calc(100vh-var(--header-height)-8px)] border-1 border-gray-600 rounded-lg m-1">
            <RouterProvider router={router} />
          </main>
        </div>
      </SidebarProvider>
    </NotesProvider>
  );
}

export default App;
