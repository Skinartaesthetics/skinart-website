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
    // Google Places API (New) — replaces the deprecated Places API
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(PLACE_ID)}`;

    const response = await fetch(url, {
      headers: {
        'X-Goog-Api-Key'    : API_KEY,
        'X-Goog-FieldMask'  : 'reviews,rating,userRatingCount',
        'Content-Type'      : 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Places API error:', response.status, errText);
      return res.status(502).json({ error: 'Could not fetch reviews.' });
    }

    const data = await response.json();

    const reviews = (data.reviews || [])
      .filter(r => r.rating >= 4 && r.text && r.text.text && r.text.text.trim().length > 20)
      .map(r => ({
        author : r.authorAttribution?.displayName || 'Guest',
        rating : r.rating,
        text   : r.text.text.trim(),
        time   : r.relativePublishTimeDescription || '',
        photo  : r.authorAttribution?.photoUri || null,
      }));

    return res.status(200).json({
      reviews,
      rating : data.rating,
      total  : data.userRatingCount,
    });
  } catch (err) {
    console.error('Reviews fetch error:', err);
    return res.status(500).json({ error: 'Server error.' });
  }
}
