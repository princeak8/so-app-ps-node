import { unitType } from "./types";

export const ihovborConversion = (vals:string) => {
    try{
        let jsonVals = JSON.parse(vals);
        let azura = {...jsonVals};
        let azuraUnits:unitType[] = [];
        let azuraIds = ['ohl1', 'ohl2'];
        let valKeys:number[] = [];
        let conversionDone = false;
        if(jsonVals.units && jsonVals.units.length > 0) {
            conversionDone = true;
            jsonVals.units.forEach((unit:unitType, i:number) => {
                if(azuraIds.includes(unit.id)) {
                    azuraUnits.push(unit);
                    valKeys.push(i);
                }
            });
            azura.id = 'azuraIppPs';
            azura.units = azuraUnits;
            // console.log(jsonVals.units);
            let i = 0; // i will track the key position, by adding one each time the array is spliced, to keep the key position correct
            valKeys.forEach((key) => {
                jsonVals.units.splice((key-i), 1);
                i++;
            });
        }
        if(conversionDone) {
            let ihovborBuffer = Buffer.from(JSON.stringify(jsonVals));
            let azuraBuffer = Buffer.from(JSON.stringify(azura));
            return [ihovborBuffer.toString(), azuraBuffer.toString()];
        }
        return [];
    } catch(e) {
        return [];
    }
}

export const gereguConversion = (vals:string) => {
    try{
        let geregu = JSON.parse(vals);
        let gereguNipp = {...geregu};
        let linesIds = ['r1j', 'r2j'];
        let units:unitType[] = [];
        let keys:number[] = [];
        let conversionDone = false;
        if(geregu.units && geregu.units.length > 0) {
            conversionDone = true;
            geregu.units.forEach((unit:unitType, i:number) => {
                if(linesIds.includes(unit.id)) {
                    keys.push(i);
                }
                units.push(unit);
            })
            gereguNipp.id = 'gereguNipp';
            gereguNipp.units = units;
            let i = 0;
            keys.forEach((key) => {
                geregu.units.splice((key-i), 1);
                i++;
            });
        }
        if(conversionDone) {
            let gereguBuffer = Buffer.from(JSON.stringify(geregu));
            let gereguNippBuffer = Buffer.from(JSON.stringify(gereguNipp));
            return [gereguBuffer.toString(), gereguNippBuffer.toString()];
        }
        return [];
    } catch(e) {
        return [];
    }
}

export const olorunsogoConversion = (vals:string) => {
    try{
        let olorunsogo = JSON.parse(vals);
        let olorunsogo2 = {...olorunsogo};
        let olorunsogoLines = {...olorunsogo};
        let olorunsogo2Lines:unitType[] = [];
        let olorunsogoLinesLines:unitType[] = [];
        let olorunsogo2LineIds = ['tr3', 'tr4'];
        let olorunsogoLinesIds = ['r1w', 'r2a'];
        let conversionDone = false;
        if(olorunsogo.lines && olorunsogo.lines.length > 0) {
            conversionDone = true;
            olorunsogo.lines.forEach((line:unitType) => {
                if(olorunsogo2LineIds.includes(line.id)) olorunsogo2Lines.push(line);
                if(olorunsogoLinesIds.includes(line.id)) olorunsogoLinesLines.push(line);
            })
            olorunsogo2.id = 'olorunsogo2';
            olorunsogoLines.id = 'olorunsogoLines';
            olorunsogo2.lines = olorunsogo2Lines;
            olorunsogoLines.lines = olorunsogoLinesLines;
        }
        if(conversionDone) {
            let olorunsogo2Buffer = Buffer.from(JSON.stringify(olorunsogo2));
            let olorunsogoLinesBuffer = Buffer.from(JSON.stringify(olorunsogoLines));
            return [olorunsogo2Buffer.toString(), olorunsogoLinesBuffer.toString()];
        }
        return [];
    } catch(e) {
        return [];
    }
}

export const sapeleConversion = (vals:string) => {
    try{
        let sapele = JSON.parse(vals);
        let sapeleNipp = {...sapele};
        let sapeleSteam = {...sapele};
        let sapeleNippUnits:unitType[] = [];
        let sapeleSteamUnits:unitType[] = [];
        let sapeleNippUnitIds = ['gt1', 'gt2', 'gt3', 'gt4'];
        let sapeleSteamUnitIds = ['st1', 'st2', 'st3'];
        let conversionDone = false;
        if(sapele.units && sapele.units.length > 0) {
            conversionDone = true;
            sapele.units.forEach((unit:unitType) => {
                if(sapeleNippUnitIds.includes(unit.id)) sapeleNippUnits.push(unit);
                if(sapeleSteamUnitIds.includes(unit.id)) sapeleSteamUnits.push(unit);
            })
            sapeleNipp.id = 'sapeleNipp';
            sapeleSteam.id = 'sapeleSteam';
            sapeleNipp.units = sapeleNippUnits;
            sapeleSteam.units = sapeleSteamUnits;
        }
        if(conversionDone) {
            let sapeleNippBuffer = Buffer.from(JSON.stringify(sapeleNipp));
            let sapeleSteamBuffer = Buffer.from(JSON.stringify(sapeleSteam));
            return [sapeleNippBuffer.toString(), sapeleSteamBuffer.toString()];
        }
        return [];
    } catch(e) {
        return [];
    }
}

export const odukpaniConversion = (vals:string) => {
    try{
        let odukpani = JSON.parse(vals);
        let linesIds = ['d1b', 'd2b'];
        let units:unitType[] = [];
        let keys = [];
        let conversionDone = false;
        if(odukpani.units && odukpani.units.length > 0) {
            conversionDone = true;
            odukpani.units.forEach((unit:unitType) => {
                if(!linesIds.includes(unit.id)) {
                    units.push(unit);
                }
            })
            odukpani.units = units;
        }
        if(conversionDone) {
            let odukpaniBuffer = Buffer.from(JSON.stringify(odukpani));
            return [odukpaniBuffer.toString()];
        }
        return [];
    } catch(e) {
        return [];
    }
}