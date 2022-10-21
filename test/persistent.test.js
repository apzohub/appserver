const { Entity, Users } = require('../src/services/entity');
const {Table, RepoService} = require('../src/services/persistent');
const {IdGen} = require('../src/utils/id');

tab = new Table('users', 
        ['id', 'email', 'password', 'kv', 'state', 'created', 'updated']
      );

const rs = new RepoService(tab);

const id = IdGen.strId();
const email = id + '@bar.com';

const testCreate = async (entity)=>{
    try{
        let ret = await rs.create(entity);
        console.log(`created: ${JSON.stringify(ret)}`);
        ret = await rs.read(entity.id);
        if(!ret) throw new Error(`Not Found ${id}`);
    }catch(e){
        console.error(e)
    };
}

const testCreate2 = (entity)=>{
    console.log('testCreate2')
    rs.create(entity).then((ret) => console.log(`created: ${JSON.stringify(ret)}`));
}

const testFind = async ()=>{
    console.log('testFind')
    try{
        let ret = await rs.find("");
        console.log(`testFind: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };
}

const testFind2 = async (q)=>{
    console.log('testFind')
    try{
        let ret = await rs.find(q);
        console.log(`testFind: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };
}

const testFindByEmail = async (email)=>{
    console.log('testFindByEmail')
    try{
        let ret = await rs.find("email=$1", [email]);
        console.log(`testFindByEmail: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };
}

const testRead = async (id)=>{
    console.log('testRead')
    try{
        let ret = await rs.read(id);
        console.log(`testRead: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };
}

const testUpdate = async (id)=>{
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

const testDelete = async (p)=>{
    console.log('testDelete')
    try{
        let ret = await rs.delete(p);
        console.log(`testDelete: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };
}

const testLDelete = async (p)=>{
    console.log('testLDelete')
    try{
        let ret = await rs.ldelete(p);
        console.log(`testLDelete: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };
}

const testAll = async () =>{
    let entity = new Users(email, 'xyz');
    const id = entity.id;
    console.log('testCreate->')
    try{
        let ret = await rs.create(entity);
        console.log(`created: ${JSON.stringify(ret)}`);
        ret = await rs.read(entity.id);
        if(!ret) throw new Error(`Not Found ${id}`);
    }catch(e){
        console.error(e)
    };

    console.log('testRead->')
    try{
        let ret = await rs.read(id);
        console.log(`read: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };

    console.log('testFind')
    try{
        let ret = await rs.find("");
        console.log(`found: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };

    console.log('testFind')
    try{
        let ret = await rs.find(`email='xyz'`);
        console.log(`found: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };

    console.log('testFindByEmail')
    try{
        let ret = await rs.find("email=$1", [email]);
        console.log(`foundByEmail: ${JSON.stringify(ret)}`);
    }catch(e){
        console.error(e)
    };

    console.log('testUpdate')
    try{
        let entity = await rs.read(id);
        if(!entity) throw new Error(`Not Found ${id}`);
        entity['state'] = Entity.ACTIVE;
        let ret = await rs.update(entity);
        console.log(`updated: ${JSON.stringify(ret)}`);
        let ret2 = await rs.read(id);
        console.log(`read: ${JSON.stringify(ret2)}`);
    }catch(e){
        console.error(e)
    };
    
    console.log('testLDelete')
    try{
        let ret = await rs.ldelete(id);
        console.log(`Ldeleted: ${JSON.stringify(ret)}`);
        let ret2 = await rs.read(id);
        console.log(`read: ${JSON.stringify(ret2)}`);
    }catch(e){
        console.error(e)
    };

    console.log('testDelete')
    try{
        let ret = await rs.delete(id);
        console.log(`deleted: ${JSON.stringify(ret)}`);
        let ret2 = await rs.read(id);
        console.log(`read: ${JSON.stringify(ret2)}`);
    }catch(e){
        console.error(e)
    };
}

console.log('/////////////');
// testCreate(new Users(email, 'xyz'));
// testCreate2(new Users(email, 'xyz'));
/* testFind2(`select * from users where email='xyz'`);
testFindByEmail(email);
testUpdate('112a123f-9606-4bdb-9671-6ccc83864df9');
testRead('112a123f-9606-4bdb-9671-6ccc83864df');
testLDelete(id);
testRead(id);
testDelete(id);
testRead(id);  */

// testAll();

let entity = new Users();
