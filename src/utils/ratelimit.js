const CONF = require('../utils/conf');

if(CONF.opt.rate_limit){
    console.log('setting rate limits');
    const rateLimit = require('express-rate-limit');
    const RedisStore = require("rate-limit-redis");
    const { createClient } = require("redis");
  
    
    const client = createClient();
    await client.connect();
    const limiter = rateLimit({
      windowMs: 1 * 60 * 1000,
      max: 100, 
      standardHeaders: true, 
      legacyHeaders: false, 
      store: new RedisStore({
        sendCommand: async (args) => client.sendCommand(args),
      }),
    });
    app.use(limiter);
}