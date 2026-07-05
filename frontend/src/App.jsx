import { BrowserRouter, Navigate, Outlet, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BuyerDashboard from './pages/BuyerDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import AuctionDetails from './pages/AuctionDetails';
import CreateRFQ from './pages/CreateRFQ';
import SubmitBid from './pages/SubmitBid';

function ProtectedRoute() {
    const { user, loading } = useAuth();
    if (loading) return <div className="main">Loading workspace...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return <Outlet />;
}

function RoleRoute({ role }) {
    const { user } = useAuth();
    if (user?.role !== role) return <Navigate to={`/${user?.role || ''}`} replace />;
    return <Outlet />;
}

function AppLayout() {
    return (
        <div className="app-shell">
            <Navbar />
            <main className="main">
                <Outlet />
            </main>
        </div>
    );
}

function HomeRedirect() {
    const { user, loading } = useAuth();
    if (loading) return <div className="main">Loading workspace...</div>;
    if (!user) return <Landing />;
    return <Navigate to={`/${user.role}`} replace />;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<HomeRedirect />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route element={<RoleRoute role="buyer" />}>
                                <Route path="/buyer" element={<BuyerDashboard />} />
                                <Route path="/create" element={<CreateRFQ />} />
                            </Route>
                            <Route element={<RoleRoute role="supplier" />}>
                                <Route path="/supplier" element={<SupplierDashboard />} />
                                <Route path="/bid/:rfq_id" element={<SubmitBid />} />
                            </Route>
                            <Route path="/auction/:id" element={<AuctionDetails />} />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
