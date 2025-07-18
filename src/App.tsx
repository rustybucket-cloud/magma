import { RouterProvider, createBrowserRouter } from "react-router";
import homeRouter from "@/pages/home/router";
import "./index.css";
import MainLayout from "./layouts/main-layout";

const router = createBrowserRouter([
  {
    Component: MainLayout,
    children: [...homeRouter],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
