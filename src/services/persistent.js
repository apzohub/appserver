const CONF = require('../utils/conf');
const uuid = require('uuid').v4;
const { Pool } = require('pg');
const { Entity } = require('./entity');

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

class Table{
    static CREATE='create';
    static READ='read';
    static UPDATE='update';
    static DELETE='delete';
    name;
    cols;
    dmls;
    constructor(name, cols){
        this.name = name; 
        this.cols = cols;
        this.dmls = Table.init(name, cols);
    }

    getDML(type){
        return this.dmls[type];
    }

    static init(name, cols){
        let ins='', set='', values='';
        for(let i=1; i<=cols.length; i++){
            if(i > 1) {
                ins += ','
                values += ',';
                set += ',';
            }
            ins += `${cols[i-1]}`;
            values += `$${i}`;
            set += `${cols[i-1]}=$${i}`;
        }
        
        const dmls = {
            create:`insert into ${name}(${ins}) values(${values})`,
            read:`select * from ${name} where id=$1`,
            update:`update ${name} set ${set} where id=$1`,
            delete:`delete from ${name} where id=$1`,
        }
        //console.log(dmls);
        return dmls;
    }
}

class RepoService{
    constructor(tab){
        this.tab = tab;
    }

    async read(id){
        try{
            let res = await this.exec(tab.getDML(Table.READ), [id]);
            return res.rowCount > 0 ?res.rows[0]:null; //must be unique
        } catch (error) {
            throw new Error(`Not Found ${id}`);
        }
    }

    async create(entity){
        try{
            Entity.init(entity);
            let res = await this.exec(tab.getDML(Table.CREATE), this.toArr(entity));
            //logger.debug(res);
            return res.rowCount;
        } catch (error) {
            throw new Error(`Failed creating entity ${entity.id}`);
        }
    }

    async update(entity){
        try{
            entity["updated"] = new Date();
            let res = await this.exec(tab.getDML(Table.UPDATE), [...this.toArr(entity)]);
            return res.rowCount;
        } catch (error) {
            throw new Error(`Not Found ${entity.id}`);
        }
    }

    //entity could be object or id
    async delete(entity){
        const id = typeof entity === 'string'?entity:entity.id;
        try{
            let res = await this.exec(tab.getDML(Table.DELETE), [id]);
            return res.rowCount;
        } catch (error) {
            throw new Error(`Not Found ${id}`);
        }
    }

    //logical delete
    async ldelete(entity){
        const id = typeof entity === 'string'?entity:entity.id;
        try{
            let res = await this.exec(`update ${tab.name} set state=$1, updated=$2 where id=$3`,
                  [Entity.DELETED, new Date(), id]);
            return res.rowCount;
        } catch (error) {
            throw new Error(`Not Found ${id}`);
        }
    }

    async find(cond, params){
        try{
            let query = `select * from ${this.tab.name} ${cond?`where ${cond}`:''}`;
            let res = await this.exec(query, params);
            return res.rowCount > 0? res.rows: [];
        } catch (error) {
            throw new Error("Not Found");
        }
    }

    async exec(query, params){
        const client = await pool.connect();
        try{
            logger.debug(query);//, params);
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
        //console.log(this.tab.cols, params);
        this.tab.cols.forEach(elm => ret.push(params[elm]));
        //console.log(ret)
        return ret; 
    }
}




module.exports = {
    Table,
    RepoService
};