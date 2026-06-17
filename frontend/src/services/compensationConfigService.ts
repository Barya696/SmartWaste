// ── Compensation Config Service ──────────────────────────────────────────────

const compensationConfigService = {

  // ── Material prices ──────────────────────────────────────────────────────
  /**
   * Fetch all material prices from backend
   * Returns: { "Plastic": 500, "Metal": 600, ... }
   */
  async getMaterialPrices(): Promise<Record<string, number>> {
    try {
      console.log('[CompensationConfigService] Fetching material prices');
      const response = await fetch('http://localhost:8080/api/material-prices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CompensationConfigService] Error fetching prices:', errorText);
        throw new Error(`Failed to fetch material prices: ${response.status}`);
      }

      const prices = await response.json();
      console.log('[CompensationConfigService] Successfully fetched prices:', prices);
      return prices;
    } catch (err) {
      console.error('[CompensationConfigService] Error fetching prices:', err);
      throw err;
    }
  },

  /**
   * Save or update material prices
   * Body: { "Plastic": 500, "Metal": 600, ... }
   */
  async saveMaterialPrices(prices: Record<string, number>): Promise<any> {
    try {
      console.log('[CompensationConfigService] Saving material prices:', prices);
      const response = await fetch('http://localhost:8080/api/material-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(prices),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[CompensationConfigService] Error saving prices:', errorText);
        throw new Error(`Failed to save material prices: ${response.status}`);
      }

      const result = await response.json();
      console.log('[CompensationConfigService] Successfully saved prices:', result);
      return result;
    } catch (err) {
      console.error('[CompensationConfigService] Error saving prices:', err);
      throw err;
    }
  },

  // ── Tax config ───────────────────────────────────────────────────────────
  /**
   * Fetch tax configuration
   * Returns: { "VAT": 18, "Environmental Levy": 2 }
   */
  async getTaxConfig(): Promise<Record<string, number>> {
    try {
      console.log('[CompensationConfigService] Fetching tax config');
      const response = await fetch('http://localhost:8080/api/tax-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch tax config: ${response.status}`);
      }

      const config = await response.json();
      console.log('[CompensationConfigService] Successfully fetched tax config:', config);
      return config;
    } catch (err) {
      console.error('[CompensationConfigService] Error fetching tax config:', err);
      throw err;
    }
  },

  /**
   * Save tax configuration
   * Body: { "VAT": 18, "Environmental Levy": 2 }
   */
  async saveTaxConfig(taxes: Record<string, number>): Promise<any> {
    try {
      console.log('[CompensationConfigService] Saving tax config:', taxes);
      const response = await fetch('http://localhost:8080/api/tax-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(taxes),
      });

      if (!response.ok) {
        throw new Error(`Failed to save tax config: ${response.status}`);
      }

      const result = await response.json();
      console.log('[CompensationConfigService] Successfully saved tax config:', result);
      return result;
    } catch (err) {
      console.error('[CompensationConfigService] Error saving tax config:', err);
      throw err;
    }
  },

  // ── Share config ─────────────────────────────────────────────────────────
  /**
   * Fetch share configuration
   * Returns: { "Citizen": 60, "Collector": 25, "System": 15 }
   */
  async getShareConfig(): Promise<Record<string, number>> {
    try {
      console.log('[CompensationConfigService] Fetching share config');
      const response = await fetch('http://localhost:8080/api/share-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch share config: ${response.status}`);
      }

      const config = await response.json();
      console.log('[CompensationConfigService] Successfully fetched share config:', config);
      return config;
    } catch (err) {
      console.error('[CompensationConfigService] Error fetching share config:', err);
      throw err;
    }
  },

  /**
   * Save share configuration
   * Body: { "Citizen": 60, "Collector": 25, "System": 15 }
   */
  async saveShareConfig(shares: Record<string, number>): Promise<any> {
    try {
      console.log('[CompensationConfigService] Saving share config:', shares);
      const response = await fetch('http://localhost:8080/api/share-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(shares),
      });

      if (!response.ok) {
        throw new Error(`Failed to save share config: ${response.status}`);
      }

      const result = await response.json();
      console.log('[CompensationConfigService] Successfully saved share config:', result);
      return result;
    } catch (err) {
      console.error('[CompensationConfigService] Error saving share config:', err);
      throw err;
    }
  },
};

export default compensationConfigService;
