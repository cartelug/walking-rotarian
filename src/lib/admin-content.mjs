// Content saved by the website admin forms (see tools/publish-issue.mjs).
// Each form writes one small JSON file in src/data/. This module reads those
// files at build time and lays them over the hand-written data, so the admin
// can change the current walk, add or update journeys, add gallery photographs
// and add media links without anyone editing code.
import fs from "node:fs";

const read = (name, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));
  } catch {
    return fallback;
  }
};

export const JOURNEY_STATUSES = ["underway", "completed", "proposed"];
export const JOURNEY_TOPICS = ["education", "peace", "faith", "wellbeing"];

/** The current walk, with any fields saved from the admin replacing the defaults. */
export function applyCurrentWalk(base) {
  const saved = read("current-walk.json", {});
  const next = { ...base };
  for (const [key, value] of Object.entries(saved)) {
    if (key === "sourceIssue" || value === "" || value === null || value === undefined) continue;
    next[key] = value;
  }
  return next;
}

const asChapter = (content) => (Array.isArray(content) ? { paras: [...content], figures: [] } : { paras: [...(content?.paras || [])], figures: [...(content?.figures || [])] });
const figure = (photo) => ({ url: photo.url, alt: photo.alt, caption: photo.caption || "" });

/**
 * Journeys: a record for an existing journey updates only the fields it fills in,
 * and adds its story and photographs to "What followed". A record for a new
 * journey creates a complete journey page.
 */
export function applyJourneys(base) {
  const records = read("journeys-admin.json", []).slice().sort((a, b) => a.sourceIssue - b.sourceIssue);
  const result = structuredClone(base);
  for (const rec of records) {
    if (rec.slug === "earlier-walks") continue;
    const existing = result.find((j) => j.slug === rec.slug);
    if (existing) {
      for (const key of ["title", "status", "dateLabel", "years", "route", "topic", "distance", "distanceBasis", "evidence", "summary"]) {
        if (rec[key]) existing[key] = rec[key];
      }
      if (rec.sortKey) existing.sortKey = rec.sortKey;
      if (rec.story?.length || rec.photos?.length) {
        existing.chapters = existing.chapters || {};
        const followed = asChapter(existing.chapters.followed);
        followed.paras.push(...(rec.story || []));
        followed.figures.push(...(rec.photos || []).map(figure));
        existing.chapters.followed = followed;
      }
      if (rec.source) {
        existing.record = existing.record || { sources: [] };
        existing.record.sources = [...(existing.record.sources || []), rec.source];
      }
      existing.updatedByAdmin = true;
      continue;
    }
    // A new journey needs the essentials before it can have a page.
    if (!rec.title || !rec.summary || !rec.dateLabel || !JOURNEY_STATUSES.includes(rec.status) || !JOURNEY_TOPICS.includes(rec.topic)) continue;
    const [hero, ...more] = rec.photos || [];
    result.push({
      slug: rec.slug,
      page: true,
      title: rec.title,
      years: rec.years || "",
      dateLabel: rec.dateLabel,
      sortKey: rec.sortKey || 0,
      route: rec.route || "",
      topic: rec.topic,
      status: rec.status,
      distance: rec.distance || "Not yet reported",
      distanceBasis: rec.distanceBasis || "As reported by the Walking Rotarian team.",
      evidence: rec.evidence || "Self-reported",
      summary: rec.summary,
      ...(hero ? { hero: { url: hero.url, alt: hero.alt, caption: hero.caption || rec.title } } : {}),
      chapters: rec.story?.length || more.length ? { road: { paras: rec.story || [], figures: more.map(figure) } } : {},
      record: { sources: rec.source ? [rec.source] : [], notes: [] },
      admin: true,
    });
  }
  return result;
}

/** Gallery photographs added through the admin, newest first. */
export function adminGalleryItems() {
  return read("gallery-admin.json", [])
    .filter((p) => p.status === "published")
    .sort((a, b) => b.sourceIssue - a.sourceIssue || a.id.localeCompare(b.id))
    .map((p) => ({
      id: p.id,
      url: p.url,
      group: "photo",
      kind: "Photograph",
      filters: p.journey ? ["journeys"] : ["community"],
      title: p.title,
      caption: p.caption,
      alt: p.alt,
      source: "Added by the Walking Rotarian team",
      credit: p.credit || "Credit not recorded",
      date: p.date || "",
      journey: p.journey || "",
      permission: "Approved for the website by the publisher",
      focal: "50% 40%",
    }));
}

/** Media links added through the admin, split into news and watch/listen lists. */
export function adminMedia() {
  const all = read("media-admin.json", []).filter((m) => m.status === "published").sort((a, b) => b.sourceIssue - a.sourceIssue);
  return {
    press: all.filter((m) => m.bucket === "press").map((m) => ({ outlet: m.outlet, date: m.date, title: m.title, url: m.url, kind: m.kind, covers: m.note })),
    listen: all.filter((m) => m.bucket === "listen").map((m) => ({ title: m.title, outlet: m.outlet, date: m.date, kind: m.kind, url: m.url, note: m.note })),
  };
}
