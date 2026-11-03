// Path: ums-app/src/App.tsx
// Purpose: Application root with routing, auth, and toast providers.

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UploadProvider } from './context/UploadContext';
import { ToastProvider } from './context/ToastContext';
import AppShell from './components/Layout/AppShell';
import LoginScreen from './components/Layout/LoginScreen';
import Dashboard from './pages/Dashboard';
import Storage from './pages/Storage';
import Clients from './pages/Clients';
import Tenders from './pages/Tenders';
import Invoices from './pages/Invoices';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
}

function AppRoutes() {
    const { user } = useAuth();

    return (
        <Routes>
            <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginScreen />} />
            <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="storage" element={<Storage />} />
                <Route path="clients" element={<Clients />} />
                <Route path="tenders" element={<Tenders />} />
                <Route path="invoices" element={<Invoices />} />
                <Route path="projects" element={<Projects />} />
                <Route path="tasks" element={<Tasks />} />
            </Route>
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <UploadProvider>
                    <Router>
                        <AppRoutes />
                    </Router>
                </UploadProvider>
            </ToastProvider>
        </AuthProvider>
    );
}