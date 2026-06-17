import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function SupervisorRedirect() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.role !== 'supervisor') {
      navigate('/');
      return;
    }

    // Redirect based on department
    // Backend returns: "RECYCLING_OPERATIONS" or "WASTE_COLLECTION_OPERATIONS"
    if (user.department === 'RECYCLING_OPERATIONS' || user.department?.toLowerCase().includes('recycling')) {
      navigate('/dashboard/supervisor/recycling');
    } else {
      // Default to waste supervisor
      navigate('/dashboard/supervisor/waste');
    }
  }, [user, navigate]);

  return null;
}
