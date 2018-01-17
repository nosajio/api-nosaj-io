require('dotenv').config();

const debug         = require('debug')('nosaj-api:index');
const error         = require('debug')('nosaj-api:error:index');
const express       = require('express');
const api           = express();
const { allPosts }  = require('nosaj-md-parser');

const { PORT } = process.env;

// 
//  Register Routes
// 
api.get('/posts', handleGetPosts);

// 
//  Just send all available posts to the requester as JSON
// 
function handleGetPosts(req, res) {
  // Add ?* to show posts after current date
  const showAllPosts = '*' in req.query;
  // Use parser to open posts in /writing dir
  allPosts()
  .then(posts => {
    const visiblePosts = posts.filter(p => showAllPosts || dateBefore(new Date(), new Date(p.date)));
    res.json(visiblePosts);
  });
}


// 
//  Is predicate before base? Both arguments must be Dates
//  @returns {bool}
// 
function dateBefore(base, predicate) {
  if (! (base instanceof Date) || ! (predicate instanceof Date)) {
    throw new TypeError('Both args should be dates');
  }
  return base >= predicate;
}


// 
//  Expose the api on PORT
// 
api.listen(PORT, () => debug('http://localhost:%s', PORT));
