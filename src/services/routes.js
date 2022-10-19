/**
 * All routes must be define here, below is a place holder only
 */
const CONF = require('../utils/conf');
const router = require('express').Router();
// const joi = require('joi');

const { Logger } = require('../utils/logger');
const logger = new Logger('RepoService');

const asyncFn = require('../com');

/// Start - place holder
router.get('/user', asyncFn(async (req, res, next) => {
  const user = await getUserById(req.params.id)
  res.send(user)
}));


// GET method route
router.get('/', (req, res) => {
    res.send('GET request to the homepage')
});
  
// POST method route
router.post('/', (req, res) => {
    res.send('POST request to the homepage')
})
  
router.route('/book')
    .get((req, res) => {
      res.send('Get a random book')
    })
    .post((req, res) => {
      res.send('Add a book')
    })
    .put((req, res) => {
      res.send('Update the book')
    })

/// End - place holder    
  

module.exports = router;