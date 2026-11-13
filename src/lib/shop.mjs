import fs from 'node:fs';
import {site} from '../data/site.mjs';
import {validateProduct, SHOP_CATEGORIES, money} from '../assets/platform/shop-model.js';
import {esc, rel, img} from './util.mjs';

export function shopData({includeHidden = false} = {}) {
  const data = JSON.parse(fs.readFileSync(new URL('../data/shop.json', import.meta.url), 'utf8'));
  const products = data.products.map(p => ({...validateProduct(p, data.currency), ...(Number.isSafeInteger(p.sourceIssue) && p.sourceIssue > 0 ? {sourceIssue:p.sourceIssue} : {})}));
  if (new Set(products.map(p => p.id)).size !== products.length) throw new Error('Shop product identifiers must be unique.');
  return {...data, products: products.filter(p => includeHidden || p.status !== 'hidden'), whatsapp: site.whatsapp};
}

export function productArt(product, logo) {
  const shapes = {
    shirt: '<path d="m105 80 48-22q27 23 54 0l48 22 47 55-38 29-23-24v132H119V140l-23 24-38-29z" fill="#edf0e9" stroke="#30484a" stroke-width="3"/><path d="M153 58q27 42 54 0" fill="none" stroke="#30484a" stroke-width="3"/>',
    cap: '<path d="M79 190q-3-112 103-112 97 0 103 112z" fill="#1c3943" stroke="#152a34" stroke-width="3"/><path d="M82 190q-29 17-44 37 143 30 268-16l-21-21z" fill="#c3a56e" stroke="#152a34" stroke-width="3"/><path d="M182 80q-35 41-34 110m34-110q40 34 42 110" fill="none" stroke="#608087" stroke-width="2"/>',
    bottle: '<rect x="145" y="41" width="70" height="29" rx="8" fill="#c3a56e" stroke="#30484a" stroke-width="3"/><path d="M148 70h64v24q24 13 24 40v131q0 20-22 20h-68q-22 0-22-20V134q0-27 24-40z" fill="#e4e9e2" stroke="#30484a" stroke-width="3"/><path d="M136 149h88v88h-88z" fill="#f6f1e6"/>',
    book: '<path d="m97 72 144-14 20 212-144 14z" fill="#c3a56e" stroke="#30484a" stroke-width="3"/><path d="M105 73h145v204H105z" fill="#1c3943" stroke="#30484a" stroke-width="3"/><path d="M116 82v185" stroke="#c3a56e" stroke-width="2"/><path d="M137 225h81m-81 12h61" stroke="#c3a56e" stroke-width="3"/>',
    tote: '<path d="M139 106V83q0-50 41-50t41 50v23" fill="none" stroke="#30484a" stroke-width="14"/><path d="m93 100-12 179h198l-12-179z" fill="#e8deca" stroke="#30484a" stroke-width="3"/><path d="M96 113h168" stroke="#c3a56e" stroke-width="2"/>',
  };
  const markY = product.illustration === 'cap' ? 123 : 135;
  const patch = ['cap', 'book'].includes(product.illustration) ? `<rect x="153" y="${markY - 6}" width="54" height="68" rx="5" fill="#f3efe6"/>` : '';
  return `<svg viewBox="0 0 360 320" role="img" aria-label="${esc(product.title)} illustration"><ellipse cx="180" cy="286" rx="112" ry="10" fill="#182b3310"/>${shapes[product.illustration]}${patch}<image href="${esc(logo)}" x="160" y="${markY}" width="40" height="56" preserveAspectRatio="xMidYMid meet"/></svg>`;
}

export function productCard(product, page = '/shop/') {
  const id = 'product-' + product.id;
  const concept = product.image.match(/\/assets\/img\/(collection-[a-z-]+)-960\.webp$/)?.[1];
  const options = (name, label, values) => values.length ? `<div class="wr-field"><label for="${id}-${name}">${label}</label><select id="${id}-${name}" name="${name}"><option value="">Choose later</option>${values.map(v => `<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select></div>` : '';
  return `<article class="wr-product" data-product="${esc(product.id)}" data-category="${esc(product.category)}" id="${id}">
    <div class="wr-product__visual">${concept ? img(concept,{ctx:page,alt:product.title+' collection concept',sizes:'(min-width: 1000px) 30vw, (min-width: 768px) 45vw, 100vw'}) : product.image ? `<img src="${esc(product.image.startsWith('/') ? rel(page, product.image) : product.image)}" alt="${esc(product.title)}" width="960" height="960" loading="lazy">` : productArt(product, rel(page, '/assets/img/logo-ink-160.webp'))}<span>${concept || !product.image ? 'Collection concept' : esc(SHOP_CATEGORIES[product.category])}</span></div>
    <div class="wr-product__details"><p class="eyebrow">${esc(SHOP_CATEGORIES[product.category])}</p><h2>${esc(product.title)}</h2><p>${esc(product.description)}</p>
    <p class="wr-product__price">${product.status === 'sold-out' ? 'Currently unavailable' : product.status === 'available' ? esc(money(product.price, product.currency)) : 'Price & availability on request'}</p>
    <form data-shop-add="${esc(product.id)}"><div class="wr-product__options">${options('size', 'Preferred size', product.sizes)}${options('colour', 'Preferred colour', product.colours)}<div class="wr-field"><label for="${id}-quantity">Quantity</label><input id="${id}-quantity" name="quantity" type="number" inputmode="numeric" min="1" max="99" step="1" value="1" required></div></div><button class="wr-action wr-action--primary" type="submit"${product.status === 'sold-out' ? ' disabled' : ''}>${product.status === 'available' ? 'Add to order list' : 'Add to enquiry'}</button><p class="wr-muted" data-product-status role="status"></p></form></div>
  </article>`;
}
