// Chart.js setup function - only call this from client components
import type { ChartComponentLike } from 'chart.js';

let isSetup = false;
let setupPromise: Promise<void> | null = null;
let setupStartTime: number | null = null;
let dataLabelsAvailable = false;

type ChartJsModuleWithOptionalRadar = typeof import('chart.js') & {
  RadarController?: ChartComponentLike;
  controllers?: {
    radar?: ChartComponentLike;
  };
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function isChartJSSetup(): boolean {
  return isSetup;
}

export function isDataLabelsAvailable(): boolean {
  return dataLabelsAvailable;
}

export function setupChartJS(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve(); // Don't run on server
  }

  if (isSetup) {
    return Promise.resolve();
  }

  if (setupPromise) {
    return setupPromise;
  }

  // Track setup start time for debugging
  setupStartTime = Date.now();
  
  setupPromise = Promise.all([
    import('chart.js').catch(error => {
      console.error('setupChartJS: Failed to import chart.js:', error);
      throw new Error(`Failed to load Chart.js: ${getErrorMessage(error)}`);
    }),
    import('chartjs-adapter-date-fns').catch(error => {
      console.error('setupChartJS: Failed to import chartjs-adapter-date-fns:', error);
      throw new Error(`Failed to load date adapter: ${getErrorMessage(error)}`);
    }),
    // Make data labels plugin optional - if it fails, we'll continue without it
    import('chartjs-plugin-datalabels').catch(error => {
      console.warn('setupChartJS: Failed to import chartjs-plugin-datalabels, continuing without data labels:', error);
      return null; // Return null instead of throwing error
    }),
    // Import Filler plugin for fill option support
    import('chart.js/auto').catch(error => {
      console.warn('setupChartJS: Failed to import chart.js/auto, continuing without auto-registration:', error);
      return null;
    })
  ]).then(([chartJS, dateAdapter, dataLabels, chartAuto]) => {
    const { Chart: ChartJS, LinearScale, PointElement, Tooltip, Legend, TimeScale, ArcElement, CategoryScale, LogarithmicScale, BarElement, LineElement, Title, Filler, RadialLinearScale } = chartJS;
    
    // Try to get RadarController if available (may not be directly exported in all Chart.js versions)
    const chartModule = chartJS as ChartJsModuleWithOptionalRadar;
    const RadarController = chartModule.RadarController || chartModule.controllers?.radar;
    
    try {
      // Register scales first
      ChartJS.register(LinearScale);
      ChartJS.register(CategoryScale);
      ChartJS.register(LogarithmicScale);
      ChartJS.register(TimeScale);
      ChartJS.register(RadialLinearScale);
      
      // Then register elements
      ChartJS.register(PointElement);
      ChartJS.register(BarElement);
      ChartJS.register(LineElement);
      ChartJS.register(ArcElement);
      
      // Register RadarController if available (react-chartjs-2 may handle this automatically)
      if (RadarController) {
        ChartJS.register(RadarController);
      }
      
      // Then register plugins
      ChartJS.register(Tooltip);
      ChartJS.register(Legend);
      ChartJS.register(Title);
      ChartJS.register(Filler); // Register Filler plugin for fill option support
      
      // Only register data labels plugin if it loaded successfully
      if (dataLabels) {
        ChartJS.register(dataLabels.default);
        dataLabelsAvailable = true;
      } else {
        dataLabelsAvailable = false;
      }
      
      isSetup = true;
    } catch (error) {
      console.error('setupChartJS: Failed to register Chart.js components:', error);
      setupPromise = null;
      setupStartTime = null;
      throw error;
    }
  }).catch(error => {
    console.error('setupChartJS: Failed to load Chart.js:', error);
    setupPromise = null; // Reset on error so we can retry
    setupStartTime = null;
    throw error;
  });

  return setupPromise;
}

// Add a function to check if setup is in progress
export function isChartJSSetupInProgress(): boolean {
  const inProgress = setupPromise !== null && !isSetup;
  return inProgress;
}

// Add a function to get setup status for debugging
export function getChartJSSetupStatus(): { isSetup: boolean; isInProgress: boolean; setupTime?: number } {
  return {
    isSetup,
    isInProgress: isChartJSSetupInProgress(),
    setupTime: setupStartTime ? Date.now() - setupStartTime : undefined
  };
}

// Add a function to reset setup state for debugging
export function resetChartJSSetup(): void {
  isSetup = false;
  setupPromise = null;
  setupStartTime = null;
  dataLabelsAvailable = false;
} 
