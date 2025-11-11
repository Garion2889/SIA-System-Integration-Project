import { useEffect, useState } from 'react';
import { getSupabaseClient } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

export function useRealtimeOrders(accessToken: string | null, onOrderUpdate?: () => void) {
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!accessToken) return;

    // Poll for updates every 5 seconds (simulating realtime for KV store)
    const interval = setInterval(async () => {
      setLastUpdate(Date.now());
      onOrderUpdate?.();
    }, 5000);

    return () => clearInterval(interval);
  }, [accessToken]);

  return { lastUpdate };
}
