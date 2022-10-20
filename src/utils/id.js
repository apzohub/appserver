const crypto = require("crypto");
const uuid = require('uuid').v4;

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
}

module.exports = {
    IdGen
};