const uuid = require('uuid').v4;

class Id{
    static strId(){
        return (1+Math.random()*4294967295).toString(16);
    }

    static uuid(){
        return uuid();
    }
}

module.exports = {
    Id
};