// config.js
require('dotenv').config();

module.exports = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // e.g., "maison-aura.database.windows.net"
    database: process.env.DB_NAME,
    port: 1433, // Standard SQL port
    options: {
        encrypt: true, // Required for Azure/Cloud
        trustServerCertificate: false // Set to false for secure cloud connections
    }
};