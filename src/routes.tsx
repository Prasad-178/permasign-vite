import { type RouteObject } from "react-router-dom";
import Home from "./pages/Home";
import RoomsPage from "./pages/RoomsPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import RoomDetailsPage from "./pages/Room";
import TemplatesPage from "./pages/TemplatesPage";
import EncryptionExplainedPage from "./pages/EncryptionExplainedPage";
import TeamPage from "./pages/TeamPage";
import AdminPage from "./pages/AdminPage.tsx";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
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
  {
    path: "/security",
    element: <EncryptionExplainedPage />,
  },
  {
    path: "/team",
    element: <TeamPage />,
  },
  {
    path: "/admin",
    element: <AdminPage />,
  },
];

export default routes; 