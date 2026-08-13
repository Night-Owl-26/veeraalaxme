import { useState, lazy, Suspense } from "react";
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

// The home feed is what nearly every first-time visit renders, so it stays
// in the main bundle — no benefit to lazy-loading the one route almost
// everyone hits immediately. Everything else is its own chunk, downloaded
// only when actually visited. This matters most for PropertyDetailPage and
// PostPropertyPage specifically: both pull in Leaflet (map + location
// picker), a sizeable library that, before this split, every visitor
// downloaded on first load even if they only ever browsed the feed.
import FeedPage from "./pages/FeedPage";
const LoginPage = lazy(() => import("./pages/LoginPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const PropertyDetailPage = lazy(() => import("./pages/PropertyDetailPage"));
const PostPropertyPage = lazy(() => import("./pages/PostPropertyPage"));
const ComparePage = lazy(() => import("./pages/ComparePage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const VastuContactPage = lazy(() => import("./pages/VastuContactPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner label="Loading…" />
    </div>
  );
}

function Shell() {
  const { loading } = useAuth();
  const { compareIds } = useCompare();
  const [showEmi, setShowEmi] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner label="Loading VeeraaLaxme Vastu…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header compareCount={compareIds.length} onOpenEmi={() => setShowEmi(true)} />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-6 flex-1">
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/" element={<FeedPage mode="all" />} />
              <Route path="/property/:id" element={<PropertyDetailPage />} />
              <Route path="/compare" element={<ComparePage />} />

              <Route path="/vastu" element={<VastuContactPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />

              <Route path="/saved" element={<ProtectedRoute><FeedPage mode="saved" /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/chat/:threadId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

              <Route path="/post" element={<ProtectedRoute roles={["SELLER", "ADMIN"]}><PostPropertyPage /></ProtectedRoute>} />
              <Route path="/my-listings" element={<ProtectedRoute roles={["SELLER", "ADMIN"]}><FeedPage mode="mine" /></ProtectedRoute>} />

              <Route path="/admin" element={<ProtectedRoute roles={["ADMIN"]}><AdminPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
      <MobileTabBar />
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
