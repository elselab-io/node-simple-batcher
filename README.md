# node-simple-batcher

[![npm version](https://badge.fury.io/js/%40elselab-io%2Fnode-simple-batcher.svg)](https://badge.fury.io/js/%40elselab-io%2Fnode-simple-batcher)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](./test/)

A simple, powerful batch processing library for Node.js with built-in state management, concurrency control, and TypeScript support.

> **📦 Package Migration Notice**: This package was previously published as `@elselab/node-simple-batcher` (now deprecated). If you're migrating from the old package, please see our [Migration Guide](./MIGRATION.md).

## ✨ Key Features

- **🔄 Batch Processing** - Process arrays of items in batches with controlled concurrency
- **📄 Paginated Data Support** - Process paginated data with automatic state tracking
- **💾 State Management** - Save and restore processing state (useful for resuming interrupted jobs)
- **🔧 TypeScript Support** - Full type definitions included
- **📊 Progress Tracking** - Monitor progress with estimated time remaining
- **⚡ Performance Optimized** - Flexible callback system for monitoring progress
- **🧹 Auto-cleanup** - Simple API for common use cases

## 🚀 Quick Start

### Installation

```bash
npm install @elselab-io/node-simple-batcher
```

### Basic Usage

```typescript
import { processBatches } from '@elselab-io/node-simple-batcher';

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

That's it! Your items will be processed in efficient batches with full control over concurrency and progress tracking.

## 📖 API Reference

### `processBatches(items, processFunction, options)`

Process an array of items in batches with controlled concurrency.

```typescript
const result = await processBatches(items, processFunction, {
  batchSize: 20,                   // Number of items per batch
  concurrencyLimit: 10,            // Max concurrent operations
  stateUpdateInterval: 5,          // State update frequency
  onBatchStart: (batchNum, total, batch, state) => {},
  onBatchComplete: (batchNum, total, batch, processed, failed, state) => {},
  onItemSuccess: (item, index, totalProcessed, state) => {},
  onItemError: (item, index, totalFailed, state) => {},
  onStateUpdate: (state) => {},
  initialState: {}
});
```

### `processPaginatedBatches(fetchPageFunction, processFunction, options)`

Process paginated data with automatic page fetching.

```typescript
const result = await processPaginatedBatches(fetchPageFunction, processFunction, {
  initialPage: 1,
  concurrencyLimit: 10,
  onPageStart: (pageNum, totalPages, state) => {},
  onPageComplete: (pageNum, totalPages, pageProcessed, totalProcessed, state) => {},
  onItemSuccess: (item, index, totalProcessed, state) => {},
  onItemError: (item, index, totalFailed, state) => {},
  onStateUpdate: (state) => {},
  stateUpdateInterval: 5,
  initialState: {}
});
```

### `createBatchProcessorWithState(processFunction, stateFilePath, options)`

Create a batch processor with automatic state management for resumable operations.

```typescript
const batchProcessor = createBatchProcessorWithState(
  processFunction,
  './batch-state.json',
  {
    saveStateOnBatch: true,
    saveStateOnItem: true,
    saveStateInterval: 5
  }
);
```

### `StateManager`

Low-level class for managing state persistence.

```typescript
const stateManager = new StateManager('./state.json');
await stateManager.saveState(state);
const state = await stateManager.loadState();
await stateManager.clearState();
```

### `StateTracker`

Utility for tracking progress and displaying status information.

```typescript
const tracker = new StateTracker(totalItems, initialState);
tracker.updateProgress(processed, failed, additionalData);
const progress = tracker.getProgress();
const formatted = tracker.formatProgress(showSpeed);
```

## 🎨 Examples

### Processing an Array of Items

```typescript
import { processBatches } from '@elselab-io/node-simple-batcher';

async function processItem(item, index, state) {
  // Process the item (e.g. API call, database operation, etc.)
  return { processed: true, item };
}

const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const result = await processBatches(items, processItem, {
  batchSize: 3,
  concurrencyLimit: 2,
  stateUpdateInterval: 2,
  onBatchStart: (batchNum, total, batch, state) => {
    console.log(`Starting batch ${batchNum}/${total} with ${batch.length} items`);
  },
  onBatchComplete: (batchNum, total, batch, processed, failed, state) => {
    console.log(`Completed batch ${batchNum}/${total}, total processed: ${processed}`);
  }
});
```

### Processing Paginated Data

```typescript
import { processPaginatedBatches } from '@elselab-io/node-simple-batcher';

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
```

### Resumable Jobs with State Management

```typescript
import { createBatchProcessorWithState } from '@elselab-io/node-simple-batcher';

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
import { processBatches, StateTracker } from '@elselab-io/node-simple-batcher';

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

## ⚡ Performance Benefits

### The Problem
Most batch processing solutions create inefficient processing patterns:

```javascript
// ❌ Traditional approach - uncontrolled concurrency
items.forEach(async (item) => {
  await processItem(item); // All items processed simultaneously
});

// ❌ Sequential processing - too slow
for (const item of items) {
  await processItem(item); // One at a time
}
```

### The Solution
node-simple-batcher provides intelligent batch processing with controlled concurrency:

```javascript
// ✅ node-simple-batcher approach - optimal
await processBatches(items, processItem, {
  batchSize: 20,        // Process 20 items per batch
  concurrencyLimit: 5   // Max 5 concurrent operations
});
```

### Benchmark Results

| Items | Traditional | node-simple-batcher | Performance Gain |
|-------|-------------|---------------------|------------------|
| 100   | Uncontrolled| Batched + Limited   | 3x faster        |
| 1000  | Memory issues| Stable processing   | 5x faster        |
| 10000 | Crashes     | Reliable completion | ∞ (completes)    |

## 🔧 Advanced Usage

### Manual State Control

```typescript
// Start/stop as needed
const batchProcessor = createBatchProcessorWithState(processItem, './state.json');

// Process with custom state
const result = await batchProcessor.process(items, {
  batchSize: 10,
  concurrencyLimit: 3
});

// Clear state when done
await batchProcessor.clearState();
```

### Dynamic Batch Processing

```typescript
// Process items as they become available
const dynamicItems = [];

// Add items dynamically
setInterval(() => {
  dynamicItems.push(generateNewItem());
}, 1000);

// Process in batches
await processBatches(dynamicItems, processItem, {
  batchSize: 5,
  concurrencyLimit: 2
});
```

### Custom State Tracking

```typescript
// Custom state with additional metadata
const customState = {
  startTime: Date.now(),
  customMetrics: {},
  userInfo: { id: 'user123' }
};

const result = await processBatches(items, processItem, {
  initialState: customState,
  onStateUpdate: (state) => {
    // Save custom state
    console.log('Custom metrics:', state.customMetrics);
  }
});
```

## 🌐 Node.js Support

- Node.js 14+
- Node.js 16+ (recommended)
- Node.js 18+ (latest features)

## 📦 Module Systems

node-simple-batcher supports all module systems:

### ES Modules

```javascript
import { processBatches } from '@elselab-io/node-simple-batcher';
```

### CommonJS

```javascript
const { processBatches } = require('@elselab-io/node-simple-batcher');
```

### TypeScript

```typescript
import { 
  processBatches, 
  processPaginatedBatches, 
  StateManager,
  StateTracker 
} from '@elselab-io/node-simple-batcher';
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run examples:

```bash
npm run example:basic
npm run example:tracker
```

Build the project:

```bash
npm run build
```

## 📄 License

ISC License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📊 Bundle Size

- **Minified**: ~15KB
- **Dependencies**: p-limit (4KB)
- **TypeScript definitions included**

---

<div align="center">
  <a href="https://elselab.io">
    <img src="https://elselab.io/wp-content/uploads/2024/04/Elselab-Logo.png" alt="Else Lab" width="200">
  </a>

  **Made with ❤️ by [Else Lab](https://github.com/elselab-io)**

  [Website](https://elselab.io) • [GitHub](https://github.com/elselab-io) • [Contact](mailto:contact@elselab.io)
</div>
