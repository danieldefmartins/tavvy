import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';

interface FooterContextType {
  isFooterVisible: boolean;
  hideFooter: () => void;
  showFooter: () => void;
  setMapInteracting: (interacting: boolean) => void;
  isMapInteracting: boolean;
  isScrollingDown: boolean;
}

const FooterContext = createContext<FooterContextType | undefined>(undefined);

export function FooterProvider({ children }: { children: ReactNode }) {
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY.current;
      
      // Only trigger if scroll delta is significant (> 10px)
      if (Math.abs(scrollDelta) > 10) {
        setIsScrollingDown(scrollDelta > 0 && currentScrollY > 50);
      }
      
      lastScrollY.current = currentScrollY;
      
      // Clear existing timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
      
      // Restore footer after scroll stops (300ms)
      scrollTimeout.current = setTimeout(() => {
        setIsScrollingDown(false);
      }, 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, []);

  const hideFooter = useCallback(() => {
    setIsFooterVisible(false);
  }, []);

  const showFooter = useCallback(() => {
    setIsFooterVisible(true);
  }, []);

  const setMapInteracting = useCallback((interacting: boolean) => {
    setIsMapInteracting(interacting);
  }, []);

  return (
    <FooterContext.Provider value={{ 
      isFooterVisible, 
      hideFooter, 
      showFooter, 
      setMapInteracting,
      isMapInteracting,
      isScrollingDown
    }}>
      {children}
    </FooterContext.Provider>
  );
}

export function useFooter() {
  const context = useContext(FooterContext);
  if (context === undefined) {
    throw new Error('useFooter must be used within a FooterProvider');
  }
  return context;
}
