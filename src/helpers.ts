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