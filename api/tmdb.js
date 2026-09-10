// Посередник між сайтом і TMDB.
// Ключ лежить у змінній оточення TMDB_KEY на Vercel і в код не потрапляє.

const ALLOWED = /^(discover\/(movie|tv)|search\/keyword|movie\/\d+|tv\/\d+)$/;

export default async function handler(req, res) {
  const { path, ...rest } = req.query;

  if (!path || !ALLOWED.test(path)) {
    return res.status(400).json({ error: 'bad path' });
  }

  const key = process.env.TMDB_KEY;
  if (!key) {
    return res.status(500).json({ error: 'TMDB_KEY is not set' });
  }

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(rest)) {
    if (typeof v === 'string') qs.set(k, v);
  }
  qs.set('api_key', key);

  try {
    const r = await fetch('https://api.themoviedb.org/3/' + path + '?' + qs.toString());
    const data = await r.json();

    // кеш на боці Vercel: однакові запити не б'ють по TMDB щоразу
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: 'upstream failed' });
  }
}
