const CONF = require('../utils/conf');
const logger = require('../utils/logger');
const uuid = require('uuid').v4;
const { Pool } = require('pg');


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
    constructor(tab){
        this.tab = tab;
    }

    async read(id){
        const client = await pool.connect();
        try{
            let res = await client.query("select * from users");
            return res.rows.length > 0 ?res.rows[0]:null;
        } catch (error) {
            console.error(error)
            throw new Error("Not Found");
        }finally{
            client.release();
        }
    }

    async create(entity){
        return this.exec(entity);
    }

    async exec(entity){
        const client = await pool.connect();
        try{
            let res = await client.query("insert into users(id, email) values(?, ?)", entity);
            return res.rows.length > 0 ?res.rows[0]:null;
        } catch (error) {
            console.error(error)
            throw new Error("Not Found");
        }finally{
            client.release();
        }
    }

    async update(entity){
        const client = await pool.connect();
        try{
            let res = await client.query("insert into users(id, email) values(?, ?)", entity);
            return res.rows.length > 0 ?res.rows[0]:null;
        } catch (error) {
            console.error(error)
            throw new Error("Not Found");
        }finally{
            client.release();
        }
    }

    async delete(entity){
        const client = await pool.connect();
        try{
            let res = await client.query("insert into users(id, email) values(?, ?)", entity);
            return res.rows.length > 0 ?res.rows[0]:null;
        } catch (error) {
            console.error(error)
            throw new Error("Not Found");
        }finally{
            client.release();
        }
    }

    async find(query, params){
        const client = await pool.connect();
        try{
            let res = await client.query("insert into users(id, email) values(?, ?)", entity);
            return res.rows.length > 0 ?res.rows[0]:null;
        } catch (error) {
            console.error(error)
            throw new Error("Not Found");
        }finally{
            client.release();
        }
    }


    async dbtest(){

        const client = await pool.connect();
        try {
            
    
            let id = uuid();
            let res = await client.query("INSERT INTO users (id, email) VALUES ($1, $2)",
              [id, id+'@bar.com']
            );
            console.log(`Added ${res}`);
    
            res = await client.query("select * from users");
            console.log(`data: ${JSON.stringify(res.rows)}`);
          } catch (error) {
            console.error(error)
          }finally{
            client.release();
          }
    }
    
    async dbtestTrx(){
    
        const client = await pool.connect();
        try {
            await client.query('BEGIN')
    
            let id = uuid();
            let res = await client.query(
              "INSERT INTO users (id, email) VALUES ($1, $2)",
              [id, id+'@bar.com']
            );
            console.log(`Added ${res}`);
    
            res = await client.query("select * from users");
            console.log(`data: ${JSON.stringify(res.rows)}`);
    
            await client.query('COMMIT')
          } catch (error) {
            console.error(error);
            await client.query('ROLLBACK')
            throw error;
          }finally{
            client.release();
          }
    }
}



/* let rs = new RepoService();
rs.dbtest();
rs.dbtestTrx(); */

module.exports = RepoService;