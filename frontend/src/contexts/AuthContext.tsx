import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, User } from '@/lib/supabase';
import { supabaseAuthAPI } from '@/lib/supabaseApi';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    name: string;
    password: string;
    email: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    console.log('AuthContext: useEffect started');

    // Timeout de seguridad para evitar carga infinita
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.log('AuthContext: Safety timeout reached, setting isLoading to false');
        setIsLoading(false);
      }
    }, 3000); // 3 segundos máximo

    // Obtener sesión actual
    const getCurrentSession = async () => {
      try {
        console.log('AuthContext: Getting current session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthContext: Session result:', session);
        
        if (session?.user && isMounted) {
          // Crear un objeto User básico con la información disponible
          const basicUser: User = {
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            created_at: new Date().toISOString()
          };
          
          console.log('AuthContext: Setting user from session:', basicUser);
          setUser(basicUser);
        } else {
          console.log('AuthContext: No session found');
        }
      } catch (error) {
        console.error('Error getting current session:', error);
      } finally {
        if (isMounted) {
          console.log('AuthContext: Setting isLoading to false');
          setIsLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    };

    getCurrentSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state change:', event, session);
        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          const basicUser: User = {
            id: session.user.id,
            username: session.user.user_metadata?.username || session.user.email?.split('@')[0] || 'user',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email || '',
            created_at: new Date().toISOString()
          };
          
          console.log('AuthContext: Setting user from auth state change:', basicUser);
          setUser(basicUser);
        } else if (event === 'SIGNED_OUT') {
          console.log('AuthContext: User signed out');
          setUser(null);
        }
      }
    );

    return () => {
      console.log('AuthContext: Cleanup - unmounting');
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await supabaseAuthAPI.login({ email, password });
      // El usuario se establecerá automáticamente en el useEffect
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData: {
    username: string;
    name: string;
    password: string;
    email: string;
  }) => {
    try {
      await supabaseAuthAPI.register(userData);
      // El usuario se establecerá automáticamente en el useEffect
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabaseAuthAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Forzar logout local en caso de error
      setUser(null);
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};