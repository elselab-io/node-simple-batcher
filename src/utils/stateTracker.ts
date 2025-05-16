import { State } from '../types';

/**
 * StateTracker provides a simple way to track progress and status of batch processes
 */
export class StateTracker {
  private totalItems: number;
  private startTime: number;
  private state: State;
  
  /**
   * Create a new StateTracker instance
   * @param totalItems - Total number of items to process
   * @param initialState - Initial state (optional)
   */
  constructor(totalItems: number, initialState: State = {}) {
    this.totalItems = totalItems;
    this.startTime = Date.now();
    this.state = {
      ...initialState,
      totalProcessed: initialState.totalProcessed || 0,
      totalFailed: initialState.totalFailed || 0,
      startTime: initialState.startTime || this.startTime,
      startedAt: initialState.startedAt || new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Get the current state
   */
  getState(): State {
    return { ...this.state };
  }
  
  /**
   * Update the state with new progress
   * @param processed - Number of processed items
   * @param failed - Number of failed items
   * @param additionalData - Additional data to merge into state
   */
  updateProgress(processed: number, failed: number, additionalData: Record<string, any> = {}): State {
    this.state = {
      ...this.state,
      ...additionalData,
      totalProcessed: processed,
      totalFailed: failed,
      lastUpdated: new Date().toISOString()
    };
    
    return this.getState();
  }
  
  /**
   * Get progress statistics
   */
  getProgress(): {
    processed: number;
    failed: number;
    total: number;
    percent: number;
    elapsed: number;
    estimatedRemaining: number;
    itemsPerSecond: number;
  } {
    const processed = this.state.totalProcessed || 0;
    const failed = this.state.totalFailed || 0;
    const elapsed = (Date.now() - this.startTime) / 1000; // in seconds
    const percent = this.totalItems > 0 ? (processed / this.totalItems) * 100 : 0;
    const itemsPerSecond = elapsed > 0 ? processed / elapsed : 0;
    const estimatedRemaining = itemsPerSecond > 0
      ? (this.totalItems - processed) / itemsPerSecond
      : -1;
    
    return {
      processed,
      failed,
      total: this.totalItems,
      percent,
      elapsed,
      estimatedRemaining,
      itemsPerSecond
    };
  }
  
  /**
   * Format the current progress as a string
   * @param showSpeed - Whether to show processing speed
   */
  formatProgress(showSpeed = true): string {
    const progress = this.getProgress();
    const percent = progress.percent.toFixed(1);
    
    let result = `Progress: ${progress.processed}/${progress.total} (${percent}%)`;
    
    if (progress.failed > 0) {
      result += `, Failed: ${progress.failed}`;
    }
    
    if (showSpeed) {
      const speed = progress.itemsPerSecond.toFixed(2);
      result += `, Speed: ${speed} items/sec`;
      
      if (progress.estimatedRemaining > 0) {
        const remaining = formatTime(progress.estimatedRemaining);
        result += `, ETA: ${remaining}`;
      }
    }
    
    return result;
  }
}

/**
 * Format seconds into a human-readable time string
 */
function formatTime(seconds: number): string {
  if (seconds < 0) return 'unknown';
  
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = '';
  if (hrs > 0) result += `${hrs}h `;
  if (mins > 0 || hrs > 0) result += `${mins}m `;
  result += `${secs}s`;
  
  return result;
} 