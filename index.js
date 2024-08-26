const express = require('express');
const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const app = express();
const s3 = new AWS.S3();
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

// Middleware para autenticar usuarios (JWT)
app.use((req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).send('Access Denied');

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).send('Invalid Token');
        req.user = decoded;
        next();
    });
});

// Generar URL prefirmada para la carga de archivos
app.post('/generate-presigned-url', async (req, res) => {
    const { fileName, fileType } = req.body;

    const params = {
        Bucket: process.env.S3_BUCKET,
        Key: fileName,
        Expires: 60 * 5, // 5 minutos
        ContentType: fileType
    };

    try {
        const url = await s3.getSignedUrlPromise('putObject', params);
        res.json({ url });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Escuchar eventos MQTT para informar sobre el progreso
mqttClient.on('connect', () => {
    mqttClient.subscribe('fileUpload/progress');
});

mqttClient.on('message', (topic, message) => {
    if (topic === 'fileUpload/progress') {
        // Procesar mensaje y notificar al cliente si es necesario
        console.log('Progress:', message.toString());
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
