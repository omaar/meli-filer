import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import s3Client from "../../../helpers/awsS3.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

const { S3_BUCKET, AWS_ETAG_EXPIRATION } = process.env;

// Creates a multipart upload id before uploading parts
// @param {string} fileName - The file name
// @returns {string} - The upload id of the file from S3
const createMultiPartdID = async (fileName) => {
  return new Promise(async (resolve, reject) => {
    if (!fileName) {
      return reject(new Error("No file name provided"));
    }
    const multiPartIdParams = {
      Bucket: S3_BUCKET,
      Key: fileName,
    };

    try {
      const command = new CreateMultipartUploadCommand(multiPartIdParams);
      const { UploadId, Key } = await s3Client.send(command);

      return resolve(UploadId);
    } catch (error) {
      return reject(new Error(error.message));
    }
  });
};

//@param {Object} fileBody - The file body object
// @param {string} fileBody.uploadId - The upload id
// @param {Integer} fileBody.parts - The parts of the file
// @param {string} fileBody.fileName - The file name
// @returns {Array} - The signed urls for the parts of the file
const makePresignedUrls = async (fileBody) => {
  return new Promise(async (resolve, reject) => {
    const { uploadId, fileName, parts } = fileBody;

    const multipartParams = {
      Bucket: S3_BUCKET,
      Key: fileName,
      UploadId: uploadId,
    };

    const multipartPromises = [];

    for (let index = 0; index < parts; index++) {
      const command = new UploadPartCommand({
        ...multipartParams,
        PartNumber: index + 1,
      });
      multipartPromises.push(
        getSignedUrl(s3Client, command, {
          expiresIn: parseInt(AWS_ETAG_EXPIRATION),
        })
      );
    }

    try {
      const signedUrls = await Promise.all(multipartPromises);

      return resolve(
        signedUrls.map((url, index) => {
          return {
            signedUrl: url,
            partNumber: index + 1,
          };
        })
      );
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
      PartNumber: parseInt(partNumber, 10),
      UploadId: uploadId,
      Body: Buffer.from(chunk, "base64"),
    };

    try {
      const command = new UploadPartCommand(uploadPartParams);
      const { ETag } = await s3Client.send(command);

      return resolve({ ETag, partNumber });
    } catch (error) {
      return reject(new Error(error.message));
    }
  });
};

const generateSignedUrl = async (fileName) => {
  return new Promise(async (resolve, reject) => {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
    });

    try {
      const url = await getSignedUrl(s3Client, command, {
        expiresIn: AWS_ETAG_EXPIRATION,
      }); // URL válida por 24hrs
      console.log("Signed URL:", url);
      return resolve(url);
    } catch (err) {
      console.error("Error generating signed URL", err);
      return reject(err);
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

    if (!uploadId || !parts || !fileName) {
      return reject(new Error("Missing parameters"));
    }
    // console.log("uploadId", uploadId, fileName);
    // console.log("parts", parts);
    const sortedParts = parts
      .sort((p1, p2) => {
        if (p1.PartNumber < p2.PartNumber) {
          return -1;
        }
        if (p1.PartNumber > p2.PartNumber) {
          return 1;
        }
        return 0;
      })
      .map((part, index) => ({
        ETag: part.ETag,
        PartNumber: index + 1,
      }));
    // console.log("sorted parts", parts);

    const completeUploadFileParams = {
      Bucket: S3_BUCKET,
      Key: fileName,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts,
      },
    };

    try {
      const command = new CompleteMultipartUploadCommand(
        completeUploadFileParams
      );
      const { Location } = await s3Client.send(command);

      return resolve(Location);
    } catch (error) {
      return reject(new Error(error.message));
    }
  });
};

export const startUpload = async (req, res, next) => {
  const { fileName } = req.body;

  // console.log("fileName", req.body);

  if (!fileName) {
    return res.status(400).json({ status: 400, message: "No file uploaded" });
  }

  createMultiPartdID(fileName)
    .then((uploadId) => {
      return res.status(200).json({ status: 200, uploadId });
    })
    .catch((error) => {
      return res.status(500).json({ status: 200, message: error.message });
    });
};

export const uploadChunk = async (req, res, next) => {
  const { uploadId, partNumber, fileName } = req.body;
  const chunk = req.file.buffer;

  // console.log("uploadChunk", req.body, chunk);

  if (!chunk || !uploadId || !partNumber || !fileName) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  uploadPart({ chunk, uploadId, partNumber, fileName })
    .then(({ ETag, partNumber }) => {
      return res.status(200).json({ status: 200, ETag, partNumber });
    })
    .catch((error) => {
      return res.status(500).json({ message: error.message });
    });
};

export const getPresignedUrls = async (req, res, next) => {
  const { uploadId, parts, fileName } = req.body;

  if (!uploadId || !parts || !fileName) {
    return res
      .status(400)
      .json({ status: 400, message: "Missing file parameters" });
  }

  makePresignedUrls({ uploadId, parts, fileName })
    .then((urls) => {
      return res.status(200).json({ status: 200, urlsSigned: urls });
    })
    .catch((error) => {
      return res.status(500).json({ status: 500, message: error.message });
    });
};

export const completeUpload = async (req, res, next) => {
  const { uploadId, parts, fileName } = req.body;

  if (!uploadId || !parts || !fileName) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  completeUploadFile({ uploadId, parts, fileName })
    .then((data) => {
      generateSignedUrl(fileName)
        .then((url) => {
          return res.status(200).json({ location: url });
        })
        .catch((error) => {
          return res.status(500).json({ message: error.message });
        });
    })
    .catch((error) => {
      return res.status(500).json({ message: error.message });
    });
};
