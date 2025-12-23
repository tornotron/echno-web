'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const SIDEBAR_STATE_KEY = 'echno-sidebar-collapsed';

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Use lazy initialization to read from localStorage only once on mount
  const [collapsed, setCollapsedState] = useState(() => {
    if (globalThis.window === undefined) return false;
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    // Default to expanded (false) if no saved state exists
    return savedState === null ? false : savedState === 'true';
  });

  const [mobileOpen, setMobileOpen] = useState(false);

  // Save state to localStorage whenever it changes
  const setCollapsed = (collapsed: boolean) => {
    setCollapsedState(collapsed);
    localStorage.setItem(SIDEBAR_STATE_KEY, String(collapsed));
  };

  return (
    <SidebarContext.Provider
      value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
