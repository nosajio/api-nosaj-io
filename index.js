require('dotenv').config();

const debug          = require('debug')('nosaj-api:index');
const error          = require('debug')('nosaj-api:error:index');
const axios          = require('axios');
const express        = require('express');
const api            = express();
const { allPosts }   = require('nosaj-md-parser');
const { findCovers } = require('./auto-covers');

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
    // Add covers to post objects
    const coversRequests = visiblePosts.map(
      vp => findCovers(vp.slug).then(covers => Object.assign({}, vp, { covers }))
    );
    Promise.all(coversRequests)
      .catch(err => {
        console.error(err);
        res.status(500);
        res.end();
      })
      .then(responseWithCovers => {
        res.json(responseWithCovers);
      });
  });
}


//
//  Proxy published posts from medium
//
function handleGetMedium(req, res) {
  const postsEndpoint = 'https://medium.com/@nosajio/latest';
  const requestOptions = {
    url: postsEndpoint,
    method: 'get',
    headers: {
      'Accept': 'application/json'
    }
  }
  axios.request(requestOptions).then((response) => {
    const mediumJSON = parseMediumResponse(response.data);
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
