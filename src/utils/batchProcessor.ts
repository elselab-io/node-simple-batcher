import pLimit from 'p-limit';
import { 
  BatchOptions, 
  BatchResult, 
  State, 
  PageData, 
  PaginatedBatchOptions 
} from '../types';

/**
 * Process items in batches with controlled concurrency
 * @param items - Array of items to process
 * @param processFunction - Async function to process each item
 * @param options - Configuration options
 * @returns Statistics about the processing
 */
export async function processBatches<T, R>(
  items: T[], 
  processFunction: (item: T, index: number, state: State) => Promise<R>, 
  options: BatchOptions = {}
): Promise<BatchResult> {
  const {
    batchSize = 20,
    concurrencyLimit = 10,
    onBatchStart = () => {},
    onBatchComplete = () => {},
    onItemSuccess = () => {},
    onItemError = () => {},
    onStateUpdate = () => {},
    stateUpdateInterval = 5,
    initialState = {}
  } = options;

  let totalProcessed = initialState.totalProcessed || 0;
  let totalFailed = initialState.totalFailed || 0;
  let currentState: State = { ...initialState };
  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    
    // Notify batch start
    await onBatchStart(batchNumber, totalBatches, batch, currentState);
    
    const limit = pLimit(concurrencyLimit);
    let batchProcessed = 0;
    
    // Process items in the batch with concurrency limit
    await Promise.all(
      batch.map((item, index) => limit(async () => {
        try {
          const result = await processFunction(item, index, currentState);
          totalProcessed++;
          batchProcessed++;
          await onItemSuccess(item, result, totalProcessed, currentState);
          
          // Update state periodically
          if (batchProcessed % stateUpdateInterval === 0 || batchProcessed === batch.length) {
            currentState = {
              ...currentState,
              totalProcessed,
              totalFailed,
              lastUpdated: new Date().toISOString()
            };
            await onStateUpdate(currentState, batchNumber, totalBatches);
          }
          
          return result;
        } catch (error) {
          totalFailed++;
          await onItemError(item, error instanceof Error ? error : new Error(String(error)), totalFailed, currentState);
          return null;
        }
      }))
    );
    
    // Update state at the end of each batch
    currentState = {
      ...currentState,
      totalProcessed,
      totalFailed,
      lastUpdated: new Date().toISOString()
    };
    await onStateUpdate(currentState, batchNumber, totalBatches);
    
    // Notify batch completion
    await onBatchComplete(batchNumber, totalBatches, batch, totalProcessed, totalFailed, currentState);
  }
  
  return {
    processed: totalProcessed,
    failed: totalFailed,
    state: currentState
  };
}

/**
 * Process items in paginated batches with controlled concurrency
 * @param fetchPageFunction - Function to fetch a page of items
 * @param processFunction - Async function to process each item
 * @param options - Configuration options
 * @returns Processing statistics
 */
export async function processPaginatedBatches<T, R>(
  fetchPageFunction: (page: number, state: State) => Promise<PageData>,
  processFunction: (item: T, index: number, state: State) => Promise<R>,
  options: PaginatedBatchOptions = {}
): Promise<BatchResult> {
  const {
    initialPage = 1,
    concurrencyLimit = 10,
    onPageStart = () => {},
    onPageComplete = () => {},
    onItemSuccess = () => {},
    onItemError = () => {},
    onStateUpdate = () => {},
    stateUpdateInterval = 5,
    initialState = {}
  } = options;

  let currentPage = initialState.currentPage || initialPage;
  let totalPages = initialState.totalPages || 1;
  let totalProcessed = initialState.totalProcessed || 0;
  let totalFailed = initialState.totalFailed || 0;
  let currentState: State = { ...initialState, currentPage, totalPages, totalProcessed, totalFailed };

  while (currentPage <= totalPages) {
    // Fetch the current page of items
    await onPageStart(currentPage, totalPages, currentState);
    const pageData = await fetchPageFunction(currentPage, currentState);
    
    // Update total pages if needed
    if (pageData.totalPages && pageData.totalPages !== totalPages) {
      totalPages = pageData.totalPages;
      currentState = { ...currentState, totalPages };
      await onStateUpdate(currentState);
    }

    const items = (pageData.items || pageData.results || []) as T[];
    if (items.length === 0) {
      console.log(`No items found on page ${currentPage}.`);
      currentPage++;
      currentState = { ...currentState, currentPage };
      await onStateUpdate(currentState);
      continue;
    }

    // Process the items on this page with concurrency
    const limit = pLimit(concurrencyLimit);
    let pageProcessed = 0;
    
    await Promise.all(
      items.map((item, index) => limit(async () => {
        try {
          const result = await processFunction(item, index, currentState);
          totalProcessed++;
          pageProcessed++;
          await onItemSuccess(item, result, totalProcessed, currentState);
          
          // Update state periodically
          if (pageProcessed % stateUpdateInterval === 0 || pageProcessed === items.length) {
            currentState = {
              ...currentState,
              totalProcessed,
              totalFailed,
              lastUpdated: new Date().toISOString()
            };
            await onStateUpdate(currentState);
          }
          
          return result;
        } catch (error) {
          totalFailed++;
          await onItemError(item, error instanceof Error ? error : new Error(String(error)), totalFailed, currentState);
          return null;
        }
      }))
    );

    // Update state at the end of each page
    currentPage++;
    currentState = {
      ...currentState,
      currentPage,
      totalProcessed,
      totalFailed,
      lastUpdated: new Date().toISOString()
    };
    await onStateUpdate(currentState);
    
    // Notify page completion
    await onPageComplete(currentPage - 1, totalPages, pageProcessed, totalProcessed, currentState);
  }
  
  return {
    processed: totalProcessed,
    failed: totalFailed,
    state: currentState
  };
} 