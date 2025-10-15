/**
 * Database Management API Client
 * Handles database cleanup operations
 */

const API_BASE_URL = 'http://127.0.0.1:8002';

// ======================= API FUNCTIONS =======================

/**
 * Clear all databases (ChromaDB collections)
 * Use when switching contexts or leaving threads
 * @returns Success status
 */
export async function clearAllDatabases(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/database/clear-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(`Database clear failed: ${errorData.detail || response.statusText}`);
    }

    const data = await response.json();
    console.log('🗑️ Database cleared:', data.message);
    return { success: true, message: data.message || 'Database cleared successfully' };
  } catch (error) {
    console.error('Failed to clear database:', error);
    // Don't throw error - this is a cleanup operation that shouldn't break the UI
    return { success: false, message: 'Failed to clear database' };
  }
}
