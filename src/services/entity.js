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
    __cols__;
    __dmls__;
    getDML(type){
        return this.__dmls__[type];
    }

    init(){
        this.__cols__ = Object.getOwnPropertyNames(this).filter(e => e!=='__dmls__' && e!=='__cols__');
        console.log(this.__cols__);
        this.__dmls__ = Entity._init(this);
    }

    static _init(entity){
        //N.B. must not uglify as we derive the name here
        const name = entity.constructor.name.toLowerCase();
        let cols = entity.__cols__;

        if(!entity.id) entity.id=IdGen.uuid();
        if(!entity.state) entity.state=Entity.INACTIVE;
        const date = new Date();
        entity.created=date;
        entity.updated=date;
        
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
        console.log(dmls);
        return dmls;
    }
}

class Users extends Entity{
    email;
    password;
    constructor(email, password, kv){
        super(kv);
        this.email=email;
        this.password=password;
        super.init();//must be called
    }
}

module.exports = {
    Entity,
    Users
};