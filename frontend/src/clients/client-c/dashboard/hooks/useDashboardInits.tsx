import { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/Authstore';

const useDashboardInit = () => {
  const [loading, setLoading] = useState(true);
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      await fetchUser();
      setLoading(false);
    };
    init();
  }, [fetchUser]);

  return loading;
};

export default useDashboardInit;