"use client";
import { createContext, useContext, useState, useCallback } from 'react';
const LoadingContext = createContext(undefined);
export function LoadingProvider({ children }) {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Loading...');
    const startLoading = useCallback(() => {
        setIsLoading(true);
    }, []);
    const stopLoading = useCallback(() => {
        setIsLoading(false);
        setLoadingMessage('Loading...');
    }, []);
    const value = {
        isLoading,
        setIsLoading,
        startLoading,
        stopLoading,
        loadingMessage,
        setLoadingMessage,
    };
    return (<LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>);
}
export function useLoading() {
    const context = useContext(LoadingContext);
    if (context === undefined) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
}
