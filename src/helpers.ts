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
