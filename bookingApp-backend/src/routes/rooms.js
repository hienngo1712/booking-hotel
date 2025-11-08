import express from 'express';
import Room from '../models/Room.js'
import { countRoom, createRoom, deleteRoom, getAllRoom, getRoom, updateRoom, updateRoomAvailability, updateRoomState } from '../controllers/roomController.js';
import { verifyAdmin, verifyHotelier } from '../utils/verifyToken.js';

const router = express.Router();

//CREATE
router.post('/:hotelId', verifyHotelier, createRoom);

//UPDATE
router.put('/:id', verifyHotelier, updateRoom)

//UPDATE ROOM AVAILABILITY
router.put('/availability/:roomId/:roomNumber', updateRoomAvailability);
router.put('/state/:roomId/:roomNumber', updateRoomState)

//DELETE
router.delete('/:id/:hotelId', verifyHotelier, deleteRoom)

//GET
router.get('/count', countRoom)
router.get('/:id', getRoom)

//GET ALL
router.get('/', getAllRoom)


export default router