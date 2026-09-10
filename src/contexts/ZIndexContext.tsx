"use client";

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

import {
  INITIAL_Z_INDEX,
  Z_INDEX_INCREMENT,
  getLayerOverlayZIndex,
  getLayerZIndex,
  registerZIndexItem,
  type ZIndexItem,
  type ZIndexLayerType,
} from './z-index-context-utils';

interface ZIndexContextType {
  registerComponent: (id: string, type: ZIndexLayerType) => number;
  unregisterComponent: (id: string) => void;
  getZIndex: (id: string) => number;
  getOverlayZIndex: (id: string) => number;
  getContentZIndex: (id: string) => number;
  components: ZIndexItem[];
}

const ZIndexContext = createContext<ZIndexContextType | undefined>(undefined);

export function ZIndexProvider({ children }: { children: React.ReactNode }) {
  const [components, setComponents] = useState<ZIndexItem[]>([]);
  const registrationCounts = useRef(new Map<string, number>());

  const registerComponent = useCallback((id: string, type: ZIndexLayerType) => {
    registrationCounts.current.set(id, (registrationCounts.current.get(id) ?? 0) + 1);
    setComponents(prev => registerZIndexItem(prev, id, type, Date.now()));
    
    // We can't return the exact z-index synchronously here because it's calculated in the next state update.
    // However, getDynamicZIndex hook will update the component value via useMemo when the state changes.
    // For synchronous return (if needed), we might need a more complex approach but current hooks use state updates.
    return INITIAL_Z_INDEX; 
  }, []);

  const unregisterComponent = useCallback((id: string) => {
    const nextCount = (registrationCounts.current.get(id) ?? 1) - 1;
    if (nextCount > 0) {
      registrationCounts.current.set(id, nextCount);
      return;
    }

    registrationCounts.current.delete(id);
    setComponents(prev => prev.filter(comp => comp.id !== id));
  }, []);

  const getZIndex = useCallback((id: string) => {
    return getLayerZIndex(components, id);
  }, [components]);

  const getOverlayZIndex = useCallback((id: string) => {
    return getLayerOverlayZIndex(components, id);
  }, [components]);

  const getContentZIndex = useCallback((id: string) => {
    return getZIndex(id);
  }, [getZIndex]);

  return (
    <ZIndexContext.Provider
      value={{
        registerComponent,
        unregisterComponent,
        getZIndex,
        getOverlayZIndex,
        getContentZIndex,
        components,
      }}
    >
      {children}
    </ZIndexContext.Provider>
  );
}

export function useZIndex() {
  const context = useContext(ZIndexContext);
  if (context === undefined) {
    throw new Error('useZIndex must be used within a ZIndexProvider');
  }
  return context;
}

// Hook for components that need dynamic z-index
export function useDynamicZIndex(id: string, type: ZIndexLayerType) {
  const { components, registerComponent, unregisterComponent, getOverlayZIndex, getContentZIndex } = useZIndex();
  
  React.useEffect(() => {
    registerComponent(id, type);
    return () => unregisterComponent(id);
  }, [id, type, registerComponent, unregisterComponent]);

  // Use useMemo to ensure z-index values are reactive to components state changes
  const overlayZIndex = React.useMemo(() => getOverlayZIndex(id), [getOverlayZIndex, id]);
  const contentZIndex = React.useMemo(() => {
    const registeredZIndex = getContentZIndex(id);

    // Select/popover content is portalled outside its parent dialog. These
    // components can mount before the dialog itself, which means registration
    // order alone may place the dropdown behind the dialog. Keep dropdowns one
    // layer above every currently registered surface so their options remain
    // visible and interactive.
    if (type !== 'dropdown' || components.length === 0) {
      return registeredZIndex;
    }

    const highestRegisteredZIndex = Math.max(
      ...components.map((component) => component.zIndex),
    );

    return Math.max(registeredZIndex, highestRegisteredZIndex + Z_INDEX_INCREMENT);
  }, [components, getContentZIndex, id, type]);

  return {
    overlayZIndex,
    contentZIndex,
  };
}

export function useLayerInstanceId(explicitId: string | undefined, prefix: string) {
  const reactId = React.useId();
  return explicitId || `${prefix}-${reactId.replace(/:/g, '')}`;
}

// Hook for debugging z-index layers
export function useZIndexDebug() {
  const { components } = useZIndex();
  return components;
}
