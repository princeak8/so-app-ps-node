import { Timestamp } from "typeorm";

export interface dataType {
    mw: number | string;
    A: number | string;
    V: number | string;
    mvar: number | string;
}

export interface sectionType {
    id: string;
    data: dataType;
}

export interface processingStationType {
    id: string;
    t: string;
    sections: rawSectionType[];
}

export interface stationType {
    id: string;
    t: string;
    sections: sectionType[]
}

export interface rawSectionType {
    id: string;
    td?: dataType;
    pd?: dataType;
    gd?: dataType;
}

export interface rawStationType {
    id: string;
    t: string;
    units?: rawSectionType[];
    lines?: rawSectionType[];
    transformers?: rawSectionType[];
}

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

export interface totalItem {
    // [key: string]: number;
    id: string;
    total: number;
}

// export type totalType = totalItem[];
export interface totalType {
    [key: string]: number;
}

// export interface powerBIPayloadType 

export interface formatDataResponseType {
    formattedData: stationType;
    total: totalType;
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
