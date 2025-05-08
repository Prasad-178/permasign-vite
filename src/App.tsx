import { HashRouter, useRoutes } from "react-router-dom";
import routes from "./routes";
import Navbar from "./components/Navbar";

function AppRoutes() {
  return useRoutes(routes);
}

export default function App() {
  return (
    <HashRouter>
      <Navbar />
      <div className="pt-16">
        <AppRoutes />
      </div>
    </HashRouter>
  );
}
