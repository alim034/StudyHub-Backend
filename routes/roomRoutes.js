// roomRoutes.js
import express from "express";
import * as roomCtrl from "../controllers/roomController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js"; //middleware

const router = express.Router();

// Apply the middleware to every room-related route
router.post("/", authMiddleware, roomCtrl.createRoom);
router.post("/join", authMiddleware, roomCtrl.joinByCode);
router.get("/mine", authMiddleware, roomCtrl.getMyRooms);
router.get("/:id", authMiddleware, roomCtrl.getRoomById);
router.patch("/:id", authMiddleware, roomCtrl.updateRoom);
router.delete("/:id", authMiddleware, roomCtrl.deleteRoom);
router.post("/:id/invite/regenerate", authMiddleware, roomCtrl.regenerateInvite);

export default router;