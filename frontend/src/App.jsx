import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { SocketProvider } from "./context/SocketContext";
import { CompareProvider, useCompare } from "./context/CompareContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import MobileTabBar from "./components/layout/MobileTabBar";
import EmiCalculatorModal from "./components/common/EmiCalculatorModal";
import Spinner from "./components/common/Spinner";

import LoginPage from "./pages/LoginPage";
import FeedPage from "./pages/FeedPage";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import PostPropertyPage from "./pages/PostPropertyPage";
import ComparePage from "./pages/ComparePage";
import AdminPage from "./pages/AdminPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";

function Shell() {
  const { loading } = useAuth();
  const { compareIds } = useCompare();
  const [showEmi, setShowEmi] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner label="Loading VasthuConnect…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header compareCount={compareIds.length} onOpenEmi={() => setShowEmi(true)} />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 flex-1">
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<FeedPage mode="all" />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/compare" element={<ComparePage />} />

            <Route path="/saved" element={<ProtectedRoute><FeedPage mode="saved" /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chat/:threadId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            <Route path="/post" element={<ProtectedRoute roles={["SELLER", "ADMIN"]}><PostPropertyPage /></ProtectedRoute>} />
            <Route path="/my-listings" element={<ProtectedRoute roles={["SELLER", "ADMIN"]}><FeedPage mode="mine" /></ProtectedRoute>} />

            <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]}><AdminPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </main>

      <Footer />
      <MobileTabBar compareCount={compareIds.length} />
      {showEmi && <EmiCalculatorModal onClose={() => setShowEmi(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SocketProvider>
            <CompareProvider>
              <Shell />
            </CompareProvider>
          </SocketProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
