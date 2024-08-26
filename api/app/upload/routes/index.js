import { Router } from "express";
import multer from "multer";

import {
  startUpload,
  uploadChunk,
  completeUpload,
} from "../controllers/index.js";

// Move router
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

router.post("/start", upload.single("file"), startUpload);

router.put("/chunk", uploadChunk);

router.post("/complete", completeUpload);

export default router;
