import { RouteObject } from "react-router-dom";
import Home from "./pages/Home";
import HelloWorld from "./pages/HelloWorld";
import RandomPage from "./pages/RandomPage";
import RoomsPage from "./pages/RoomsPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import RoomDetailsPage from "./pages/Room";

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
    path: "/rooms",
    element: <RoomsPage />,
  },
  {
    path: "/rooms/create",
    element: <CreateRoomPage />,
  },
  {
    path: "/rooms/:roomId",
    element: <RoomDetailsPage />,
  },
];

export default routes; 