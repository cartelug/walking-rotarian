/* The Walking Rotarian: small, optional helpers. The site reads fine without this file. */
(function () {
  "use strict";
  const doc = document;

  /* Opening the files straight from a folder (no web server): folder links need "index.html". */
  const fix = (href) => (location.protocol === "file:" && href && !/^(https?:|mailto:|tel:|#)/.test(href) ? href.replace(/\/(#|$)/, "/index.html$1") : href);
  if (location.protocol === "file:") {
    doc.querySelectorAll("a[href]").forEach((a) => a.setAttribute("href", fix(a.getAttribute("href"))));
  }

  /* Page loader: a short walk across the screen, then the page.
     Longer on the first page of a visit, brief after that. */
  const root = doc.documentElement;
  const pre = doc.querySelector(".preloader");
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let seen = false;
  try {
    seen = sessionStorage.getItem("wr-seen") === "1";
    sessionStorage.setItem("wr-seen", "1");
  } catch (e) { /* private mode: treat as a first visit */ }
  const reveal = () => {
    root.classList.add("is-ready");
    if (pre) {
      pre.classList.add("is-done");
      setTimeout(() => pre.remove(), 700);
    }
  };
  const minShow = 0;
  const whenLoaded = () => setTimeout(reveal, Math.max(0, minShow - performance.now()));
  if (doc.readyState !== "loading") whenLoaded();
  else doc.addEventListener("DOMContentLoaded", whenLoaded, { once: true });
  setTimeout(reveal, 5000); // never keep anyone waiting on a slow picture
  window.addEventListener("pageshow", (e) => { if (e.persisted) reveal(); });

  /* Calm portrait motion: only animate while visible, and pause in background tabs. */
  if (!calm && 'IntersectionObserver' in window) {
    const portraits = doc.querySelectorAll('.wr-opening__portrait, .wr-person__visual');
    const portraitObserver = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('is-visible', entry.isIntersecting)));
    portraits.forEach(el => portraitObserver.observe(el));
    doc.addEventListener('visibilitychange', () => root.classList.toggle('wr-paused', doc.hidden));
  }

  /* Header shadow once the page moves */
  const header = doc.querySelector(".site-header");
  if (header) {
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }


  /* Headlines: wrap each word so it can rise into place */
  if (!calm) {
    let n = 0;
    const split = (node) => {
      Array.from(node.childNodes).forEach((c) => {
        if (c.nodeType === 3) {
          const frag = doc.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(doc.createTextNode(t)); return; }
            const w = doc.createElement("span"); w.className = "w";
            const i = doc.createElement("span"); i.className = "w__i"; i.style.setProperty("--i", n++); i.textContent = t;
            w.appendChild(i); frag.appendChild(w);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1) split(c);
      });
    };
    doc.querySelectorAll(".hero--home h1, .page-head--art h1").forEach((h) => { n = 0; split(h); });
  }

  /* Hero figures count up once the page is ready */
  function countUp() {
    if (calm) return;
    doc.querySelectorAll(".hero__num").forEach((el) => {
      const text = el.textContent;
      const m = text.match(/(\d[\d,]*)/);
      if (!m) return;
      const end = Number(m[1].replace(/,/g, ""));
      const pre = text.slice(0, m.index), post = text.slice(m.index + m[1].length);
      el.innerHTML = "";
      const full = doc.createElement("span"); full.className = "visually-hidden"; full.textContent = text;
      const vis = doc.createElement("span"); vis.setAttribute("aria-hidden", "true");
      el.append(full, vis);
      const start = performance.now(), dur = 1800;
      const fmt = (v) => pre + Math.round(v).toLocaleString("en-US") + post;
      vis.textContent = fmt(0);
      const tick = (t) => {
        const k = Math.min(1, (t - start) / dur);
        vis.textContent = fmt(end * (1 - Math.pow(1 - k, 4)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  if (!calm && doc.querySelector(".hero__num")) {
    const t = setInterval(() => { if (root.classList.contains("is-ready")) { clearInterval(t); setTimeout(countUp, 500); } }, 100);
  }

  /* Scroll progress bar and a slow parallax on the hero picture */
  if (!calm) {
    const bar = doc.createElement("div"); bar.className = "progress"; bar.setAttribute("aria-hidden", "true");
    doc.body.appendChild(bar);
    const bg = doc.querySelector(".hero__bg");
    let queued = false;
    const paint = () => {
      queued = false;
      const max = doc.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty("--prog", max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
      if (bg && window.scrollY < window.innerHeight * 1.5) bg.style.setProperty("--py", (window.scrollY * 0.22).toFixed(1) + "px");
    };
    window.addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(paint); } }, { passive: true });
    paint();
  }

  /* Gentle reveal of sections as they scroll into view */
  if ("IntersectionObserver" in window && !calm) {
    const targets = doc.querySelectorAll(".chapter__main > *, .block .container > *:not(.filters), .cards > li, .jlist > li, .timeline > li, .notes-list > li, .medialist > li, .band--dark .container > *, .gallery-grid > *");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    targets.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) return; // already on screen: leave it be
      const sib = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty("--d", Math.min(sib % 3, 2) * 90 + "ms");
      el.classList.add("reveal");
      io.observe(el);
    });
  }

  /* Menu on small screens */
  const toggle = doc.querySelector(".menu-toggle");
  const panel = doc.getElementById("site-menu");
  if (toggle && panel) {
    const label = toggle.querySelector(".menu-toggle__label");
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      panel.classList.toggle("is-open", open);
      if (label) label.textContent = open ? "Close" : "Menu";
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    doc.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    panel.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });
    window.matchMedia("(min-width: 64rem)").addEventListener("change", (e) => {
      if (e.matches) setOpen(false);
    });
  }

  /* The journey thread: a fine line that follows how far down the chapters you have read */
  const thread = doc.querySelector("[data-thread]");
  if (thread) {
    const chapters = Array.from(thread.querySelectorAll("[data-chapter]"));
    let queued = false;
    const update = () => {
      queued = false;
      const r = thread.getBoundingClientRect();
      const mark = window.innerHeight * 0.45;
      const p = Math.max(0, Math.min(1, (mark - r.top) / r.height));
      thread.style.setProperty("--p", p.toFixed(4));
      chapters.forEach((c) => {
        const cr = c.getBoundingClientRect();
        c.classList.toggle("is-passed", cr.bottom < mark);
        c.classList.toggle("is-current", cr.top <= mark && cr.bottom >= mark);
      });
    };
    const queue = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();
  }

  /* Filters: journeys, timeline, gallery */
  doc.querySelectorAll("[data-filters]").forEach((bar) => {
    const list = doc.querySelector(bar.getAttribute("data-target"));
    if (!list) return;
    const items = Array.from(list.children);
    const noun = bar.getAttribute("data-noun") || "items";
    const count = bar.querySelector("[data-count]");
    const state = {};
    const buttons = Array.from(bar.querySelectorAll(".filter-btn"));
    if (list.id === 'gallery') {
      const collection = new URLSearchParams(location.search).get('collection');
      if (collection && buttons.some(button => button.dataset.value === collection)) {
        buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.value === collection)));
      }
    }
    buttons.forEach((b) => {
      if (b.getAttribute("aria-pressed") === "true") state[b.getAttribute("data-attr")] = b.getAttribute("data-value");
    });
    const apply = () => {
      let shown = 0;
      items.forEach((it) => {
        const ok = Object.keys(state).every((a) => {
          const v = state[a];
          if (v === "*") return true;
          return (it.getAttribute("data-" + a) || "").split(/\s+/).includes(v);
        });
        it.hidden = !ok;
        if (ok) shown += 1;
      });
      if (count) count.textContent = "Showing " + shown + " of " + items.length + " " + noun + ".";
    };
    buttons.forEach((b) =>
      b.addEventListener("click", () => {
        const a = b.getAttribute("data-attr");
        buttons.filter((x) => x.getAttribute("data-attr") === a).forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
        state[a] = b.getAttribute("data-value");
        apply();
      })
    );
    bar.hidden = false;
    apply();
  });

  /* Gallery viewer */
  const dataEl = doc.getElementById("gallery-data");
  const dlg = doc.getElementById("viewer");
  if (dataEl && dlg && typeof dlg.showModal === "function") {
    const data = JSON.parse(dataEl.textContent);
    const byId = {};
    data.forEach((d) => (byId[d.id] = d));
    const tiles = Array.from(doc.querySelectorAll(".tile"));
    const visible = () => tiles.filter((t) => !t.closest("[hidden]"));
    let opener = null;
    const add = (dl, k, v) => {
      if (!v) return;
      const row = doc.createElement("div");
      const dt = doc.createElement("dt");
      const dd = doc.createElement("dd");
      dt.textContent = k;
      if (typeof v === "string") dd.textContent = v;
      else dd.appendChild(v);
      row.append(dt, dd);
      dl.appendChild(row);
    };
    const show = (id) => {
      const d = byId[id];
      if (!d) return;
      const img = doc.getElementById("viewer-img");
      img.src = d.src;
      img.alt = d.alt;
      img.width = d.w;
      img.height = d.h;
      doc.getElementById("viewer-caption").textContent = d.caption;
      doc.getElementById("viewer-title").textContent = d.title;
      doc.getElementById("viewer-kind").textContent = d.kind + (d.artwork ? ": designed artwork, not a photograph" : "");
      const dl = doc.getElementById("viewer-dl");
      dl.textContent = "";
      add(dl, "Source", d.source);
      add(dl, "Credit", d.credit);
      add(dl, "Date", d.date);
      if (d.journey) {
        const a = doc.createElement("a");
        a.href = fix(d.journeyHref);
        a.textContent = d.journey;
        add(dl, "Journey", a);
      }
      add(dl, "Permission", d.permission);
      const vis = visible();
      const i = vis.findIndex((t) => t.getAttribute("data-id") === id);
      doc.getElementById("viewer-count").textContent = (i + 1) + " of " + vis.length;
      dlg.setAttribute("data-current", id);
    };
    const step = (dir) => {
      const vis = visible();
      const i = vis.findIndex((t) => t.getAttribute("data-id") === dlg.getAttribute("data-current"));
      const next = vis[(i + dir + vis.length) % vis.length];
      opener = next;
      show(next.getAttribute("data-id"));
    };
    tiles.forEach((t) =>
      t.addEventListener("click", (e) => {
        e.preventDefault();
        opener = t;
        show(t.getAttribute("data-id"));
        dlg.showModal();
        dlg.querySelector("[data-viewer-close]").focus();
      })
    );
    dlg.querySelector("[data-viewer-next]").addEventListener("click", () => step(1));
    dlg.querySelector("[data-viewer-prev]").addEventListener("click", () => step(-1));
    dlg.querySelector("[data-viewer-close]").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg) dlg.close();
    });
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    });
    dlg.addEventListener("close", () => {
      if (opener) opener.focus();
    });
  }


  /* Donate: builds a tidy WhatsApp message and opens it. No money moves on this site. */
  (function () {
    const pf = doc.querySelector("form.donate-form");
    if (!pf) return;
    const status = doc.getElementById("donate-status");
    const amt = pf.elements.amount;
    const chips = pf.querySelectorAll(".amt");
    // Key words in the message use a bold sans alphabet (Unicode), so they stand out in WhatsApp.
    const fancy = (t) => Array.from(t).map((c) => {
      const k = c.codePointAt(0);
      if (k >= 65 && k <= 90) return String.fromCodePoint(0x1d5d4 + k - 65);
      if (k >= 97 && k <= 122) return String.fromCodePoint(0x1d5ee + k - 97);
      if (k >= 48 && k <= 57) return String.fromCodePoint(0x1d7ec + k - 48);
      return c;
    }).join("");
    const clean = (t, n) => t.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, n);
    const money = (v) => { const n = Number(String(v).replace(/[\s,]/g, "")); return Number.isFinite(n) && n > 0 ? n : 0; };
    const showAmt = () => chips.forEach((c) => c.setAttribute("aria-pressed", String(money(amt.value) === Number(c.dataset.amt))));
    chips.forEach((c) => c.addEventListener("click", () => {
      pf.elements.currency.value = "UGX";
      amt.value = Number(c.dataset.amt).toLocaleString("en-US");
      showAmt();
      unfail(amt);
    }));
    amt.addEventListener("input", () => { showAmt(); unfail(amt); });
    pf.elements.name.addEventListener("input", () => unfail(pf.elements.name));
    amt.addEventListener("blur", () => { const n = money(amt.value); if (n) amt.value = n.toLocaleString("en-US"); });
    const unfail = (el) => {
      const f = el.closest(".field");
      f.classList.remove("is-invalid");
      const m = f.querySelector(".field__error"); if (m) m.remove();
      el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby");
    };
    const fail = (el, text) => {
      const f = el.closest(".field");
      f.classList.add("is-invalid");
      if (!f.querySelector(".field__error")) {
        const m = doc.createElement("p"); m.className = "field__error"; m.id = el.id + "-err"; m.textContent = "Error: " + text; f.appendChild(m);
      }
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", el.id + "-err");
    };
    pf.addEventListener("submit", (e) => {
      e.preventDefault();
      pf.querySelectorAll(".field.is-invalid").forEach((f) => { f.classList.remove("is-invalid"); const m = f.querySelector(".field__error"); if (m) m.remove(); });
      pf.querySelectorAll("[aria-invalid]").forEach((el) => { el.removeAttribute("aria-invalid"); el.removeAttribute("aria-describedby"); });
      status.textContent = ""; status.classList.remove("is-error");
      const name = clean(pf.elements.name.value, 80), note = clean(pf.elements.note.value, 200), n = money(amt.value);
      let first = null;
      if (!name) { fail(pf.elements.name, "please add your name."); first = pf.elements.name; }
      if (!n) { fail(amt, "enter an amount, for example 50,000."); first = amt; }
      if (first) { first.focus(); return; }
      const cur = pf.elements.currency.value === "USD" ? "USD" : "UGX";
      const lines = [
        "Hello Mbanda Shyaka,", "",
        "I would like to make a " + fancy("donation") + " to " + fancy("The Walking Rotarian") + ".", "",
        fancy("Name") + ": " + name,
        fancy("Donation amount") + ": " + cur + " " + n.toLocaleString("en-US"),
      ];
      if (note) lines.push(fancy("Note") + ": " + note);
      lines.push("", fancy("Every step has a story") + ".");
      const url = "https://wa.me/" + pf.getAttribute("data-wa") + "?text=" + encodeURIComponent(lines.join("\n"));
      const win = window.open(url, "_blank", "noopener");
      const p = doc.createElement("p");
      p.append("WhatsApp should open with your message ready. Nothing has been sent until you press Send there. If it did not open, ");
      const a = doc.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; a.textContent = "open it here"; p.append(a, ".");
      status.appendChild(p);
      if (!win) status.focus();
    });
  })();

  /* Enquiry form: says honestly what happened */
  doc.querySelectorAll("[data-pick]").forEach((a) =>
    a.addEventListener("click", () => {
      const s = doc.getElementById("f-type");
      if (s) s.value = a.getAttribute("data-pick");
    })
  );
  const form = doc.querySelector("form.enquiry");
  if (form) {
    const status = doc.getElementById("form-status");
    const button = form.querySelector('button[type="submit"]');
    const say = (kind, ...nodes) => {
      status.textContent = "";
      status.classList.toggle("is-error", kind === "error");
      nodes.forEach((n) => status.appendChild(typeof n === "string" ? Object.assign(doc.createElement("p"), { textContent: n }) : n));
      status.focus();
    };
    const clearErrors = () => {
      form.querySelectorAll(".field.is-invalid").forEach((f) => {
        f.classList.remove("is-invalid");
        const e = f.querySelector(".field__error");
        if (e) e.remove();
      });
      form.querySelectorAll("[aria-invalid]").forEach((el) => {
        el.removeAttribute("aria-invalid");
        el.removeAttribute("aria-describedby");
      });
    };
    const validate = () => {
      clearErrors();
      let first = null;
      form.querySelectorAll("[required]").forEach((el) => {
        let ok = el.type === "checkbox" ? el.checked : el.value.trim() !== "";
        if (ok && el.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        if (ok) return;
        const f = el.closest(".field");
        f.classList.add("is-invalid");
        const msg = doc.createElement("p");
        msg.className = "field__error";
        msg.id = el.id + "-err";
        msg.textContent = "Error: " + (el.type === "checkbox" ? "tick the box to continue." : el.type === "email" ? "enter a valid email address." : "this is needed.");
        f.appendChild(msg);
        el.setAttribute("aria-invalid", "true");
        el.setAttribute("aria-describedby", msg.id);
        if (!first) first = el;
      });
      if (first) {
        status.textContent = "";
        status.classList.add("is-error");
        const p = doc.createElement("p");
        p.textContent = "The message has not been sent. Check the marked fields.";
        status.appendChild(p);
        first.focus();
        return false;
      }
      status.textContent = "";
      return true;
    };
    const message = () => {
      const g = (n) => (form.elements[n] ? form.elements[n].value.trim() : "");
      const type = form.elements.type.options[form.elements.type.selectedIndex].text;
      const lines = ["Name: " + g("name"), "Email: " + g("email")];
      if (g("organisation")) lines.push("Organisation: " + g("organisation"));
      lines.push("About: " + type);
      if (g("where")) lines.push("Proposed date and place: " + g("where"));
      lines.push("", g("message"));
      return { subject: "Website enquiry: " + type, body: lines.join("\n") };
    };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validate()) return;
      if (form.elements.website && form.elements.website.value) {
        say("ok", "Thank you.");
        return;
      }
      const m = message();
      const endpoint = form.getAttribute("data-endpoint");
      const email = form.getAttribute("data-email");
      if (endpoint) {
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
        say("ok", "Sending your message…");
        fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
          .then((r) => {
            if (!r.ok) throw new Error("status " + r.status);
            form.reset();
            say("ok", "Delivered. The form service accepted your message, and the campaign team can now read it. Thank you.");
          })
          .catch(() => {
            const p = doc.createElement("p");
            p.append("Not delivered. The form service did not accept the message, and nothing was sent. What you typed is still here. Try again, or write to ");
            const a = doc.createElement("a");
            a.href = "mailto:" + email;
            a.textContent = email;
            p.append(a, ".");
            say("error", p);
          })
          .finally(() => {
            button.disabled = false;
            button.removeAttribute("aria-busy");
          });
        return;
      }
      // No form service: open the visitor's own email app, and say plainly that nothing is sent yet.
      const area = doc.createElement("textarea");
      area.readOnly = true;
      area.rows = 7;
      area.value = m.body;
      area.setAttribute("aria-label", "Your message, to copy");
      area.style.cssText = "width:100%;margin:.5rem 0";
      const p = doc.createElement("p");
      p.append("Nothing has been sent yet. Your email app should now open with the message ready. Press Send there. If nothing opened, copy the message below and send it to ");
      const a = doc.createElement("a");
      a.href = "mailto:" + email;
      a.textContent = email;
      p.append(a, ".");
      say("ok", p, area);
      window.location.href = "mailto:" + email + "?subject=" + encodeURIComponent(m.subject) + "&body=" + encodeURIComponent(m.body);
    });
  }
})();
