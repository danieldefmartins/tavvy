import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TrustedCongratsModal } from "@/components/TrustedCongratsModal";
import { BottomNav } from "@/components/BottomNav";
import { FooterProvider } from "@/contexts/FooterContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index";
import PlacesToStay from "./pages/PlacesToStay";
import PlaceDetail from "./pages/PlaceDetail";
import SearchResults from "./pages/SearchResults";
import SavedPlaces from "./pages/SavedPlaces";
import AdminSuggestions from "./pages/AdminSuggestions";
import AdminPhotos from "./pages/AdminPhotos";
import AdminUsers from "./pages/AdminUsers";
import AdminPlaceSubmissions from "./pages/AdminPlaceSubmissions";
import ImportPlaces from "./pages/ImportPlaces";
import BulkImport from "./pages/BulkImport";
import AdminDataEnrichment from "./pages/AdminDataEnrichment";
import Auth from "./pages/Auth";
import MapView from "./pages/MapView";
import RoutePlanning from "./pages/RoutePlanning";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import UserProfile from "./pages/UserProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <TrustedCongratsModal />
      <ErrorBoundary>
        <BrowserRouter>
          <FooterProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/places" element={<PlacesToStay />} />
              <Route path="/place/:id" element={<PlaceDetail />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/route" element={<RoutePlanning />} />
              <Route path="/saved" element={<SavedPlaces />} />
              <Route path="/notifications" element={<Notifications />} />

              <Route
                path="/admin/suggestions"
                element={
                  <AdminRoute>
                    <AdminSuggestions />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/photos"
                element={
                  <AdminRoute>
                    <AdminPhotos />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminUsers />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/place-submissions"
                element={
                  <AdminRoute>
                    <AdminPlaceSubmissions />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/import"
                element={
                  <AdminRoute>
                    <ImportPlaces />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/bulk-import"
                element={
                  <AdminRoute>
                    <BulkImport />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/data-enrichment"
                element={
                  <AdminRoute>
                    <AdminDataEnrichment />
                  </AdminRoute>
                }
              />

              <Route path="/auth" element={<Auth />} />
              <Route path="/profile/:username" element={<UserProfile />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            {/* Global Fixed Bottom Navigation */}
            <BottomNav />
          </FooterProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

