const winston = require('winston');
const path = require('path');
const { combine, timestamp, label, printf } = winston.format;
// const DailyRotateFile = require('winston-daily-rotate-file');

class Logger{
    ctx;
    constructor(ctx, file){
        if(typeof ctx !== 'string') ctx = '-*-';
        this.ctx = ctx;
        Logger.init();
    }

    error(msg, ...prms){
        Logger.logger.error(`${this.ln()} - ${msg}`);
    }

    warn(msg, ...prms){
        Logger.logger.warn(`${this.ln()} - ${msg}`);
    }

    debug(msg, ...prms){
        Logger.logger.debug(`${this.ln()} - ${msg}`, prms);
    }
    
    info(msg, ...prms){
        Logger.logger.info(`${this.ln()} - ${msg}`);
    }

    ln(){
        let file = new Error().stack.split('\n')[3];
        let frags = file.split(path.sep);
        return `[${this.ctx}] (${frags[frags.length - 2]}/${frags.pop()}`;
    }

    static logger;
    static init(){
        Logger.logger = winston.createLogger({
            level: process.env.NODE_ENV=='dev'?'debug':'info',
            // format: winston.format.json(),
            format: combine(
                // label({ label: this.label(ctx, file) }),
                timestamp(),
                printf(({ level, message, label, timestamp }) => {
                    return `${timestamp} ${level}: ${message}`;
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
}


module.exports = {
    Logger
};