import { Router } from "express";
import multer from "multer";

import {
  startUpload,
  uploadChunk,
  completeUpload,
  getPresignedUrls,
} from "../controllers/index.js";

// Move router
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = Router();

router.post("/start", startUpload);

router.put("/chunk", upload.single("file"), uploadChunk);

router.post("/chunk/sign", getPresignedUrls);

router.post("/complete", completeUpload);

export default router;
