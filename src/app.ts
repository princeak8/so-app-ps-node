require('reflect-metadata');
const express = require("express");
require('dotenv').config();
import { DataSource } from "typeorm"
const ormConfig = require("./config/ormconfig").default;
var cors = require("cors");
import bodyParser from "body-parser";
import routes from "./routes";

var mqtt = require("mqtt");
const http = require("http");
import { createServer, IncomingMessage, ServerResponse, ClientRequest } from 'http';
import * as WebSocket from 'ws';
const queryString = require("query-string");
import StationController from "./controllers/StationController";
import { Duplex } from "stream";

import topics from "./topics";
import mqttConnect from "./mqttConnect";

import seedPowerStations from "./seeds/powerStations";
import LoadDropController from "./controllers/LoadDropController";
import {Request, Response} from 'express';
// var bodyParser = require("body-parser");
// const bcrypt = require("bcrypt");

const wss = new WebSocket.Server({ noServer: true });

const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(express.json());
app.use('/api', routes);

// app.get('/api/users', LoadDropController.save);

// app.post('/api/save_drop', LoadDropController.save);

const server = http.createServer(app);

server.on("upgrade", async function upgrade(request:IncomingMessage, socket:Duplex, head:Buffer) {
    wss.handleUpgrade(request, socket, head, function done(ws) {
        wss.emit("connection", ws, request);
    });
});


// const dataSource = new DataSource(ormConfig);

// dataSource.initialize()
// .then(() => {
//   dataSource.synchronize(true); 
//   console.log('Database initialized');
// })
// .catch((err) => console.log("Error initializing database: ", err));
import database from "./database";



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
var client = mqtt.connect(host, options);
var client2 = mqtt.connect(host2, options2);

mqttConnect(client, topics);
mqttConnect(client2, topics);

StationController.sendNccMessage(wss, client);
StationController.sendAwsMessage(wss, client2);

server.listen("3002", async () => {
    await database();
    // seedPowerStations();
    console.log("Server started on port 3002");
  });