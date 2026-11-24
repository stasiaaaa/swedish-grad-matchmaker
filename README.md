# Swedish Grad Matchmaker

Build a web app called "LaunchPad", a job-matching platform that helps MSc engineering students in Sweden find relevant jobs based on their skills, education and experience. It also lets companies find suitable students.

## Target audience and scope
- Built for MSc engineering students (5-year engineering programmes, e.g. Computer Science and Engineering, Industrial Engineering and Management, Information Technology, Applied Physics and Electrical Engineering, Mechanical Engineering, Engineering Biology) and recent graduates.
- Geographic focus: Linköping, Stockholm and Gothenburg. Only collect and show jobs in these three cities (including commuting areas) plus remote roles in Sweden. The map opens on Sweden with quick-zoom buttons for the three cities. The location filter offers these three as chips, plus "Other Sweden".
- Seed and highlight these universities first: Linköping University, KTH Royal Institute of Technology, Chalmers University of Technology. Other Swedish and European universities remain selectable (50+ in total).
- "Looking for" categories, in this order: Master's thesis project, Internship, Graduate/trainee programme, Student job (part-time), Full-time. Master's thesis projects are a first-class category with their own filter and tab.
- Role types: Software Engineering, Embedded and Systems, AI/ML and Data, Cybersecurity, Automotive, Aerospace and Defence, Energy and Power, Industrial and Production, Telecom, Electronics and Hardware, Management Consulting, Finance and Quant, R&D and Life Science.

## Access model
- NO account is required to browse. Guests can use the job list, filters, map, job detail pages, company pages, watched companies and the Role explorer.
- An account is only needed to: save jobs, keep a student profile, get personalised match scores, upload a CV, apply inside the platform, get email notifications, or (for companies) post jobs and search students.
- When a guest clicks a gated action, show a friendly modal ("Create a free profile to save this job") instead of redirecting.
- Guest "Quick match": a guest can pick a few skills and a study level without signing up. Match scores are shown for that session (browser state/localStorage only). Offer "Save this as your profile" to convert it into an account.
- Use Supabase for auth (email + Google), database, storage, edge functions and scheduled jobs. Row-level security: jobs, companies, skills, universities and watched companies are publicly readable. Student profiles are private unless the student opts into company visibility.

## Users
1. Guests: browse and explore.
2. Students: build a profile, save jobs, get matches and notifications.
3. Companies: post roles and search for students.
4. Admin: manages the company list, watched companies and scraper.
Users choose Student or Company at signup.

## Student profile (fast, ideally under 3 minutes)
- Step-by-step onboarding wizard with a progress bar.
- Education: searchable university dropdown, then programme, study level (Bachelor/Master/PhD) and expected graduation year.
- Skills: searchable multi-select from a predefined list grouped by category (Programming, Embedded and Hardware, Data and AI, Security, Engineering tools, Business, Languages, Soft skills), shown as removable chips with a proficiency level (Beginner/Intermediate/Advanced). Allow custom skills. Seed 100+ skills including: Python, C, C++, C#, Java, Rust, MATLAB/Simulink, embedded systems, RTOS, control systems, signal processing, machine learning, computer vision, CAD, FEM, systems engineering, requirements engineering, ROS, Linux, cloud, SQL, networking, cryptography, threat hunting, and common soft skills.
- Work experience, two options:
  a) Upload a CV (PDF/DOCX). Parse it with AI in a Supabase edge function using Lovable AI, then pre-fill education, skills and experience for the student to review and edit before saving.
  b) Add manually (title, company, dates, description).
- Preferences: what they are looking for (see categories above), preferred cities, remote/hybrid/on-site, fields of interest.
- Privacy toggle: visible to companies or hidden.

## My page (student personal page, LinkedIn-style "My jobs")
- Route /my-jobs, the main page after login, with a clear navigation entry.
- Tabs: Saved, Applied, Watching (followed companies), Closed. A counter on each tab.
- Each row shows company logo, title, location, work mode, match score, date saved and application deadline if known. Quick actions: Open, Mark as applied, Remove.
- Status per saved job (dropdown): Saved, Applied, Interview, Offer, Rejected. Optional private notes per job.
- If a saved job is closed by the scraper, keep it in the list with a grey "No longer open" badge and move it to the Closed tab.
- Sorting (Date saved, Deadline, Best match) and a filter by status.
- The Save button on any job card or detail page toggles instantly with a bookmark icon and a toast.
- Top of the page: a summary strip ("12 saved, 3 applied, 2 closing this week") and a "Closing soon" highlight. Below it, a "Recommended for you" row based on the profile.

## Job discovery
- Jobs are categorised in two ways: (1) by what the student is looking for, (2) by role type.
- Each job card shows an AI-generated summary (2-3 sentences), a "Key requirements" list, required skill chips, location, work mode, posted date, and a match score (0-100%) with a short explanation when a profile or Quick match exists ("You match 6 of 8 required skills"). Matched skills in green, missing in grey.
- Match score is based on skill overlap, education level and field, and location preference.
- Filters: looking-for category, role type, city, work mode, skills, company. Search bar. Sorting: Best match, Newest.
- Job detail page: full summary, requirements, company info, map pin, "Apply" (links to the original listing for collected jobs) and "Save" buttons, plus the "Skills to add" panel (see Role explorer).
- Show "Last updated: X hours ago" on the job search page.

## Map
- Interactive map (Mapbox or Leaflet/OpenStreetMap) with clustered pins colour-coded by role type. Clicking a pin shows a job preview with a link to details.
- Map and list are synced: filtering updates both. Include a "Search this area" option.
- Remote jobs appear in a separate "Remote" section.
- Toggle "Show watched companies": shown as hollow/outlined pins to distinguish them from active job pins.

## Watched companies (followed companies with no open listings)
- A public page "Companies we're watching" plus the map toggle.
- Each card shows: logo, name, industry, city, typical roles they hire for (chips), typical hiring period ("Usually opens graduate roles in September"), a short note on why we watch them, the date of their last known posting, and a link to their careers page.
- "Notify me" button. Guests enter just an email (with a consent checkbox and a captcha or rate limit); logged-in students are subscribed with one click.
- NOTIFICATION EMAIL: sent when a new listing from that company appears. Short, containing: company name, job title, location, a 1-2 sentence summary, a "View listing" button linking to the job on our site, and an unsubscribe link. Subject example: "[Company] just posted: [Job title]". Send via Resend (or the Lovable email option) from an edge function. Send at most one email per company per run (group several new roles into one email). No marketing mail.
- Logged-in students also get an in-app notification (bell icon) and see the company under the "Watching" tab on /my-jobs.
- When a new job is detected for a watched company, it moves from the watchlist to active and subscribers are notified. If a company has no open jobs for 30 days, it moves back to the watchlist.
- Filters: role type, city, industry. Searchable. Managed on the admin page.

## Automated job collection (scraper), twice a day
- Supabase scheduled job (pg_cron) triggers an edge function at 06:00 and 18:00 Swedish time (handle the UTC offset and daylight saving). The function loops through all companies with scrape_enabled = true, in small batches with a 1-2 second delay between requests and a time limit per company. Tier 1 companies run first.
- Source priority for every company:
  1. Arbetsförmedlingen JobTech open API (JobSearch) is the main source. Filter by municipality: Linköping 0580, Stockholm 0180, Gothenburg 1480 (verify the codes against the API's taxonomy). Match employers by organisation name or number.
  2. The company's own ATS feed if detected (Greenhouse, Lever, Workable, Teamtailor, Varbi, ReachMee, Jobylon, Ashby, Workday) to fill gaps.
  3. Careers page HTML plus Lovable AI extraction (or a scraping connector such as Firecrawl if available) only as a last resort. Extract title, location, description, URL, posted date, deadline.
- Thesis projects: also query each company's careers page and JobTech for "master thesis", "thesis project" and "degree project". AI classifies these as "Master's thesis".
- Respect robots.txt and each site's terms. Use a clear User-Agent. Store only title, location, a short description/summary and the URL, and always link back to the original listing. Do NOT scrape LinkedIn, Indeed, Glassdoor or other boards that prohibit it.
- For each new or changed job, use AI to normalise: role type, looking-for category, required skills (mapped to our skill list), work mode, city (geocoded for the map) and a 2-3 sentence summary. Only run AI on new or changed jobs.
- Deduplication: unique key on (company_id, external_id or source_url), and across sources on company + normalised title + city, preferring the ATS version. Track first_seen_at, last_seen_at and status (open/closed). Drop jobs outside the three focus cities unless they are remote in Sweden.
- Closing logic: if a job is not seen in 2 consecutive runs, mark it closed (never delete, so saved jobs keep working). Reopen if it appears again.
- After each run: update company status (watched vs active), send notification emails, and write a row in `scrape_runs` (started_at, finished_at, companies_checked, jobs_new, jobs_updated, jobs_closed, errors).
- Failure handling: one failing company never stops the run. After 3 consecutive failures, flag it on the admin page.

## Companies table and admin page
- `companies` table: name, org_number, careers_url, city, industry, tier, source_type (auto, jobtech, greenhouse, lever, workable, teamtailor, varbi, reachmee, jobylon, ashby, workday, custom_html), ats_identifier, scrape_enabled, last_scraped_at, last_status, consecutive_failures.
- Admin page (admin role only): add, edit, pause and bulk-import companies via CSV (name, org_number, careers_url, city, industry, tier), manage watched companies, and view scraper health (last run, errors, jobs per company).
- "Detect source" button: inspects careers_url for known ATS patterns (jobs.lever.co, boards.greenhouse.io, *.teamtailor.com, *.varbi.com, *.reachmee.com, *.jobylon.com, *.workable.com, *.myworkdayjobs.com) and fills in source_type and ats_identifier. "Test connection" button: runs one fetch and shows the number of jobs found.
- On the first run, test every company. If a company returns 0 jobs from all sources, set scrape_enabled = false with the reason "needs manual check" and show it in the health table. Never fail silently.
- Seed companies with name, city, industry and tier only, with source_type = auto. Pre-set only Spotify to Lever (jobs.lever.co/spotify).

## Seed companies by city (a company with several offices appears under each city)
LINKÖPING: Saab (Defence/Aerospace), Sectra (Medical IT/Security), IFS (Enterprise software), Ericsson (Telecom), Combitech (Engineering/Security), Afry, Sweco, Knowit (consulting), FOI (Defence research), Trafikverket (Public sector), Region Östergötland (Healthcare), Linköping University (Academia).
STOCKHOLM: Ericsson, Spotify, Klarna, King, Paradox Interactive, Tink, Truecaller, Sinch, Kry, Einride, Voi, Tobii, Hexagon, Atlas Copco, Epiroc, Scania (Södertälje), Saab, Vattenfall, Svenska kraftnät, Telia, Tele2, Swedbank, SEB, Handelsbanken, Nordea, Afry, Sweco, WSP, McKinsey, BCG, Bain, Oliver Wyman, Truesec, Outpost24, Detectify, Advenica, Försvarsmakten, FOI, FRA, MSB, Trafikverket, KTH.
GOTHENBURG: Volvo Group, Volvo Cars, Polestar, Zenseact, Volvo Penta, SKF, AstraZeneca (Mölndal), Ericsson, Saab, Kognic, Smart Eye, Semcon, Afry, Sweco, WSP, Combitech, Chalmers.
Tiers: Tier 1 = large employers with graduate programmes and thesis projects (Ericsson, Volvo Group, Volvo Cars, Saab, Scania, Atlas Copco, Hexagon, Vattenfall, Telia, banks, consulting); Tier 2 = tech, games, startups; Tier 3 = engineering consultancies; Tier 4 = public sector and academia.
Exclude insolvent or non-hiring companies (e.g. Northvolt). Seed about 15 of these as "watched" (no open jobs yet) with typical hiring periods.

## Role explorer and skills to add to your CV
- A "Role explorer" page, open to everyone: pick a role type or job title and see:
  - Top skills for that role, ranked by how often they appear in current listings (e.g. "C++, in 72% of Embedded roles").
  - Split into "Core skills", "Nice to have" and "Emerging skills".
  - A one-line "Why it matters" per skill, generated with Lovable AI. For roles with few listings, fill in typical skills and label them "typical".
- The same panel appears on every job detail page as "Skills to add to your CV for this role".
- With a profile or Quick match: show "You have" (green) vs "Missing" (grey), ordered by priority, with an "Add to my profile" button on each missing skill and a readiness score ("You cover 60% of core skills").
- Guests can tick the skills they have to see their gap instantly, without an account.
- Optional short learning hint per missing skill, without external links.

## Company side
- Company signup and profile: name, logo, industry, size, description, website, locations.
- Post a job directly: title, looking-for category, role type, required and nice-to-have skills, city (address autocomplete), work mode, description. AI generates the summary and suggests categories.
- Manage postings (edit, close, delete) and see applicants per job.
- Student search: filters (university, programme, skills, graduation year, city, what they're looking for), showing only students who opted into visibility. Cards show skills, education and a match score against a selected job. Companies can save candidates and send a short interest request.
- Require admin approval of a company account before it can see student profiles.

## Privacy and compliance
- GDPR: consent checkboxes for profile visibility, CV upload and email notifications; a "delete my data" option; a clear privacy page. Every email has an unsubscribe link.

## Pages
Landing, Job search (list + map), Job detail, Role explorer, Watched companies, Company public profile, Login/Signup, Student onboarding, My jobs (/my-jobs), Profile edit, Notification settings, Company dashboard, Post a job, Student search, Candidate profile, Admin (companies, scraper health, watched companies).

## Design
Clean, modern, friendly. Mobile-first and responsive. Light colour scheme with one strong accent colour, rounded cards, clear typography. Use shadcn/ui. Include loading, empty and error states. The landing page lets a guest start searching immediately (search bar, city chips and role categories above the fold).

## Data
Seed about 30 realistic sample jobs (including several Master's thesis projects) across the three cities, about 10 companies with active jobs, about 15 watched companies, 100+ skills and 50+ universities, so the app is usable before the first scrape finishes.

## Build order
1. Database schema, public job list, city and looking-for filters (including Master's thesis), detail pages and seed data (no login needed)
2. Map view with the watched companies toggle
3. Companies table, admin page, scraper edge function (JobTech first, then ATS feeds), scheduling, closing logic and health page
4. Watched companies page, subscriptions and notification emails
5. Auth, student onboarding, save jobs and the /my-jobs page
6. Matching score, Quick match and AI summaries
7. Role explorer and skill recommendations
8. CV upload and parsing
9. Company dashboard, job posting and student search
Ask me before making assumptions about anything not specified here.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://swedish-grad-matchmaker.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/31791f30-2019-4135-ac59-cda17fde3057).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
