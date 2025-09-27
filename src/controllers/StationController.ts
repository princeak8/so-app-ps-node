import * as WebSocket from 'ws';
import { Client } from "mqtt";
import axios from "axios";
require('dotenv').config();
import { jsonrepair } from 'jsonrepair';
import { ihovborConversion, gereguConversion, olorunsogoConversion, sapeleConversion, odukpaniConversion } from '../conversions';
import { prepareNC, formatStreamedData, aggregateTotal, repairJSON } from '../utilities';
import { stationType, type rawStationType, type totalType } from '../types';
import localStorage from '../localStorage';
import { storage, stationId, companyId } from '../enums';
import { getDate, getMergeStationId } from '../helpers';
import logger from '../logger';
import stationIds from '../stationIds';

import { MergeStationController } from './MergeStationController';

const companyIds = Object.values(companyId);
// console.log("companysId:", companyIds);
const PowerDataQueue = require('../PowerDataQueue');

const StationController:{ [index: string]: Function } = {};
const dataQueue = new PowerDataQueue({
    apiBaseUrl: process.env.API_BASE_URL,
    batchSize: 100,
    flushInterval: 30000, // 30 seconds
    maxRetries: 3,
    enableLogging: true,
    // Stations that should save detailed unit data (others will only save total load)
    stationsWithUnitData: [
        stationIds.Sapele, stationIds.Egbin, stationIds.Delta4, stationIds.Delta3, stationIds.Delta2, stationIds.AfamIII,
        stationIds.AfamIV, stationIds.AfamV, stationIds.AfamVI, stationIds.Dadinkowa
    ] // Example station IDs
});

// Handle graceful shutdown
// process.on('SIGINT', StationController.handleShutdown.bind(this));
// process.on('SIGTERM', StationController.handleShutdown.bind(this));

const mergeIds = {
    'sapele': ['sapele-gas', 'sapele-steam'],
    'deltaGs': ['delta4-1', 'delta4-2'],
    'omotoshoGas': ['omotosho1', 'omotosho2']
};
const mergedStationController = new MergeStationController(mergeIds);

// console.log("done initializing");

StationController.sendNccMessage= (wss:WebSocket.Server, client:Client) => {
    client.on('message', async function (sentTopic:string, message:Buffer) {
        if(message.toString() != 'NC') {
            sendMessage(wss, message, sentTopic);
        }else{
            // console.log('message:', message.toString());
        }
    });
}

StationController.sendAwsMessage= (wss:WebSocket.Server, client:Client) => {
    client.on('message', async function (sentTopic:string, message:Buffer) {
        if(message.toString() != 'NC') {
            sendMessage(wss, message, sentTopic);
        }else{
            console.log('message:', message.toString());
        }
    });
}

StationController.sendLocalMessage= (client:Client) => {
    client.on('message', async function (sentTopic:string, message:Buffer) {
        try{
            let vals = message.toString();
            let data = JSON.parse(vals);
            localStorage.setItem(storage.Frequency, data.value);
        }catch(err){
            logger.error('error sending local message ',err);
        }
    });
}

const sendMessage = (wss:WebSocket.Server, message:Buffer, topic='') => {
    // console.log('send message', message);
    // console.log('clients:', wss.clients);
    // console.log(topic);
    // if(topic.includes('ps/dadinkowa/hydro/gombe/pd')) console.log(topic, message.toString());
    // if(topic.includes('omotoso2ts/tv')) console.log(topic, message.toString());
    // if( topic.includes('ps/sapele')) console.log(message.toString());
    let preparedData = convertAndPrepareData(message.toString(), topic);
    // if(topic=='mesl/aenl/pd') console.log(preparedData);

    // Process each data item for persistence BEFORE sending to WebSocket
    const persistencePromises = preparedData.map(data => {
        let id = data?.id ? data.id : (data as any)?.name;
        // if(!companyIds.includes(id as companyId)) console.log(id);
        if (data != null && data != undefined && !companyIds.includes(id as companyId)) {
            // Queue data for persistence asynchronously (non-blocking)
            return dataQueue.queuePowerData(data).catch((Error: any) => {
                console.error('Error queuing data for persistence:', Error);
                // Don't throw - we still want to send to WebSocket even if persistence fails
            });
        }
        return Promise.resolve();
    });
    // Start persistence operations (don't wait for them to complete)
    Promise.all(persistencePromises);

    wss.clients.forEach((wsClient) => {
        // console.log('client ready');
        // console.log(wsClient.readyState);
        if (wsClient.readyState === WebSocket.OPEN) {
            // console.log('client ready', preparedData);
            // if(topic == 'zungeru/tv') console.log(vals);
            
            preparedData.forEach((data) => {
                // if(topic=='ps/delta2/gas/delta/pd' && data) console.log(data.sections[0].data);
                if(data != null && data != undefined) sendData(wsClient, data); 
            }) 
        }
    });
}

const convertAndPrepareData = (msg:string, topic:string) => {
    let mergeTopics = ['ps/sapele', 'ps/delta4-1/gas/Delta/pd', 'ps/delta4-2/gas/Delta/pd', 'omotoso11ts/pv', 'omotoso12ts/pv',];
    // if(topic == 'omotoso11ts/pv') console.log(msg);
    //  if(topic == 'omotoso12ts/pv') console.log(msg);
    // console.log('send:', msg);
    // if(!topic.toLowerCase().includes('/status')) {
        let preparedData = [];
        switch(topic) {
            case 'ihovborts/tv' :
                let ihovborArr = ihovborConversion(msg);
                if(ihovborArr.length > 0) {
                    ihovborArr.forEach((vals) => {
                        preparedData.push(prepareData(vals, topic));
                    }); 
                    break;
                }
            case 'gereguGs/pv' :
                let gereguArr = gereguConversion(msg);
                if(gereguArr.length > 0) {
                    gereguArr.forEach((vals) => {
                        preparedData.push(prepareData(vals, topic));
                    }); 
                    break; 
                }
            case 'olorunsogo2ts/tv' :
                let olorunsogoArr = olorunsogoConversion(msg);
                if(olorunsogoArr.length > 0) {
                    olorunsogoArr.forEach((vals) => {
                        preparedData.push(prepareData(vals, topic));
                    }); 
                    break;
                }
            case 'sapelets/pv' :
                let sapeleArr = sapeleConversion(msg);
                if(sapeleArr.length > 0) {
                    sapeleArr.forEach((vals) => {
                        preparedData.push(prepareData(vals, topic));
                    }); 
                    break;
                }
            case 'odukpanits/pv' :
                let odukpaniArr = odukpaniConversion(msg);
                if(odukpaniArr.length > 0) {
                    odukpaniArr.forEach((vals) => {
                        preparedData.push(prepareData(vals, topic));
                    }); 
                    break;
                }
            default:
                if (mergeTopics.some(mergeTopic => topic.includes(mergeTopic))) {
                    let data = repairJSON(msg);
                    // if(topic.includes('ps/sapele')) console.log("repaired data:", data);
                    let parsedData = JSON.parse(data);
                    let subStationId = (parsedData.id) ? parsedData.id : parsedData.name;
                    const stationId = getMergeStationId(subStationId, mergedStationController.mergeIds);

                    mergedStationController.processIncomingStream(parsedData);
                    if(stationId) {
                        // console.log('its station Id:', stationId);
                        const mergedData = mergedStationController.getStationData(stationId);
                        // console.log("merged Data:", mergedData);
                        if(mergedData != null) {
                            const data = prepareData(JSON.stringify(mergedData), topic);
                            // if( data && data.id == 'omotoshoGas') console.log("data:", data);
                            preparedData.push(data);
                        }
                    }
                }else{
                    preparedData.push(prepareData(msg, topic));
                    // return prepareData(msg);
                }
        }
        return preparedData;
    // }else{
    //     let msgs = prepareNC(topic, msg);
    //     if(msgs.length > 0) msgs.forEach((msg) => wsClient.send(msg));
    // }
}

const prepareData = (data:string, topic: string = ''): stationType | null => {
    try{
        // if(topic.includes('ps/sapele')) console.log("data:", data);
        // data = jsonrepair(data);
        data = repairJSON(data);
        // if(topic.includes('ps/sapele')) console.log("repaired data:", data);
        let parsedData = JSON.parse(data);
        // if(topic.includes('egbings/pv')) console.log("parsed Data",parsedData);
        let formattedData = formatData(parsedData);
        return formattedData;
    }catch(err){
        console.log('prepare Data Error for '+topic, err);
        console.log(data);
        logger.error('Error sending websocket data ',err);
        return null;
    }
}

const sendData = (wsClient:WebSocket.WebSocket, formattedData:stationType | null) => {
    try{
        // console.log('sending data', formattedData);
        if(formattedData != null)  wsClient.send(JSON.stringify(formattedData));
        // wsClient.send(data);
        // console.log(Buffer.from(JSON.stringify(formattedData)));
    }catch(err){
        logger.error('Error sending websocket data ',err);
    }
}

const formatData = (data: rawStationType) => {
    // console.log('formatting data', data);
    let formattedData = formatStreamedData(data);
    let isAbsolute = (formattedData?.id != 'olorunsogoLines') ? true : false;
    let formattedDataCopy = JSON.parse(JSON.stringify(formattedData));
    let companies = [
            'pheonix', 'quantum', 'sunflag', 'africanFoundriesLimited', 'starPipe', 'topSteel', 'pulkitSteel', 'kamSteel', 'larfarge', 'monarch',
            'kamSteel-Ilorin'
        ];
    if(!companies.includes(formattedDataCopy.id)) {
        let total = aggregateTotal(formattedDataCopy, isAbsolute);
        // if(startSendingTotalToPowerBi() && sendNewDataToPowerBi()) sendTotalToPowerBi(total);
        let started = localStorage.getItem(storage.StartedSendingTotal);
        if(startSendingTotalToPowerBi() && !started) startSendingLoop();
    }
    return formattedData;
    // console.log('total:',total);
}

const startSendingLoop = () => {
    
        console.log('start sending');
            let intervalId = setInterval(() => {
                let storageTotal: totalType | undefined = localStorage.getItem(storage.StationTotal);
                // console.log(storageTotal);
                if(storageTotal != undefined) {
                    let total = Object.values(storageTotal).reduce((sumTotal, curr) => sumTotal + parseFloat(curr.toString()), 0);
                    sendTotalToPowerBi(total, storageTotal);
                }
                sendFrequencyToPowerBi();
            }, 2000);
            localStorage.setItem(storage.StartedSendingTotal, true);
        
        // clearInterval(intervalId);
}

const sendTotalToPowerBi = (total: number, storageTotal: totalType | undefined) => {
    total = parseFloat(total.toFixed(2));
    let url = process.env.POWER_BI_TOTAL_API;
    let freq = localStorage.getItem(storage.Frequency);
    let data: any = [];
    let time = getDate().toISOString();
    if(storageTotal != undefined) {
        // console.log('storageTotal:', storageTotal);
        // freq = (freq != undefined) ? parseFloat(freq.toFixed(2)) : null;
        let exclude = ['Eket', 'Ekim', 'Olorunsogo1', 'Olorunsogo2', 'OlorunsogoLines', 'Omotosho1', 'Omotosho2'];

        Object.keys(stationIds).forEach((key) => {
            if(!exclude.includes(key)){
                let stationName = key; 
                let stationId = stationIds[key as keyof typeof stationIds];
                if(storageTotal[stationId] !== undefined) {
                    data.push(
                        {
                            Load: parseFloat(storageTotal[stationId].toFixed(2)),
                            Frequency: freq,
                            Time: time,
                            station: stationName
                        }
                    );
                }
            }
        });
        if(storageTotal['Eket'] !== undefined && storageTotal['Ekim'] !== undefined) {
            let ibomGen = storageTotal['Eket'] + storageTotal['Ekim'];
            data.push(
                {
                    Load: parseFloat(ibomGen.toFixed(2)),
                    Frequency: freq,
                    Time: time,
                    station: 'Ibom'
                }
            );
        }
        let omotosho1 = (storageTotal['Omotosho1'] !== undefined) ? storageTotal['Omotosho1'] : 0;
        let omotosho2 = (storageTotal['Omotosho2'] !== undefined) ? storageTotal['Omotosho2'] : 0;
        let omotoshoGas = omotosho1 + omotosho2;
        data.push(
            {
                Load: parseFloat(omotoshoGas.toFixed(2)),
                Frequency: freq,
                Time: time,
                station: 'OmotoshoGas'
            },
            {
                Load: total,
                Frequency: freq,
                Time: time,
                station: 'Total Generation'
            }
        );
        // data.push({

        // });
    }
    
        // console.log('data:', data);
    if(url != undefined) {
        axios.post(url, data)
        .then(() => {
            // console.log('sent ', data);
        })
        .catch((err) => {
            console.log(time+': an error occured while sending total to powerBI '+err);
        })
    }
}

const sendFrequencyToPowerBi = () => {
    let freq = localStorage.getItem(storage.Frequency);
    let time = getDate().toISOString();
    let url = process.env.POWER_BI_FREQ_API;
    let data = [
                    {
                        "Frequency" : freq,
                        "Time" : time
                    }
                ]
    // console.log('sending frequency');
    if(url != undefined) {
        axios.post(url, data)
        .then(() => {
            // console.log('frequency sent ', data);
        })
        .catch((err) => {
            console.log(time+': an error occured while sending frequency to powerBI '+err);
        })
    }
}

const startSendingTotalToPowerBi = () => {
    let receivingDataStartTime: number | undefined = localStorage.getItem(storage.ReceivingDataStartTime);
    // console.log('start Sending Total To PowerBI',receivingDataStartTime);
    if(receivingDataStartTime != undefined) {
        let startSendingTotal = localStorage.getItem(storage.StartSendingTotal);
        if(startSendingTotal == undefined || !startSendingTotal) {
            let now = getDate().getTime();
            let timeElapsed = now - receivingDataStartTime;
            startSendingTotal = ((timeElapsed/1000) > 60) ? true : false;
            localStorage.setItem(storage.StartSendingTotal, startSendingTotal);
        }
        return startSendingTotal;
    }else{
        localStorage.setItem(storage.ReceivingDataStartTime, getDate().getTime());
        return false;
    }
}

const sendNewDataToPowerBi = () => {
    let lastSentTime: number | undefined = localStorage.getItem(storage.LastSentTime);
    let send = false;
    if(lastSentTime != undefined) {
        let now = getDate().getTime();
        let timeElapsed = now - lastSentTime;
        if((timeElapsed/1000) >= 2) {
            send = true;
            localStorage.setItem(storage.LastSentTime, getDate().getTime());
        }
    }else{
        localStorage.setItem(storage.LastSentTime, getDate().getTime());
    }
    return send;
}

export default StationController;