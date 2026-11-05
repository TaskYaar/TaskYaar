import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import Splash from "../pages/Splash.jsx";
import Onboarding from "../pages/Onboarding.jsx";
import PermissionStep from "../pages/permissions/PermissionStep.jsx";
import Language from "../pages/Language.jsx";
import Login from "../pages/Login.jsx";
import Verify from "../pages/Verify.jsx";
import Register from "../pages/Register.jsx";
import Home from "../pages/Home.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/onboarding" element={<Onboarding />} />

          <Route path="/permissions" element={<Navigate to="/permissions/notifications" replace />} />
          <Route path="/permissions/:step" element={<PermissionStep />} />

          <Route path="/language" element={<Language />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/register" element={<Register />} />

          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}