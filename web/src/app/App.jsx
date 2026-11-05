import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import AppShell from "../components/AppShell.jsx";
import Splash from "../pages/Splash.jsx";
import Onboarding from "../pages/Onboarding.jsx";
import PermissionStep from "../pages/permissions/PermissionStep.jsx";
import Language from "../pages/Language.jsx";
import Login from "../pages/Login.jsx";
import Verify from "../pages/Verify.jsx";
import Register from "../pages/Register.jsx";
import Home from "../pages/Home.jsx";
import Tasks from "../pages/Tasks.jsx";
import TaskDetail from "../pages/TaskDetail.jsx";
import PostTask from "../pages/PostTask.jsx";
import Applications from "../pages/Applications.jsx";
import Chat from "../pages/Chat.jsx";
import Wallet from "../pages/Wallet.jsx";
import Profile from "../pages/Profile.jsx";
import TaskList from "../pages/TaskList.jsx";
import ComingSoon from "../pages/ComingSoon.jsx";

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

          <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route path="/home" element={<Home />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/post" element={<PostTask />} />
            <Route path="/applications" element={<Applications />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/chat/:id" element={<Chat />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-tasks" element={<TaskList mode="mine" />} />
            <Route path="/saved" element={<TaskList mode="saved" />} />
            <Route path="/reviews" element={<ComingSoon title="Reviews" />} />
            <Route path="/settings" element={<ComingSoon title="Settings" />} />
            <Route path="/help" element={<ComingSoon title="Help & Support" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}