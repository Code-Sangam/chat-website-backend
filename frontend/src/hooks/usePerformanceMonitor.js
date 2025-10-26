import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to monitor component render performance
 * @param {string} componentName - Name of the component being monitored
 * @param {boolean} enabled - Whether monitoring is enabled (default: only in development)
 */
export const useRenderPerformance = (componentName, enabled = import.meta.env.DEV) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    renderCount.current += 1;
    const currentTime = performance.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    
    if (renderCount.current > 1) {
      console.log(`[Performance] ${componentName} render #${renderCount.current} - ${timeSinceLastRender.toFixed(2)}ms since last render`);
    }
    
    lastRenderTime.current = currentTime;
  });

  return renderCount.current;
};

/**
 * Hook to measure function execution time
 * @param {boolean} enabled - Whether monitoring is enabled
 */
export const useExecutionTime = (enabled = import.meta.env.DEV) => {
  const measureTime = useCallback((fn, label = 'Function') => {
    if (!enabled) return fn();

    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    console.log(`[Performance] ${label} executed in ${(endTime - startTime).toFixed(2)}ms`);
    
    return result;
  }, [enabled]);

  const measureAsyncTime = useCallback(async (fn, label = 'Async Function') => {
    if (!enabled) return await fn();

    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    
    console.log(`[Performance] ${label} executed in ${(endTime - startTime).toFixed(2)}ms`);
    
    return result;
  }, [enabled]);

  return { measureTime, measureAsyncTime };
};

/**
 * Hook to monitor memory usage
 * @param {string} componentName - Name of the component
 * @param {number} interval - Monitoring interval in milliseconds
 */
export const useMemoryMonitor = (componentName, interval = 5000) => {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!import.meta.env.DEV || !performance.memory) return;

    intervalRef.current = setInterval(() => {
      const memory = performance.memory;
      console.log(`[Memory] ${componentName}:`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [componentName, interval]);
};

/**
 * Hook to detect slow renders
 * @param {number} threshold - Threshold in milliseconds to consider a render slow
 * @param {Function} onSlowRender - Callback when a slow render is detected
 */
export const useSlowRenderDetection = (threshold = 16, onSlowRender) => {
  const renderStartTime = useRef(performance.now());

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    
    if (renderTime > threshold) {
      console.warn(`[Performance] Slow render detected: ${renderTime.toFixed(2)}ms`);
      
      if (onSlowRender) {
        onSlowRender(renderTime);
      }
    }
  });
};

/**
 * Hook to track component lifecycle performance
 * @param {string} componentName - Name of the component
 */
export const useLifecyclePerformance = (componentName) => {
  const mountTime = useRef(null);
  const updateCount = useRef(0);

  useEffect(() => {
    // Component mounted
    mountTime.current = performance.now();
    console.log(`[Lifecycle] ${componentName} mounted`);

    return () => {
      // Component unmounted
      const lifetimeMs = performance.now() - mountTime.current;
      console.log(`[Lifecycle] ${componentName} unmounted after ${lifetimeMs.toFixed(2)}ms, ${updateCount.current} updates`);
    };
  }, [componentName]);

  useEffect(() => {
    // Component updated
    if (mountTime.current) {
      updateCount.current += 1;
      console.log(`[Lifecycle] ${componentName} updated (update #${updateCount.current})`);
    }
  });
};