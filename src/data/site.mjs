// Site-wide settings. Change things here, then run:  node build.mjs
// Text between [square brackets](/like-this/) becomes a link. Paths that start
// with "/" are inside this site; paths that start with https:// go elsewhere.

export const site = {
  name: "The Walking Rotarian",
  person: "Mbanda Shyaka",
  alsoPublishedAs: "Shyaka Mbanda",
  tagline: "Every step has a story.",
  motto: "One man. Extraordinary journeys. Meaningful change.",
  description:
    "Mbanda Shyaka, the Walking Rotarian. Long walks for education, peace and community in Uganda and beyond, with the sources behind every claim.",
  lang: "en",

  // Set the real web address when it is known (for example https://example.org).
  // It can also be given when building:  SITE_URL=https://example.org node build.mjs
  // Until it is set, the site leaves out the sitemap and the absolute share links.
  url: (process.env.SITE_URL || "").replace(/\/+$/, ""),

  // Search engines may list the site. Build with NOINDEX=1 to ask them not to
  // (useful while the owner is still reviewing).
  indexing: !process.env.NOINDEX,

  // Where enquiries from the form go.
  //  - formEndpoint: the address of a form service or script that accepts a POST.
  //    When it is set, the form sends the message itself and shows whether it arrived.
  //  - email: used when no endpoint is set. The form opens the visitor's own
  //    email app with the message ready, and says plainly that nothing is sent
  //    until they press Send there.
  // The email below is the public campaign address published by PCI. Replace it
  // with the booking address when the owner confirms one.
  formEndpoint: process.env.FORM_ENDPOINT || "",
  email: "pci.uganda@gmail.com",

  // Donations open WhatsApp with a message ready, addressed to Mbanda Shyaka.
  // Digits only, with the country code and no plus sign. No money is handled by this site.
  whatsapp: "256757112376",

  nav: [
    { label: "His story", href: "/his-story/" },
    { label: "Journeys", href: "/journeys/" },
    { label: "Field notes", href: "/field-notes/" },
    { label: "Gallery", href: "/gallery/" },
    { label: "Media", href: "/media/" },
    { label: "Get involved", href: "/get-involved/" },
  ],

  reviewed: "2 November 2026",
  fontCredit: {
    text: "Fonts made from",
    linkText: "Web Fonts",
    url: "https://www.onlinewebfonts.com",
    tail: "is licensed by CC BY 4.0",
  },
};

// The one walk the "Support the current walk" button points to.
// Everything about the current campaign lives here and nowhere else.
export const currentWalk = {
  name: "Walk for Education 2026",
  route: "Nairobi to UCU–Kagando University College",
  purpose:
    "Support for UCU–Kagando University College and Kagando Nursery & Primary School, through a five-year education mission convened by Pamodzi Community Initiative (PCI) Uganda.",
  distance: "About 1,100 km",
  distanceBasis: "Planned route (campaign figure). Not distance walked.",
  status: "Underway",
  statusNote:
    "The campaign team has confirmed the walk is underway. Dates, towns and kilometres will be added here once they are confirmed.",
  lastVerifiedUpdate: null, // set to a date such as "2026-11-10" when a dated stage update is approved
  image: "portrait",
  imageAlt: "Mbanda Shyaka, smiling, wearing a black headwrap and a grey polo shirt.",
  imageCaption: "Mbanda Shyaka. Photograph supplied for the Walk for Education campaign.",
  journeySlug: "walk-for-education",
  // PCI's official pages. This site never repeats payment details or totals.
  url: "https://pamodzici.com/walk-for-education/",
  takePartUrl: "https://pamodzici.com/take-part/",
  contributeUrl: "https://pamodzici.com/contribute/",
};
