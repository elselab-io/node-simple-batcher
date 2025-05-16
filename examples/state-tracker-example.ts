// Example using StateTracker for progress monitoring
import { 
  processBatches, 
  StateManager, 
  StateTracker,
  State 
} from '../src';

/**
 * Simulate a slow API call to process items
 */
async function processItem(item: number): Promise<any> {
  // Simulate processing with random delay (200-500ms)
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  // Simulate occasional failures (10% chance)
  if (Math.random() < 0.1) {
    throw new Error(`Processing failed for item ${item}`);
  }
  
  return { id: item, result: `Processed-${item}`, timestamp: new Date().toISOString() };
}

/**
 * Run processing with progress tracking
 */
async function runWithProgressTracking() {
  // Create items to process (100 items)
  const items = Array.from({ length: 100 }, (_, i) => i + 1);
  
  // Create state manager for persistence
  const stateManager = new StateManager('./tmp/tracker-state.json');
  
  // Try to load previous state
  const savedState = await stateManager.loadState();
  
  console.log('Initial state:', Object.keys(savedState).length ? savedState : 'No saved state');
  
  // Create state tracker
  const tracker = new StateTracker(items.length, savedState);
  
  // Update progress every second
  const progressInterval = setInterval(() => {
    process.stdout.write(`\r${tracker.formatProgress()}`);
  }, 1000);
  
  try {
    // Process items with progress tracking
    const result = await processBatches(
      items,
      async (item, index, state) => {
        try {
          const result = await processItem(item);
          return result;
        } catch (error) {
          console.error(`\nError processing item ${item}: ${error instanceof Error ? error.message : error}`);
          throw error;
        }
      },
      {
        batchSize: 10,
        concurrencyLimit: 5,
        stateUpdateInterval: 1,
        initialState: savedState,
        onItemSuccess: (_, __, totalProcessed, state) => {
          // Update tracker on each successful item
          tracker.updateProgress(totalProcessed, state.totalFailed || 0);
        },
        onItemError: (_, __, totalFailed, state) => {
          // Update tracker on each failed item
          tracker.updateProgress(state.totalProcessed || 0, totalFailed);
        },
        onStateUpdate: async (state) => {
          // Save state periodically
          await stateManager.saveState(state);
        },
        onBatchComplete: (batchNum, totalBatches) => {
          // Show batch completion
          console.log(`\nCompleted batch ${batchNum}/${totalBatches}`);
          process.stdout.write(`${tracker.formatProgress()}`);
        }
      }
    );
    
    // Clear progress interval
    clearInterval(progressInterval);
    
    // Show final results
    console.log('\n\nProcessing completed!');
    console.log(`Processed ${result.processed} items, failed: ${result.failed}`);
    
    const trackerState = tracker.getState();
    const elapsedTime = Math.round((Date.now() - (trackerState.startTime as number)) / 1000);
    console.log(`Total time: ${elapsedTime}s`);
    
    // Clear state after successful completion
    await stateManager.clearState();
    console.log('State cleared.');
  } catch (error) {
    // Clear progress interval
    clearInterval(progressInterval);
    
    console.error('\n\nProcessing failed:', error instanceof Error ? error.message : error);
    console.log('Current progress saved. You can resume later.');
  }
}

// Run the example
runWithProgressTracking().catch(console.error); 