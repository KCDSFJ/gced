// Storage interface for the application
// This CSV Price Updater is stateless and doesn't require persistent storage

export interface IStorage {
  // Add storage methods here if needed in the future
}

export class MemStorage implements IStorage {
  constructor() {
    // No storage needed for CSV processing
  }
}

export const storage = new MemStorage();
