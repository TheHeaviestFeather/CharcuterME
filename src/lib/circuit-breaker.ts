// =============================================================================
// Circuit Breaker Pattern
// Prevents cascading failures when external services are down
// =============================================================================

type CircuitState = 'closed' | 'open' | 'half-open';

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailure: number = 0;
  private readonly name: string;
  private readonly threshold: number;
  private readonly timeout: number;

  constructor(name: string, threshold = 5, timeout = 60000) {
    this.name = name;
    this.threshold = threshold;
    this.timeout = timeout;
  }

  async execute<T>(fn: () => Promise<T>, fallback?: () => T | Promise<T>): Promise<T> {
    if (this.state === 'open') {
      // Check if timeout has passed
      if (Date.now() - this.lastFailure > this.timeout) {
        console.log(`[CircuitBreaker:${this.name}] Transitioning to half-open`);
        this.state = 'half-open';
      } else {
        console.log(`[CircuitBreaker:${this.name}] Circuit is open, using fallback`);
        if (fallback) return await fallback();
        throw new Error(`Circuit breaker '${this.name}' is open`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) {
        console.log(`[CircuitBreaker:${this.name}] Primary failed, using fallback`);
        return await fallback();
      }
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === 'half-open') {
      console.log(`[CircuitBreaker:${this.name}] Success in half-open, closing circuit`);
    }
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      console.error(
        `[CircuitBreaker:${this.name}] Circuit opened after ${this.failures} failures`
      );
      this.state = 'open';
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailure = 0;
  }
}

// Create breakers for each external service
export const dalleCircuit = new CircuitBreaker('dalle', 3, 30000);
export const claudeCircuit = new CircuitBreaker('claude', 5, 60000);
export const gptCircuit = new CircuitBreaker('gpt', 5, 60000);
