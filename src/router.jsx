import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import DashboardPage from './pages/dashboard';
import InventoryPage from './pages/inventory';
import PriceHistoryPage from './pages/price-history';
import TripsPage from './pages/trips';
import TripDetailsPage from './pages/trips/details';
import NewTripPage from './pages/trips/new';
import TripShoppingPage from './pages/trips/shopping';
import ManagersPage from './pages/managers/ManagersPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/new" element={<NewTripPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/price-history" element={<PriceHistoryPage />} />
        <Route path="/managers" element={<ManagersPage />} />
        <Route path="/trips/:tripId" element={<TripDetailsPage />} />
        <Route path="/trips/:tripId/shopping" element={<TripShoppingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
