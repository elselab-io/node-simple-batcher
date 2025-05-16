// Export types
export * from './types';

// Export batch processor functions
export { processBatches, processPaginatedBatches } from './utils/batchProcessor';

// Export state manager
export { StateManager } from './utils/stateManager';

// Export state tracker
export { StateTracker } from './utils/stateTracker';

// Import required modules for the function below
import { StateManager } from './utils/stateManager';
import { processBatches } from './utils/batchProcessor';
import { State, BatchOptions } from './types';

// Export a simple utility to create a state manager with options to automatically save state
export function createBatchProcessorWithState<T, R>(
  processFunction: (item: T, index: number, state: State) => Promise<R>,
  stateFilePath: string,
  options: {
    saveStateOnBatch?: boolean;
    saveStateOnItem?: boolean;
    saveStateInterval?: number;
  } = {}
) {
  const { saveStateOnBatch = true, saveStateOnItem = false, saveStateInterval = 5 } = options;
  const stateManager = new StateManager(stateFilePath);
  
  return {
    /**
     * Process items with automatic state management
     */
    async process(items: T[], batchOptions: BatchOptions = {}) {
      // Load initial state
      const initialState = await stateManager.loadState();
      
      // Configure state update callbacks
      const onStateUpdate = async (state: State, batchNumber?: number, totalBatches?: number) => {
        if (saveStateOnBatch && batchNumber !== undefined && totalBatches !== undefined) {
          await stateManager.saveState(state);
        }
        if (batchOptions.onStateUpdate) {
          await batchOptions.onStateUpdate(state, batchNumber, totalBatches);
        }
      };
      
      const onItemSuccess = async (item: T, result: R, totalProcessed: number, state: State) => {
        if (saveStateOnItem && totalProcessed % saveStateInterval === 0) {
          await stateManager.saveState(state);
        }
        if (batchOptions.onItemSuccess) {
          await batchOptions.onItemSuccess(item, result, totalProcessed, state);
        }
      };
      
      // Process with automatic state management
      return processBatches(items, processFunction, {
        ...batchOptions,
        initialState,
        onStateUpdate,
        onItemSuccess
      });
    },
    
    /**
     * Clear the saved state
     */
    async clearState() {
      return stateManager.clearState();
    },
    
    /**
     * Get the current state
     */
    async getState() {
      return stateManager.loadState();
    },
    
    /**
     * Get the state manager instance
     */
    stateManager
  };
} 