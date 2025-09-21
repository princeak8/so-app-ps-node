import localStorage from './localStorage';
const axios = require('axios');
import { getDateTime } from './helpers';
import stationIds from './stationIds';

class PowerDataQueue {
    constructor(config = {}) {
        this.config = {
            apiBaseUrl: config.apiBaseUrl || process.env.API_BASE_URL || 'http://localhost:8000/api',
            batchSize: config.batchSize || 50,
            flushInterval: config.flushInterval || 30000, // 30 seconds
            maxRetries: config.maxRetries || 3,
            retryDelay: config.retryDelay || 5000, // 5 seconds
            enableLogging: config.enableLogging || false,
            ...config
        };

        this.stationIdsArr = Object.values(stationIds);

        // Array of station IDs that should save unit data
        this.stationsWithUnitData = config.stationsWithUnitData || [];
        
        // Queue keys for localStorage
        this.POWER_DATA_QUEUE = 'power_data_queue';
        this.UNIT_DATA_QUEUE = 'unit_data_queue';
        this.FAILED_REQUESTS_QUEUE = 'failed_requests_queue';
        
        this.isProcessing = false;
        this.processingTimer = null;
        
        // Initialize queues
        this.initializeQueues();
        
        // Start the periodic flush process
        this.startPeriodicFlush();
    }

    initializeQueues() {
        // Initialize empty arrays if queues don't exist
        if (!localStorage.getItem(this.POWER_DATA_QUEUE)) {
            localStorage.setItem(this.POWER_DATA_QUEUE, JSON.stringify([]));
        }
        // if (!localStorage.getItem(this.UNIT_DATA_QUEUE)) {
        //     localStorage.setItem(this.UNIT_DATA_QUEUE, JSON.stringify([]));
        // }
        if (!localStorage.getItem(this.FAILED_REQUESTS_QUEUE)) {
            localStorage.setItem(this.FAILED_REQUESTS_QUEUE, JSON.stringify([]));
        }
    }

    /**
     * Process and queue power station data asynchronously
     * @param {Object} data - The power station data
     * @param {string} data.id - Station ID
     * @param {string} data.t - Timestamp
     * @param {Array} data.sections - Unit data sections
     */
    async queuePowerData(data) {
        try {
            const timestamp = (data.t) ? getDateTime(data.t) : getDateTime();
            const stationId = data.id ? data.id : data.name; // this.extractStationId(data.id);
            
            if (!stationId) {
                this.log('Warning: Could not extract station ID from', data.id);
                return;
            }

            // Calculate total load from all sections
            let nonAbsLoads = [stationIds.Alaoji, stationIds.OlorunsogoNipp];
            let totalLoad = (!nonAbsLoads.includes(data?.id)) ? this.calculateTotalLoad(data.sections) : this.calculateTotalLoad(data.sections, false);
            
            // Prepare power data (always saved for all stations)
            const powerData = {
                powerStationId: stationId,
                load: totalLoad,
                frequency: this.extractFrequency(data.sections),
                capturedAt: timestamp
            };
            if (this.stationsWithUnitData.includes(stationId)) powerData.unitsData = this.extractUnitSections(data.sections);

            // Add to power data queue
            await this.addToPowerDataQueue(powerData);

            // Only save unit data for specified stations
            // if (this.stationsWithUnitData.includes(stationId)) {
            //     const unitDataArray = this.prepareUnitData(stationId, data.sections, timestamp);
                
            //     for (const unitData of unitDataArray) {
            //         await this.addToUnitDataQueue(unitData);
            //     }
            // }

            // Trigger flush if batch size is reached
            await this.checkAndFlushIfNeeded();

        } catch (error) {
            this.log('Error queuing power data:', error.message);
        }
    }

    /**
     * Extract station ID from data.id (e.g., 'delta2' -> 2)
     */
    extractStationId(id) {
        // You may need to adjust this logic based on your ID format
        const match = id.match(/\d+/);
        return match ? parseInt(match[0]) : null;
    }

    /**
     * Calculate total MW load from all sections
     */
    calculateTotalLoad(sections, abs=true) {
        if (!Array.isArray(sections)) return 0;
        
        let total = sections.reduce((total, section) => {
            let mw = parseFloat(section.data?.mw || 0);
            if(abs) mw = (mw < 0) ? (mw * -1) : mw
            return total + mw;
        }, 0).toFixed(4);

        if(total < 0) total = 0; //total * -1;
        return total;
    }

    extractUnitSections(sections) {
        let newSections = [];
        if(sections.length > 0) {
            sections.forEach((section) => {
                newSections.push({
                    id: section.id,
                    mw: parseFloat(section.data.mw),
                    a: parseFloat(section.data.a),
                    kv: parseFloat(section.data.v),
                    mx: parseFloat(section.data.mx),
                    pf: parseFloat(section.data.pf),
                    frequency: parseFloat(section.data.f),
                });
            })
        }
        return newSections;
    }

    /**
     * Extract average frequency from sections
     */
    // extractFrequency(sections) {
    //     if (!Array.isArray(sections) || sections.length === 0) return 50.0;
        
    //     const frequencies = sections
    //         .map(section => parseFloat(section.data?.f || 50.0))
    //         .filter(f => !isNaN(f));
            
    //     if (frequencies.length === 0) return 50.0;
        
    //     const avgFrequency = frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length;
    //     return parseFloat(avgFrequency.toFixed(4));
    // }
    extractFrequency(sections) {
        if (!Array.isArray(sections) || sections.length === 0) return 50.0;
        
        const frequencies = sections
            .map(section => parseFloat(section.data?.f || 50.0))
            .filter(f => !isNaN(f));
            
        if (frequencies.length === 0) return 50.0;
        
        const avgFrequency = frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length;
        const result = parseFloat(avgFrequency.toFixed(4));
        
        return result < 0 ? null : result;
    }

    /**
     * Prepare unit data array from sections
     */
    prepareUnitData(stationId, sections, timestamp) {
        if (!Array.isArray(sections)) return [];
        
        return sections.map(section => ({
            powerStationId: stationId,
            powerUnitId: this.extractUnitId(section.id),
            mw: parseFloat(section.data?.mw || 0),
            kv: parseFloat(section.data?.v || 0), // v maps to kv
            a: parseFloat(section.data?.a || 0),
            mx: parseFloat(section.data?.mx || 0),
            frequency: parseFloat(section.data?.f || 50.0),
            capturedAt: timestamp
        })).filter(unit => unit.powerUnitId !== null);
    }

    /**
     * Extract unit ID from section.id (e.g., 'gt6' -> 6)
     */
    extractUnitId(id) {
        const match = id.match(/\d+/);
        return match ? parseInt(match[0]) : null;
    }

    /**
     * Add power data to queue
     */
    async addToPowerDataQueue(powerData) {
        const queue = JSON.parse(localStorage.getItem(this.POWER_DATA_QUEUE) || '[]');
        queue.push(powerData);
        await localStorage.setItem(this.POWER_DATA_QUEUE, JSON.stringify(queue));
    }

    /**
     * Add unit data to queue
     */
    async addToUnitDataQueue(unitData) {
        const queue = JSON.parse(localStorage.getItem(this.UNIT_DATA_QUEUE) || '[]');
        queue.push(unitData);
        await localStorage.setItem(this.UNIT_DATA_QUEUE, JSON.stringify(queue));
    }

    /**
     * Check if flush is needed and execute if so
     */
    async checkAndFlushIfNeeded() {
        const powerQueue = JSON.parse(localStorage.getItem(this.POWER_DATA_QUEUE) || '[]');
        const unitQueue = JSON.parse(localStorage.getItem(this.UNIT_DATA_QUEUE) || '[]');
        
        const totalItems = powerQueue.length + unitQueue.length;
        
        if (totalItems >= this.config.batchSize) {
            await this.flushQueues();
        }
    }

    /**
     * Start periodic flush process
     */
    startPeriodicFlush() {
        this.processingTimer = setInterval(async () => {
            await this.flushQueues();
            await this.retryFailedRequests();
        }, this.config.flushInterval);
    }

    /**
     * Stop periodic flush process
     */
    stopPeriodicFlush() {
        if (this.processingTimer) {
            clearInterval(this.processingTimer);
            this.processingTimer = null;
        }
    }

    /**
     * Flush all queued data to API
     */
    async flushQueues() {
        if (this.isProcessing) {
            this.log('Flush already in progress, skipping...');
            return;
        }

        this.isProcessing = true;

        try {
            // Get and clear power data queue
            const powerQueue = JSON.parse(localStorage.getItem(this.POWER_DATA_QUEUE) || '[]');
            if (powerQueue.length > 0) {
                await localStorage.setItem(this.POWER_DATA_QUEUE, JSON.stringify([]));
                await this.sendPowerData(powerQueue);
            }

            // Get and clear unit data queue
            const unitQueue = JSON.parse(localStorage.getItem(this.UNIT_DATA_QUEUE) || '[]');
            if (unitQueue.length > 0) {
                await localStorage.setItem(this.UNIT_DATA_QUEUE, JSON.stringify([]));
                await this.sendUnitData(unitQueue);
            }

            // this.log(`Flushed ${powerQueue.length} power records and ${unitQueue.length} unit records`);

        } catch (error) {
            this.log('Error during flush:', error.message);
            // this.log('error sending:', powerQueue);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Send power data to API
     */
    async sendPowerData(dataArray) {
        if (dataArray.length === 0) return;

        try {
            const response = await axios.post(
                `${this.config.apiBaseUrl}/power_data/save`,
                { data: dataArray },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 30000 // 30 seconds timeout
                }
            );

            // this.log(`Successfully sent ${dataArray.length} power data records`);
            return response.data;

        } catch (error) {
            this.log(`Failed to send power data: ${error.message}`);
            await this.addToFailedQueue('power_data', dataArray);
            throw error;
        }
    }

    /**
     * Send unit data to API
     */
    async sendUnitData(dataArray) {
        if (dataArray.length === 0) return;

        try {
            const response = await axios.post(
                `${this.config.apiBaseUrl}/power-monitoring/stream/unit-data`,
                { data: dataArray },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    timeout: 30000 // 30 seconds timeout
                }
            );

            this.log(`Successfully sent ${dataArray.length} unit data records`);
            return response.data;

        } catch (error) {
            this.log(`Failed to send unit data: ${error.message}`);
            await this.addToFailedQueue('unit_data', dataArray);
            throw error;
        }
    }

    /**
     * Add failed requests to retry queue
     */
    async addToFailedQueue(type, data) {
        const failedQueue = JSON.parse(localStorage.getItem(this.FAILED_REQUESTS_QUEUE) || '[]');
        
        failedQueue.push({
            type: type,
            data: data,
            timestamp: new Date().toISOString(),
            retries: 0
        });

        await localStorage.setItem(this.FAILED_REQUESTS_QUEUE, JSON.stringify(failedQueue));
    }

    /**
     * Retry failed requests
     */
    async retryFailedRequests() {
        const failedQueue = JSON.parse(localStorage.getItem(this.FAILED_REQUESTS_QUEUE) || '[]');
        
        if (failedQueue.length === 0) return;

        const updatedQueue = [];

        for (const failedRequest of failedQueue) {
            if (failedRequest.retries >= this.config.maxRetries) {
                this.log(`Dropping failed request after ${this.config.maxRetries} retries:`, failedRequest.type);
                continue;
            }

            try {
                if (failedRequest.type === 'power_data') {
                    await this.sendPowerData(failedRequest.data);
                } else if (failedRequest.type === 'unit_data') {
                    await this.sendUnitData(failedRequest.data);
                }
                
                this.log(`Successfully retried ${failedRequest.type} request`);
                // Don't add back to queue if successful
                
            } catch (error) {
                // Add back to queue with incremented retry count
                failedRequest.retries++;
                updatedQueue.push(failedRequest);
                this.log(`Retry ${failedRequest.retries} failed for ${failedRequest.type}: ${error.message}`);
            }
        }

        await localStorage.setItem(this.FAILED_REQUESTS_QUEUE, JSON.stringify(updatedQueue));
    }

    /**
     * Force flush all queues immediately
     */
    async forceFlush() {
        await this.flushQueues();
        await this.retryFailedRequests();
    }

    /**
     * Get queue statistics
     */
    getQueueStats() {
        const combinedQueue = JSON.parse(localStorage.getItem(this.COMBINED_DATA_QUEUE) || '[]');
        const failedQueue = JSON.parse(localStorage.getItem(this.FAILED_REQUESTS_QUEUE) || '[]');

        return {
            combinedDataQueue: combinedQueue.length,
            failedRequestsQueue: failedQueue.length,
            totalPending: combinedQueue.length,
            isProcessing: this.isProcessing
        };
    }

    /**
     * Clear all queues (use with caution)
     */
    async clearAllQueues() {
        await localStorage.setItem(this.COMBINED_DATA_QUEUE, JSON.stringify([]));
        await localStorage.setItem(this.FAILED_REQUESTS_QUEUE, JSON.stringify([]));
        this.log('All queues cleared');
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Update stations with unit data if provided
        if (newConfig.stationsWithUnitData) {
            this.stationsWithUnitData = newConfig.stationsWithUnitData;
        }
        
        // Restart periodic flush with new interval if changed
        if (newConfig.flushInterval && this.processingTimer) {
            this.stopPeriodicFlush();
            this.startPeriodicFlush();
        }
    }

    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.log('Shutting down PowerDataQueue...');
        this.stopPeriodicFlush();
        
        // Final flush before shutdown
        await this.forceFlush();
        
        this.log('PowerDataQueue shutdown complete');
    }

    /**
     * Logging utility
     */
    log(...args) {
        if (this.config.enableLogging) {
            const timestamp = new Date().toISOString();
            console.log(`[PowerDataQueue ${timestamp}]`, ...args);
        }
    }
}

module.exports = PowerDataQueue;