import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../../../store/Authstore';
import { useDashboardStore } from '../../../../store/Dashboard.store';

const useDashboardInit = () => {
  const { fetchUser } = useAuthStore();
  const uploadIds = useDashboardStore((s) => s.uploadIds);
  const setUploadIds = useDashboardStore((s) => s.setUploadIds);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initDashboard = async () => {
      await fetchUser();
      
      // If no uploadIds are set, fetch the latest uploadId
      if (uploadIds.length === 0) {
        try {
          const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
          const res = await axios.get(`${API_URL}/api/etl/get-billing-uploads`, {
            withCredentials: true,
          });
          
          const data = Array.isArray(res.data) ? res.data : [];
          if (data.length > 0) {
            // Sort by uploadedat descending to get the latest upload
            data.sort((a, b) => new Date(b.uploadedat) - new Date(a.uploadedat));
            const latestUploadId = data[0].uploadid;
            setUploadIds([latestUploadId]);
          }
        } catch (err) {
          console.error("Failed to fetch latest uploadId:", err);
        }
      }
      
      setLoading(false);
    };
    
    initDashboard();
  }, [fetchUser, uploadIds.length, setUploadIds]);

  return loading;
};

export default useDashboardInit;
