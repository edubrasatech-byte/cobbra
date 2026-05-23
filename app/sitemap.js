export default function sitemap() {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://cobbra.ai';
  const now = new Date().toISOString();
  return [
    { url: BASE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/cadastro`, lastModified: now, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];
}
