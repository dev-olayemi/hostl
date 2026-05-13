-- ============================================================
-- SEED: 5 initial blog posts
-- Run after 013_blog_newsletter.sql
-- ============================================================

insert into public.blog_posts (slug, title, excerpt, content, category, author_name, read_time, published, published_at) values

(
  'introducing-hostl',
  'Introducing Hostl: Your inbox, finally interactive',
  'Today we are launching Hostl, the platform that makes every message interactive. Send approvals, RSVPs, polls, and forms that recipients complete right inside the message.',
  '<p>Today we are launching Hostl, the platform that makes every message interactive.</p><p>For too long, the inbox has been a passive place. You receive a message, you click a link, you open a browser, you log in somewhere else, you take an action, you come back. Every single day. For every single thing.</p><p>We built Hostl to fix that. With Hostl, the action happens inside the message. Approvals get approved. Events get RSVPs. Polls get answered. Forms get filled. All without leaving the inbox.</p><p>Your @handle is your identity. Share hostl.cloud/u/yourname anywhere. Anyone can send you a message, no account needed to view your profile.</p><p>Verification badges make trust visible. Personal, Company, Government, Service, and Commerce badges tell recipients exactly who they are dealing with before they act.</p><p>We are starting with the Free plan: your @handle, full messaging features, and up to 500 messages per month at no cost. Forever.</p><p>We are just getting started. Follow along on the blog for updates.</p>',
  'Announcement',
  'Hostl Team',
  3,
  true,
  '2026-05-13 09:00:00+00'
),

(
  'why-interactive-messaging-is-the-future',
  'Why interactive messaging is the future of communication',
  'Email was designed in 1971. The inbox has not fundamentally changed since. Here is why we think interactive messaging is the next evolution, and why now is the right time.',
  '<p>Email was designed in 1971. The inbox has not fundamentally changed since.</p><p>You still receive a message. You still click a link. You still leave to take action somewhere else. The inbox is a notification center, not a workspace.</p><p>We think that is about to change.</p><h2>The problem with links</h2><p>Every time a message contains a link, there is friction. The recipient has to decide whether to trust it. They have to open a new tab. They have to log in again. They have to find their way back.</p><p>Studies show that completion rates for link-based actions are dramatically lower than in-context actions. The friction is not just annoying — it costs real outcomes.</p><h2>What interactive messaging looks like</h2><p>With Hostl, the action is the message. An approval request contains the Approve and Decline buttons. An event invitation contains the RSVP. A poll contains the voting interface.</p><p>The recipient does not leave. They do not log in again. They just act.</p><h2>Why now</h2><p>The technology to do this has existed for years. What was missing was a platform built around the idea from the ground up — not email with a plugin, but a new kind of inbox designed for action.</p><p>That is what we built.</p>',
  'Product',
  'Hostl Team',
  5,
  true,
  '2026-05-10 09:00:00+00'
),

(
  'verification-badges-explained',
  'Verification badges explained: how trust works on Hostl',
  'Our five-tier verification system — Personal, Company, Government, Service, and Commerce — is designed to make trust visible at a glance. Here is how it works.',
  '<p>When you receive a message, you need to know who sent it. Not just their name — their legitimacy.</p><p>We built a five-tier verification system to make trust visible at a glance.</p><h2>The five badge types</h2><p><strong>Personal (blue circle)</strong> — For verified individuals. Celebrities, journalists, public figures. The classic blue tick.</p><p><strong>Company (blue wavy seal)</strong> — For verified businesses. If you see this badge, the company has been reviewed and confirmed.</p><p><strong>Government (grey-blue square badge)</strong> — For official government bodies. Ministries, agencies, councils.</p><p><strong>Service (purple shield)</strong> — For API integrations and automated senders. When a system sends you a message, you know it is a trusted integration.</p><p><strong>Commerce (green bag)</strong> — For verified merchants and marketplaces. When you receive an order confirmation or invoice, you know it is from a real seller.</p><h2>How to get verified</h2><p>Go to Settings and tap Get Verified. Fill in your legal name, website, registration number, and contact details. Our team reviews every application. Approval typically takes 3 to 5 business days.</p><p>Personal verification for public figures is coming soon.</p>',
  'Product',
  'Hostl Team',
  4,
  true,
  '2026-05-06 09:00:00+00'
),

(
  'handle-based-identity',
  'Your @handle is your identity on the internet',
  'We made a deliberate choice: no email required to create a Hostl account. Your @handle is your identity. Here is why that matters.',
  '<p>We made a deliberate choice when building Hostl: no email required.</p><p>Your @handle is your identity. It is how people find you, message you, and know who you are. It is permanent, unique, and yours.</p><h2>Why not email?</h2><p>Email addresses are fragile identities. They change when you switch providers. They get compromised. They are hard to remember and easy to fake.</p><p>A handle is different. @muhammed is @muhammed everywhere on Hostl. It cannot be transferred. It cannot be faked. It is tied to a verified identity.</p><h2>How it works technically</h2><p>When you sign up, you choose your @handle. Internally, we generate a secure synthetic identifier so our auth system works correctly — but you never see it. You sign in with your handle and password. That is it.</p><h2>Sharing your handle</h2><p>Your public profile lives at hostl.cloud/u/yourhandle. Share it anywhere — your email signature, your social bio, your business card. Anyone who visits it can send you a message, even without a Hostl account.</p>',
  'Product',
  'Hostl Team',
  4,
  true,
  '2026-05-03 09:00:00+00'
),

(
  'building-hostl-tech-stack',
  'How we built Hostl: the technical decisions behind the platform',
  'A look at the technology choices behind Hostl — Next.js 16, Supabase, Tiptap, Cloudinary — and why we made them.',
  '<p>Building a new kind of inbox required making some unconventional technical choices. Here is what we chose and why.</p><h2>Next.js 16 with App Router</h2><p>We chose Next.js 16 for its server components, which let us fetch data on the server and pass it directly to the client. This means the inbox loads with data already present — no loading spinners, no empty states.</p><h2>Supabase for everything backend</h2><p>Supabase gives us PostgreSQL, real-time subscriptions, auth, and storage in one platform. Row Level Security means every user can only see their own data, enforced at the database level.</p><h2>Handle-based auth</h2><p>We wanted no email required. Supabase Auth requires an email internally, so we generate a secure synthetic one that users never see. You sign in with your @handle and password.</p><h2>Tiptap for rich text</h2><p>The message editor needed to support rich text, HTML, and eventually interactive form elements. Tiptap gave us a headless editor we could style completely to match our design system.</p><h2>Cloudinary for avatars</h2><p>Avatar uploads go through Cloudinary with automatic face-aware cropping to a square. GIFs are supported and preserve their animation. The result is always a clean, consistent profile picture.</p><p>We will keep sharing technical decisions as we build. Follow the blog for updates.</p>',
  'Engineering',
  'Hostl Team',
  6,
  true,
  '2026-04-28 09:00:00+00'
);
