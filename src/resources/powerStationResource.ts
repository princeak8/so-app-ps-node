const ResourcePowerStation = require('resources.js');

class powerStationResource extends ResourcePowerStation {
    toArray() {
        // console.log('load:', this);
        return {
            id: Number(this.id),
            name: this.name,
            identifier: this.identifier,
        }
    }
}

module.exports = powerStationResource;