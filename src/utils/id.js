const crypto = require("crypto");
const uuid = require('uuid').v4;
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { Logger } = require('../utils/logger');

const logger = new Logger(module);//'RepoService'

const privateKey  = fs.readFileSync('etc/cert/localhostkey.pem', 'utf8');
const SECRET = process.env.SECRET;
const AUDIENCE= process.env.AUDIENCE || '';
const ISSUER=process.env.ISSUER || '';
const opt = { expiresIn: '1h', audience: AUDIENCE, issuer: ISSUER }

const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const alphaLen = alpha.length;

class IdGen{
    static strId(){
        return (1+Math.random()*4294967295).toString(16);
    }

    static uuid(){
        return uuid();
    }

    static srndStr(size){
        return crypto.randomBytes(size/2).toString('hex');
    }

    
    static rndStr(size){
        let ret='';
        for ( let i = 0; i < size; i++ ) {
            ret += alpha.charAt(Math.floor(Math.random() * alphaLen));
        }
        return ret;
    }
    
    static jwt(data){
        //HMAC SHA256
        return jwt.sign(data, SECRET, opt); //expiresIn = 1hr => 60 * 60 sec
        // sign with RSA SHA256
        //return jwt.sign(data, privateKey, { expiresIn: 60 * 60 });
    }

    static jwt_verify(token){
        try{
            return jwt.verify(token, SECRET, opt);
        }catch(error){
            logger.error(error);
            return null;
        }
    }
}

module.exports = {
    IdGen
};