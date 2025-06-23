import { type RouteObject } from "react-router-dom";
import Home from "./pages/Home";
import HelloWorld from "./pages/HelloWorld";
import RandomPage from "./pages/RandomPage";
import RoomsPage from "./pages/RoomsPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import RoomDetailsPage from "./pages/Room";
import TemplatesPage from "./pages/TemplatesPage";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/hello",
    element: <HelloWorld />,
  },
  {
    path: "/random/:num",
    element: <RandomPage />,
  },
  {
    path: "/companies",
    element: <RoomsPage />,
  },
  {
    path: "/companies/create",
    element: <CreateRoomPage />,
  },
  {
    path: "/companies/:companyId",
    element: <RoomDetailsPage />,
  },
  {
    path: "/companies/create/template",
    element: <TemplatesPage />,
  },
];

export default routes; 