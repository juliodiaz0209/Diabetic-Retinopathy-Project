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

    // Obtener usuario actual al cargar
    const getCurrentUser = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && isMounted) {
          // Obtener perfil completo del usuario
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();
          
          if (profile && isMounted) {
            setUser(profile);
          }
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    getCurrentUser();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profile && isMounted) {
              setUser(profile);
            }
          } catch (error) {
            console.error('Error getting profile:', error);
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUser(null);
          }
        }
      }
    );

    return () => {
      isMounted = false;
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