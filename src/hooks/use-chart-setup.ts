import { useState, useEffect, useRef } from 'react';
import { setupChartJS, isChartJSSetup, isChartJSSetupInProgress, resetChartJSSetup } from '@/lib/chartjs-setup';

export function useChartSetup() {
  const [chartReady, setChartReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setupAttempted = useRef(false);

  useEffect(() => {
    const initializeChart = async () => {
      // If already ready or setup already attempted, don't do anything
      if (chartReady || setupAttempted.current) {
        return;
      }

      // If already set up, mark as ready
      if (isChartJSSetup()) {
        setChartReady(true);
        setIsLoading(false);
        setError(null);
        return;
      }

      setupAttempted.current = true;
      setIsLoading(true);
      setError(null);

      try {
        // Always call setupChartJS - it will return the existing promise if setup is in progress
        await setupChartJS();
        
        // Check setup completion
        if (isChartJSSetup()) {
          setChartReady(true);
          setIsLoading(false);
        } else {
          console.error('useChartSetup: Chart setup failed - isChartJSSetup() returned false');
          setError('Chart setup failed');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('useChartSetup: Chart setup error:', err);
        setError(err instanceof Error ? err.message : 'Chart setup failed');
        setIsLoading(false);
      }
    };

    initializeChart();
  }, []); // Remove chartReady from dependency array to prevent infinite loop

  // Function to manually retry setup
  const retrySetup = () => {
    setError(null);
    setChartReady(false);
    setIsLoading(true);
    setupAttempted.current = false; // Reset attempt flag
    // Reset the Chart.js setup state to force a fresh attempt
    resetChartJSSetup();
    
    // Re-run the initialization
    const initializeChart = async () => {
      try {
        await setupChartJS();
        
        if (isChartJSSetup()) {
          setChartReady(true);
          setIsLoading(false);
        } else {
          console.error('useChartSetup: Retry failed - isChartJSSetup() returned false');
          setError('Chart setup failed');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('useChartSetup: Retry error:', err);
        setError(err instanceof Error ? err.message : 'Chart setup failed');
        setIsLoading(false);
      }
    };
    
    initializeChart();
  };

  return {
    chartReady,
    isLoading,
    error,
    retrySetup
  };
}
