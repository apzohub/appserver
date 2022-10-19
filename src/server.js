const CONF = require('./utils/conf');
const fs = require('fs');
const https = require('https');
const privateKey  = fs.readFileSync('etc/cert/localhostkey.pem', 'utf8');
const certificate = fs.readFileSync('etc/cert/localhostcert.pem', 'utf8');

const cert = {key: privateKey, cert: certificate};

const app = require('./app');

const HOST = CONF.app.host || 'localhost';
const PORT = CONF.app.port || '8443';

let server = https.createServer(cert, app);
server.listen(PORT, HOST, () => {
    console.log(`Server started on https://${HOST}:${PORT}`)
});

//process error handlers
const uncaughtErr = (error) => {
    console.error(error);
    if (server) {
      server.close(() => {
        console.info('Server closed');
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
};
  
process.on('uncaughtException', uncaughtErr);
process.on('unhandledRejection', uncaughtErr);
  
process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) {
      server.close();
    }
});

