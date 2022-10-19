const winston = require('winston');
// const DailyRotateFile = require('winston-daily-rotate-file');

const logger = winston.createLogger({
    level: process.env.LOG,
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        // new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'app.log' }),
        // new DailyRotateFile(opts)
    ],
});

if (process.env.NODE_ENV == 'dev') {
    logger.add(new winston.transports.Console());
}


module.exports = logger;