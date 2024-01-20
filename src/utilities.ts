import stationIds from "./stationIds";

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