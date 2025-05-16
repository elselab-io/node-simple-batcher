// Basic usage example for node-simple-batcher
import { 
  processBatches, 
  createBatchProcessorWithState, 
  StateManager 
} from '../src';

// Mock data processing function (e.g., API call)
async function processItem(item: number): Promise<{ id: number, processed: true }> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
  
  // Simulate occasional failures
  if (Math.random() < 0.1) {
    throw new Error(`Failed to process item ${item}`);
  }
  
  return { id: item, processed: true };
}

// Example 1: Simple batch processing
async function simpleBatchExample() {
  console.log('Example 1: Simple batch processing');
  
  const items = Array.from({ length: 50 }, (_, i) => i + 1);
  
  console.log(`Processing ${items.length} items...`);
  
  const result = await processBatches(
    items,
    processItem,
    {
      batchSize: 10,
      concurrencyLimit: 3,
      onBatchStart: (batchNum, total) => {
        console.log(`Starting batch ${batchNum}/${total}`);
      },
      onBatchComplete: (batchNum, total, _, processed, failed) => {
        console.log(`Completed batch ${batchNum}/${total}, progress: ${processed}/${items.length} (failed: ${failed})`);
      },
      onItemSuccess: (item, result) => {
        console.log(`Processed item ${item} -> ${result.id}`);
      },
      onItemError: (item, error) => {
        console.error(`Error processing item ${item}: ${error.message}`);
      }
    }
  );
  
  console.log(`Batch processing complete!`);
  console.log(`Total processed: ${result.processed}, failed: ${result.failed}`);
}

// Example 2: Batch processing with state management
async function stateManagementExample() {
  console.log('\nExample 2: Batch processing with state management');
  
  const items = Array.from({ length: 30 }, (_, i) => i + 1);
  
  // Create a batch processor with state management
  const batchProcessor = createBatchProcessorWithState(
    processItem,
    './tmp/example-state.json',
    {
      saveStateOnBatch: true,
      saveStateOnItem: true,
      saveStateInterval: 5
    }
  );
  
  // Get current state (if there's a previous run)
  const initialState = await batchProcessor.getState();
  console.log('Initial state:', initialState);
  
  try {
    console.log(`Processing ${items.length} items with state management...`);
    
    const result = await batchProcessor.process(items, {
      batchSize: 5,
      concurrencyLimit: 2,
      onBatchComplete: (batchNum, total, _, processed, failed) => {
        console.log(`Completed batch ${batchNum}/${total}, progress: ${processed}/${items.length} (failed: ${failed})`);
      }
    });
    
    console.log(`Processing complete!`);
    console.log(`Total processed: ${result.processed}, failed: ${result.failed}`);
    
    // Clear state after successful completion
    await batchProcessor.clearState();
    console.log('State cleared after successful completion');
  } catch (error) {
    console.error('Processing failed:', error);
    
    // Show the saved state (progress so far)
    const currentState = await batchProcessor.getState();
    console.log('Current saved state:', currentState);
  }
}

// Run examples
async function runExamples() {
  await simpleBatchExample();
  await stateManagementExample();
}

runExamples().catch(console.error); 