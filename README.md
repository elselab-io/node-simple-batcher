# @elselab/node-simple-batcher

A simple, powerful batch processing library for Node.js with built-in state management, concurrency control, and TypeScript support.

## Features

- ✅ Process arrays of items in batches with controlled concurrency
- ✅ Process paginated data with automatic state tracking 
- ✅ Save and restore processing state (useful for resuming interrupted jobs)
- ✅ TypeScript support with full type definitions
- ✅ Flexible callback system for monitoring progress
- ✅ Progress tracking with estimated time remaining
- ✅ Simple API for common use cases

## Installation

```bash
npm install @elselab/node-simple-batcher
```

## Basic Usage

### Processing an Array of Items

```typescript
import { processBatches } from '@elselab/node-simple-batcher';

async function processItem(item, index, state) {
  // Process the item (e.g. API call, database operation, etc.)
  return { processed: true, item };
}

const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Process with custom options
const result = await processBatches(items, processItem, {
  batchSize: 3,                    // Process 3 items per batch
  concurrencyLimit: 2,             // Run at most 2 concurrent operations 
  stateUpdateInterval: 2,          // Update state every 2 items
  onBatchStart: (batchNum, total, batch, state) => {
    console.log(`Starting batch ${batchNum}/${total} with ${batch.length} items`);
  },
  onBatchComplete: (batchNum, total, batch, processed, failed, state) => {
    console.log(`Completed batch ${batchNum}/${total}, total processed: ${processed}`);
  }
});

console.log(`Processed ${result.processed} items, failed: ${result.failed}`);
```

### Processing Paginated Data

```typescript
import { processPaginatedBatches } from '@elselab/node-simple-batcher';

// Function to fetch a page of data
async function fetchPage(pageNumber, state) {
  const response = await fetch(`https://api.example.com/items?page=${pageNumber}`);
  const data = await response.json();
  return {
    items: data.results,
    totalPages: data.totalPages
  };
}

// Function to process each item
async function processItem(item, index, state) {
  // Process the item
  return { processed: true, item };
}

// Process all pages
const result = await processPaginatedBatches(fetchPage, processItem, {
  initialPage: 1,
  concurrencyLimit: 5,
  onPageStart: (pageNum, totalPages, state) => {
    console.log(`Starting page ${pageNum}/${totalPages || '?'}`);
  },
  onPageComplete: (pageNum, totalPages, pageProcessed, totalProcessed, state) => {
    console.log(`Completed page ${pageNum}/${totalPages}, processed: ${pageProcessed}`);
  }
});

console.log(`Total processed: ${result.processed}, failed: ${result.failed}`);
```

### Using the State Manager for Resumable Jobs

```typescript
import { createBatchProcessorWithState } from '@elselab/node-simple-batcher';

// Function to process each item
async function processItem(item, index, state) {
  // Process the item
  return { processed: true, item };
}

// Create a batch processor with automatic state management
const batchProcessor = createBatchProcessorWithState(
  processItem,
  './batch-state.json',  // Path to store state
  {
    saveStateOnBatch: true,  // Save state after each batch
    saveStateOnItem: true,   // Save state after processing items
    saveStateInterval: 5     // Save every 5 items when saveStateOnItem is true
  }
);

// Get all items to process
const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

try {
  // Process items with automatic state management
  // If the process stops and restarts, it will resume from the last saved state
  const result = await batchProcessor.process(items, {
    batchSize: 3,
    concurrencyLimit: 2
  });
  
  console.log(`Completed processing with ${result.processed} processed items`);
  
  // Clear state after successful completion
  await batchProcessor.clearState();
} catch (error) {
  console.error('Processing error:', error);
  // State is automatically saved, so the job can be resumed later
  const currentState = await batchProcessor.getState();
  console.log('Current progress:', currentState);
}
```

### Progress Tracking with StateTracker

```typescript
import { processBatches, StateTracker } from '@elselab/node-simple-batcher';

// Create items to process
const items = Array.from({ length: 100 }, (_, i) => i + 1);

// Create a state tracker
const tracker = new StateTracker(items.length);

// Update progress display every second
const progressInterval = setInterval(() => {
  process.stdout.write(`\r${tracker.formatProgress()}`);
}, 1000);

// Process the items
const result = await processBatches(
  items,
  async (item) => {
    // Your processing logic here
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
    return { success: true };
  },
  {
    batchSize: 10,
    concurrencyLimit: 5,
    onItemSuccess: (_, __, totalProcessed, state) => {
      // Update tracker with current progress
      tracker.updateProgress(totalProcessed, state.totalFailed || 0);
    },
    onItemError: (_, __, totalFailed, state) => {
      tracker.updateProgress(state.totalProcessed || 0, totalFailed);
    }
  }
);

// Clear interval when done
clearInterval(progressInterval);
console.log(`\nComplete! Processed ${result.processed} items`);
```

## API Reference

### `processBatches(items, processFunction, options)`

Process an array of items in batches with controlled concurrency.

**Parameters:**
- `items`: Array of items to process
- `processFunction`: Async function to process each item
- `options`: Configuration options
  - `batchSize`: Number of items to process in each batch (default: 20)
  - `concurrencyLimit`: Maximum number of concurrent operations (default: 10)
  - `onBatchStart`: Callback when a batch starts
  - `onBatchComplete`: Callback when a batch completes
  - `onItemSuccess`: Callback when an item is processed successfully
  - `onItemError`: Callback when an item processing fails
  - `onStateUpdate`: Callback to save state periodically
  - `stateUpdateInterval`: How often to update state (# of items) (default: 5)
  - `initialState`: Initial state object to use

**Returns:** Promise resolving to `{ processed, failed, state }`

### `processPaginatedBatches(fetchPageFunction, processFunction, options)`

Process paginated data with automatic page fetching.

**Parameters:**
- `fetchPageFunction`: Function to fetch a page of items
- `processFunction`: Async function to process each item
- `options`: Configuration options
  - `initialPage`: Starting page number (default: 1)
  - `concurrencyLimit`: Maximum number of concurrent operations (default: 10)
  - `onPageStart`: Callback when a page starts
  - `onPageComplete`: Callback when a page completes
  - `onItemSuccess`: Callback when an item is processed successfully
  - `onItemError`: Callback when an item processing fails
  - `onStateUpdate`: Callback to save state
  - `stateUpdateInterval`: How often to update state (# of items) (default: 5)
  - `initialState`: Initial state object to use

**Returns:** Promise resolving to `{ processed, failed, state }`

### `createBatchProcessorWithState(processFunction, stateFilePath, options)`

Create a batch processor with automatic state management for resumable operations.

**Parameters:**
- `processFunction`: Async function to process each item
- `stateFilePath`: Path to save state file
- `options`: Configuration options
  - `saveStateOnBatch`: Whether to save state after each batch (default: true)
  - `saveStateOnItem`: Whether to save state after processing items (default: false)
  - `saveStateInterval`: How often to save state when saveStateOnItem is true (default: 5)

**Returns:** Object with the following methods:
- `process(items, batchOptions)`: Process items with state management
- `clearState()`: Clear the saved state
- `getState()`: Get the current state
- `stateManager`: The StateManager instance

### `StateManager`

Low-level class for managing state persistence.

**Methods:**
- `constructor(stateFilePath)`: Create a state manager
- `saveState(state)`: Save state to file
- `loadState()`: Load state from file
- `clearState()`: Clear saved state

### `StateTracker`

Utility for tracking progress and displaying status information.

**Methods:**
- `constructor(totalItems, initialState)`: Create a tracker
- `updateProgress(processed, failed, additionalData)`: Update progress
- `getState()`: Get current state
- `getProgress()`: Get progress statistics
- `formatProgress(showSpeed)`: Format progress as a string

## License

ISC 