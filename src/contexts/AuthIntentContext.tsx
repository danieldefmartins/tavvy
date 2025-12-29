import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthIntent {
  action: 'review' | 'save' | 'add_place' | 'edit_place' | 'check_in';
  returnTo: string;
  data?: Record<string, unknown>;
}

interface AuthIntentContextType {
  intent: AuthIntent | null;
  setIntent: (intent: AuthIntent | null) => void;
  requireAuth: (intent: Omit<AuthIntent, 'returnTo'>) => boolean;
  clearIntent: () => void;
  executeIntent: () => void;
}

const AuthIntentContext = createContext<AuthIntentContextType | undefined>(undefined);

export function AuthIntentProvider({ children }: { children: ReactNode }) {
  const [intent, setIntentState] = useState<AuthIntent | null>(() => {
    // Restore intent from sessionStorage on mount
    const stored = sessionStorage.getItem('auth-intent');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });
  const navigate = useNavigate();

  const setIntent = useCallback((newIntent: AuthIntent | null) => {
    setIntentState(newIntent);
    if (newIntent) {
      sessionStorage.setItem('auth-intent', JSON.stringify(newIntent));
    } else {
      sessionStorage.removeItem('auth-intent');
    }
  }, []);

  const clearIntent = useCallback(() => {
    setIntentState(null);
    sessionStorage.removeItem('auth-intent');
  }, []);

  // Returns true if auth is required (redirects to /auth), false if user is already authed
  const requireAuth = useCallback((intentData: Omit<AuthIntent, 'returnTo'>): boolean => {
    // This is used by components - they should check auth themselves first
    // This just sets up the intent and navigates
    const fullIntent: AuthIntent = {
      ...intentData,
      returnTo: window.location.pathname + window.location.search,
    };
    setIntent(fullIntent);
    navigate('/auth', { state: { from: fullIntent.returnTo } });
    return true;
  }, [navigate, setIntent]);

  const executeIntent = useCallback(() => {
    if (!intent) return;
    
    const returnPath = intent.returnTo || '/';
    clearIntent();
    navigate(returnPath);
  }, [intent, navigate, clearIntent]);

  return (
    <AuthIntentContext.Provider value={{ intent, setIntent, requireAuth, clearIntent, executeIntent }}>
      {children}
    </AuthIntentContext.Provider>
  );
}

export function useAuthIntent() {
  const context = useContext(AuthIntentContext);
  if (!context) {
    throw new Error('useAuthIntent must be used within AuthIntentProvider');
  }
  return context;
}