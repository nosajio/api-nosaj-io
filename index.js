require('dotenv').config();

const debug         = require('debug')('nosaj-api:index');
const error         = require('debug')('nosaj-api:error:index');
const request       = require('request');
const express       = require('express');
const api           = express();
const { allPosts }  = require('nosaj-md-parser');

const { PORT } = process.env;

// 
//  Register Routes
// 
api.get('/posts', handleGetPosts);
api.get('/medium', handleGetMedium)

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
//  Proxy published posts from medium
//
function handleGetMedium(req, res) {
  const postsEndpoint = 'https://medium.com/@nosajio/latest';
  const requestOptions = {
    url: postsEndpoint,
    headers: {
      'Accept': 'application/json'
    }
  }
  request(requestOptions, (err, response, body) => {
    const mediumJSON = parseMediumResponse(body);
    res.json(mediumJSON);
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
//  Take Medium entries object, clean up response, and return as JSON
//  @param {string} response
//  @return {object}
// 
function parseMediumResponse(response) {
  const replaceStr = '])}while(1);</x>';
  const cleanRes = response.replace(replaceStr, '');
  const json = JSON.parse(cleanRes);
  // Only return posts part of medium response
  const posts = Object.entries(json.payload.references.Post);
  return posts.map(([id, obj]) => obj);
}


// 
//  Expose the api on PORT
// 
api.listen(PORT, () => debug('http://localhost:%s', PORT));
