import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../../store/Authstore';
import { useDashboardStore } from '../../../../store/Dashboard.store';
import { apiGet } from '../../../../services/http';

interface BillingUpload {
  uploadid: string;
  uploadedat: string;
}

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
          const response = await apiGet<BillingUpload[]>("/api/etl/get-billing-uploads");
          
          const data = Array.isArray(response) ? response : [];
          if (data.length > 0) {
            // Sort by uploadedat descending to get the latest upload
            data.sort((a: BillingUpload, b: BillingUpload) => new Date(b.uploadedat).getTime() - new Date(a.uploadedat).getTime());
            const latestUploadId = data[0]?.uploadid;
            if (latestUploadId) {
              setUploadIds([latestUploadId]);
            }
          }
        } catch (err: unknown) {
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
