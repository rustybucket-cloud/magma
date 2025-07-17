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
        <div className="w-full">
          <SidebarTrigger />
          <main className="w-full h-full border-1 border-gray-600 rounded-lg">
            <RouterProvider router={router} />
          </main>
        </div>
      </SidebarProvider>
    </NotesProvider>
  );
}

export default App;
