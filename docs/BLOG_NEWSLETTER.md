# Blog & Newsletter — Website Team Guide

## Overview

The blog and newsletter are powered by the same Supabase database as the Hostl app.
The website reads blog posts directly from Supabase.
The newsletter subscription sends a system message to the subscriber via Hostl.

---

## Supabase connection

The website needs these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tilbejapfljfvdvqtggo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbGJlamFwZmxqZnZkdnF0Z2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDQyODMsImV4cCI6MjA5Mzk4MDI4M30.no-GnuZs0No_pxI5t_u4Bu8hl9UiJm58ptZCVh67WBs
SUPABASE_SERVICE_ROLE_KEY=<get from Hostl team — never expose publicly>
```

The anon key is safe to use client-side for reading published blog posts.
The service role key is needed server-side only for newsletter subscription (sending system messages).

---

## Blog — how to fetch posts

### List all published posts
 mass message feature in the app.

---

## Migrations to run

1. docs/migrations/013_blog_newsletter.sql — creates tables
2. docs/migrations/013b_blog_seed.sql — inserts 5 initial posts

Run both in Supabase SQL Editor in order.
