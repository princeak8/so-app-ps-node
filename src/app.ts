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
import logger from "./logger";

const wss = new WebSocket.Server({ noServer: true });

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const server = http.createServer(app);

server.on('connection', (socket: any) => {
    socket.on('error', (err:any) => logger.error(err));
});

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

const host = process.env.MQTT_HOST; //"mqtt://102.89.11.82";
const host2 = process.env.MQTT_AWS_HOST; //"mqtt://ec2-3-88-196-213.compute-1.amazonaws.com";
let client = mqtt.connect(host, options);
let client2 = mqtt.connect(host2, options2);

mqttConnect(client, topics);
mqttConnect(client2, topics);

StationController.sendNccMessage(wss, client);
StationController.sendAwsMessage(wss, client2);

server.listen("3002", async () => console.log("Server started on port 3002"));