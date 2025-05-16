export interface State {
  totalProcessed?: number;
  totalFailed?: number;
  lastUpdated?: string;
  startTime?: number;
  startedAt?: string;
  currentPage?: number;
  totalPages?: number;
  [key: string]: any;
}

export interface BatchOptions {
  batchSize?: number;
  concurrencyLimit?: number;
  onBatchStart?: (batchNumber: number, totalBatches: number, batch: any[], state: State) => Promise<void> | void;
  onBatchComplete?: (
    batchNumber: number, 
    totalBatches: number, 
    batch: any[], 
    totalProcessed: number, 
    totalFailed: number, 
    state: State
  ) => Promise<void> | void;
  onItemSuccess?: (item: any, result: any, totalProcessed: number, state: State) => Promise<void> | void;
  onItemError?: (item: any, error: Error, totalFailed: number, state: State) => Promise<void> | void;
  onStateUpdate?: (state: State, batchNumber?: number, totalBatches?: number) => Promise<void> | void;
  stateUpdateInterval?: number;
  initialState?: State;
}

export interface BatchResult {
  processed: number;
  failed: number;
  state: State;
}

export interface PageData {
  items?: any[];
  results?: any[];
  totalPages?: number;
  [key: string]: any;
}

export interface PaginatedBatchOptions {
  initialPage?: number;
  concurrencyLimit?: number;
  onPageStart?: (currentPage: number, totalPages: number, state: State) => Promise<void> | void;
  onPageComplete?: (
    currentPage: number, 
    totalPages: number, 
    pageProcessed: number, 
    totalProcessed: number, 
    state: State
  ) => Promise<void> | void;
  onItemSuccess?: (item: any, result: any, totalProcessed: number, state: State) => Promise<void> | void;
  onItemError?: (item: any, error: Error, totalFailed: number, state: State) => Promise<void> | void;
  onStateUpdate?: (state: State) => Promise<void> | void;
  stateUpdateInterval?: number;
  initialState?: State;
} 