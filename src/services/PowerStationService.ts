import {dataSource} from "../database";
import PowerStation from '../models/PowerStation';
import { stationId } from '../enums';

const { manager } = dataSource;
const repository = dataSource.getRepository(PowerStation)

const PowerStationService = {
    getPowerStation: async (id: number) => {
        const powerStation = await repository.findOneBy({id: id});
        return powerStation;
    },
    getPowerStationByIdentifier: async (id: string) => {
        const powerStation = await repository.findOneBy({identifier: id});
        return powerStation;
    }
}

export default PowerStationService;