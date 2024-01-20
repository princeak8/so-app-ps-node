import { Timestamp } from "typeorm";

export interface dataType {
    mw: number | string;
    A: number | string;
    V: number | string;
    mvar: number | string;
}

export interface unitType {
    id: string;
    td?: dataType;
    pd?: dataType;
    gd?: dataType;
}

export interface loadDropRequest {
    powerStationId: number;
    load: number;
    previousLoad: number;
    referenceLoad: number;
    timeOfDrop: Timestamp;
    calType: string;
}

export interface acknowledgeLoadDropRequest {
    id: number;
    acknowledgedAt: Timestamp;
}