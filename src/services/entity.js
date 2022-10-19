const {Id} = require('../utils/id');

//Base Entity
class Entity{
    id;
    kv;    //json
    state;      //ACT - active, INA - inactive, DEL - deleted
    created;
    updated;

    constructor(kv){
        this.kv=kv;
        Entity.init(this);
    }

    static init(entity){
        entity.id=Id.uuid();
        entity.state=Entity.INACTIVE;
        const date = new Date();
        entity.created=date;
        entity.updated=date;
    }

    //state
    static ACTIVE='ACT'
    static INACTIVE='INA';  //if the created & updated dates are same 
                            //then the entity is state is created o/w entity
                            //has been inactivated
    static DELETED='DEL';   //logically deleted
}

class Users extends Entity{
    email;
    password;
    constructor(email, password, kv){
        super(kv);
        this.email=email;
        this.password=password;
    }
}

module.exports = {
    Entity,
    Users
};