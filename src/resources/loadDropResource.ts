// import * as dateFormat from 'dateformat';
const Resource = require('resources.js');
const powerStation = require("./powerStationResource");
import { percentage } from "../helpers";

class LoadDropResource extends Resource {
    
    toArray() {
        // const pwrStation = new powerStation(this.powerStation);
        // const load = (this.load == undefined) ? 0.0 : Number(this.load);
        // const prevLoad = (this.previous_load == undefined) ? 0 : Number(this.previous_load);
        // const refLoad = (this.reference_load == undefined) ? 0 : Number(this.reference_load);
        return {
            // id: Number(this.id),
            // station: {
            //     id: this.powerStation.id,
            //     name: this.powerStation.name,
            //     identifier: this.powerStation.identifier
            // },
            // load: load,
            // previousLoad: prevLoad,
            // referenceLoad: refLoad,
            // timeOfDrop: this.time_of_drop.toString().slice(0,25).trim(),
            // acknowledgedAt: (this.acknowledged_at) ? this.acknowledged_at.toString().slice(0,25).trim() : null,
            // calculationType: this.calculation_type.trim(),
            // prevLoadPercentage: percentage(prevLoad, load),
            // refLoadPercentage: percentage(refLoad, load)
        }
    }
}

module.exports = LoadDropResource;