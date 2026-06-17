import { createBrowserRouter, Navigate } from 'react-router';
import { RootLayout } from './layouts/RootLayout';
import { MainLayout } from './layouts/MainLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SupervisorRedirect } from './components/SupervisorRedirect';
import { HomePage } from './pages/HomePage';
import { CitizenDashboard } from './pages/citizen/CitizenDashboard';
import { WasteReportPage } from './pages/citizen/WasteReportPage';
import { MyReportsPage } from './pages/citizen/MyReportsPage';
import { CollectorDashboard } from './pages/collector/CollectorDashboard';
import { CollectionTasksPage } from './pages/collector/CollectionTasksPage';
import { RecyclingCreditsPage } from './pages/collector/RecyclingCreditsPage';
// Waste Supervisor
import { WasteSupervisorDashboard } from './pages/supervisor/waste/WasteSupervisorDashboard';
import { TaskAssignmentPage } from './pages/supervisor/waste/TaskAssignmentPage';
import { CollectorsPage } from './pages/supervisor/waste/CollectorsPage';
import { WasteSupervisorProfile } from './pages/supervisor/waste/WasteSupervisorProfile';
// Recycling Supervisor
import { RecyclingSupervisorDashboard } from './pages/supervisor/recycling/RecyclingSupervisorDashboard';
import { RecyclingManagementPage } from './pages/supervisor/recycling/RecyclingManagementPage';
import { RecyclingSupervisorProfile } from './pages/supervisor/recycling/RecyclingSupervisorProfile';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProfile } from './pages/admin/AdminProfile';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { ReportsManagementPage } from './pages/admin/ReportsManagementPage';
import { DistrictsPage } from './pages/admin/DistrictsPage';
import { AnalyticsPage } from './pages/admin/AnalyticsPage';
import { SystemSettingsPage } from './pages/admin/SystemSettingsPage';
import { CitizenProfile } from './pages/citizen/CitizenProfile';
import { CollectorProfile } from './pages/collector/CollectorProfile';
import { NotFoundPage } from './pages/NotFoundPage';
import { Notifications } from './pages/Notifications';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: HomePage
      },
      {
        path: 'dashboard',
        Component: MainLayout,
        children: [
          {
            path: 'notifications',
            element: (
              <ProtectedRoute allowedRoles={['citizen', 'collector', 'supervisor', 'administrator']}>
                <Notifications />
              </ProtectedRoute>
            )
          },
          {
            path: 'citizen',
            element: (
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenDashboard />
              </ProtectedRoute>
            )
          },
          {
            path: 'citizen/report',
            element: (
              <ProtectedRoute allowedRoles={['citizen']}>
                <WasteReportPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'citizen/my-reports',
            element: (
              <ProtectedRoute allowedRoles={['citizen']}>
                <MyReportsPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'citizen/profile',
            element: (
              <ProtectedRoute allowedRoles={['citizen']}>
                <CitizenProfile />
              </ProtectedRoute>
            )
          },
          {
            path: 'collector',
            element: (
              <ProtectedRoute allowedRoles={['collector']}>
                <CollectorDashboard />
              </ProtectedRoute>
            )
          },
          {
            path: 'collector/tasks',
            element: (
              <ProtectedRoute allowedRoles={['collector']}>
                <CollectionTasksPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'collector/credits',
            element: (
              <ProtectedRoute allowedRoles={['collector']}>
                <RecyclingCreditsPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'collector/profile',
            element: (
              <ProtectedRoute allowedRoles={['collector']}>
                <CollectorProfile />
              </ProtectedRoute>
            )
          },
          {
            path: 'supervisor',
            element: (
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorRedirect />
              </ProtectedRoute>
            )
          },
          {
            path: 'supervisor/waste',
            element: (
              <ProtectedRoute allowedRoles={['supervisor']}>
                <WasteSupervisorDashboard />
              </ProtectedRoute>
            )
          },
          {
            path: 'supervisor/waste/task-assignment',
            element: (
              <ProtectedRoute allowedRoles={['supervisor']}>
                <TaskAssignmentPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'supervisor/waste/collectors',
            element: (
              <ProtectedRoute allowedRoles={['supervisor']}>
                <CollectorsPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'supervisor/waste/profile',
            element: (
              <ProtectedRoute allowedRoles={['supervisor']}>
                <WasteSupervisorProfile />
              </ProtectedRoute>
            )
          },
          {
            path: 'supervisor/recycling',
            element: (
              <ProtectedRoute allowedRoles={['supervisor']} allowedDepartments={['RECYCLING_OPERATIONS']}>
                <RecyclingSupervisorDashboard />
              </ProtectedRoute>
            )
          },

          {
            path: 'supervisor/recycling/management',
            element: (
              <ProtectedRoute allowedRoles={['supervisor']} allowedDepartments={['RECYCLING_OPERATIONS']}>
                <RecyclingManagementPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'supervisor/recycling/profile',
            element: (
              <ProtectedRoute allowedRoles={['supervisor']} allowedDepartments={['RECYCLING_OPERATIONS']}>
                <RecyclingSupervisorProfile />
              </ProtectedRoute>
            )
          },
          {
            path: 'admin',
            element: (
              <ProtectedRoute allowedRoles={['administrator']}>
                <AdminDashboard />
              </ProtectedRoute>
            )
          },
          {
            path: 'admin/users',
            element: (
              <ProtectedRoute allowedRoles={['administrator']}>
                <UserManagementPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'admin/reports',
            element: (
              <ProtectedRoute allowedRoles={['administrator']}>
                <ReportsManagementPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'admin/districts',
            element: (
              <ProtectedRoute allowedRoles={['administrator']}>
                <DistrictsPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'admin/analytics',
            element: (
              <ProtectedRoute allowedRoles={['administrator']}>
                <AnalyticsPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'admin/settings',
            element: (
              <ProtectedRoute allowedRoles={['administrator']}>
                <SystemSettingsPage />
              </ProtectedRoute>
            )
          },
          {
            path: 'admin/profile',
            element: (
              <ProtectedRoute allowedRoles={['administrator']}>
                <AdminProfile />
              </ProtectedRoute>
            )
          }
        ]
      },
      {
        path: '*',
        Component: NotFoundPage
      }
    ]
  }
]);
