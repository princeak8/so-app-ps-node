import {dataSource} from "../database";
import PowerStation from '../models/PowerStation';
import LoadDrop from '../models/LoadDrop';
import { stationId } from '../enums';
import { loadDropRequest, acknowledgeLoadDropRequest } from "../types";
import { Between, IsNull, Not, Timestamp } from "typeorm";
import { IsNotEmpty } from "class-validator";

const { manager } = dataSource;
const repository = dataSource.getRepository(LoadDrop)

interface rangeInterface {
    start: Date;
    end?: Date;
}

const LoadDropService = {
    save: async function(data: loadDropRequest) {
        const loadDrop = new LoadDrop();
        loadDrop.powerStation = data.powerStationId;
        loadDrop.load = data.load;
        loadDrop.previous_load = data.previousLoad;
        loadDrop.reference_load = data.referenceLoad;
        // loadDrop.percentage_drop = data.percentage;
        loadDrop.time_of_drop = data.timeOfDrop
        loadDrop.calculation_type = data.calType;
        return await manager.save(loadDrop);
    },

    acknowledge: async function(data: acknowledgeLoadDropRequest) {
        await repository.save({id: data.id, acknowledged_at: data.acknowledgedAt});
    },

    acknowledgeStation: async function(acknowledgedAt: Timestamp, loadDrops: LoadDrop[]) {
        if(loadDrops.length > 0) {
            loadDrops.forEach(async (loadDrop) => {
                const data = {id: loadDrop.id, acknowledgedAt};
                await this.acknowledge(data);
            })
        }
    },

    getLoadDrop: async (id: number) => {
        const loadDrop = await repository.findOneBy({id: id});
        return loadDrop;
    },

    getStationLoadDrops: async (identifier: string) => {
        return await repository.find({
            where: {
                powerStation: {
                    identifier: identifier
                }
            }
        });
    },

    getUnAcknowledgedStationLoadDrops: async (identifier: string) => {
        return await repository.find({
            where: {
                powerStation: {
                    identifier: identifier
                },
                acknowledged_at: IsNull()
            }
        });
    },

    getAcknowledgedStationLoadDrops: async (identifier: string) => {
        return await repository.find({
            where: {
                powerStation: {
                    identifier: identifier
                },
                acknowledged_at: Not(IsNull())
            }
        });
    },

    getLoadDropByStationAndTimeOfDrop: async (timeOfDrop: any, stationId:number) => {
        const loadDrop = await repository.findOne({
            where: {
                time_of_drop: timeOfDrop, 
                powerStation: {
                    id: stationId
                }
            }
        });
        return loadDrop;
    },

    getLatestLoadDrops: async (limit:number = 10) => {
        const loadDrops = await repository.find({
            take: limit,
            order: {
                time_of_drop: "DESC"
            },
            relations: {
                powerStation: true
            }
        })
        return loadDrops;
    },

    getrange: async (range: rangeInterface, group=false) => {
        if(!range.end) range.end = new Date();
        const { start, end } = range;
        if(!group) {
            return await repository.find({
                where: {
                    time_of_drop: Between(
                        start, 
                        end
                    ),
                },
                relations: {powerStation: true}
            })
        }else{
            return await repository.createQueryBuilder('loadDrop')
            .leftJoin('loadDrop.powerStation', 'powerStation')
            .select(['powerStation.name', 'COUNT(powerStation.id) as occurance'])
            .where('loadDrop.time_of_drop BETWEEN :start AND :end', { start, end })
            .groupBy('powerStation.id')
            .getRawMany();
        }
    }
}

export default LoadDropService;