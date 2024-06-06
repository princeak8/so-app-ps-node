import * as WebSocket from 'ws';
import { Client } from "mqtt";
import axios from "axios";
import { ihovborConversion, gereguConversion, olorunsogoConversion, sapeleConversion, odukpaniConversion } from '../conversions';
import { prepareNC, formatStreamedData, aggregateTotal } from '../utilities';
import { type rawStationType } from '../types';
import localStorage from '../localStorage';
import { storage } from '../enums';

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

const sendMessage = (wss:WebSocket.Server, message:Buffer, topic='') => {
    
    wss.clients.forEach((wsClient) => {
        // console.log('client ready');
        if (wsClient.readyState === WebSocket.OPEN) {
            let vals = message.toString();
            // if(topic == 'olorunsogo2ts/tv' || topic == 'olorunsogo1ts/pv') console.log(vals);
            // if(topic == 'shirorogs/pv') vals = Buffer.from(JSON.stringify(nc)).toString();
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
                        formatData(JSON.parse(vals));
                        wsClient.send(vals)
                    }); 
                    break;
                }
            case 'gereguGs/pv' :
                let gereguArr = gereguConversion(msg);
                if(gereguArr.length > 0) {
                    gereguArr.forEach((vals) => {
                        formatData(JSON.parse(vals));
                        wsClient.send(vals)
                    }); 
                    break; 
                }
            case 'olorunsogo2ts/tv' :
                let olorunsogoArr = olorunsogoConversion(msg);
                if(olorunsogoArr.length > 0) {
                    olorunsogoArr.forEach((vals) => {
                        formatData(JSON.parse(vals));
                        wsClient.send(vals)
                    }); 
                    break;
                }
            case 'sapelets/pv' :
                let sapeleArr = sapeleConversion(msg);
                if(sapeleArr.length > 0) {
                    sapeleArr.forEach((vals) => {
                        formatData(JSON.parse(vals));
                        wsClient.send(vals)
                    }); 
                    break;
                }
            case 'odukpanits/pv' :
                let odukpaniArr = odukpaniConversion(msg);
                if(odukpaniArr.length > 0) {
                    odukpaniArr.forEach((vals) => {
                        formatData(JSON.parse(vals));
                        wsClient.send(vals)
                    }); 
                    break;
                }
            default:
                formatData(JSON.parse(msg));
                wsClient.send(msg);
        }
    }else{
        let msgs = prepareNC(topic, msg);
        if(msgs.length > 0) msgs.forEach((msg) => wsClient.send(msg));
    }
}

const formatData = (data: rawStationType) => {
    let formattedData = formatStreamedData(data);
    let isAbsolute = (formattedData?.id != 'olorunsogoLines') ? true : false;
    let total = aggregateTotal(formattedData, isAbsolute);
    // if(startSendingTotalToPowerBi() && sendNewDataToPowerBi()) sendTotalToPowerBi(total);
    // console.log('total:',total);
}

const sendTotalToPowerBi = (total: number) => {
    total = parseFloat(total.toFixed(2));
    let url = process.env.POWER_BI_TOTAL_API;
    let data = [
            {
                "total_gen" :total,
                "time" : new Date().toISOString()
            }
        ]
    if(url != undefined) {
        axios.post(url, data)
        .then(() => {
            console.log('sent ', data);
        })
        .catch((err) => {
            console.log('an error occured while sending total to powerBI '+err);
        })
    }
}

const startSendingTotalToPowerBi = () => {
    let receivingDataStartTime: number | undefined = localStorage.getItem(storage.ReceivingDataStartTime);
    if(receivingDataStartTime != undefined) {
        let startSendingTotal = localStorage.getItem(storage.StartSendingTotal);
        if(startSendingTotal == undefined || !startSendingTotal) {
            let now = new Date().getTime();
            let timeElapsed = now - receivingDataStartTime;
            startSendingTotal = ((timeElapsed/1000) > 60) ? true : false;
            localStorage.setItem(storage.StartSendingTotal, startSendingTotal);
        }
        return startSendingTotal;
    }else{
        localStorage.setItem(storage.ReceivingDataStartTime, new Date().getTime());
        return false;
    }
}

const sendNewDataToPowerBi = () => {
    let lastSentTime: number | undefined = localStorage.getItem(storage.LastSentTime);
    let send = false;
    if(lastSentTime != undefined) {
        let now = new Date().getTime();
        let timeElapsed = now - lastSentTime;
        if((timeElapsed/1000) >= 2) {
            send = true;
            localStorage.setItem(storage.LastSentTime, new Date().getTime());
        }
    }else{
        localStorage.setItem(storage.LastSentTime, new Date().getTime());
    }
    return send;
}

export default StationController;