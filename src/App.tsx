import { RouterProvider, createBrowserRouter } from 'react-router'
import { NotesProvider } from '@/contexts/NotesContext'
import homeRouter from '@/pages/home/router'
import "./index.css";

const router = createBrowserRouter([
  ...homeRouter,
]);

function App() {
  return (
    <NotesProvider>
      <RouterProvider router={router} />
    </NotesProvider>
  );
}

export default App;
