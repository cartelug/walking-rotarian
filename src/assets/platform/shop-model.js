import {cleanText, slugify, webURL} from './model.js';

export const SHOP_CATEGORIES = {
  clothing: 'Clothing',
  books: 'Books & publications',
  accessories: 'Accessories',
  other: 'Other items',
};

export function validateProduct(input, currency = 'UGX') {
  const id = slugify(input.id || input.title);
  const title = cleanText(input.title, 120);
  const status = input.status || 'enquiry';
  if (!id || !title) throw new Error('A product needs a name and identifier.');
  if (!Object.hasOwn(SHOP_CATEGORIES, input.category)) throw new Error('Choose a shop category.');
  if (!['enquiry', 'available', 'sold-out', 'hidden'].includes(status)) throw new Error('Choose a valid availability.');
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Choose a three-letter currency.');

  const hasPrice = input.price !== null && input.price !== undefined && input.price !== '';
  const price = hasPrice ? Number(input.price) : null;
  if (hasPrice && (!Number.isFinite(price) || price < 0 || price > 100000000)) {
    throw new Error('Enter a valid price or leave it blank for a quote.');
  }
  const minorDigits = currency === 'UGX' ? 0 : 2;
  if (hasPrice && Math.abs(price * 10 ** minorDigits - Math.round(price * 10 ** minorDigits)) > 0.00001) {
    throw new Error('Use whole shillings for UGX and at most two decimal places for other currencies.');
  }
  if (status === 'available' && !hasPrice) throw new Error('Available items need a confirmed price.');
  const choices = value => [...new Set((Array.isArray(value) ? value : []).map(v => cleanText(v, 60)).filter(Boolean))].slice(0, 16);

  return {
    id, title, category: input.category,
    description: cleanText(input.description, 1200), status, price, currency,
    image: webURL(input.image || '', {relative: true}),
    illustration: ['shirt', 'cap', 'book', 'bottle', 'tote'].includes(input.illustration) ? input.illustration : 'book',
    sizes: choices(input.sizes), colours: choices(input.colours),
  };
}

export function lineKey(line) {
  return JSON.stringify([line.productId, line.size || '', line.colour || '']);
}

export function sanitiseCart(lines, products) {
  const allowed = new Map(products.filter(p => !['hidden', 'sold-out'].includes(p.status)).map(p => [p.id, p]));
  const clean = new Map();
  for (const line of (Array.isArray(lines) ? lines : []).slice(0, 100)) {
    if (!line || typeof line !== 'object') continue;
    const product = allowed.get(line.productId);
    if (!product || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99) continue;
    const size = cleanText(line.size, 60);
    const colour = cleanText(line.colour, 60);
    if ((size && !product.sizes.includes(size)) || (colour && !product.colours.includes(colour))) continue;
    const item = {productId: product.id, size, colour, quantity: line.quantity};
    const key = lineKey(item);
    if (clean.has(key)) clean.get(key).quantity = Math.min(99, clean.get(key).quantity + item.quantity);
    else if (clean.size < 25) clean.set(key, item);
  }
  return [...clean.values()];
}

export function cartSummary(lines, products, currency = 'UGX') {
  const cart = sanitiseCart(lines, products);
  const factor = currency === 'UGX' ? 1 : 100;
  let subtotalMinor = 0;
  let quoteCount = 0;
  let quantity = 0;
  for (const line of cart) {
    const product = products.find(p => p.id === line.productId);
    quantity += line.quantity;
    if (product.status === 'available' && product.price !== null) {
      subtotalMinor += Math.round(product.price * factor) * line.quantity;
    } else quoteCount += line.quantity;
  }
  return {cart, quantity, quoteCount, subtotal: subtotalMinor / factor, currency};
}

export function money(value, currency = 'UGX') {
  return currency + ' ' + new Intl.NumberFormat('en-UG', {
    minimumFractionDigits: currency === 'UGX' ? 0 : 2,
    maximumFractionDigits: currency === 'UGX' ? 0 : 2,
  }).format(value);
}

export function quoteMessage(lines, products, {currency = 'UGX', note = '', delivery = '', page = ''} = {}) {
  const summary = cartSummary(lines, products, currency);
  if (!summary.cart.length) throw new Error('Choose an item before preparing an enquiry.');
  const text = ['Hello Walking Rotarian team,', '', 'I would like availability and a quote for these items:', ''];
  summary.cart.forEach((line, index) => {
    const product = products.find(p => p.id === line.productId);
    const details = [line.size && 'size ' + line.size, line.colour].filter(Boolean).join(', ');
    const price = product.status === 'available' && product.price !== null ? money(product.price * line.quantity, currency) : 'quote requested';
    text.push(`${index + 1}. ${product.title} × ${line.quantity}${details ? ' (' + details + ')' : ''} — ${price}`);
  });
  if (summary.quoteCount === 0) text.push('', 'Item subtotal: ' + money(summary.subtotal, currency));
  else if (summary.subtotal > 0) text.push('', 'Priced items subtotal: ' + money(summary.subtotal, currency));
  if (delivery) text.push('', 'Receiving items: ' + cleanText(delivery, 100));
  if (note.trim()) text.push('', 'My note: ' + cleanText(note, 600));
  text.push('', 'Please confirm availability, the final price, delivery costs and payment instructions.');
  if (page) text.push('', webURL(page, {empty: false}));
  return text.join('\n');
}

export function whatsappQuote(phone, message) {
  if (!/^\d{10,15}$/.test(String(phone))) throw new Error('The shop contact needs a valid international WhatsApp number.');
  return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
}
