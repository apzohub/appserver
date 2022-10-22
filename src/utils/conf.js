const fs = require('fs');

const CONF = JSON.parse(fs.readFileSync('etc/config.json', 'utf8'));
// console.log(CONF);

module.exports = CONF;
