-- ============================================================
-- MIGRATION 018: Message filtering and security
-- ============================================================

-- Message security scores and flags
alter table public.messages
  add column if not exists security_score int default 100,  -- 0-100, lower = more suspicious
  add column if not exists security_flags jsonb default '[]'::jsonb,  -- Array of detected issues
  add column if not exists filtered_at timestamptz,  -- When filtering was applied
  add column if not exists filter_version text default '1.0';  -- Filter version for tracking

-- Indexes for filtering queries
create index if not exists messages_security_score_idx on public.messages (security_score);
create index if not exists messages_category_score_idx on public.messages (category, security_score);

-- Trusted senders table (whitelist)
create table if not exists public.trusted_senders (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  trusted_id      uuid not null references public.profiles(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (profile_id, trusted_id)
);

create index trusted_senders_profile_idx on public.trusted_senders (profile_id);

-- Blocked senders table (blacklist)
create table if not exists public.blocked_senders (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  blocked_id      uuid not null references public.profiles(id) on delete cascade,
  reason          text,
  created_at      timestamptz not null default now(),
  unique (profile_id, blocked_id)
);

create index blocked_senders_profile_idx on public.blocked_senders (profile_id);

-- Suspicious patterns table (for learning)
create table if not exists public.suspicious_patterns (
  id              uuid primary key default uuid_generate_v4(),
  pattern_type    text not null,  -- 'url', 'keyword', 'attachment', 'sender'
  pattern_value   text not null,
  severity        int not null default 50,  -- 0-100, higher = more severe
  description     text,
  is_active       boolean default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index suspicious_patterns_type_idx on public.suspicious_patterns (pattern_type);
create index suspicious_patterns_active_idx on public.suspicious_patterns (is_active);

-- RLS policies
alter table public.trusted_senders enable row level security;
alter table public.blocked_senders enable row level security;
alter table public.suspicious_patterns enable row level security;

create policy "trusted_senders_own"
  on public.trusted_senders for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "blocked_senders_own"
  on public.blocked_senders for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Suspicious patterns are read-only for users
create policy "suspicious_patterns_read"
  on public.suspicious_patterns for select
  using (is_active = true);

-- Insert default suspicious patterns with context-aware severity
insert into public.suspicious_patterns (pattern_type, pattern_value, severity, description) values
  -- High severity URLs (only in combination with other factors)
  ('url', 'bit.ly', 40, 'Shortened URL - verify sender'),
  ('url', 'tinyurl.com', 40, 'Shortened URL - verify sender'),
  ('url', '.tk', 60, 'Free domain - verify legitimacy'),
  ('url', '.ml', 60, 'Free domain - verify legitimacy'),
  ('url', '.ga', 60, 'Free domain - verify legitimacy'),
  
  -- Phishing keywords (moderate severity - context matters)
  ('keyword', 'verify your account', 50, 'Common phishing phrase - verify sender'),
  ('keyword', 'urgent action required', 45, 'Urgency tactic - verify sender'),
  ('keyword', 'suspended account', 55, 'Account threat - verify sender'),
  ('keyword', 'click here immediately', 50, 'Urgency + action - verify sender'),
  ('keyword', 'confirm your password', 60, 'Credential request - verify sender'),
  ('keyword', 'wire transfer', 50, 'Financial request - verify sender'),
  ('keyword', 'western union', 50, 'Payment request - verify sender'),
  ('keyword', 'bitcoin', 35, 'Cryptocurrency mention - verify context'),
  ('keyword', 'lottery winner', 70, 'Classic scam phrase'),
  ('keyword', 'nigerian prince', 85, 'Classic scam phrase'),
  ('keyword', 'inheritance from unknown', 60, 'Advance fee fraud pattern'),
  ('keyword', 'tax refund pending', 55, 'IRS impersonation pattern'),
  
  -- Suspicious attachments (context-aware)
  ('attachment', '.exe', 50, 'Executable - verify sender and purpose'),
  ('attachment', '.scr', 70, 'Screen saver - unusual file type'),
  ('attachment', '.bat', 60, 'Batch file - verify sender'),
  ('attachment', '.cmd', 60, 'Command file - verify sender'),
  ('attachment', '.vbs', 65, 'Visual Basic script - verify sender'),
  ('attachment', '.js', 45, 'JavaScript file - verify context'),
  ('attachment', '.jar', 40, 'Java archive - verify sender'),
  ('attachment', '.zip', 20, 'Archive - common file type'),
  ('attachment', '.rar', 20, 'Archive - common file type'),
  
  -- Sender patterns (low severity - just flags)
  ('sender', 'noreply@', 15, 'No-reply address - automated system'),
  ('sender', 'admin@', 20, 'Admin address - verify legitimacy'),
  ('sender', 'support@', 20, 'Support address - verify legitimacy')
on conflict do nothing;

-- Function to calculate message security score
create or replace function public.calculate_message_security_score(
  message_body text,
  message_subject text,
  sender_handle text,
  attachment_types text[]
)
returns jsonb as $$
declare
  score int := 100;
  flags jsonb := '[]'::jsonb;
  pattern record;
  body_lower text;
  subject_lower text;
begin
  body_lower := lower(message_body);
  subject_lower := lower(message_subject);
  
  -- Check for suspicious keywords in body and subject
  for pattern in 
    select pattern_value, severity, description
    from public.suspicious_patterns
    where pattern_type = 'keyword' and is_active = true
  loop
    if body_lower like '%' || pattern.pattern_value || '%' 
       or subject_lower like '%' || pattern.pattern_value || '%' then
      score := score - pattern.severity;
      flags := flags || jsonb_build_object(
        'type', 'keyword',
        'value', pattern.pattern_value,
        'severity', pattern.severity,
        'description', pattern.description
      );
    end if;
  end loop;
  
  -- Check for suspicious URLs
  for pattern in 
    select pattern_value, severity, description
    from public.suspicious_patterns
    where pattern_type = 'url' and is_active = true
  loop
    if body_lower like '%' || pattern.pattern_value || '%' then
      score := score - pattern.severity;
      flags := flags || jsonb_build_object(
        'type', 'url',
        'value', pattern.pattern_value,
        'severity', pattern.severity,
        'description', pattern.description
      );
    end if;
  end loop;
  
  -- Check for suspicious attachments
  if attachment_types is not null and array_length(attachment_types, 1) > 0 then
    for pattern in 
      select pattern_value, severity, description
      from public.suspicious_patterns
      where pattern_type = 'attachment' and is_active = true
    loop
      if exists (
        select 1 from unnest(attachment_types) as ext
        where ext like '%' || pattern.pattern_value
      ) then
        score := score - pattern.severity;
        flags := flags || jsonb_build_object(
          'type', 'attachment',
          'value', pattern.pattern_value,
          'severity', pattern.severity,
          'description', pattern.description
        );
      end if;
    end loop;
  end if;
  
  -- Check sender patterns
  for pattern in 
    select pattern_value, severity, description
    from public.suspicious_patterns
    where pattern_type = 'sender' and is_active = true
  loop
    if sender_handle like pattern.pattern_value || '%' then
      score := score - pattern.severity;
      flags := flags || jsonb_build_object(
        'type', 'sender',
        'value', pattern.pattern_value,
        'severity', pattern.severity,
        'description', pattern.description
      );
    end if;
  end loop;
  
  -- Ensure score stays in 0-100 range
  if score < 0 then score := 0; end if;
  if score > 100 then score := 100; end if;
  
  return jsonb_build_object(
    'score', score,
    'flags', flags
  );
end;
$$ language plpgsql stable;

-- Grant execute permission
grant execute on function public.calculate_message_security_score(text, text, text, text[]) to authenticated;

-- ============================================================
-- CONTEXT-AWARE FILTERING
-- ============================================================

-- Sender reputation table
create table if not exists public.sender_reputation (
  id                uuid primary key default uuid_generate_v4(),
  profile_id        uuid not null references public.profiles(id) on delete cascade,
  messages_sent     int default 0,
  messages_received int default 0,
  spam_reports      int default 0,
  account_age_days  int default 0,
  is_verified       boolean default false,
  reputation_score  int default 50,  -- 0-100, starts at 50
  last_calculated   timestamptz default now(),
  unique (profile_id)
);

create index sender_reputation_profile_idx on public.sender_reputation (profile_id);
create index sender_reputation_score_idx on public.sender_reputation (reputation_score);

-- Conversation history table
create table if not exists public.conversation_history (
  id                uuid primary key default uuid_generate_v4(),
  profile_a         uuid not null references public.profiles(id) on delete cascade,
  profile_b         uuid not null references public.profiles(id) on delete cascade,
  message_count     int default 0,
  first_message_at  timestamptz default now(),
  last_message_at   timestamptz default now(),
  unique (profile_a, profile_b)
);

create index conversation_history_a_idx on public.conversation_history (profile_a);
create index conversation_history_b_idx on public.conversation_history (profile_b);

-- RLS policies
alter table public.sender_reputation enable row level security;
alter table public.conversation_history enable row level security;

create policy "sender_reputation_read"
  on public.sender_reputation for select
  using (true);  -- Public read for reputation checking

create policy "conversation_history_read"
  on public.conversation_history for select
  using (auth.uid() = profile_a or auth.uid() = profile_b);

-- Function to calculate sender reputation
create or replace function public.calculate_sender_reputation(sender_id uuid)
returns int as $$
declare
  rep_score int := 50;  -- Start at neutral
  account_age int;
  msg_sent int;
  msg_received int;
  spam_count int;
  is_verified bool;
begin
  -- Get sender data
  select 
    extract(day from now() - created_at)::int,
    verified
  into account_age, is_verified
  from public.profiles
  where id = sender_id;
  
  -- Get message stats
  select count(*) into msg_sent
  from public.messages
  where from_profile_id = sender_id;
  
  select count(*) into msg_received
  from public.messages
  where to_profile_id = sender_id;
  
  -- Get spam reports
  select count(*) into spam_count
  from public.messages
  where from_profile_id = sender_id
  and category = 'isolated';
  
  -- Calculate reputation
  -- Account age bonus (max +20)
  if account_age > 365 then
    rep_score := rep_score + 20;
  elsif account_age > 180 then
    rep_score := rep_score + 15;
  elsif account_age > 90 then
    rep_score := rep_score + 10;
  elsif account_age > 30 then
    rep_score := rep_score + 5;
  elsif account_age < 7 then
    rep_score := rep_score - 10;  -- Very new account
  end if;
  
  -- Verified account bonus (+15)
  if is_verified then
    rep_score := rep_score + 15;
  end if;
  
  -- Message activity bonus (max +15)
  if msg_sent > 100 and msg_received > 50 then
    rep_score := rep_score + 15;
  elsif msg_sent > 50 and msg_received > 25 then
    rep_score := rep_score + 10;
  elsif msg_sent > 10 and msg_received > 5 then
    rep_score := rep_score + 5;
  end if;
  
  -- Spam penalty
  if spam_count > 10 then
    rep_score := rep_score - 40;
  elsif spam_count > 5 then
    rep_score := rep_score - 25;
  elsif spam_count > 2 then
    rep_score := rep_score - 15;
  end if;
  
  -- Ensure score stays in 0-100 range
  if rep_score < 0 then rep_score := 0; end if;
  if rep_score > 100 then rep_score := 100; end if;
  
  return rep_score;
end;
$$ language plpgsql stable;

-- Enhanced security scoring with context
create or replace function public.calculate_message_security_score_v2(
  message_body text,
  message_subject text,
  sender_id uuid,
  recipient_id uuid,
  sender_handle text,
  attachment_types text[]
)
returns jsonb as $$
declare
  base_score int := 100;
  final_score int;
  flags jsonb := '[]'::jsonb;
  pattern record;
  body_lower text;
  subject_lower text;
  sender_reputation int;
  conversation_exists boolean;
  message_count int;
  pattern_count int := 0;
  high_severity_count int := 0;
begin
  body_lower := lower(message_body);
  subject_lower := lower(message_subject);
  
  -- Get sender reputation
  sender_reputation := calculate_sender_reputation(sender_id);
  
  -- Check if conversation exists
  select count(*) > 0, coalesce(max(message_count), 0)
  into conversation_exists, message_count
  from public.conversation_history
  where (profile_a = sender_id and profile_b = recipient_id)
     or (profile_a = recipient_id and profile_b = sender_id);
  
  -- CONTEXT MODIFIERS
  -- High reputation sender: reduce pattern severity by 50%
  -- Existing conversation: reduce pattern severity by 30%
  -- First message from stranger: increase pattern severity by 20%
  
  declare
    severity_multiplier numeric := 1.0;
  begin
    if sender_reputation >= 80 then
      severity_multiplier := 0.5;  -- Trusted sender
    elsif sender_reputation >= 60 then
      severity_multiplier := 0.7;  -- Good reputation
    elsif sender_reputation < 30 then
      severity_multiplier := 1.3;  -- Poor reputation
    end if;
    
    if conversation_exists and message_count > 5 then
      severity_multiplier := severity_multiplier * 0.7;  -- Ongoing conversation
    elsif not conversation_exists then
      severity_multiplier := severity_multiplier * 1.2;  -- First contact
    end if;
    
    -- Check for suspicious keywords
    for pattern in 
      select pattern_value, severity, description
      from public.suspicious_patterns
      where pattern_type = 'keyword' and is_active = true
    loop
      if body_lower like '%' || pattern.pattern_value || '%' 
         or subject_lower like '%' || pattern.pattern_value || '%' then
        declare
          adjusted_severity int := (pattern.severity * severity_multiplier)::int;
        begin
          base_score := base_score - adjusted_severity;
          pattern_count := pattern_count + 1;
          if adjusted_severity > 50 then
            high_severity_count := high_severity_count + 1;
          end if;
          
          flags := flags || jsonb_build_object(
            'type', 'keyword',
            'value', pattern.pattern_value,
            'severity', adjusted_severity,
            'original_severity', pattern.severity,
            'description', pattern.description,
            'context', case 
              when sender_reputation >= 80 then 'trusted_sender'
              when conversation_exists then 'existing_conversation'
              else 'first_contact'
            end
          );
        end;
      end if;
    end loop;
    
    -- Check for suspicious URLs
    for pattern in 
      select pattern_value, severity, description
      from public.suspicious_patterns
      where pattern_type = 'url' and is_active = true
    loop
      if body_lower like '%' || pattern.pattern_value || '%' then
        declare
          adjusted_severity int := (pattern.severity * severity_multiplier)::int;
        begin
          base_score := base_score - adjusted_severity;
          pattern_count := pattern_count + 1;
          if adjusted_severity > 50 then
            high_severity_count := high_severity_count + 1;
          end if;
          
          flags := flags || jsonb_build_object(
            'type', 'url',
            'value', pattern.pattern_value,
            'severity', adjusted_severity,
            'original_severity', pattern.severity,
            'description', pattern.description
          );
        end;
      end if;
    end loop;
    
    -- Check for suspicious attachments (context-aware)
    if attachment_types is not null and array_length(attachment_types, 1) > 0 then
      for pattern in 
        select pattern_value, severity, description
        from public.suspicious_patterns
        where pattern_type = 'attachment' and is_active = true
      loop
        if exists (
          select 1 from unnest(attachment_types) as ext
          where ext like '%' || pattern.pattern_value
        ) then
          declare
            adjusted_severity int := (pattern.severity * severity_multiplier)::int;
          begin
            base_score := base_score - adjusted_severity;
            pattern_count := pattern_count + 1;
            if adjusted_severity > 50 then
              high_severity_count := high_severity_count + 1;
            end if;
            
            flags := flags || jsonb_build_object(
              'type', 'attachment',
              'value', pattern.pattern_value,
              'severity', adjusted_severity,
              'original_severity', pattern.severity,
              'description', pattern.description,
              'context', case 
                when sender_reputation >= 80 then 'trusted_sender'
                when conversation_exists then 'existing_conversation'
                else 'first_contact'
              end
            );
          end;
        end if;
      end loop;
    end if;
    
    -- Check sender patterns
    for pattern in 
      select pattern_value, severity, description
      from public.suspicious_patterns
      where pattern_type = 'sender' and is_active = true
    loop
      if sender_handle like pattern.pattern_value || '%' then
        declare
          adjusted_severity int := (pattern.severity * severity_multiplier)::int;
        begin
          base_score := base_score - adjusted_severity;
          pattern_count := pattern_count + 1;
          
          flags := flags || jsonb_build_object(
            'type', 'sender',
            'value', pattern.pattern_value,
            'severity', adjusted_severity,
            'original_severity', pattern.severity,
            'description', pattern.description
          );
        end;
      end if;
    end loop;
  end;
  
  -- SMART DECISION LOGIC
  -- Multiple weak signals = suspicious
  -- Single strong signal from stranger = suspicious
  -- Any signal from trusted sender = just flag, don't isolate
  
  if sender_reputation >= 80 then
    -- Trusted sender: minimum score 60 (never isolate)
    if base_score < 60 then
      base_score := 60;
    end if;
  elsif conversation_exists and message_count > 10 then
    -- Established conversation: minimum score 50
    if base_score < 50 then
      base_score := 50;
    end if;
  elsif high_severity_count >= 3 or (high_severity_count >= 2 and not conversation_exists) then
    -- Multiple high-severity patterns: cap at 40 (suspicious)
    if base_score > 40 then
      base_score := 40;
    end if;
  end if;
  
  -- Ensure score stays in 0-100 range
  if base_score < 0 then base_score := 0; end if;
  if base_score > 100 then base_score := 100; end if;
  
  final_score := base_score;
  
  return jsonb_build_object(
    'score', final_score,
    'flags', flags,
    'context', jsonb_build_object(
      'sender_reputation', sender_reputation,
      'conversation_exists', conversation_exists,
      'message_count', message_count,
      'pattern_count', pattern_count,
      'high_severity_count', high_severity_count
    )
  );
end;
$$ language plpgsql stable;

grant execute on function public.calculate_sender_reputation(uuid) to authenticated;
grant execute on function public.calculate_message_security_score_v2(text, text, uuid, uuid, text, text[]) to authenticated;
