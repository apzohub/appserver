const {IdGen} = require('../utils/id');

//Base Entity
class Entity{
    id;
    kv;    //json
    state;      //ACT - active, INA - inactive, DEL - deleted
    created;
    updated;

    constructor(kv){
        this.kv=kv;
    }

    /* static init(entity){
        if(!entity.id) entity.id=IdGen.uuid();
        if(!entity.state) entity.state=Entity.INACTIVE;
        const date = new Date();
        entity.created=date;
        entity.updated=date;
    } */

    //state
    static ACTIVE='ACT'
    static INACTIVE='INA';  //if the created & updated dates are same 
                            //then the entity is state is created o/w entity
                            //has been inactivated
    static DELETED='DEL';   //logically deleted

    static CREATE='create';
    static READ='read';
    static UPDATE='update';
    static DELETE='delete';
    static cols={};
    static dmls={};

    static init(entity){
        if(!entity.id) entity.id=IdGen.uuid();
        if(!entity.state) entity.state=Entity.INACTIVE;
        const date = new Date();
        entity.created=date;
        entity.updated=date;
        if(!Entity.cols[entity.getName()])
            Entity._init(entity);
    }

    getName(){
        //N.B. must not uglify as we derive the name here
        return this.constructor.name.toLowerCase();
    }

    static getDML(type, sql){
        return Entity.dmls[type][sql];
    }

    static getCols(type){
        return Entity.cols[type];
    }

    static _init(entity){
        const name = entity.getName();
        const cols = Object.getOwnPropertyNames(entity);
        Entity.cols[name] = cols;
        // console.log(Entity.cols);
        
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
        
        Entity.dmls[name] = {
            create:`insert into ${name}(${ins}) values(${values})`,
            read:`select * from ${name} where id=$1`,
            update:`update ${name} set ${set} where id=$1`,
            delete:`delete from ${name} where id=$1`,
        }
        // console.log(Entity.dmls);
    }
}

class User extends Entity{
    email;
    password;
    constructor(email, password, kv){
        super(kv);
        this.email=email;
        this.password=password;
        Entity.init(this);//must be called
    }
}

module.exports = {
    Entity,
    User
};