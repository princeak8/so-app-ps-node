require('reflect-metadata');
const express = require("express");
require('dotenv').config();

var mqtt = require("mqtt");
const http = require("http");
import { createServer, IncomingMessage, ServerResponse, ClientRequest } from 'http';
import * as WebSocket from 'ws';
const queryString = require("query-string");
import StationController from "./controllers/StationController";
import { Duplex } from "stream";

import topics from "./topics";
import mqttConnect from "./mqttConnect";
import mqttLocalConnect from "./mqttLocalConnect";
import logger from "./logger";
import axios from "axios";
import localStorage from './localStorage';
import { storage } from './enums';

const wss = new WebSocket.Server({ noServer: true });

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const server = http.createServer(app);

server.on('connection', (socket: any) => {
    socket.on('error', (err:any) => logger.error(err));
});

const loadPowerBi = () => {
    
    const url = "https://api.powerbi.com/beta/b740a52c-b75e-450e-84bb-7b929258459a/datasets/dffb5871-62fc-41bd-a031-70cab033e35a/rows?experience=power-bi&key=jaPKvpIbnbCpyDsaD8CwEPcFIfAFJg%2F3WySFKbA3YiSo3XV3dADyCElt2%2FoY2Dx%2Bz%2BiIdyDmm4Wq2RA7FVfxyA%3D%3D";
    const high = 4000;
    const low = 1000;
    const highFreq = 52.00;
    const lowFreq = 48.50;

    let intervalId = setInterval(() => {
        let gen = Math.random() * (high - low) + low;
        let freq = Math.random() * (highFreq - lowFreq) + lowFreq;

        let data = [
            {
                "total_gen" :gen.toFixed(2),
                "time" : new Date().toISOString(),
                "frequency": freq.toFixed(2)
            }
        ];

        axios.post(url, data)
        .then(() => {
            console.log('sent ', data);
        })
        .catch((err) => {
            console.log('an error occured while sending to powerBI '+err);
        })
    }, 2000)
    // console.log(data);
    // axios.post(url, data);

}

// loadPowerBi();

server.on("upgrade", async function upgrade(request:IncomingMessage, socket:Duplex, head:Buffer) {
    // console.log(request.headers.upgrade);
    wss.handleUpgrade(request, socket, head, function done(ws) {
        
    //     // console.log('handling upgrade')
    //     // wss.emit("connection", ws, request);
        ws.on("error", (error) => console.log("websocket error", error));
    });
});



const options = {
    clientId: process.env.NCC_CLIENT_ID,
    // username:"akalo",
    // password:"akalo88",
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    clean: true,
};
  
const options2 = {
    clientId: process.env.AWS_CLIENT_ID,
    username: process.env.MQTT_AWS_USER,
    password: process.env.MQTT_AWS_PASS,
    clean: true,
};

const localOptions = {
    clientId: process.env.LOCAL_CLIENT_ID,
    username: process.env.MQTT_LOCAL_USER,
    password: process.env.MQTT_LOCAL_PASS,
    clean: true,
};

const host = process.env.MQTT_HOST; //"mqtt://102.89.11.82";
const host2 = process.env.MQTT_AWS_HOST; //"mqtt://ec2-3-88-196-213.compute-1.amazonaws.com";
const localHost = process.env.MQTT_LOCAL_HOST; //"mqtt://localhost";
let client = mqtt.connect(host, options);
let client2 = mqtt.connect(host2, options2);
let localClient = mqtt.connect(localHost, localOptions);

mqttConnect(client, topics);
mqttConnect(client2, topics);
mqttLocalConnect(localClient);

StationController.sendNccMessage(wss, client);
StationController.sendAwsMessage(wss, client2);
StationController.sendLocalMessage(localClient);

localStorage.removeItems([storage.StationTotal, storage.Olorunsogo1, storage.Olorunsogo2,
    storage.OlorunsogoGas, storage.OlorunsogoLines, storage.OlorunsogoNipp, storage.ReceivingDataStartTime
]);
localStorage.setItem(storage.StartSendingTotal, false);
localStorage.setItem(storage.StartedSendingTotal, false);
localStorage.setItem('localTrials', 0);

server.listen("3002", async () => console.log("Server started on port 3002"));