const fs = require('fs');

const CONF = JSON.parse(fs.readFileSync('etc/config.json', 'utf8'));

module.exports = CONF;
