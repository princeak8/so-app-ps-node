import LoadDropService from "../services/LoadDropService";
import PowerStationService from "../services/PowerStationService";
import {Request, Response, RequestHandler} from 'express';
import { LoadDropValidator } from "../validators/LoadDropValidator";
import { AcknowledgeLoadDropValidator } from "../validators/AcknowledgeLoadDropValidator";
import { AcknowledgeStationLoadDropValidator } from "../validators/AcknowledgeStationLoadDropValidator";
import { validate } from "class-validator";
import { validatorErrors } from "../helpers";
import logger from "../logger";
const LoadDropResource = require("../resources/loadDropResource");
// const jc = require('json-cycle');

type Params = {};
type ResBody = {};
type ReqBody = {};
type ReqQuery = {
    query: string;
}

class PowerDropController {
    static stringify = (obj: any) => {
        let cach: any = [];
        Object.keys(obj).forEach((key) => {
            if(typeof obj[key] === "object" && obj[key] !== null) {
                if(cach.indexOf(obj[key]) !== -1) {
                    delete obj[key];
                }
            }
        })
        return obj;

        let cache:any = [];
        let str = JSON.stringify(obj, function(key, value) {
          if (typeof value === "object" && value !== null) {
            if (cache.indexOf(value) !== -1) {
              // Circular reference found, discard key
              return;
            }
            // Store value in our collection
            cache.push(value);
          }
          return value;
        });
        cache = null; // reset the cache
        return str;
    }

    static save = async (req: Request, res:Response) => {
        try{
            const { powerStationId, load, previousLoad, referenceLoad, timeOfDrop, calType } = req.body;
            const data = {powerStationId, load, previousLoad, referenceLoad, timeOfDrop, calType};
            const loadDropValidator = new LoadDropValidator();
            Object.assign(loadDropValidator, data);
            const validationErrors = await validate(loadDropValidator);
            if (validationErrors.length > 0) {
                const extractedValidationErrors = validatorErrors(validationErrors);
                logger.error(extractedValidationErrors);
                res.status(400).json({ errors: extractedValidationErrors });
                return;
            }

            // Check if the associated power station exists
            const powerStation = await PowerStationService.getPowerStationByIdentifier(powerStationId);
            if (!powerStation) {
                logger.error('Power station not found');
                res.status(400).json({ error: 'Power station not found' });
                return;
            }

            //Check if the load drop for a station has already been added by that exact time
            let loadDrop = await LoadDropService.getLoadDropByStationAndTimeOfDrop(timeOfDrop, powerStation.id);
            if(loadDrop) {
                logger.error('Load Drop for this station has already been captured. powerStationId:'+powerStation.identifier);
                res.status(400).json({ error: 'Load Drop for this station has already been captured' });
                return
            }

            data.powerStationId = powerStation.id;
            loadDrop = await LoadDropService.save(data);
            res.status(200).send(loadDrop);
            // res.status(200).send(this.stringify(loadDrop));
        } catch (error) {
            logger.error('Error creating power drop', error);
            res.status(500).send('Error creating power drop: '+error);
        }
    }

    static acknowledge = async (req: Request, res:Response) => {
        try{
            const { id, acknowledgedAt } = req.body;
            const data = {id, acknowledgedAt};
            const acknowledgeLoadDropValidator = new AcknowledgeLoadDropValidator();
            Object.assign(acknowledgeLoadDropValidator, data);
            const validationErrors = await validate(acknowledgeLoadDropValidator);
            if (validationErrors.length > 0) {
                const extractedValidationErrors = validatorErrors(validationErrors);
                logger.error(extractedValidationErrors);
                res.status(400).json({ errors: extractedValidationErrors});
                return;
            }

            // Check if the loadDrop exists
            const loadDrop = await LoadDropService.getLoadDrop(id);
            if (!loadDrop) {
                logger.error('Load Drop not found');
                res.status(400).json({ error: 'Load Drop not found' });
                return;
            }

            // Check if the loadDrop has been acknowledged
            if(loadDrop.acknowledged_at != null) {
                res.status(400).json({ error: 'Load Drop has already been acknowledged' });
                return;
            }

            await LoadDropService.acknowledge(data);
            res.status(200).send('success');
        } catch (error) {
            logger.error('Error acknowledging power drop', error);
            res.status(500).send('Error acknowledging power drop');
        }
    }

    static acknowledgeStation = async (req: Request, res:Response) => {
        try{
            const { identifier, acknowledgedAt } = req.body;
            const data = {identifier, acknowledgedAt};
            const acknowledgeStationLoadDropValidator = new AcknowledgeStationLoadDropValidator();
            Object.assign(acknowledgeStationLoadDropValidator, data);
            const validationErrors = await validate(acknowledgeStationLoadDropValidator);
            if (validationErrors.length > 0) {
                const extractedValidationErrors = validatorErrors(validationErrors);
                logger.error(extractedValidationErrors);
                res.status(400).json({ errors: extractedValidationErrors});
                return;
            }

            // Check if power station exists
            const powerStation = await PowerStationService.getPowerStationByIdentifier(identifier);
            if (!powerStation) {
                logger.error('Power Station not found: load_drop/acknowledge_station');
                res.status(400).json({ error: 'Power Station not found' });
                return;
            }
            const loadDrops = await LoadDropService.getUnAcknowledgedStationLoadDrops(identifier);
            await LoadDropService.acknowledgeStation(acknowledgedAt, loadDrops);
            res.status(200).send('success');
        } catch (error) {
            logger.error('Error acknowledging power drop', error);
            res.status(500).send('Error acknowledging power drop');
        }
    }

    static getLatest = async (req: Request, res:Response) => {
        try{
            const loadDrops = await LoadDropService.getLatestLoadDrops();
            res.status(200).send(LoadDropResource.collection(loadDrops));
        } catch (error) {
            logger.error('Error fetching latest load drops', error);
            res.status(500).send('Error fetching latest drops');
        }
    }

    static getRange:RequestHandler<Params, ResBody, ReqBody, ReqQuery> = async (req: Request, res:Response) => {
        try{
            const start = req.query.start as string;
            const end = req.query.end as string;
            if(start) {
                const startDate = new Date(start);
                const endDate = (end) ? new Date(end) : new Date();
                let loadDrops;
                if(!req.query.group) {
                    loadDrops = (end) ? await LoadDropService.getrange({start:startDate, end:endDate}) : await LoadDropService.getrange({start:startDate});
                }else{
                    loadDrops = (end) ? await LoadDropService.getrange({start:startDate, end:endDate}, true) : await LoadDropService.getrange({start:startDate}, true);
                }
                res.status(200).send(LoadDropResource.collection(loadDrops));
            }else{
                logger.error('incorrect query parameters: load_drop/range');
                res.status(400).send('incorrect query parameters');
            }
        } catch (error) {
            // console.error('Error fetching latest load drops', error);
            logger.error('Error fetching load drops range: '+error);
            res.status(500).send('Error fetching latest drops: '+error);
        }
    }

    static getAcknowledged = async (req: Request, res:Response) => {
        try{
            const identifier = req.query.id as string;
            if(identifier) {
                const powerStation = await PowerStationService.getPowerStationByIdentifier(identifier);
                if(powerStation) {
                    const loadDrops = await LoadDropService.getAcknowledgedStationLoadDrops(identifier);
                    res.status(200).send(loadDrops);
                }else{
                    logger.error('power station not found: : load_drop/acknowledged')
                    res.status(400).send('power station was not found');
                }
            }else{
                logger.error('identifier is required in the query: load_drop/acknowledged')
                res.status(400).send('identifier is required in the query');
            }
        } catch (error) {
            logger.error('Error fetching latest load drops', error);
            res.status(500).send('Error fetching latest drops');
        }
    }

    static getUnAcknowledged = async (req: Request, res:Response) => {
        try{
            const identifier = req.query.id as string;
            if(identifier) {
                const powerStation = await PowerStationService.getPowerStationByIdentifier(identifier);
                if(powerStation) {
                    const loadDrops = await LoadDropService.getUnAcknowledgedStationLoadDrops(identifier);
                    res.status(200).send(loadDrops);
                }else{
                    logger.error('power station not found: : load_drop/un_acknowledged')
                    res.status(400).send('power station was not found');
                }
            }else{
                logger.error('identifier is required in the query: : load_drop/un_acknowledged')
                res.status(400).send('identifier is required in the query');
            }
        } catch (error) {
            logger.error('Error fetching latest load drops', error);
            res.status(500).send('Error fetching latest drops');
        }
    }
}

export default PowerDropController;