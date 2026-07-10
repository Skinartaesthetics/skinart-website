// /api/reviews.js — Vercel serverless function
// Fetches Google Places reviews and caches for 24 hours.
// Required env variables (set in Vercel dashboard):
//   GOOGLE_PLACES_API_KEY  — your Google Places API key
//   GOOGLE_PLACE_ID        — your Google Place ID

export default async function handler(req, res) {
  const API_KEY  = process.env.GOOGLE_PLACES_API_KEY;
  const PLACE_ID = process.env.GOOGLE_PLACE_ID;

  if (!API_KEY || !PLACE_ID) {
    return res.status(500).json({ error: 'Missing API configuration.' });
  }

  // Cache at the CDN edge for 24 h; serve stale while revalidating
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(PLACE_ID)}` +
      `&fields=reviews,rating,user_ratings_total` +
      `&reviews_sort=newest` +
      `&key=${API_KEY}`;

    const response = await fetch(url);
    const data     = await response.json();

    if (data.status !== 'OK') {
      console.error('Places API error:', data.status, data.error_message);
      return res.status(502).json({ error: 'Could not fetch reviews.' });
    }

    const reviews = (data.result.reviews || [])
      .filter(r => r.rating >= 4 && r.text && r.text.trim().length > 20)
      .map(r => ({
        author : r.author_name,
        rating : r.rating,
        text   : r.text.trim(),
        time   : r.relative_time_description,
        photo  : r.profile_photo_url || null,
      }));

    return res.status(200).json({
      reviews,
      rating : data.result.rating,
      total  : data.result.user_ratings_total,
    });
  } catch (err) {
    console.error('Reviews fetch error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
}
