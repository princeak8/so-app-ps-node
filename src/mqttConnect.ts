import { Client } from "mqtt";

const mqtt = (client:Client, topics:string[]) => {
    const connectedStations:string[] = [];
    let connectedCount = 0;
    console.log("is connected:", client.connected)
    client.on('connect', function () {
        connectedCount++;
        // console.log('connected count:', connectedCount);
        // console.log('connected');
        if(topics.length > 0) {
            topics.forEach((topic) => {
                client.subscribe(topic, function (err) {
                    if (err) {
                        console.log(topic+': '+err);
                    }else{
                        if(!connectedStations.includes(topic)) connectedStations.push(topic);
                        // console.log(topic+': Connected');
                    }
                })
            })
            // console.log("connected stations", connectedStations);
        }
        
    });
    client.on('connectionLost', function() {
        console.log("connection lost");
    })
    client.on('error', function (error) {
        console.log("failed to connect: "+error);
    })
}

export default mqtt;