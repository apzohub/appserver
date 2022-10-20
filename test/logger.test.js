const { Logger } = require('../src/utils/logger');
const logger = new Logger('RepoService');//
const logger2 = new Logger('RepoService');//

logger.debug('test');
logger2.debug('test2');
logger2.debug('test2', 'foo');
logger2.info('test2', 'foo', 123);