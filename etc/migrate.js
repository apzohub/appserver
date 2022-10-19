const { Liquibase, LiquibaseConfig, LiquibaseLogLevels, POSTGRESQL_DEFAULT_CONFIG } = require('liquibase');

const inst = new Liquibase({
    ...POSTGRESQL_DEFAULT_CONFIG,
    changeLogFile: 'etc/db.xml',
    url: 'jdbc:postgresql://localhost:5252/apdb',
    username: 'apusr',
    password: 'a',
    liquibaseSchemaName: 'public',
    logLevel: LiquibaseLogLevels.Off,
  });

inst.update();