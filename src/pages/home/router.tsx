import Home from "./home";
import NotePage from "../note/note";

export default [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/note/:notePath",
    Component: NotePage,
  },
];
