import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import Sidebar from "./components/Sidebar";
import MaterialsPage from "./pages/MaterialsPage";
import ReviewQueuePage from "./pages/ReviewQueuePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import "./App.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function App() {
  return (
    <ConvexProvider client={convex}>
      <BrowserRouter>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/materials" replace />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/review-queue" element={<ReviewQueuePage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ConvexProvider>
  );
}

export default App;
