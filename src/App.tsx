import { RouterProvider, createBrowserRouter } from 'react-router'
import homeRouter from '@/pages/home/router'
import "./index.css";

const router = createBrowserRouter([
  ...homeRouter,
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
