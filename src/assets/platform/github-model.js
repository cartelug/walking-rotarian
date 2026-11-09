import {cleanText, webURL} from './model.js';

export const JOURNEY_NAMES = {
  'Walk for Education': 'walk-for-education',
  'Faith in Motion': 'faith-in-motion',
  'Nakivale to Makerere peace walk': 'peace-walk-nakivale-makerere',
  'General update': '',
};
export const SOCIAL_HOSTS = {
  facebook: ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.watch'],
  instagram: ['instagram.com', 'www.instagram.com'],
  tiktok: ['tiktok.com', 'www.tiktok.com'],
  linkedin: ['linkedin.com', 'www.linkedin.com'],
  youtube: ['youtube.com', 'www.youtube.com', 'youtu.be'],
  x: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'],
};

export function validateSiteSettings(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Website settings are missing.');
  const email = cleanText(input.email, 254);
  const whatsapp = cleanText(input.whatsapp, 30).replace(/[+\s()-]/g, '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid public contact email.');
  if (!/^[1-9]\d{7,14}$/.test(whatsapp)) throw new Error('Use a WhatsApp number with its country code.');
  if (!Object.values(JOURNEY_NAMES).includes(input.currentJourney)) throw new Error('Choose a valid default journal journey.');
  const socials = {};
  for (const [name, hosts] of Object.entries(SOCIAL_HOSTS)) {
    const value = webURL(input.socials?.[name] || '');
    if (value) {
      const url = new URL(value);
      if (url.protocol !== 'https:' || !hosts.includes(url.hostname)) throw new Error('Use the complete HTTPS ' + name + ' account link.');
    }
    socials[name] = value;
  }
  return {email, whatsapp, currentJourney: input.currentJourney, socials};
}

// These addresses contain public content only. GitHub authenticates the publisher
// and receives the final submission; no repository credential enters this page.
export function githubFormURL(repository, template, fields = {}) {
  if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/?$/.test(repository)) throw new Error('The GitHub publishing address is invalid.');
  if (!['journal.yml', 'product.yml', 'progress.yml', 'connections.yml'].includes(template)) throw new Error('Unknown publishing form.');
  const url = new URL(repository.replace(/\/$/, '') + '/issues/new');
  url.searchParams.set('template', template);
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && String(value)) url.searchParams.set(key, String(value));
  }
  if (url.href.length > 7600) throw new Error('This story is too long to carry to GitHub in a link. Copy the text, open the full publishing form and paste it into Story.');
  return url.href;
}
