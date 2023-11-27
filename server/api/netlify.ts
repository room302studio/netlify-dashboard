import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';

const cacheFilePath = './netlify.cache.json';

export default defineEventHandler(async (event) => {
  const token = process.env.NETLIFY_TOKEN;

  // Check if cache file exists
  if (!fs.existsSync(cacheFilePath)) {
    fs.writeFileSync(cacheFilePath, JSON.stringify({}));
  }

  const cachedData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));

  // Check if cached data is still valid
  if (cachedData && cachedData.expiresAt > Date.now()) {
    return { data: cachedData.sites };
  }

  const response = await axios.get('https://api.netlify.com/api/v1/sites', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const sites = response.data;

  // Calculate MD5 hash of the response data
  const md5Hash = crypto.createHash('md5').update(JSON.stringify(sites)).digest('hex');

  // Save the response data and expiration time to cache file
  const cacheData = {
    sites,
    expiresAt: Date.now() + 3600000 // Cache expires in 1 hour
  };
  fs.writeFileSync(cacheFilePath, JSON.stringify(cacheData));

  return { data: sites };
});