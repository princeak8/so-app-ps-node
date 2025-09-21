// Type definitions
interface PowerData {
    mw: string;
    a: string;
    v: string;
    mx: string;
    pf: string;
    f: string;
}

interface Unit {
    id: string;
    pd: PowerData;
}

interface StationData {
    id: string;
    units: Unit[];
    time: string;
}

interface InternalStationData extends StationData {
    sources?: Map<string, SourceData>;
}

interface SourceData {
    units: Unit[];
    time: string;
}

// Add interfaces for the incoming data format
interface GeneratorData {
    mw: number;
    A: number;
    V: number;
    mvar: number;
}

interface Line {
    id: string;
    gd: GeneratorData;
}

interface IncomingStreamData {
    id: string;
    t: string;
    lines: Line[];
}

// Keep the original StreamData interface for backward compatibility
interface StreamData {
    id: string;
    name?: string;
    units: Unit[];
    time: string;
}

// Union type for both data formats
type FlexibleStreamData = StreamData | IncomingStreamData;

type MergeGroupConfig = Map<string, string[]>;
type StationDataMap = Map<string, InternalStationData>;

class MergeStationController {
    private data: StationDataMap;
    private mergeGroups: MergeGroupConfig;

    public mergeIds: Object 

    constructor(mergeIds: Object) {
        // Use in-memory storage instead of localStorage
        this.data = new Map<string, InternalStationData>();
        this.mergeGroups = new Map<string, string[]>();
        this.mergeIds = mergeIds;
        
        // Define merge groups - stations that should be combined
        this.defineMergeGroups();
        
        // Load existing data if any
        this.loadExistingData();
    }

    private defineMergeGroups(): void {
        for (let topicId in this.mergeIds) {
            const unitsId = (this.mergeIds as any)[topicId];
            this.mergeGroups.set(topicId, unitsId)
        }
    }

    private loadExistingData(): void {
        // In a real implementation with localStorage, you would load data here
        // For now, initialize with empty data
    }

    private saveData(): Record<string, StationData> {
        // Convert Map to object for storage, excluding internal sources
        const dataObj: Record<string, StationData> = {};
        
        for (const [key, value] of this.data) {
            dataObj[key] = {
                id: value.id,
                units: value.units,
                time: value.time
            };
        }
        
        return dataObj;
    }

    // Helper method to check if data is in the new format
    private isIncomingStreamData(data: FlexibleStreamData): data is IncomingStreamData {
        return 'lines' in data && 't' in data;
    }

    // Helper method to normalize incoming data to standard format
    private normalizeStreamData(data: FlexibleStreamData): StreamData {
        if (this.isIncomingStreamData(data)) {
            // Convert new format to standard format
            const units: Unit[] = data.lines.map(line => ({
                id: line.id,
                pd: {
                    mw: line.gd.mw.toString(),
                    a: line.gd.A.toString(),
                    v: line.gd.V.toString(),
                    mx: line.gd.mvar.toString(), // Using mvar for mx
                    pf: "0.0", // Default value since not provided
                    f: "50.0"  // Default frequency
                }
            }));

            return {
                id: data.id,
                units: units,
                time: this.parseTime(data.t)
            };
        } else {
            // Already in standard format
            return data as StreamData;
        }
    }

    // Helper method to parse time string to ISO format
    private parseTime(timeStr: string): string {
        try {
            // If it's just time (like "9:58:29"), assume it's today
            if (timeStr.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
                const today = new Date();
                const [hours, minutes, seconds] = timeStr.split(':').map(Number);
                today.setHours(hours, minutes, seconds, 0);
                return today.toISOString();
            }
            
            // If it's already a valid date string, parse it
            const parsed = new Date(timeStr);
            if (!isNaN(parsed.getTime())) {
                return parsed.toISOString();
            }
            
            // Fallback to current time
            return new Date().toISOString();
        } catch (error) {
            console.warn('Error parsing time string:', timeStr, error);
            return new Date().toISOString();
        }
    }

    public processIncomingStream(streamData: FlexibleStreamData): StationData | null {
        try {
            // Normalize the data to standard format
            const normalizedData = this.normalizeStreamData(streamData);
            const { id, units, time } = normalizedData;
            
            // Check if this station should be merged with others
            const mergeGroupName = this.findMergeGroup(id);
            
            if (mergeGroupName) {
                this.handleMergeableData(mergeGroupName, id, { units: units || [], time: time || new Date().toISOString() });
            } else {
                // Store standalone station data
                const stationData: InternalStationData = {
                    id: id,
                    units: units || [],
                    time: time || new Date().toISOString()
                };
                this.data.set(id, stationData);
            }

            // Persist changes
            this.saveData();
            
            const result = this.data.get(mergeGroupName || id);
            return result ? this.cleanStationData(result) : null;
        } catch (error) {
            console.error('Error processing stream data:', error);
            throw error;
        }
    }

    private findMergeGroup(stationId: string): string | null {
        for (const [mergeGroupName, sourceIds] of this.mergeGroups) {
            if (sourceIds.includes(stationId)) {
                return mergeGroupName;
            }
        }
        return null;
    }

    private handleMergeableData(mergeGroupName: string, sourceId: string, newData: SourceData): void {
        // Get existing merged data or create new
        let mergedData = this.data.get(mergeGroupName);
        
        if (!mergedData) {
            mergedData = {
                id: mergeGroupName,
                units: [],
                time: newData.time || new Date().toISOString(),
                sources: new Map<string, SourceData>()
            };
        }

        // Ensure sources map exists
        if (!mergedData.sources) {
            mergedData.sources = new Map<string, SourceData>();
        }

        // Store the source data
        mergedData.sources.set(sourceId, {
            units: newData.units || [],
            time: newData.time || new Date().toISOString()
        });

        // Rebuild merged units array
        mergedData.units = this.mergeUnits(mergedData.sources);
        mergedData.time = this.getLatestTime(mergedData.sources);

        // Store the merged result
        this.data.set(mergeGroupName, mergedData);
    }

    private mergeUnits(sourcesMap: Map<string, SourceData>): Unit[] {
        const allUnits: Unit[] = [];
        
        // Combine units from all sources
        for (const [sourceId, sourceData] of sourcesMap) {
            if (sourceData.units) {
                allUnits.push(...sourceData.units);
            }
        }

        return allUnits;
    }

    private getLatestTime(sourcesMap: Map<string, SourceData>): string {
        let latestTime = new Date(0).toISOString();
        
        for (const [sourceId, sourceData] of sourcesMap) {
            if (sourceData.time && new Date(sourceData.time) > new Date(latestTime)) {
                latestTime = sourceData.time;
            }
        }

        return latestTime;
    }

    private cleanStationData(data: InternalStationData): StationData {
        return {
            id: data.id,
            units: data.units,
            time: data.time
        };
    }

    // Get current data for a station
    public getStationData(stationId: string): StationData | null {
        const data = this.data.get(stationId);
        return data ? this.cleanStationData(data) : null;
    }

    // Get all current data
    public getAllData(): Record<string, StationData> {
        const result: Record<string, StationData> = {};
        
        for (const [key, value] of this.data) {
            result[key] = this.cleanStationData(value);
        }
        
        return result;
    }

    // Replace entire unit data for a station
    public replaceStationData(stationId: string, newData: Partial<StationData>): void {
        const stationData: InternalStationData = {
            id: stationId,
            units: newData.units || [],
            time: newData.time || new Date().toISOString()
        };
        
        this.data.set(stationId, stationData);
        this.saveData();
    }

    // Update specific unit within a station
    public updateUnit(stationId: string, unitId: string, unitData: Partial<PowerData>): boolean {
        const stationData = this.data.get(stationId);
        if (!stationData) {
            console.warn(`Station ${stationId} not found`);
            return false;
        }

        const unitIndex = stationData.units.findIndex((unit: Unit) => unit.id === unitId);
        
        if (unitIndex === -1) {
            // Add new unit if it doesn't exist
            const newUnit: Unit = {
                id: unitId,
                pd: {
                    mw: unitData.mw || "",
                    a: unitData.a || "",
                    v: unitData.v || "",
                    mx: unitData.mx || "",
                    pf: unitData.pf || "",
                    f: unitData.f || ""
                }
            };
            stationData.units.push(newUnit);
        } else {
            // Update existing unit
            stationData.units[unitIndex].pd = { 
                ...stationData.units[unitIndex].pd, 
                ...unitData 
            };
        }

        stationData.time = new Date().toISOString();
        this.saveData();
        return true;
    }

    // Get station units by type (for debugging/monitoring)
    public getUnitsByType(stationId: string, unitPrefix: string): Unit[] {
        const stationData = this.data.get(stationId);
        if (!stationData) {
            return [];
        }

        return stationData.units.filter((unit: Unit) => unit.id.startsWith(unitPrefix));
    }

    // Get merge group configuration
    public getMergeGroups(): Record<string, string[]> {
        const result: Record<string, string[]> = {};
        for (const [key, value] of this.mergeGroups) {
            result[key] = [...value];
        }
        return result;
    }
}

// Export the class and types for use in other modules
export { MergeStationController };
export type { StreamData, StationData, Unit, PowerData, IncomingStreamData, FlexibleStreamData };