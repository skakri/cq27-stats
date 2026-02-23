import { Routes, Route, Link, useLocation } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import ClusterGraphPage from "./pages/ClusterGraphPage";

export default function App() {
  const location = useLocation();

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      <header className="mb-5 flex items-baseline gap-4">
        <h1 className="text-lg font-bold text-gray-100">cq27</h1>
        <nav className="flex gap-3 text-sm">
          <Link
            to="/"
            className={`transition-colors ${location.pathname === "/" ? "text-gray-100" : "text-gray-500 hover:text-gray-300"}`}
          >
            Dashboard
          </Link>
          <Link
            to="/clusters"
            className={`transition-colors ${location.pathname === "/clusters" ? "text-gray-100" : "text-gray-500 hover:text-gray-300"}`}
          >
            Cluster Graph
          </Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/clusters" element={<ClusterGraphPage />} />
      </Routes>
    </div>
  );
}
