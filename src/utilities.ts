import stationIds from "./stationIds";
import { 
    type dataType, 
    type sectionType, 
    type stationType, 
    type processingStationType,
    type rawSectionType, 
    type rawStationType,
    type totalType,
    type totalItem
        } from "./types"

import { getTotal } from "./helpers";
import localStorage from "./localStorage";

const generateNcData = (id:string) => {
    let data = {
        id: id,
        nc: true
    };
    return Buffer.from(JSON.stringify(data)).toString()
}

export const prepareNC = (topic:string, msg:string) => {
    let vals = [];
    if(msg == 'nc') {
        let ncId = getStatusTopicStationId(topic);
        if(ncId != '') {
            if(Array.isArray(ncId)){
                ncId.forEach((id) => vals.push(generateNcData(id)));
            }else{
                vals.push(generateNcData(ncId));
            }
        }
    }
    return vals;
}

export function getStatusTopicStationId(topic:string) {
    switch(topic) {
        case 'gereguGs/status' : return [stationIds.Geregu, stationIds.GereguNipp]; break;
        case 'olorunsogo2ts/status' : return [stationIds.Olorunsogo2, stationIds.OlorunsogoLines]; break;
        case 'olorunsogo1ts/status' : return stationIds.Olorunsogo1; break;
        case 'gbaraints/status' : return stationIds.Gbarain; break;
        case 'eketts/status' : return stationIds.Eket; break;
        case 'ekimts/status' : return stationIds.Ekim; break;
        case 'afam5gs/status' : return stationIds.AfamV; break;
        case 'afam6ts/status' : return stationIds.AfamVI; break;
        case 'ihovborts/status' : return [stationIds.Ihovbor, stationIds.Azura]; break;
        case 'jebbaTs/status' : return stationIds.Jebba; break;
        case 'kainjits/status' : return stationIds.Kainji; break;
        case 'odukpanits/status' : return stationIds.Odukpani; break;
        case 'OkpaiippGs/status' : return stationIds.Okpai; break;
        // case 'phmains/status' : return stationIds.ph; break;
        case 'riversIppPs/status' : return stationIds.RiversIpp; break;
        case 'sapelets/status' : return [stationIds.SapeleNipp, stationIds.SapeleSteam]; break;
        case 'zungeru/status' : return stationIds.Zungeru; break;
        default: return '';
    }
}

export const formatStreamedData = (rawData: rawStationType): stationType | null => {
    let formattedSectionData = formatSections(rawData);

    let formattedInnerData = (formattedSectionData != null ) ? formatAllInnerData(formattedSectionData.sections) : null;
    // let formattedInnerData = (formattedSectionData != null) ? formatAllInnerData(formattedSectionData) : null
    if(formattedSectionData != null && formattedInnerData != null) {
      return {...formattedSectionData, sections: formattedInnerData};
    }
    return null;
}

//convert units and lines to sections
export const formatSections = (rawStationData: rawStationType): processingStationType | null => {
  let sectionData:rawSectionType[];
  if(rawStationData.units) {
     sectionData = [...rawStationData.units];
    //  delete rawStationData.units;
     return {...rawStationData, sections: sectionData};
  }
  if(rawStationData.lines) {
    sectionData = [...rawStationData.lines];
    //  delete rawStationData.lines;
    return {...rawStationData, sections: sectionData};
  }
  return null;
}


// loop through all the lines/units and format the data
export const formatAllInnerData = (rawSectionData: rawSectionType[]): sectionType[] => {
    let result: sectionType[] = [];
    rawSectionData.forEach((rawSection: rawSectionType) => {
      let formattedSection = formatInnerData(rawSection);
      if(formattedSection != null) result.push(formattedSection);
    })
    return result;
}

// convert td or pd to data
export const formatInnerData = (rawSectionData: rawSectionType): sectionType | null => {
    let dt: dataType;
    if(rawSectionData.td) {
      dt = {...rawSectionData.td};
      // delete rawSectionData.td;
      return {...rawSectionData, data: dt};
    }
    if(rawSectionData.pd) {
      dt = {...rawSectionData.pd};
      // delete rawSectionData.pd;
      return {...rawSectionData, data: dt};
    }
    if(rawSectionData.gd) {
      dt = {...rawSectionData.gd};
      // delete rawSectionData.gd;
      return {...rawSectionData, data: dt};
    }
    return null;
}

export const aggregateTotal = (stationData: stationType | null, absolute=true):  number => {
    // console.log(stationData);
    const localStorageTotal = localStorage.getItem('stationTotal')
    let total: totalType = (localStorageTotal == undefined) ? {} : localStorageTotal;
    if(stationData != null) {
        const olorunsogos = ['olorunsogo1', 'olorunsogo2', 'olorunsogoLines'];
        let stationArr:number[] = []; 
        let stationTotal = 0;
        if(stationData.id != 'gereguNipp' && !olorunsogos.includes(stationData.id)) {
            stationData.sections.forEach((sectionData: sectionType) => {
                // console.log(sectionData.data);
                // stationTotal += parseFloat(sectionData.data.mw.toString());
                stationArr.push(parseFloat(sectionData.data.mw.toString()));
            })
            stationTotal = getTotal(stationArr, absolute);
        }else{
            if(olorunsogos.includes(stationData.id)){
                let olorunsogo = olorunsogoFn(stationData);
                if(olorunsogo != null) {
                    stationData.id = olorunsogo.id;
                    stationTotal = olorunsogo.value;
                }
            }else{
                stationTotal = extractTotal(stationData.sections);
            }
        }
        total[stationData.id] = stationTotal;
    }
    localStorage.setItem('stationTotal', total);
    // console.log(total);
    return Object.values(total).reduce((sumTotal, curr) => sumTotal + parseFloat(curr.toString()), 0);
    // return 45;
}

function extractTotal (data: sectionType[]) {
    let totalMw = 0;
    let gasMw = 0;
    let linesIds = ['r1j', 'r2j'];

    data.forEach((section) => {
        let mw = parseFloat(section.data.mw.toString());
        if(!Number.isNaN(mw)) {
            mw = (mw < 0) ? (mw * -1) : mw;
            if(linesIds.includes(section.id)) {
                totalMw += mw;
            }else{
                gasMw += mw;
            }
        }
    });
    let mw = totalMw - gasMw;
    return mw;
}

function olorunsogoFn (data: stationType) {
    let olorunsogo1 = localStorage.getItem('olorunsogo1');
    let olorunsogo2 = localStorage.getItem('olorunsogo2');
    let olorunsogoLines = localStorage.getItem('olorunsogoLines');
    let olorunsogoGas = localStorage.getItem('olorunsogoGas');
    let olorunsogoNipp = localStorage.getItem('olorunsogoNipp');
    if(data.id == 'olorunsogo1') {
        let totalArr:number[] = [];
        localStorage.setItem('olorunsogo1', data);
        data.sections.forEach((section) => {
            totalArr.push(parseFloat(section.data.mw.toString()));
        })
        if(olorunsogo2 != undefined) {
            olorunsogo2.sections.forEach((section: sectionType) => {
                totalArr.push(parseFloat(section.data.mw.toString()));
            })
        }
        olorunsogoGas = getTotal(totalArr);
        localStorage.setItem('olorunsogoGas', {'id':'olorunsogoGas', 'value': olorunsogoGas});
        return {'id':'olorunsogoGas', 'value': olorunsogoGas}
    }
    if(data.id == 'olorunsogo2') {
        let totalArr:number[] = [];
        localStorage.setItem('olorunsogo2', data);
        data.sections.forEach((section) => {
            totalArr.push(parseFloat(section.data.mw.toString()));
        })
        if(olorunsogo1 != undefined) {
            olorunsogo1.sections.forEach((section: sectionType) => {
                totalArr.push(parseFloat(section.data.mw.toString()));
            })
        }
        olorunsogoGas = getTotal(totalArr);
        localStorage.setItem('olorunsogoGas', {'id':'olorunsogoGas', 'value': olorunsogoGas});
        return {'id':'olorunsogoGas', 'value': olorunsogoGas}
    }

    if(data.id == 'olorunsogoLines') {
        let totalArr:number[] = [];
        localStorage.setItem('olorunsogoLines', data);
        data.sections.forEach((section) => {
            totalArr.push(parseFloat(section.data.mw.toString()));
        })
        olorunsogoLines = getTotal(totalArr, false);
        // console.log('Nipp:',)
        olorunsogoNipp = olorunsogoLines - olorunsogoGas.value;
        if(olorunsogoGas != undefined) {
            // console.log('NIPP', olorunsogoNipp);
            // console.log('Gas', olorunsogoGas.value);
            localStorage.setItem('olorunsogoNipp', {'id': 'olorunsogoNipp', 'value': olorunsogoNipp});
            return {'id': 'olorunsogoNipp', 'value': olorunsogoNipp};
        }
    } 
}

