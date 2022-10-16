const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
//const timeout = require('connect-timeout')

const methodOverride = require('method-override');

// console.log(process.env);
const env = process.env.NODE_ENV; // 'dev' or 'prod'

const app = express();

//https://expressjs.com/en/resources/middleware/timeout.html
// app.use(timeout('5s'))
app.use(express.json());
app.use(express.raw()) 
app.use(express.urlencoded({ extended: false }));

//Security
app.use(helmet());
app.disable('x-powered-by');
app.disable('etag');

// cors
if(process.env.CORS == 'true'){
  var corsOpt = {
    origin: process.env.WEBAPP_URL
  }
  app.use(cors(corsOpt)); 
  //app.options('*', cors(corsOpt));
  /* app.options('/*', cors(corsOpt), (req, res) => {
    res.sendStatus(200);
  });*/
}
/* 
  app.use((req, res, next) => {
    console.log('option', req.headers);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Methods","GET, POST, PATCH, PUT, DELETE, OPTIONS");
    next();
  });
  app.options('/*', (req, res) => {
    res.sendStatus(204);
  });
*/

//session
let sess = {
  secret: 'ap whildcat',
  resave: false,
  saveUninitialized: false,
  name: 'sessionId',
  cookie: {}
}

if (env === 'prod') {
  app.set('trust proxy', 1);
  sess.cookie.secure = true; 
  sess.httpOnly = true;
}
app.use(session(sess));

//simple req logger - use morgan instead for example
app.use((req, res, next)=>{
  if(process.env.LOG == 'DEBUG'){
    console.log(req.method, ' ', req.url);
  }
  next();
});

//static files
app.use(express.static(path.join(__dirname, 'public')));

app.use('/favicon.ico|/robots.txt', (req, res) => {
  res.status(404).send(null);
});



//OpenAPI / Swagger
if(process.env.OPEN_API === 'true'){
  const openapi = require('./services/openapi');
  app.use('/', openapi);
}

//GraphQL
if(process.env.GRAPHQL === 'true'){

  const { graphqlHTTP } = require('express-graphql');

  const GQLSchema = require('./services/graphql');

  app.use('/gql', graphqlHTTP({
    schema: GQLSchema,
    graphiql: true,
  }));
}


//Auth
/* app.use((req, res, next)=>{
  if(req.path.startsWith('/api')){
    return passport.authenticate('session');
  }
  next();
}) */
// app.use(passport.authenticate('session'));

const auth = require('./auth/auth');
app.use('/', auth);

/**
 * Custom routes
 * Update/Replace services/routes.js with the required routes.
 * TODO: create npx command to use this as template stating point
 */
const routes = require('./services/routes');
app.use('/', routes);


// Error handlers
app.use((req, res, next) => {
  res.status(404).send({err:"Not Found!"});
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({err:'Opps something went wrong!'});
});

module.exports = app;