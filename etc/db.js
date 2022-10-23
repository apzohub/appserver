// liquibase migration
const { Liquibase, LiquibaseConfig, LiquibaseLogLevels, POSTGRESQL_DEFAULT_CONFIG } = require('liquibase');
const CONF = require('../src/utils/conf');

const inst = new Liquibase({
    ...POSTGRESQL_DEFAULT_CONFIG,
    changeLogFile: 'etc/db.xml',
    url: `jdbc:postgresql://${CONF.db.host}:${CONF.db.port}/${CONF.db.database}`,
    username: process.env.DB_USR,
    password: process.env.DB_PWD,
    liquibaseSchemaName: 'public',
    logLevel: LiquibaseLogLevels.Warning,
  });

inst.update();