import * as WebSocket from 'ws';
import { Client } from "mqtt";
import { ihovborConversion, gereguConversion, olorunsogoConversion, sapeleConversion, odukpaniConversion } from '../conversions';
import { prepareNC } from '../utilities';

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
                if(ihovborArr.length > 0) ihovborArr.forEach((vals) => wsClient.send(vals)); break;
            case 'gereguGs/pv' :
                let gereguArr = gereguConversion(msg);
                if(gereguArr.length > 0) gereguArr.forEach((vals) => wsClient.send(vals)); break; 
            case 'olorunsogo2ts/tv' :
                let olorunsogoArr = olorunsogoConversion(msg);
                if(olorunsogoArr.length > 0) olorunsogoArr.forEach((vals) => wsClient.send(vals)); break;
            case 'sapelets/pv' :
                let sapeleArr = sapeleConversion(msg);
                if(sapeleArr.length > 0) sapeleArr.forEach((vals) => wsClient.send(vals)); break;
            case 'odukpanits/pv' :
                let odukpaniArr = odukpaniConversion(msg);
                if(odukpaniArr.length > 0) odukpaniArr.forEach((vals) => wsClient.send(vals)); break;
            default:
                wsClient.send(msg);
        }
    }else{
        let msgs = prepareNC(topic, msg);
        if(msgs.length > 0) msgs.forEach((msg) => wsClient.send(msg));
    }
}

export default StationController;