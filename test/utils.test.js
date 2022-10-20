const {IdGen} = require('../src/utils/id');

console.log(IdGen.uuid());
console.log(IdGen.srndStr(32));
console.log(IdGen.rndStr(32));