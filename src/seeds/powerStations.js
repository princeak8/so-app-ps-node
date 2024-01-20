// src/seeds/seed.js
import {dataSource} from "../database";
import PowerStation from '../models/PowerStation';
import { stationId } from '../enums';

const { manager } = dataSource;

const seedPowerStations = async () => {
    console.log('is initialized: ',dataSource.isInitialized);
  // Check if there are already records in the table
  const existingPowerStations = await dataSource.manager.find(PowerStation);
  if (existingPowerStations.length > 0) {
    console.log('PowerStations table already seeded.');
    return;
  }

  // Seed initial data
  const initialPowerStations = [
    { name: 'Afam IV', identifier: stationId.AfamIV },
    { name: 'Afam V', identifier: stationId.AfamV },
    { name: 'Afam VI', identifier: stationId.AfamVI },
    { name: 'Alaoji', identifier: stationId.Alaoji },
    { name: 'Azura-Edo IPP (Gas)', identifier: stationId.Azura },
    { name: 'Dadinkowa', identifier: stationId.Dadinkowa },
    { name: 'Delta 2 (Gas)', identifier: stationId.Delta2 },
    { name: 'Delta 3 (Gas)', identifier: stationId.Delta3 },
    { name: 'Delta 4 (Gas)', identifier: stationId.Delta4 },
    { name: 'Egbin', identifier: stationId.Egbin },
    { name: 'Geregu (Gas)', identifier: stationId.Geregu },
    { name: 'Geregu NIPP (Gas)', identifier: stationId.GereguNipp },
    { name: 'Gbarain (Gas)', identifier: stationId.Gbarain },
    { name: 'Ihovbor (Gas)', identifier: stationId.Ihovbor },
    { name: 'Jebba (Hydro)', identifier: stationId.Jebba },
    { name: 'Kainji (Hydro)', identifier: stationId.Kainji },
    { name: 'Odukpani (Gas)', identifier: stationId.Odukpani },
    { name: 'Okpai (Gas/Steam)', identifier: stationId.Okpai },
    { name: 'Olorunsogo Gas', identifier: stationId.OlorunsogoGas },
    { name: 'Olorunsogo NIPP', identifier: stationId.OlorunsogoNipp },
    { name: 'Omoku (Gas)', identifier: stationId.Omoku },
    { name: 'Omotosho Gas', identifier: stationId.OmotoshoGas },
    { name: 'Omotosho NIPP', identifier: stationId.OmotoshoNipp},
    { name: 'Paras Energy (Gas)', identifier: stationId.ParasEnergy },
    { name: 'Rivers IPP (Gas)', identifier: stationId.RiversIpp },
    { name: 'Sapele NIPP', identifier: stationId.SapeleNipp },
    { name: 'Sapele (Steam)', identifier: stationId.SapeleSteam },
    { name: 'Shiroro (Hydro)', identifier: stationId.Shiroro },
    { name: 'Taopex', identifier: stationId.Taopex },
    { name: 'Transamadi (Gas)', identifier: stationId.Transamadi },
    { name: 'Zungeru', identifier: stationId.Zungeru },
    // Add more initial data as needed
  ];

  initialPowerStations.forEach(async (station) => {
    const powerStation = new PowerStation();
    powerStation.name = station.name;
    powerStation.identifier = station.identifier;
    await manager.save(powerStation);
  })
//   await manager.save(initialPowerStations);

  console.log('PowerStations table seeded successfully.');
};

export default seedPowerStations;
