export const getIssueImageUrl = (image) => {
  if (!image) return null;

  if (typeof image === 'string') {
    return image.startsWith('http') ? image : `/uploads/${image}`;
  }

  if (!image.url) return null;

  const apiBase = import.meta.env.VITE_API_URL || '/api';
  const imagePath = image.url.startsWith('/api/')
    ? image.url.slice(4)
    : image.url;
  const token = localStorage.getItem('token');

  return `${apiBase.replace(/\/$/, '')}${imagePath}?token=${encodeURIComponent(token || '')}`;
};
