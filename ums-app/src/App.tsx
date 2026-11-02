// Path: ums-app/src/App.tsx
// Purpose: Application router setup wrapped in the global upload context.

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UploadProvider } from './context/UploadContext';
import AppShell from './components/Layout/AppShell';
import Dashboard from './pages/Dashboard';
import Storage from './pages/Storage';
import Clients from './pages/Clients';
import Tenders from './pages/Tenders';
import Invoices from './pages/Invoices';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';

export default function App() {
    return (
        <UploadProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<AppShell />}>
                        <Route index element={<Dashboard />} />
                        <Route path="storage" element={<Storage />} />
                        <Route path="clients" element={<Clients />} />
                        <Route path="tenders" element={<Tenders />} />
                        <Route path="invoices" element={<Invoices />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="tasks" element={<Tasks />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </UploadProvider>
    );
}