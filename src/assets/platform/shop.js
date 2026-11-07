import {h, readLocal, writeLocal, toast} from './client.js';
import {sanitiseCart, lineKey, cartSummary, quoteMessage, whatsappQuote, money} from './shop-model.js';

export async function renderShop(root, ctx) {
  const response = await fetch(ctx.href('/data/shop.json'), {cache: 'no-cache'});
  if (!response.ok) throw new Error('The shop could not be loaded. Please try again.');
  const shop = await response.json();
  const storageKey = 'wr.shop.cart';
  const stored = readLocal(storageKey, []);
  let cart = sanitiseCart(stored, shop.products);
  const status = root.querySelector('[data-shop-status]');
  const setStatus = (text, error = false) => {
    status.textContent = text;
    status.className = error ? 'wr-error wr-notice' : 'wr-muted';
  };

  function updateCart() {
    const summary = cartSummary(cart, shop.products, shop.currency);
    cart = summary.cart;
    root.querySelector('[data-shop-copy-panel]').hidden = true;
    const persisted = writeLocal(storageKey, cart);
    root.querySelector('[data-cart-count]').textContent = summary.quantity;
    root.querySelector('[data-cart-lines]').innerHTML = cart.length ? cart.map((line, index) => {
      const product = shop.products.find(p => p.id === line.productId);
      const details = [line.size, line.colour].filter(Boolean).join(' · ');
      return `<div class="wr-cart-line"><div><strong>${h(product.title)}</strong>${details ? `<span class="wr-muted">${h(details)}</span>` : ''}<span class="wr-muted">${product.status === 'available' ? h(money(product.price, shop.currency)) + ' each' : 'Quote requested'}</span></div><div class="wr-cart-line__controls"><button type="button" class="wr-quantity" data-cart-change="${index}" data-delta="-1" aria-label="Decrease ${h(product.title)} quantity"${line.quantity === 1 ? ' disabled' : ''}>−</button><span aria-label="Quantity">${line.quantity}</span><button type="button" class="wr-quantity" data-cart-change="${index}" data-delta="1" aria-label="Increase ${h(product.title)} quantity"${line.quantity === 99 ? ' disabled' : ''}>+</button><button type="button" class="wr-cart-remove" data-cart-remove="${index}" aria-label="Remove ${h(product.title)}">Remove</button></div></div>`;
    }).join('') : '<p class="wr-muted">Choose an item to start your enquiry.</p>';
    root.querySelector('[data-cart-summary]').innerHTML = cart.length ? `<p class="wr-cart-total">${summary.quoteCount ? 'Quote requested' : h(money(summary.subtotal, shop.currency))}</p>${summary.quoteCount && summary.subtotal ? `<p>Priced items ${h(money(summary.subtotal, shop.currency))}</p>` : ''}<p class="wr-muted">${summary.quoteCount ? 'The team will confirm item prices and availability.' : 'Item subtotal. Delivery and final availability are confirmed by the team.'}</p>` : '';
    root.querySelectorAll('[data-shop-whatsapp], [data-shop-copy]').forEach(button => button.disabled = !cart.length);
    root.querySelectorAll('[data-cart-change]').forEach(button => button.addEventListener('click', () => {
      const index = Number(button.dataset.cartChange);
      cart[index].quantity = Math.max(1, Math.min(99, cart[index].quantity + Number(button.dataset.delta)));
      updateCart();
    }));
    root.querySelectorAll('[data-cart-remove]').forEach(button => button.addEventListener('click', () => {
      cart.splice(Number(button.dataset.cartRemove), 1);
      updateCart();
      setStatus('Item removed from your list.');
    }));
    if (!persisted) setStatus('Your browser could not save the list. Keep this page open while you prepare your enquiry.', true);
  }

  root.querySelectorAll('[data-shop-add]').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(form);
    const quantity = Number(data.get('quantity'));
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return;
    const product = shop.products.find(p => p.id === form.dataset.shopAdd);
    if (!product || ['sold-out', 'hidden'].includes(product.status)) return;
    const line = {productId: product.id, size: data.get('size') || '', colour: data.get('colour') || '', quantity};
    const existing = cart.find(item => lineKey(item) === lineKey(line));
    if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
    else if (cart.length < 25) cart.push(line);
    else {setStatus('Your list has 25 different selections. Send this enquiry before starting another.', true); return;}
    updateCart();
    form.querySelector('[data-product-status]').textContent = 'Added to your list.';
    toast(product.title + ' added to your list.');
  }));

  const filter = () => {
    const query = root.querySelector('#shop-search').value.trim().toLowerCase();
    const category = root.querySelector('#shop-category').value;
    let count = 0;
    root.querySelectorAll('[data-product]').forEach(card => {
      const product = shop.products.find(p => p.id === card.dataset.product);
      const match = (!category || product.category === category) && (product.title + ' ' + product.description).toLowerCase().includes(query);
      card.hidden = !match;
      if (match) count++;
    });
    root.querySelector('[data-shop-results]').textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
    root.querySelector('[data-shop-empty]').hidden = count > 0;
  };
  root.querySelector('#shop-search').addEventListener('input', filter);
  root.querySelector('#shop-category').addEventListener('change', filter);

  const message = () => quoteMessage(cart, shop.products, {
    currency: shop.currency,
    note: root.querySelector('#shop-note').value,
    delivery: root.querySelector('#shop-delivery').value,
    page: location.origin + ctx.href('/shop/'),
  });
  root.querySelector('[data-shop-whatsapp]').addEventListener('click', () => {
    try {
      const anchor = document.createElement('a');
      anchor.href = whatsappQuote(shop.whatsapp, message());
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.click();
      setStatus('Your enquiry is prepared. Review it and press Send in WhatsApp.');
    } catch (error) {setStatus(error.message, true);}
  });
  root.querySelector('[data-shop-copy]').addEventListener('click', async () => {
    const text = message();
    const prepared = root.querySelector('#shop-prepared');
    prepared.value = text;
    root.querySelector('[data-shop-copy-panel]').hidden = false;
    setStatus('Your enquiry is ready below. You can select and copy the text.');
    try {
      await Promise.race([
        navigator.clipboard.writeText(text),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Clipboard unavailable')), 2000)),
      ]);
      setStatus('Enquiry copied. You can paste it into your conversation with the team.');
    } catch {
      setStatus('Select and copy the prepared enquiry below, or use Enquire on WhatsApp.');
    }
  });
  updateCart();
  if (JSON.stringify(cart) !== JSON.stringify(stored)) setStatus('Your list was refreshed using the latest product options and availability.');
  filter();
}
