const membaseService = require('./MembaseService');
const logger = require('../../utils/logger');

class PreferenceManager {
    constructor() {
        this.categories = {
            TRADING: 'trading',
            SECURITY: 'security',
            NOTIFICATIONS: 'notifications',
            GENERAL: 'general'
        };

        this.defaultPreferences = {
            risk_tolerance: 'medium',
            gas_strategy: 'standard',
            slippage_tolerance: 0.5,
            auto_approve: false,
            notifications_enabled: true,
            theme: 'dark'
        };
    }

    /**
     * Set user preference
     * @param {string} userId - User identifier
     * @param {string} category - Preference category
     * @param {string} key - Preference key
     * @param {any} value - Preference value
     * @returns {Promise<Object>} Set result
     */
    async setPreference(userId, category, key, value) {
        try {
            const prefKey = `${category}.${key}`;

            await membaseService.storeUserPreference(userId, prefKey, value);

            logger.info('Preference set', { userId, category, key, value });

            return {
                success: true,
                user_id: userId,
                category,
                key,
                value,
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Set preference error:', error.message);
            throw new Error(`Failed to set preference: ${error.message}`);
        }
    }

    /**
     * Get specific preference
     * @param {string} userId - User identifier
     * @param {string} category - Preference category
     * @param {string} key - Preference key
     * @returns {Promise<any>} Preference value
     */
    async getPreference(userId, category, key) {
        try {
            const preferences = await membaseService.getUserPreferences(userId);
            const prefKey = `${category}.${key}`;

            const value = preferences[prefKey];

            logger.info('Preference retrieved', { userId, category, key });

            return value !== undefined ? value : this.getDefaultValue(key);
        } catch (error) {
            logger.error('Get preference error:', error.message);
            return this.getDefaultValue(key);
        }
    }

    /**
     * Get all user preferences
     * @param {string} userId - User identifier
     * @returns {Promise<Object>} All preferences
     */
    async getAllPreferences(userId) {
        try {
            const preferences = await membaseService.getUserPreferences(userId);

            // Organize by category
            const organized = {
                trading: {},
                security: {},
                notifications: {},
                general: {}
            };

            for (const [key, value] of Object.entries(preferences)) {
                const [category, prefKey] = key.split('.');
                if (organized[category]) {
                    organized[category][prefKey] = value;
                }
            }

            // Fill in defaults for missing preferences
            const complete = {
                ...organized,
                defaults: this.defaultPreferences
            };

            logger.info('All preferences retrieved', { userId });

            return complete;
        } catch (error) {
            logger.error('Get all preferences error:', error.message);
            return {
                trading: {},
                security: {},
                notifications: {},
                general: {},
                defaults: this.defaultPreferences
            };
        }
    }

    /**
     * Update risk tolerance
     * @param {string} userId - User identifier
     * @param {string} level - Risk level (low/medium/high)
     * @returns {Promise<Object>} Update result
     */
    async updateRiskTolerance(userId, level) {
        try {
            const validLevels = ['low', 'medium', 'high'];

            if (!validLevels.includes(level.toLowerCase())) {
                throw new Error(`Invalid risk level. Must be one of: ${validLevels.join(', ')}`);
            }

            const result = await this.setPreference(
                userId,
                this.categories.TRADING,
                'risk_tolerance',
                level.toLowerCase()
            );

            logger.info('Risk tolerance updated', { userId, level });

            return result;
        } catch (error) {
            logger.error('Update risk tolerance error:', error.message);
            throw new Error(`Failed to update risk tolerance: ${error.message}`);
        }
    }

    /**
     * Update gas strategy
     * @param {string} userId - User identifier
     * @param {string} strategy - Gas strategy (slow/standard/fast/custom)
     * @returns {Promise<Object>} Update result
     */
    async updateGasStrategy(userId, strategy) {
        try {
            const validStrategies = ['slow', 'standard', 'fast', 'custom'];

            if (!validStrategies.includes(strategy.toLowerCase())) {
                throw new Error(`Invalid gas strategy. Must be one of: ${validStrategies.join(', ')}`);
            }

            const result = await this.setPreference(
                userId,
                this.categories.TRADING,
                'gas_strategy',
                strategy.toLowerCase()
            );

            logger.info('Gas strategy updated', { userId, strategy });

            return result;
        } catch (error) {
            logger.error('Update gas strategy error:', error.message);
            throw new Error(`Failed to update gas strategy: ${error.message}`);
        }
    }

    /**
     * Update slippage tolerance
     * @param {string} userId - User identifier
     * @param {number} slippage - Slippage percentage (0.1 - 50)
     * @returns {Promise<Object>} Update result
     */
    async updateSlippageTolerance(userId, slippage) {
        try {
            const slippageNum = parseFloat(slippage);

            if (isNaN(slippageNum) || slippageNum < 0.1 || slippageNum > 50) {
                throw new Error('Slippage must be between 0.1 and 50');
            }

            const result = await this.setPreference(
                userId,
                this.categories.TRADING,
                'slippage_tolerance',
                slippageNum
            );

            logger.info('Slippage tolerance updated', { userId, slippage: slippageNum });

            return result;
        } catch (error) {
            logger.error('Update slippage tolerance error:', error.message);
            throw new Error(`Failed to update slippage tolerance: ${error.message}`);
        }
    }

    /**
     * Update notification settings
     * @param {string} userId - User identifier
     * @param {boolean} enabled - Enable/disable notifications
     * @returns {Promise<Object>} Update result
     */
    async updateNotifications(userId, enabled) {
        try {
            const result = await this.setPreference(
                userId,
                this.categories.NOTIFICATIONS,
                'enabled',
                Boolean(enabled)
            );

            logger.info('Notifications updated', { userId, enabled });

            return result;
        } catch (error) {
            logger.error('Update notifications error:', error.message);
            throw new Error(`Failed to update notifications: ${error.message}`);
        }
    }

    /**
     * Update auto-approve setting
     * @param {string} userId - User identifier
     * @param {boolean} autoApprove - Enable/disable auto-approve
     * @returns {Promise<Object>} Update result
     */
    async updateAutoApprove(userId, autoApprove) {
        try {
            const result = await this.setPreference(
                userId,
                this.categories.SECURITY,
                'auto_approve',
                Boolean(autoApprove)
            );

            logger.info('Auto-approve updated', { userId, autoApprove });

            return result;
        } catch (error) {
            logger.error('Update auto-approve error:', error.message);
            throw new Error(`Failed to update auto-approve: ${error.message}`);
        }
    }

    /**
     * Reset preferences to defaults
     * @param {string} userId - User identifier
     * @param {string} category - Category to reset (optional, resets all if not specified)
     * @returns {Promise<Object>} Reset result
     */
    async resetPreferences(userId, category = null) {
        try {
            const resetCount = 0;

            if (category) {
                // Reset specific category
                const categoryDefaults = this.getCategoryDefaults(category);
                for (const [key, value] of Object.entries(categoryDefaults)) {
                    await this.setPreference(userId, category, key, value);
                }
            } else {
                // Reset all
                for (const [key, value] of Object.entries(this.defaultPreferences)) {
                    const cat = this.inferCategory(key);
                    await this.setPreference(userId, cat, key, value);
                }
            }

            logger.info('Preferences reset', { userId, category: category || 'all' });

            return {
                success: true,
                user_id: userId,
                category: category || 'all',
                reset_at: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Reset preferences error:', error.message);
            throw new Error(`Failed to reset preferences: ${error.message}`);
        }
    }

    /**
     * Get default value for a preference key
     * @param {string} key - Preference key
     * @returns {any} Default value
     */
    getDefaultValue(key) {
        return this.defaultPreferences[key] || null;
    }

    /**
     * Get category defaults
     * @param {string} category - Category name
     * @returns {Object} Category defaults
     */
    getCategoryDefaults(category) {
        const categoryMap = {
            trading: {
                risk_tolerance: 'medium',
                gas_strategy: 'standard',
                slippage_tolerance: 0.5
            },
            security: {
                auto_approve: false
            },
            notifications: {
                enabled: true
            },
            general: {
                theme: 'dark'
            }
        };

        return categoryMap[category] || {};
    }

    /**
     * Infer category from preference key
     * @param {string} key - Preference key
     * @returns {string} Category
     */
    inferCategory(key) {
        const categoryMap = {
            risk_tolerance: this.categories.TRADING,
            gas_strategy: this.categories.TRADING,
            slippage_tolerance: this.categories.TRADING,
            auto_approve: this.categories.SECURITY,
            notifications_enabled: this.categories.NOTIFICATIONS,
            theme: this.categories.GENERAL
        };

        return categoryMap[key] || this.categories.GENERAL;
    }

    /**
     * Validate preference value
     * @param {string} key - Preference key
     * @param {any} value - Preference value
     * @returns {boolean} Is valid
     */
    validatePreference(key, value) {
        const validators = {
            risk_tolerance: (v) => ['low', 'medium', 'high'].includes(v),
            gas_strategy: (v) => ['slow', 'standard', 'fast', 'custom'].includes(v),
            slippage_tolerance: (v) => !isNaN(v) && v >= 0.1 && v <= 50,
            auto_approve: (v) => typeof v === 'boolean',
            notifications_enabled: (v) => typeof v === 'boolean',
            theme: (v) => ['light', 'dark'].includes(v)
        };

        const validator = validators[key];
        return validator ? validator(value) : true;
    }
}

module.exports = new PreferenceManager();
