import { Routes, Route } from "react-router-dom";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/react";

import Sidebar from "./components/Sidebar";
import MaterialsPage from "./pages/MaterialsPage";
import ReviewQueuePage from "./pages/ReviewQueuePage";
import AnalyticsPage from "./pages/AnalyticsPage";
import LandingPage from "./pages/LandingPage";
import AuditTrailPage from "./pages/AuditTrailPage";
import SystemIntegrationPage from "./pages/SystemIntegrationPage";
import DataIngestionPage from "./pages/DataIngestionPage";

import "./App.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function App() {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <div className="app-layout">
        <div className="app-backdrop" aria-hidden="true" />

        <Sidebar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/review-queue" element={<ReviewQueuePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/audit-trail" element={<AuditTrailPage />} />
            <Route path="/integration" element={<SystemIntegrationPage />} />
            <Route path="/ingestion" element={<DataIngestionPage />} />
          </Routes>
        </main>
      </div>
    </ConvexProviderWithClerk>
  );
}

export default App;