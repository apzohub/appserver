const CONF = require('../utils/conf');
const uuid = require('uuid').v4;
const { Pool } = require('pg');
const { Entity } = require('../model/entity');

const { Logger } = require('../utils/logger');
const logger = new Logger(module);//'RepoService'

const pool = new Pool({
    host: CONF.db.host,
    port: CONF.db.port,
    database: CONF.db.database,
    user: process.env.DB_USR,
    password: process.env.DB_PWD,
    ssl: CONF.db.ssl,
    max: CONF.db.pool.max, // set pool max size to 20
    idleTimeoutMillis: CONF.db.pool.idle, // close idle clients after 1 second
    connectionTimeoutMillis: CONF.db.pool.con_time_out, // return an error after 1 second if connection could not be established
    maxUses: CONF.db.pool.maxusrs, // close (and replace) a connection after it has been used 7500 times (see below for discussion)
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err)
    //process.exit(-1)
})

class RepoService{
    constructor(type){
        if(!type) throw new Error('Type cannot be null');
        this.type = type.name.toLowerCase();
    }

    async read(id){
        try{
            let res = await this.exec(Entity.getDML(this.type, Entity.READ), [id]);
            if(res.rowCount > 0)
            return res.rowCount > 0 ?res.rows[0]:null; //must be unique
        } catch (error) {
            logger.error(error);
            throw new Error(`Not Found ${id}`);
        }
    }

    async create(entity){
        try{
            Entity.init(entity);
            let res = await this.exec(Entity.getDML(this.type, Entity.CREATE), this.toArr(entity));
            if(res.rowCount == 1)
                return entity.id;
            throw `failed creation`;
        } catch (error) {
            console.error(error);
            throw new Error(`Failed creating entity ${entity.id}`);
        }
    }

    async update(entity){
        try{
            entity["updated"] = new Date();
            let res = await this.exec(Entity.getDML(this.type, Entity.UPDATE), [...this.toArr(entity)]);
            return res.rowCount;
        } catch (error) {
            logger.error(error);
            throw new Error(`Not Found ${entity.id}`);
        }
    }

    //entity could be object or id
    async delete(entity){
        const id = typeof entity === 'string'?entity:entity.id;
        try{
            let res = await this.exec(Entity.getDML(this.type, Entity.DELETE), [id]);
            return res.rowCount;
        } catch (error) {
            logger.error(error);
            throw new Error(`Not Found ${id}`);
        }
    }

    //logical delete
    async ldelete(entity){
        const id = typeof entity === 'string'?entity:entity.id;
        try{
            let res = await this.exec(Entity.getDML(this.type, Entity.LDELETE),
                  [Entity.DELETED, new Date(), id]);
            return res.rowCount;
        } catch (error) {
            logger.error(error);
            throw new Error(`Not Found ${id}`);
        }
    }

    async find(cond, params){
        try{
            let query = `${Entity.getDML(this.type, Entity.FIND)} ${cond?`where ${cond}`:''}`;
            let res = await this.exec(query, params);
            return res.rowCount > 0? res.rows: [];
        } catch (error) {
            logger.error(error);
            throw new Error("Not Found");
        }
    }

    async exec(query, params){
        const client = await pool.connect();
        try{
            logger.debug(query, params);
            // logger.silly(query, params);
            await client.query('BEGIN');
            let res = await client.query(query, params);
            await client.query('COMMIT');
            //logger.debug(res);
            return res;
        } catch (error) {
            logger.error(error);
            await client.query('ROLLBACK')
            throw error;
        }finally{
            client.release();
        }
    }

    toArr(params){
        let ret = [];
        //console.log(this.this.entity.cols, params);
        Entity.getCols(this.type).forEach(elm => ret.push(params[elm]));
        //console.log(ret)
        return ret; 
    }
}

module.exports = {
    RepoService
};