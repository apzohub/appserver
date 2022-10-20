const { Entity, Users } = require('../src/services/entity');
const {Table, RepoService} = require('../src/services/persistent');
const {IdGen} = require('../src/utils/id');

tab = new Table('users', 
        ['id', 'email', 'password', 'kv', 'state', 'created', 'updated'], 
        {
            create:'insert into users(id, email, password, kv, state, created, updated)\
                    values($1, $2, $3, $4, $5, $6, $7)',
            read:'select * from users where id=$1',
            update:'update users set id=$1, email=$2, password=$3, kv=$4, state=$5, created=$6, updated=$7 where id =$8',
            delete:'delete from users where id=$1',
        }
     );

let rs = new RepoService(tab);

let testCreate = async (entity)=>{
    console.log('testCreate')
    try{
        let ret = await rs.create(entity);
        console.log(`created: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };
}

let testCreate2 = (entity)=>{
    console.log('testCreate2')
    rs.create(entity).then((ret) => console.log(`created: ${JSON.stringify(ret)}`));
}

let testFind = async ()=>{
    console.log('testFind')
    try{
        let ret = await rs.find("select * from users");
        console.log(`testFind: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };
}

let testFind2 = async (q)=>{
    console.log('testFind')
    try{
        let ret = await rs.find(q);
        console.log(`testFind: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };
}

let testFindByEmail = async (email)=>{
    console.log('testFindByEmail')
    try{
        let ret = await rs.find("select * from users where email=$1", [email]);
        console.log(`testFindByEmail: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };
}

let testRead = async (id)=>{
    console.log('testRead')
    try{
        let ret = await rs.read(id);
        console.log(`testRead: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };
}

let testUpdate = async (id)=>{
    console.log('testUpdate')
    try{
        let entity = await rs.read(id);
        if(!entity) throw new Error(`Not Found ${id}`);
        entity['state'] = Entity.ACTIVE;
        let ret = await rs.update(entity);
        console.log(`testUpdate: ${JSON.stringify(ret)}`);
        let ret2 = await rs.read(id);
        console.log(`testRead: ${JSON.stringify(ret2)}`);
    }catch(e){
        console.error(e)
    };
}

let testDelete = async (p)=>{
    console.log('testDelete')
    try{
        let ret = await rs.delete(p);
        console.log(`testDelete: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };
}

let testLDelete = async (p)=>{
    console.log('testLDelete')
    try{
        let ret = await rs.ldelete(p);
        console.log(`testLDelete: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };
}

console.log('/////////////');
let id = IdGen.strId();
let email = id + '@bar.com';
testCreate(new Users(email, 'xyz'));
// testCreate2(new Users(email, 'xyz'));
testFind2(`select * from users where email='xyz'`);
testFindByEmail(email);
testUpdate('112a123f-9606-4bdb-9671-6ccc83864df9');
testRead('112a123f-9606-4bdb-9671-6ccc83864df');
testLDelete(id);
testRead(id);
testDelete(id);
testRead(id); 