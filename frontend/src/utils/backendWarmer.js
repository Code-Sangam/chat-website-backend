// Backend warming utility to prevent cold starts
const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class BackendWarmer {
  constructor() {
    this.isWarming = false;
    this.isWarm = false;
    this.warmingPromise = null;
  }

  async warmBackend() {
    if (this.isWarm || this.isWarming) {
      return this.warmingPromise;
    }

    this.isWarming = true;
    console.log('🔥 Warming up backend server...');

    this.warmingPromise = this.performWarmup();
    
    try {
      await this.warmingPromise;
      this.isWarm = true;
      console.log('✅ Backend server is warm and ready');
    } catch (error) {
      console.warn('⚠️ Backend warming failed:', error.message);
    } finally {
      this.isWarming = false;
    }

    return this.warmingPromise;
  }

  async performWarmup() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        console.log('🎯 Backend health check successful:', data);
        return true;
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Backend warming timed out - server may be cold starting');
      }
      throw error;
    }
  }

  // Check if backend is likely cold (hasn't been warmed recently)
  isLikelyCold() {
    const lastWarm = localStorage.getItem('backend_last_warm');
    if (!lastWarm) return true;
    
    const timeSinceWarm = Date.now() - parseInt(lastWarm);
    return timeSinceWarm > 10 * 60 * 1000; // 10 minutes
  }

  // Mark backend as recently warmed
  markAsWarmed() {
    localStorage.setItem('backend_last_warm', Date.now().toString());
    this.isWarm = true;
  }

  // Auto-warm on app start if likely cold
  async autoWarm() {
    if (this.isLikelyCold()) {
      await this.warmBackend();
      this.markAsWarmed();
    }
  }
}

export const backendWarmer = new BackendWarmer();