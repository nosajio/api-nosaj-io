/**
 * Check for cover image(s) on the assets server
 */

const axios = require('axios');

const coverUrl = filename => `${process.env.COVERS}/${filename}`;
 
const searchTypes = ['svg', 'png', 'gif', 'jpg'];

const findCovers = async slug => {
  // First, check which covers are available
  const requests = searchTypes.map(t => {
    const url = coverUrl(`${slug}.${t}`);
    const request = axios.get( url, { validateStatus: s => s < 500 } );
    return request;
  });
  const responses = await Promise.all(requests);
  // Just output urls that returned a 200
  const existingUrls = responses.filter(res => res.status === 200).map(({ config }) => config.url);
  return existingUrls
}
 
module.exports = { findCovers }