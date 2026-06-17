import { Outlet } from 'react-router';
import { AuthProvider } from '../context/AuthContext';
import { RecyclingProvider } from '../context/RecyclingContext';

export function RootLayout() {
  return (
    <AuthProvider>
      <RecyclingProvider>
        <div className="min-h-screen bg-background">
          <Outlet />
        </div>
      </RecyclingProvider>
    </AuthProvider>
  );
}
