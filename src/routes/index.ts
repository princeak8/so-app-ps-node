import express from "express";
import LoadDropController from "../controllers/LoadDropController";

const router = express.Router();

router.post("/load_drop/save", LoadDropController.save);
router.post("/load_drop/acknowledge", LoadDropController.acknowledge);
router.post("/load_drop/acknowledge_station", LoadDropController.acknowledgeStation);
router.get("/load_drop/latest", LoadDropController.getLatest);
router.get("/load_drop/range", LoadDropController.getRange);
router.get("/load_drop/acknowledged", LoadDropController.getAcknowledged);
router.get("/load_drop/un_acknowledged", LoadDropController.getUnAcknowledged);


export default router;