export {
  CircuitBreaker,
  createLoopGuard,
  createProtectedDebounce,
} from './infinite-loop-guards';

export {
  useCircuitBreaker,
  useEffectMonitor,
  useInfiniteLoopDetection,
  useProtectedDebounce,
  useRetryGuard,
  useStateUpdateGuard,
} from './infinite-loop-hooks';

import {
  CircuitBreaker,
  createLoopGuard,
  createProtectedDebounce,
} from './infinite-loop-guards';
import {
  useCircuitBreaker,
  useEffectMonitor,
  useInfiniteLoopDetection,
  useProtectedDebounce,
  useRetryGuard,
  useStateUpdateGuard,
} from './infinite-loop-hooks';

const infiniteLoopDetectionUtils = {
  useInfiniteLoopDetection,
  useEffectMonitor,
  useStateUpdateGuard,
  CircuitBreaker,
  useCircuitBreaker,
  createLoopGuard,
  useRetryGuard,
  createProtectedDebounce,
  useProtectedDebounce,
};

export default infiniteLoopDetectionUtils;
