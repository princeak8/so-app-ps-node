import { stationType } from "../types";
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
    sections: Unit[];
    t: string;
}

interface InternalStationData extends StationData {
    sources?: Map<string, SourceData>;
}

interface SourceData {
    sections: Unit[];
    t: string;
}

interface StreamData {
    id: string;
    sections: Unit[];
    time: string;
}

type MergeGroupConfig = Map<string, string[]>;
type StationDataMap = Map<string, InternalStationData>;

class MergeStationController {
    private data: StationDataMap;
    private mergeGroups: MergeGroupConfig;

    constructor() {
        // Use in-memory storage instead of localStorage
        this.data = new Map<string, InternalStationData>();
        this.mergeGroups = new Map<string, string[]>();
        
        // Define merge groups - stations that should be combined
        this.defineMergeGroups();
        
        // Load existing data if any
        this.loadExistingData();
    }

    private defineMergeGroups(): void {
        // Define which station IDs should be merged together
        // Format: merged_name -> [array of source IDs]
        this.mergeGroups.set('sapele', ['sapele-gas', 'sapele-steam']);
        // this.mergeGroups.set('olorunsogo', ['olorunsogo-gas', 'olorunsogo-steam']);
        // Add more merge groups as needed
    }

    private loadExistingData(): void {
        // In a real implementation with localStorage, you would:
        // const stored = localStorage.getItem('powerPlantData');
        // if (stored) {
        //     try {
        //         const parsedData = JSON.parse(stored);
        //         this.data = new Map(Object.entries(parsedData));
        //     } catch (error) {
        //         console.error('Error loading stored data:', error);
        //     }
        // }
        
        // For now, initialize with empty data
        // console.log('Data manager initialized');
    }

    private saveData(): Record<string, StationData> {
        // Convert Map to object for storage, excluding internal sources
        const dataObj: Record<string, StationData> = {};
        
        for (const [key, value] of this.data) {
            dataObj[key] = {
                id: value.id,
                sections: value.sections,
                t: value.t
            };
        }
        
        // In a real implementation with localStorage:
        // try {
        //     localStorage.setItem('powerPlantData', JSON.stringify(dataObj));
        // } catch (error) {
        //     console.error('Error saving data to localStorage:', error);
        // }
        
        // For demonstration, just log the data
        // console.log('Data saved:', dataObj);
        return dataObj;
    }

    public processIncomingStream(streamData: any): stationType | null {
        try {
            console.log("streamed data:", streamData);
            const { id, sections, t } = streamData;
            
            // Check if this station should be merged with others
            const mergeGroupName = this.findMergeGroup(id);
            
            if (mergeGroupName) {
                this.handleMergeableData(mergeGroupName, id, { sections: sections || [], t: t || new Date().toISOString() });
            } else {
                // Store standalone station data
                const stationData: InternalStationData = {
                    id: id,
                    sections: sections || [],
                    t: t || new Date().toISOString()
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
                sections: [],
                t: newData.t || new Date().toISOString(),
                sources: new Map<string, SourceData>()
            };
        }

        // Ensure sources map exists
        if (!mergedData.sources) {
            mergedData.sources = new Map<string, SourceData>();
        }

        // Store the source data
        mergedData.sources.set(sourceId, {
            sections: newData.sections || [],
            t: newData.t || new Date().toISOString()
        });

        // Rebuild merged units array
        mergedData.sections = this.mergeUnits(mergedData.sources);
        mergedData.t = this.getLatestTime(mergedData.sources);

        // Store the merged result
        this.data.set(mergeGroupName, mergedData);
    }

    private mergeUnits(sourcesMap: Map<string, SourceData>): Unit[] {
        const allUnits: Unit[] = [];
        
        // Combine units from all sources
        for (const [sourceId, sourceData] of sourcesMap) {
            if (sourceData.sections) {
                allUnits.push(...sourceData.sections);
            }
        }

        return allUnits;
    }

    private getLatestTime(sourcesMap: Map<string, SourceData>): string {
        let latestTime = new Date(0).toISOString();
        
        for (const [sourceId, sourceData] of sourcesMap) {
            if (sourceData.t && new Date(sourceData.t) > new Date(latestTime)) {
                latestTime = sourceData.t;
            }
        }

        return latestTime;
    }

    private cleanStationData(data: InternalStationData): stationType {
        return {
            id: data.id,
            sections: data.sections,
            t: data.t
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

    // Replace entire section data for a station
    public replaceStationData(stationId: string, newData: Partial<StationData>): void {
        const stationData: InternalStationData = {
            id: stationId,
            sections: newData.sections || [],
            t: newData.t || new Date().toISOString()
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

        const unitIndex = stationData.sections.findIndex((unit: Unit) => unit.id === unitId);
        
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
            stationData.sections.push(newUnit);
        } else {
            // Update existing unit
            stationData.sections[unitIndex].pd = { 
                ...stationData.sections[unitIndex].pd, 
                ...unitData 
            };
        }

        stationData.t = new Date().toISOString();
        this.saveData();
        return true;
    }

    // Get station units by type (for debugging/monitoring)
    public getUnitsByType(stationId: string, unitPrefix: string): Unit[] {
        const stationData = this.data.get(stationId);
        if (!stationData) {
            return [];
        }

        return stationData.sections.filter((unit: Unit) => unit.id.startsWith(unitPrefix));
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

// Usage example
// const dataManager = new PowerPlantDataManager();

// // Example 1: Process sapele-gas data
// const sapeleGasData: StreamData = {
//     id: "sapele-gas",
//     units: [
//         {
//             id: "pb202",
//             pd: {
//                 mw: "45.2",
//                 a: "120.5",
//                 v: "415.0",
//                 mx: "50.0",
//                 pf: "0.85",
//                 f: "50.1"
//             }
//         },
//         {
//             id: "pb203",
//             pd: {
//                 mw: "52.1",
//                 a: "135.2",
//                 v: "414.8",
//                 mx: "60.0",
//                 pf: "0.87",
//                 f: "50.0"
//             }
//         }
//     ],
//     time: "2025-09-04T10:30:00Z"
// };

// // Example 2: Process sapele-steam data
// const sapeleSteamData: StreamData = {
//     id: "sapele-steam",
//     units: [
//         {
//             id: "st1",
//             pd: {
//                 mw: "75.5",
//                 a: "185.3",
//                 v: "416.2",
//                 mx: "80.0",
//                 pf: "0.92",
//                 f: "50.2"
//             }
//         },
//         {
//             id: "st2",
//             pd: {
//                 mw: "68.9",
//                 a: "172.1",
//                 v: "415.9",
//                 mx: "75.0",
//                 pf: "0.89",
//                 f: "49.9"
//             }
//         }
//     ],
//     time: "2025-09-04T10:31:00Z"
// };

// // Process the streams
// console.log('Processing sapele-gas data...');
// const gasResult = dataManager.processIncomingStream(sapeleGasData);

// console.log('Processing sapele-steam data...');
// const steamResult = dataManager.processIncomingStream(sapeleSteamData);

// // Get the merged result
// const mergedSapeleData = dataManager.getStationData('sapele');
// console.log('Merged sapele data:', JSON.stringify(mergedSapeleData, null, 2));

// // Get all current data
// console.log('All current data:', JSON.stringify(dataManager.getAllData(), null, 2));

// // Example of updating a specific unit
// console.log('Updating unit pb202...');
// const updateSuccess = dataManager.updateUnit('sapele', 'pb202', {
//     mw: "47.8",
//     a: "125.1",
//     v: "415.2"
// });

// if (updateSuccess) {
//     console.log('Updated sapele data:', JSON.stringify(dataManager.getStationData('sapele'), null, 2));
// }

// // Get units by type
// const gasUnits = dataManager.getUnitsByType('sapele', 'pb');
// const steamUnits = dataManager.getUnitsByType('sapele', 'st');
// console.log('Gas units:', gasUnits.length);
// console.log('Steam units:', steamUnits.length);

// Export the class for use in other modules
export { MergeStationController };
export type { StreamData, StationData, Unit, PowerData };