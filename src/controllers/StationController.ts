import * as WebSocket from 'ws';
import { Client } from "mqtt";
import axios from "axios";
import { ihovborConversion, gereguConversion, olorunsogoConversion, sapeleConversion, odukpaniConversion } from '../conversions';
import { prepareNC, formatStreamedData, aggregateTotal } from '../utilities';
import { type rawStationType, type totalType } from '../types';
import localStorage from '../localStorage';
import { storage, stationId } from '../enums';
import { getDate } from '../helpers';
import logger from '../logger';
import stationIds from '../stationIds';

const StationController:{ [index: string]: Function } = {};

StationController.sendNccMessage= (wss:WebSocket.Server, client:Client) => {
    client.on('message', async function (sentTopic:string, message:Buffer) {
        sendMessage(wss, message, sentTopic);
    });
}

StationController.sendAwsMessage= (wss:WebSocket.Server, client:Client) => {
    client.on('message', async function (sentTopic:string, message:Buffer) {
        sendMessage(wss, message, sentTopic);
    });
}

StationController.sendLocalMessage= (client:Client) => {
    client.on('message', async function (sentTopic:string, message:Buffer) {
        try{
            let vals = message.toString();
            let data = JSON.parse(vals);
            localStorage.setItem(storage.Frequency, data.value);
        }catch(err){
            logger.error(err);
        }
    });
}

const sendMessage = (wss:WebSocket.Server, message:Buffer, topic='') => {
    
    wss.clients.forEach((wsClient) => {
        // console.log('client ready');
        if (wsClient.readyState === WebSocket.OPEN) {
            let vals = message.toString();
            // if(topic == 'olorunsogo2ts/tv' || topic == 'olorunsogo1ts/pv') console.log(vals);
            // if(topic == 'shirorogs/pv') vals = Buffer.from(JSON.stringify(nc)).toString();
            // if(topic == 'zungeru/tv') console.log(vals);
            send(vals, topic, wsClient);
        }
    });
}

const send = (msg:string, topic:string, wsClient:WebSocket.WebSocket) => {
    // if(topic == 'shirorogs/pv') console.log(msg);
    if(!topic.toLowerCase().includes('/status')) {
        switch(topic) {
            case 'ihovborts/tv' :
                let ihovborArr = ihovborConversion(msg);
                if(ihovborArr.length > 0) {
                    ihovborArr.forEach((vals) => {
                        sendData(wsClient, vals);
                    }); 
                    break;
                }
            case 'gereguGs/pv' :
                let gereguArr = gereguConversion(msg);
                if(gereguArr.length > 0) {
                    gereguArr.forEach((vals) => {
                        sendData(wsClient, vals);
                    }); 
                    break; 
                }
            case 'olorunsogo2ts/tv' :
                let olorunsogoArr = olorunsogoConversion(msg);
                if(olorunsogoArr.length > 0) {
                    olorunsogoArr.forEach((vals) => {
                        sendData(wsClient, vals);
                    }); 
                    break;
                }
            case 'sapelets/pv' :
                let sapeleArr = sapeleConversion(msg);
                if(sapeleArr.length > 0) {
                    sapeleArr.forEach((vals) => {
                        sendData(wsClient, vals);
                    }); 
                    break;
                }
            case 'odukpanits/pv' :
                let odukpaniArr = odukpaniConversion(msg);
                if(odukpaniArr.length > 0) {
                    odukpaniArr.forEach((vals) => {
                        sendData(wsClient, vals);
                    }); 
                    break;
                }
            default:
                sendData(wsClient, msg);
        }
    }else{
        let msgs = prepareNC(topic, msg);
        if(msgs.length > 0) msgs.forEach((msg) => wsClient.send(msg));
    }
}

const sendData = (wsClient:WebSocket.WebSocket, data:string) => {
    try{
        let parsedData = JSON.parse(data);
        let formattedData = formatData(parsedData);
        // if(companies.includes(parsedData?.id)) console.log('parsed Data', parsedData, 'formatted data:', formattedData);
        if(formattedData != null)  wsClient.send(JSON.stringify(formattedData));
        // wsClient.send(data);
        // console.log(Buffer.from(JSON.stringify(formattedData)));
    }catch(err){
        logger.error(err);
    }
}

const formatData = (data: rawStationType) => {
    let formattedData = formatStreamedData(data);
    let isAbsolute = (formattedData?.id != 'olorunsogoLines') ? true : false;
    let formattedDataCopy = JSON.parse(JSON.stringify(formattedData));
    let companies = ['pheonix', 'quantum', 'sunflag', 'africanFoundriesLimited', 'starPipe', 'topSteel', 'pulkitSteel', 'kamSteel', 'larfarge', 'monarch'];
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
    if(storageTotal != undefined) {
        // freq = (freq != undefined) ? parseFloat(freq.toFixed(2)) : null;
        let time = getDate().toISOString();
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
    // let data = [
    //         {
    //             "total_gen" :total,
    //             "time" : getDate().toISOString(),
    //             "frequency" : (freq != undefined) ? parseFloat(freq.toFixed(2)) : null,
    //             "freq_time" : getDate().toISOString(),
    //             "egbin" : (storageTotal != undefined && storageTotal[stationId.Egbin] !== undefined) ? parseFloat(storageTotal[stationId.Egbin].toFixed(2)) : null,
    //             "jebba" : (storageTotal != undefined && storageTotal[stationId.Jebba] !== undefined) ? parseFloat(storageTotal[stationId.Jebba].toFixed(2)) : null,
    //             "kainji" : (storageTotal != undefined && storageTotal[stationId.Kainji] !== undefined) ? parseFloat(storageTotal[stationId.Kainji].toFixed(2)) : null
    //         }
    //     ]
        // console.log('sending now: ', data);
    if(url != undefined) {
        axios.post(url, data)
        .then(() => {
            // console.log('sent ', data);
        })
        .catch((err) => {
            console.log('an error occured while sending total to powerBI '+err);
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
    console.log('sending frequency');
    if(url != undefined) {
        axios.post(url, data)
        .then(() => {
            console.log('frequency sent ', data);
        })
        .catch((err) => {
            console.log('an error occured while sending frequency to powerBI '+err);
        })
    }
}

const startSendingTotalToPowerBi = () => {
    let receivingDataStartTime: number | undefined = localStorage.getItem(storage.ReceivingDataStartTime);
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