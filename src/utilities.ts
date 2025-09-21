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
        case 'sapele/status' : return [stationIds.SapeleNipp, stationIds.Sapele]; break;
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
    // console.log("formatted section:", {...rawStationData, sections: sectionData});
     return {...rawStationData, sections: sectionData};
  }
  if(rawStationData.lines) {
    sectionData = [...rawStationData.lines];
    //  delete rawStationData.lines;
    return {...rawStationData, sections: sectionData};
  }
  if(rawStationData.transformers) {
    sectionData = [...rawStationData.transformers];
    return {...rawStationData, sections: sectionData};
  }
  if((!rawStationData?.units && !rawStationData?.lines && !rawStationData?.transformers) ) {
    let td:any = {};
    if(rawStationData?.mw) td.mw = rawStationData.mw;
    if(rawStationData?.a) td.a = rawStationData.a;
    if(rawStationData?.A) td.a = rawStationData.A;
    if(rawStationData?.mx) td.mx = rawStationData.mx;
    if(rawStationData?.mvar) td.mx = rawStationData.mvar;
    if(rawStationData?.v) td.v = rawStationData.v;
    if(rawStationData?.V) td.V = rawStationData.V;
    if(rawStationData?.f) td.f = rawStationData.f;
    if(rawStationData?.pf) td.pf = rawStationData.pf;
    let line = { id: 'line1', td: td};
    return {...rawStationData, sections: [line]}
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
    //   console.log("formatted Inner Data:", {...rawSectionData, data: dt});
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
    // console.log(stationData?.id);
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
                // console.log('Olorunsogo:', stationData.id, stationTotal);
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

function zungeruFn (data: sectionType[]) {
    let totalMw = 0;
    data.forEach((section) => {
        let A = parseFloat(section.data.A.toString());
        let V = parseFloat(section.data.V.toString());
        if(!Number.isNaN(A) && !Number.isNaN(V)) {
            // console.log('A:'+A + 'V', V);
            let mw = (Math.sqrt(3) * (A*V))/1000;
            totalMw += mw;
        }
    })
    return totalMw;
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
        
        if(olorunsogoGas != undefined) {
            olorunsogoNipp = olorunsogoLines - olorunsogoGas.value;
            // console.log('NIPP', olorunsogoNipp);
            // console.log('Gas', olorunsogoGas.value);
            localStorage.setItem('olorunsogoNipp', {'id': 'olorunsogoNipp', 'value': olorunsogoNipp});
            return {'id': 'olorunsogoNipp', 'value': olorunsogoNipp};
        }
    } 
}

export const repairJSON = (jsonString: string): any => {
    try {
        // First try parsing as-is
        let fixedJson = JSON.parse(jsonString);
        return jsonString;
    } catch (error) {
        // Try common fixes
        let fixed = jsonString.trim();
        
        // Add missing opening brace
        if (!fixed.startsWith('{') && !fixed.startsWith('[')) {
            fixed = '{' + fixed;
        }
        
        // Add missing closing brace
        if (!fixed.endsWith('}') && !fixed.endsWith(']')) {
            if (fixed.startsWith('{')) {
                fixed = fixed + '}';
            } else if (fixed.startsWith('[')) {
                fixed = fixed + ']';
            }
        }
        
        // Remove trailing commas
        fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
        
        // Fix unquoted keys (basic regex - may need refinement)
        fixed = fixed.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
        
        try {
            let fixedJson = JSON.parse(fixed);
            return fixed;
        } catch (secondError: any) {
            // console.log(`Cannot repair JSON: ${secondError.message}`);
            throw new Error(`Cannot repair JSON: ${secondError.message}`);
        }
    }
}

