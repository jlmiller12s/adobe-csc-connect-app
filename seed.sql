-- seed.sql
-- Run this in your Supabase SQL Editor AFTER schema.sql

insert into public.channels (name, description, is_default)
values 
  ('General', 'General conference chat and announcements', true),
  ('Travel Help', 'Need a ride or have travel questions?', true),
  ('AI Sessions', 'Discussion for AI related sessions', true),
  ('Workfront', 'Workfront specific team chat', true),
  ('Firefly', 'Adobe Firefly enthusiasts', true),
  ('Networking', 'Connect with other attendees', true),
  ('Social', 'Dinner plans, drinks, and offsite events', true);

insert into public.sessions (title, start_time, end_time, location, description)
values
  ('Opening Keynote', '2026-04-10 09:00:00+00', '2026-04-10 10:30:00+00', 'Main Stage', 'Welcome to Adobe CSC. Get ready for an amazing conference.'),
  ('The Future of GenAI in Enterprise', '2026-04-10 11:00:00+00', '2026-04-10 12:00:00+00', 'Room A', 'Exploring new AI capabilities and how we use Firefly internally.'),
  ('Building Team Culture', '2026-04-10 13:00:00+00', '2026-04-10 14:00:00+00', 'Room B', 'Interactive workshop on cross-functional alignment.'),
  ('Networking Dinner', '2026-04-10 18:30:00+00', '2026-04-10 21:00:00+00', 'Downtown Venue', 'Join us for food, drinks, and networking.');

insert into public.announcements (title, content, is_pinned)
values
  ('Welcome to Adobe CSC!', 'We are so excited to have you all here. Make sure to check the schedule.', true),
  ('Bus Schedule', 'Buses leave from the front of the hotel at 8:15 AM sharp.', false);
