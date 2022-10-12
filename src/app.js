const express = require('express');
const session = require('express-session');
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

//https://expressjs.com/en/resources/middleware/cors.html
app.use(cors());
// app.options('*', cors()); 

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

app.use(express.static(path.join(__dirname, 'public')));


if(process.env.OPEN_API === 'true'){
  const openapi = require('./services/openapi');
  app.use('/', openapi);
}

if(process.env.GRAPHQL === 'true'){

  const { graphqlHTTP } = require('express-graphql');

  const GQLSchema = require('./services/graphql');

  app.use('/gql', graphqlHTTP({
    schema: GQLSchema,
    graphiql: true,
  }));
}

const routes = require('./routes');
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