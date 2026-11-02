// "His story": the short biography and the sourced timeline.
// Rules for every entry: say what the source says, no more, and name the kind of evidence.

export const bio = {
  // Publication-ready wording from the research file. Owner approval is still needed.
  short:
    "Shyaka Mbanda, widely known as the Walking Rotarian, connects long-distance walking with community causes, education and public awareness. His work has included campaigns associated with Rotary networks and an earlier focus on education technology through TOD Idea. In 2026, Pamodzi Community Initiative documented his 400 km Faith in Motion journey in Uganda and presented him as the Walking Rotarian for its Nairobi-to-Kagando Walk for Education mission. His walks draw attention to specific community priorities and invite broader participation in their long-term development.",
};

export const tracks = {
  education: "Education and technology",
  walking: "Walking and service",
  wellbeing: "Wellbeing",
  community: "Community",
};

const DM_2025 = {
  label: "Daily Monitor, Shyaka: beat fear, obesity and addictions to gain self-mastery",
  url: "https://www.monitor.co.ug/uganda/lifestyle/reviews-profiles/shyaka-beat-fear-obesity-and-addictions-to-gain-self-mastery-4938170",
};
const CLUB_MAG = {
  label: "Rotary Club of Akright City magazine, “Walking for Mental Health Awareness”",
  url: "https://rotaryclubakright.com/files/system/RCAkright-Magazine.pdf",
};

// Oldest first. `when` is what is printed. `sort` only orders the list.
export const timeline = [
  {
    id: "teaching",
    when: "2009–2011",
    sort: 2009,
    track: "education",
    title: "Teaching, and a way to keep pupils in school",
    text: "In a 2025 interview, Shyaka said he worked in farming in northern Uganda and became a primary-school teacher. He then formed a friend-funded effort to help pupils who could not continue beyond Primary Seven. He said at least seven of them later finished school and stayed in touch.",
    evidence: "Self-reported",
    note: "Personal testimony. School records and the pupils’ permission were not inspected.",
    sources: [DM_2025],
  },
  {
    id: "edutab",
    when: "2013–2014",
    sort: 2013,
    track: "education",
    title: "TOD Idea and the EduTab",
    text: "The Daily Monitor reported on TOD Idea’s EduTab: a tablet preloaded with offline books, videos and interactive learning apps. It named Shyaka as a team leader at TOD Idea.",
    evidence: "Media-reported",
    sources: [
      {
        label: "Daily Monitor, Edutabs to revolutionise e-learning (6 November 2014)",
        url: "https://www.monitor.co.ug/uganda/magazines/jobs-and-career/edutabs-to-revolutionise-e-learning-1589996",
      },
    ],
  },
  {
    id: "coding-2016",
    when: "2016",
    sort: 2016,
    track: "education",
    title: "Coding, robotics and critical thinking",
    text: "This Is Uganda profiled TOD Idea’s work with school-age learners on programming, robotics and critical thinking. It describes the aims of the work, including plans to reach less privileged children. Aims are not evidence of how many children were reached.",
    evidence: "Media-reported",
    sources: [
      {
        label: "This Is Uganda, Building a cohort of technology creators (13 May 2016)",
        url: "https://www.thisisuganda.org/mbanda-shyaka-is-building-a-cohort-of-ugandan-kids-that-will-create-technology/",
      },
    ],
  },
  {
    id: "fawe-2017",
    when: "2017",
    sort: 2017,
    track: "education",
    title: "“The TOD Idea Story” on a conference programme",
    text: "A conference booklet from FAWE lists “The TOD Idea Story”, by Mbanda Shyaka, as a scheduled session. A programme listing does not show that the session was given.",
    evidence: "Listing only",
    sources: [
      {
        label: "FAWE conference booklet (21 August 2017)",
        url: "https://faweconference.wordpress.com/wp-content/uploads/2017/08/fawe-conference-booklet-en-_-21082017.pdf",
      },
    ],
  },
  {
    id: "mwalimutab",
    when: "2019",
    sort: 2019,
    track: "education",
    title: "MwalimuTab for teachers",
    text: "The ICT Teachers Association of Uganda reported that Shyaka, as chief executive of TOD Idea Limited, presented MwalimuTab at the American Center in Kampala. The reports describe ICT and lesson-planning tools for teachers.",
    evidence: "Media-reported",
    sources: [
      {
        label: "ITAU, Digital pedagogy at the American Center (26 May 2019)",
        url: "https://ictteachersug.net/digital-pedagogy-american-center-partnering-with-yaaka-and-tod-idea-to-train-and-encourage-teachers/",
      },
      {
        label: "ITAU, MwalimuTab: digital inclusion for teachers (28 May 2019)",
        url: "https://ictteachersug.net/mwalimu-tab-promoting-digital-inclusion-for-teachers/",
      },
    ],
  },
  {
    id: "digital-2020",
    when: "2020",
    sort: 2020,
    track: "education",
    title: "Digital learning, in public",
    text: "The Independent reported Shyaka’s comments, as a team leader at TOD Idea, on how digital learning content should be approved and on teachers’ online-teaching skills, as schools moved to digital learning. On 31 October 2020 he was the guest on the Digital Talent Africa podcast.",
    evidence: "Media-reported",
    sources: [
      {
        label: "The Independent, Uganda’s education system not prepared for digital learning tide (4 May 2020)",
        url: "https://www.independent.co.ug/ugandas-education-system-not-prepared-for-digital-learning-tide/",
      },
      {
        label: "Digital Talent Africa on Apple Podcasts",
        url: "https://podcasts.apple.com/de/podcast/digital-talent-africa/id1527152164",
      },
    ],
  },
  {
    id: "codeimpact",
    when: "2023",
    sort: 2023.1,
    track: "education",
    title: "CodeImpact",
    text: "A July 2023 workshop account by Sharon Ikechi names Shyaka as a co-founder of CodeImpact, which runs programming, robotics and STEM courses. Scholar Media Africa’s 2023 coverage of a young robotics learner also links him to it. His present role there has not been verified.",
    evidence: "Media-reported",
    sources: [
      {
        label: "Sharon Ikechi, Micro:bit lesson plan by CodeImpact educators (14 July 2023)",
        url: "https://medium.com/@sharon.kechi/micro-bit-lesson-plan-by-codeimpact-educators-3eb909f8cbe3",
      },
      {
        label: "Scholar Media Africa, Aleem, 9, genius robots builder",
        url: "https://scholarmedia.africa/uganda/aleem-9-genius-robots-builder-representing-uganda-in-texas/",
      },
    ],
  },
  {
    id: "tedx",
    when: "31 July 2023",
    sort: 2023.3,
    track: "wellbeing",
    title: "TEDxLubowa: “From Unhealthy to Unstoppable”",
    text: "Shyaka gave a talk at TEDxLubowa about his own change of lifestyle. The TEDx upload carries a caution about health claims made in the talk. It is a personal story, not medical advice.",
    evidence: "Official TEDx upload",
    sources: [
      { label: "TEDx Talks on YouTube", url: "https://www.youtube.com/watch?v=7tLq6c_CHG8" },
    ],
  },
  {
    id: "mh-march",
    when: "October 2023",
    sort: 2023.8,
    track: "wellbeing",
    title: "A mental-health awareness event",
    text: "POA TV reported Shyaka addressing a mental-health awareness event held by the Rotary Club of Akright City and the Academy for Compassionate Training.",
    evidence: "Media-reported",
    link: { label: "Read the record", href: "/journeys/earlier-walks/#march-2023" },
    sources: [
      {
        label: "POA TV (12 October 2023)",
        url: "https://poatvug.com/rotary-club-of-akright-city-partners-march-for-mental-health-awareness",
      },
    ],
  },
  {
    id: "first-person-walks",
    when: "2023–2024",
    sort: 2023.9,
    track: "walking",
    title: "First-person accounts of early walks",
    text: "The Rotary Club of Akright City’s magazine carries Shyaka’s own account of walks from Masaka to Akright City (about 150 km), from Kisoro to Kabale, and from Jinja to Busia and back (about 370 km). Several are undated. They are told here as his reports, with his words attributed to him.",
    evidence: "Self-reported",
    link: { label: "See the journeys", href: "/journeys/" },
    sources: [CLUB_MAG],
  },
  {
    id: "ishekye",
    when: "November 2024",
    sort: 2024.9,
    track: "walking",
    title: "A fundraising walk to Sheema",
    text: "The Rotary Club of Akright City flagged off a walk advertised as 310 km, to raise funds for accessibility improvements for children with disabilities at Ishekye Primary School.",
    evidence: "Media-reported",
    link: { label: "Read the record", href: "/journeys/ishekye-sheema-walk/" },
    sources: [
      {
        label: "Nile Post (17 November 2024)",
        url: "https://nilepost.co.ug/news/227158/rotary-club-of-akright-city-flags-off-310km-walk-to-raise-funds-for-disabled-kids-in-sheema",
      },
    ],
  },
  {
    id: "peace-walk",
    when: "27 December 2024 to 11 January 2025",
    sort: 2024.95,
    track: "walking",
    title: "A walk for peace from Nakivale to Makerere",
    text: "A 300 km walk from the Nakivale refugee settlement to Makerere University, reported at its launch by Nile Post and at its arrival by Uganda Radio Network.",
    evidence: "Media-reported",
    link: { label: "Read the record", href: "/journeys/peace-walk-nakivale-makerere/" },
    sources: [
      {
        label: "Nile Post (27 December 2024)",
        url: "https://nilepost.co.ug/news/234773/walk-for-peace-mbanda-shyaka-embarks-on-300km-journey-to-makerere-university",
      },
      {
        label: "Uganda Radio Network (11 January 2025)",
        url: "https://ugandaradionetwork.net/story/hundreds-participate-in-rotary-peace-walk",
      },
    ],
  },
  {
    id: "profile-2025",
    when: "23 February 2025",
    sort: 2025.1,
    track: "wellbeing",
    title: "A profile in the Daily Monitor",
    text: "The Daily Monitor’s profile covers Shyaka’s personal transformation, his exercise and walking, the origin of his nickname, his support for education and his business interests, which include a natural skincare business, Karibu Shop. It also records a hope to support free secondary education in future. Those are stated interests and hopes, not completed projects. Wellbeing statements are his personal views.",
    evidence: "Interview",
    sources: [DM_2025],
  },
  {
    id: "akright-association",
    when: "Snapshot",
    sort: 2025.5,
    track: "community",
    title: "Akright City Residents Association",
    text: "The association’s published team page lists Shyaka Mbanda as Information Minister. This is a snapshot of that page. It does not show the length of the term.",
    evidence: "Organisation page",
    sources: [{ label: "Akright City Residents Association, executive team", url: "https://www.akrightcity.com/en/team.php" }],
  },
  {
    id: "faith-in-motion",
    when: "2 August 2026",
    sort: 2026.6,
    track: "walking",
    title: "Faith in Motion reaches Kiburara",
    text: "PCI records about 400 km walked from Akright City in Kampala to St Joseph Rwembyo Catholic Church at Kiburara, in the Rwenzori foothills of Kasese.",
    evidence: "Organiser-reported",
    link: { label: "Read the record", href: "/journeys/faith-in-motion/" },
    sources: [{ label: "PCI, Faith in Motion: the walk", url: "https://pamodzici.com/walk/" }],
  },
  {
    id: "walk-for-education",
    when: "2026, underway",
    sort: 2026.9,
    track: "walking",
    title: "Walk for Education",
    text: "A walk from Nairobi to UCU–Kagando University College, convened by PCI Uganda. The campaign team has confirmed it is underway. Dated stages will be added once confirmed.",
    evidence: "Organiser-reported",
    link: { label: "Read the record", href: "/journeys/walk-for-education/" },
    sources: [{ label: "PCI, Walk for Education", url: "https://pamodzici.com/walk-for-education/" }],
  },
];
