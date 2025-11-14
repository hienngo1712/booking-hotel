import Room from '../models/Room.js';
import Hotel from '../models/Hotel.js';
import { createError } from '../utils/error.js';

export const createRoom =  async (req, res, next) => {
    const hotelId = req.params.hotelId;
  const newRoom = new Room({ ...req.body, hotelId });

  try {
    // Save the new room
    const savedRoom = await newRoom.save();

    // Add the room ID to the hotel's rooms array
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return next(createError(404, 'Hotel not found'));
    }
    hotel.rooms.push(savedRoom._id);
    await hotel.save();

    // Fetch all rooms for the hotel (including the newly added room)
    const rooms = await Room.find({ hotelId });

    // Find the cheapest price among all rooms
    const prices = rooms.map((room) => room.price);
    const cheapestPrice = Math.min(...prices);

    // Update the hotel's cheapestPrice
    await Hotel.findByIdAndUpdate(hotelId, { $set: { cheapestPrice } }, { new: true });

    res.status(200).json(savedRoom);
  } catch (err) {
    next(err);
  }
}

export const updateRoom = async (req, res, next) => {
    try {
      const hotelId = req.body.hotelId;
      const updatedRoom = await Room.findByIdAndUpdate(
          req.params.id, 
          { $set: req.body},
          { new: true }
      )
       // Fetch all rooms for the hotel (including the newly added room)
      const rooms = await Room.find({ hotelId });

      // Find the cheapest price among all rooms
      const prices = rooms.map((room) => room.price);
      const cheapestPrice = Math.min(...prices);

      // Update the hotel's cheapestPrice
      await Hotel.findByIdAndUpdate(hotelId, { $set: { cheapestPrice } }, { new: true });
      res.status(200).json(updatedRoom)
    } catch(err) {
        next(err);
    }
}


export const updateRoomAvailability = async (req, res, next) => {
    try {
      const { roomId, roomNumber } = req.params;
      const { dates } = req.body;
  
      if (!dates || !Array.isArray(dates)) {
        return res.status(400).json({ message: "Dates must be an array" });
      }
  
      const updatedRoom = await Room.updateOne(
        { _id: roomId, "roomNumber.number": parseInt(roomNumber) },
        {
          $push: {
            "roomNumber.$.unavailableDates": { $each: dates.map((date) => new Date(date)) },
          },
        }
      );
  
      if (updatedRoom.matchedCount === 0) {
        return res.status(404).json({ message: "Room or room number not found" });
      }
  
      res.status(200).json("Room state has been updated");
    } catch (err) {
      next(err);
    }
  };

export const updateRoomState = async (req, res, next) => {
    try {
      const { roomId, roomNumber } = req.params;
      const { dates } = req.body; // Nhận danh sách các ngày cần xóa
  
      if (!dates || !Array.isArray(dates)) {
        return res.status(400).json({ message: "Dates must be provided as an array" });
      }
  
      // Chuyển đổi các ngày thành định dạng Date để so sánh
      const datesToRemove = dates.map((date) => new Date(date));
  
      const updatedRoom = await Room.findOneAndUpdate(
        { _id: roomId, "roomNumber.number": roomNumber },
        { $pull: { "roomNumber.$.unavailableDates": { $in: datesToRemove } } },
        { new: true }
      );
  
      if (!updatedRoom) {
        return res.status(404).json({ message: "Room or room number not found" });
      }
  
      res.status(200).json({ message: "Room state has been updated", room: updatedRoom });
    } catch (err) {
      next(err);
    }
  };

export const deleteRoom = async (req, res, next) => {
    const hotelId = req.params.hotelId;
    try {
        await Room.findByIdAndDelete(
            req.params.id
        )
        try {
            await Hotel.findByIdAndUpdate(hotelId, { $pull: { rooms: req.params.id } });
        } catch (err) {
            next(err);
        }
        res.status(200).json("Room has been deleted")
    } catch(err) {
        next(err);
    }
}

export const getRoom = async (req, res, next) => {
    try {
        const room = await Room.findById(
            req.params.id
        )
        res.status(200).json(room)
    } catch(err) {
        next(err);
    }
}

export const getAllRoom = async (req, res, next) => {
    try {
        const rooms = await Room.find(
            req.params.id
        )
        res.status(200).json(rooms)
    } catch(err) {
        next(err);
    }
}

export const countRoom = async (req, res, next) => {
    
    try {
        const roomCount = await Room.countDocuments();
        
        res.status(200).json(roomCount)
    } catch(err) {
        next(err);
    }
}