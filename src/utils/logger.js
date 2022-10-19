const winston = require('winston');
const { combine, timestamp, label, printf } = winston.format;
// const DailyRotateFile = require('winston-daily-rotate-file');

class Logger{
    logger;
    constructor(ctx){
        this.logger = winston.createLogger({
            level: process.env.NODE_ENV=='dev'?'debug':'info',
            // format: winston.format.json(),
            format: combine(
                label({ label: ctx }),
                timestamp(),
                printf(({ level, message, label, timestamp }) => {
                    return `${timestamp} [${label}] ${level}: ${message}`;
                })),
            defaultMeta: { service: 'user-service' },
            transports: [
                // new winston.transports.File({ filename: 'error.log', level: 'error' }),
                new winston.transports.File({ filename: 'app.log' }),
                // new DailyRotateFile(opts)
            ],
        });
        
        if (process.env.NODE_ENV == 'dev') {
            this.logger.add(new winston.transports.Console());
        }
    }

    error(msg){
        this.logger.error(msg);
    }

    warn(msg){
        this.logger.warn(msg);
    }

    debug(msg, prm){
        this.logger.debug(msg, prm);
    }
    
    info(msg){
        this.logger.info(msg);
    }
}


module.exports = {
    Logger
};