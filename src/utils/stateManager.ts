import fs from 'fs';
import path from 'path';
import { State } from '../types';

/**
 * StateManager provides functions to save and load processing state
 */
export class StateManager {
  private filePath: string;
  
  /**
   * Create a state manager instance
   * @param stateFilePath - Path to save state file
   */
  constructor(stateFilePath: string) {
    this.filePath = stateFilePath;
    
    // Ensure the directory exists
    const directory = path.dirname(this.filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
  }
  
  /**
   * Save the current state to file
   * @param state - The state object to save
   */
  async saveState(state: State): Promise<void> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(state, null, 2);
      fs.writeFile(this.filePath, data, 'utf8', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  
  /**
   * Load state from file
   * @returns The loaded state or an empty object if file doesn't exist
   */
  async loadState(): Promise<State> {
    return new Promise((resolve) => {
      if (!fs.existsSync(this.filePath)) {
        resolve({});
        return;
      }
      
      fs.readFile(this.filePath, 'utf8', (err, data) => {
        if (err) {
          console.warn(`Could not load state from ${this.filePath}:`, err.message);
          resolve({});
        } else {
          try {
            const state = JSON.parse(data);
            resolve(state);
          } catch (parseError) {
            console.warn(`Invalid state file format in ${this.filePath}`);
            resolve({});
          }
        }
      });
    });
  }
  
  /**
   * Clear saved state
   */
  async clearState(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(this.filePath)) {
        resolve();
        return;
      }
      
      fs.unlink(this.filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
} 