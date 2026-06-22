import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/ui/Toast";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { LoginPage } from "./pages/LoginPage";
import { InventoryPage } from "./pages/InventoryPage";
import { CreateItemPage } from "./pages/CreateItemPage";
import { SalesHistoryPage } from "./pages/SalesHistoryPage";
import { UsersPage } from "./pages/UsersPage";
import { RolesPage } from "./pages/RolesPage";
import { LogsPage } from "./pages/LogsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { Permission } from "./types";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/inventaire"
            element={
              <ProtectedRoute>
                <Layout>
                  <InventoryPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/creer-objet"
            element={
              <ProtectedRoute permission={Permission.ITEM_CREATE}>
                <Layout>
                  <CreateItemPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/historique"
            element={
              <ProtectedRoute permission={Permission.SALES_HISTORY_VIEW}>
                <Layout>
                  <SalesHistoryPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/utilisateurs"
            element={
              <ProtectedRoute permission={Permission.USERS_MANAGE}>
                <Layout>
                  <UsersPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roles"
            element={
              <ProtectedRoute permission={Permission.ROLES_MANAGE}>
                <Layout>
                  <RolesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <ProtectedRoute permission={Permission.LOGS_VIEW}>
                <Layout>
                  <LogsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/parametres"
            element={
              <ProtectedRoute permission={Permission.WEBHOOK_CONFIGURE}>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/inventaire" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
