/**
 * Governance Service
 * Business logic for governance and compliance
 */

import * as policies from './governance.policies.js';

export const governanceService = {
  /**
   * Get governance summary
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Governance summary
   */
  async getGovernanceSummary(params = {}) {
    return policies.generateGovernanceSummary(params);
  },

  /**
   * Get tag compliance report
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Tag compliance metrics
   */
  async getTagCompliance(params = {}) {
    return policies.checkTagCompliance(params);
  },

  /**
   * Get ownership gaps report
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Ownership compliance metrics
   */
  async getOwnershipGaps(params = {}) {
    return policies.checkOwnershipGaps(params);
  },

  /**
   * Get accounts with ownership data
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Accounts data with ownership insights
   */
  async getAccountsWithOwnership(params = {}) {
    return policies.getAccountsWithOwnership(params);
  },

  /**
   * Suggest owner for an account
   * @param {Object} account - Account data
   * @returns {string} Suggested owner
   */
  suggestAccountOwner(account) {
    return policies.suggestAccountOwner(account);
  },

  /**
   * Update account owner
   * @param {string} accountId - Account ID
   * @param {string} owner - Owner email/name
   * @param {Array} uploadIds - User's upload IDs
   * @returns {Promise<Object>} Updated account info
   */
  async updateAccountOwner(accountId, owner, uploadIds = []) {
    return policies.updateAccountOwner(accountId, owner, uploadIds);
  }
};
