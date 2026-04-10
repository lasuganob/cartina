import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import DashboardPage from './pages/dashboard';
import TripsPage from './pages/trips';
import TripDetailsPage from './pages/trips/details';
import TripShoppingPage from './pages/trips/shopping';

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:tripId" element={<TripDetailsPage />} />
        <Route path="/trips/:tripId/shopping" element={<TripShoppingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
