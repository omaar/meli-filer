import { S3 } from "@aws-sdk/client-s3";
import s3Client from "../../../helpers/awsS3.js";
import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const { S3_BUCKET } = process.env;

// Creates a multipart upload id before uploading parts
// @param {string} fileName - The file name
// @returns {string} - The upload id of the file from S3
const createMultiPartdID = async (fileName) => {
  return new Promise(async (resolve, reject) => {
    const multiPartIdParams = {
      Bucket: S3_BUCKET,
      Key: fileName,
    };

    try {
      const { UploadId } = await s3Client
        .createMultipartUpload(multiPartIdParams)
        .promise();

      return resolve(UploadId);
    } catch (error) {
      return reject(new Error(error.message));
    }
  });
};

// Uploads a part of the file to S3
// @param {Object} fileBody - The file body object
// @param {string} fileBody.chunk - The file chunk
// @param {string} fileBody.uploadId - The upload id
// @param {string} fileBody.partNumber - The part number
// @param {string} fileBody.fileName - The file name
// @returns {Object} - The s3 ETag and part number of the file part
const uploadPart = async (fileBody) => {
  return new Promise(async (resolve, reject) => {
    const { chunk, uploadId, partNumber, fileName } = fileBody;

    const uploadPartParams = {
      Bucket: S3_BUCKET,
      Key: fileName,
      partNumber: parseInt(partNumber, 10),
      UploadId: uploadId,
      Body: Buffer.from(chunk, "base64"),
    };

    try {
      const { ETag } = await s3Client.uploadPart(uploadPartParams).promise();

      return resolve({ ETag, partNumber });
    } catch (error) {
      return reject(new Error(error.message));
    }
  });
};

// Completes the upload of the file to S3
// @param {Object} fileBody - The file body object
// @param {string} fileBody.uploadId - The upload id
// @param {Array} fileBody.parts - The parts of the file
// @param {string} fileBody.fileName - The file name
// @returns {string} - The location of the file in S3
const completeUploadFile = async (fileBody) => {
  return new Promise(async (resolve, reject) => {
    const { uploadId, parts, fileName } = fileBody;

    const completeUploadFileParams = {
      Bucket: S3_BUCKET,
      Key: fileName,
      MultipartUpload: {
        Parts: parts.map((part, index) => ({
          ETag: part.ETag,
          PartNumber: index + 1,
        })),
      },
      UploadId: uploadId,
    };

    try {
      const { Location } = await s3Client
        .completeMultipartUpload(completeUploadFileParams)
        .promise();

      return resolve(Location);
    } catch (error) {
      return reject(new Error(error.message));
    }
  });
};

export const startUpload = async (req, res, next) => {
  const { file } = req;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const { originalname } = file;

  const fileName = originalname;

  createMultiPartdID(fileName)
    .then((uploadId) => {
      return res.status(200).json({ uploadId });
    })
    .catch((error) => {
      return res.status(500).json({ message: error.message });
    });
};

export const uploadChunk = async (req, res, next) => {
  const { chunk, uploadId, partNumber, fileName } = req.body;

  uploadPart({ chunk, uploadId, partNumber, fileName })
    .then((data) => {
      return res.status(200).json(data);
    })
    .catch((error) => {
      return res.status(500).json({ message: error.message });
    });
};

export const completeUpload = async (req, res, next) => {
  const { uploadId, parts, fileName } = req.body;

  completeUploadFile({ uploadId, parts, fileName })
    .then((data) => {
      return res.status(200).json({ location: data });
    })
    .catch((error) => {
      return res.status(500).json({ message: error.message });
    });
};
