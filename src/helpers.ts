interface errorInterface {
    constraints: [key:any];
}

export const validatorErrors = (errors: any) => {
    let errorMessages = <string[]>[];
    if(errors.length > 0) {
        errors.forEach((error:errorInterface) => {
            Object.values(error.constraints).forEach((value) => errorMessages.push(value))
        })
    }
    return errorMessages;
}

export const percentage = (firstVal:number, secondVal:number):string => {
    let diff = firstVal - secondVal;
    // console.log('diff:', diff);
    return (diff > 0) ? ((diff/firstVal) * 100).toFixed(2) : '0.00';
}

export const getTotal = (items: number[], absolute=true): number => {
    let total = 0;
    items.forEach((number) => {
        if(!Number.isNaN(number)) {
            if(absolute) {
                number = (number < 0) ? (number * -1) : number;
                total += number;
            }else{
                total += number;
            }
        }
    });
    return total;
}

export const wait = (ms: number) => {
    return new Promise((resolve) => {
        console.log(`waiting ${ms/1000}Secs to retry connection`);
        setTimeout(resolve, ms);
    })
}

export const getDate = (adjustOffset:boolean = true) => {
    let date = new Date();
    let timezoneOffset = date.getTimezoneOffset();
    let adjustedOffset = timezoneOffset * -1;
    // let lagosOffset = 120; // this is the offset for the Pacific Standard Time timezone
    // let adjustedTime = new Date(date.getTime() + (lagosOffset + timezoneOffset) * 60 * 1000);
    let adjustedDate = new Date(date.getTime() + adjustedOffset * 60 * 1000);
    return adjustedDate;
}

export const getMergeStationId = (subId: string, mergeIds: Object) => {
    let stationId = null;
    for (let topicId in mergeIds) {
        const unitsId = (mergeIds as any)[topicId];
        if (unitsId && unitsId.includes(subId)) {
            return topicId;
        }
    }
    return null;
}

export const getDateTime = (t=null, date=null) => {
    if(t && !date) return new Date().toISOString().split('T')[0] + ' ' + t;
    if(t && date) return date+' '+t;
    return new Date().toISOString().replace('T', ' ').substring(0, 19);
}