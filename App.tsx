import './global.css';
import { useEffect } from 'react';
import { supabase } from './src/lib/supabase';
import { useAuthStore } from './src/store/authStore';
import { RootNavigator } from './src/navigation';
import { Profile } from './src/types';

export default function App() {
  const { setProfile, setLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data as Profile);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(data as Profile);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return <RootNavigator />;
}
