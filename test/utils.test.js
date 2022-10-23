const {IdGen} = require('../src/utils/id');

console.log(IdGen.uuid());
console.log(IdGen.srndStr(32));
console.log(IdGen.rndStr(32));
const jwt = IdGen.jwt({email: 'foo@bar.com'});
console.log(jwt);
console.log(IdGen.jwt_verify(jwt));


