import axios from 'axios';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const token = process.env.NETLIFY_TOKEN;
  const siteId = body.siteId; // Assuming siteId is sent in the request body

  const response = await axios.get(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const deploys = response.data;

  return { data: deploys };
});
