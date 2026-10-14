-- SchoolSwap demo data: School Office admin, demo students, demo listings and DEMO news.
-- Run it in Supabase → SQL Editor after the schema migration. Safe to run again:
-- it resets the accounts' passwords and replaces earlier demo content.
--
-- Set the three values below before running. Do not commit real passwords.

create or replace function pg_temp.seed_user(p_email text, p_name text, p_password text)
returns uuid language plpgsql as $$
declare
  v_id uuid;
begin
  select id into v_id from auth.users where email = lower(p_email);

  if v_id is null then
    v_id := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change_token_current,
      email_change, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', lower(p_email),
      extensions.crypt(p_password, extensions.gen_salt('bf')), now(),
      '{"provider": "email", "providers": ["email"]}', jsonb_build_object('name', p_name), now(), now(),
      '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_id, v_id::text, 'email',
      jsonb_build_object('sub', v_id::text, 'email', lower(p_email), 'email_verified', true),
      now(), now(), now()
    );
  else
    update auth.users
    set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
        raw_user_meta_data = jsonb_build_object('name', p_name),
        updated_at = now()
    where id = v_id;
    update public.profiles set name = p_name where id = v_id;
  end if;

  return v_id;
end;
$$;

do $$
declare
  -- ▼ Change these three values ▼
  admin_email    text := 'office@schoolswap.site';
  admin_password text := 'CHANGE-ME-admin-password';
  demo_password  text := 'CHANGE-ME-demo-password';
  -- ▲ ------------------------ ▲

  admin_id uuid := pg_temp.seed_user(admin_email, 'School Office', admin_password);
  mia    uuid := pg_temp.seed_user('mia.demo@example.com', 'Mia Thompson', demo_password);
  leo    uuid := pg_temp.seed_user('leo.demo@example.com', 'Leo Park', demo_password);
  sofia  uuid := pg_temp.seed_user('sofia.demo@example.com', 'Sofia Reyes', demo_password);
  daniel uuid := pg_temp.seed_user('daniel.demo@example.com', 'Daniel Okafor', demo_password);
begin
  if admin_password like 'CHANGE-ME%' or demo_password like 'CHANGE-ME%' then
    raise exception 'Set admin_password and demo_password at the top of the script first';
  end if;

  update public.profiles set role = 'admin' where id = admin_id;

  delete from public.listings where seller_id in (mia, leo, sofia, daniel);
  insert into public.listings (seller_id, title, description, price, category, condition, photos, status, created_at)
  values
    (leo, 'Chemistry textbook, Year 10', 'Oxford GCSE Chemistry, 3rd edition. A few pencil notes in chapters 4–6, otherwise clean. Covers everything for the Year 10 course.', 12, 'Textbooks', 'Good', array['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&q=80&auto=format&fit=crop', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1200&q=80&auto=format&fit=crop'], 'active', now() - interval '7200 seconds'),
    (mia, 'Casio fx-CG50 graphing calculator', 'Used for one term of A-level Maths. Comes with the cover and a USB cable. Batteries included.', 45, 'Electronics', 'Like new', array['https://images.unsplash.com/photo-1564939558297-fc396f18e5c7?w=1200&q=80&auto=format&fit=crop', 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=1200&q=80&auto=format&fit=crop'], 'active', now() - interval '18000 seconds'),
    (sofia, 'Braemar hoodie, size M', 'Official navy school hoodie. Worn twice, I ordered the wrong size.', 20, 'Clothing', 'Like new', array['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=1200&q=80&auto=format&fit=crop', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1200&q=80&auto=format&fit=crop'], 'active', now() - interval '86400 seconds'),
    (daniel, 'Wireless headphones', 'Over-ear, Bluetooth, about 20 hours of battery. Small scratch on the left side.', 30, 'Electronics', 'Good', array['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&q=80&auto=format&fit=crop', 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=1200&q=80&auto=format&fit=crop'], 'active', now() - interval '120960 seconds'),
    (leo, 'Geometry set and scientific ruler', 'Unopened. Compass, protractor, set squares and a 30 cm ruler.', 5, 'School supplies', 'New', array['https://images.unsplash.com/photo-1596495578065-6e0763fa1178?w=1200&q=80&auto=format&fit=crop', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=1200&q=80&auto=format&fit=crop'], 'active', now() - interval '172800 seconds'),
    (daniel, 'Acoustic guitar with soft case', 'Full-size, good for the music club. New strings in September.', 80, 'Other', 'Good', array['https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1200&q=80&auto=format&fit=crop', 'https://images.unsplash.com/photo-1525201548942-d8732f6617a0?w=1200&q=80&auto=format&fit=crop'], 'active', now() - interval '259200 seconds'),
    (sofia, 'English Literature set texts (3 books)', 'Macbeth, An Inspector Calls and A Christmas Carol. Annotated with useful quotes.', 15, 'Textbooks', 'Good', array['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=1200&q=80&auto=format&fit=crop', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200&q=80&auto=format&fit=crop'], 'active', now() - interval '302400 seconds'),
    (mia, 'School backpack, navy', 'Fits a 15" laptop. Two side pockets for bottles.', 18, 'Clothing', 'Like new', array['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1200&q=80&auto=format&fit=crop', 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=1200&q=80&auto=format&fit=crop'], 'active', now() - interval '345600 seconds'),
    (leo, 'Football boots, UK 7', 'Moulded studs. Good grip left, some wear on the toe.', 25, 'Other', 'Fair', array['https://images.unsplash.com/photo-1511886929837-354d827aae26?w=1200&q=80&auto=format&fit=crop', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&q=80&auto=format&fit=crop'], 'sold', now() - interval '518400 seconds'),
    (sofia, 'Pack of 10 A4 exercise books', 'Lined, 80 pages each. Bought too many.', 6, 'School supplies', 'New', array['https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=1200&q=80&auto=format&fit=crop', 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=1200&q=80&auto=format&fit=crop'], 'active', now() - interval '604800 seconds');

  delete from public.articles where is_demo;
  insert into public.articles (author_id, author_name, section, title, summary, body, photo_url, is_notice, is_demo, published_at)
  values
    (admin_id, 'School Office', 'Notices', 'East staircase closed for repairs until Friday', 'Use the main staircase or the lift by the library. The east stairs between floors 1 and 3 are closed while the handrails are replaced.', 'The east staircase will be closed from Wednesday morning until the end of the school day on Friday while contractors replace the handrails between the first and third floors.

Students with lessons in the science block should use the main staircase by reception. The lift next to the library is available for anyone who needs it.

Teachers on duty will be at both ends of the corridor during changeovers. Please allow a few extra minutes to get to class.', 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=1200&q=80&auto=format&fit=crop', true, true, now() - interval '10800 seconds'),
    (admin_id, 'Student Council', 'Achievements', 'Year 11 team wins the regional robotics final', 'Four students built a sorting robot in six weeks and beat 22 schools to first place. They now go to the national round in March.', 'The Year 11 robotics team took first place at the regional final on Saturday, finishing ahead of 22 other schools.

Their robot sorted coloured blocks by weight and size in under two minutes. The judges praised the team’s design notebook and their clean wiring.

The team will represent the region at the national round in March. They are looking for two more members who can code in Python.', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80&auto=format&fit=crop', false, true, now() - interval '86400 seconds'),
    (admin_id, 'Music Department', 'Events', 'Winter concert tickets go on sale Monday', 'Choir, orchestra and the jazz band perform on December 12 in the main hall.', 'Tickets for the winter concert go on sale on Monday at the reception desk and cost $5 for students.

The programme includes the senior choir, the school orchestra and the jazz band, who will close the evening.', 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&q=80&auto=format&fit=crop', false, true, now() - interval '172800 seconds'),
    (admin_id, 'Library', 'Announcements', 'Library extends opening hours before exams', 'From November 1 the library stays open until 6 pm on weekdays.', 'The library will stay open until 6 pm from Monday to Thursday, starting November 1.

Quiet study rooms can be booked at the front desk for groups of up to four.', 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=80&auto=format&fit=crop', false, true, now() - interval '216000 seconds'),
    (admin_id, 'Science Department', 'Events', 'Science fair: projects due November 20', 'Register your project with your science teacher by the end of this month.', 'This year’s science fair takes place on November 27. Projects can be done alone or in pairs.', 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80&auto=format&fit=crop', false, true, now() - interval '259200 seconds'),
    (admin_id, 'PE Department', 'Achievements', 'Under-15 football team reaches cup semi-final', 'A 3–1 win on Thursday sends the team through.', 'Goals in both halves gave the under-15s a 3–1 win and a place in the semi-final.', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80&auto=format&fit=crop', false, true, now() - interval '345600 seconds'),
    (admin_id, 'School Office', 'Announcements', 'New lost property point at reception', 'Unclaimed items are donated at the end of each term.', 'Lost property now has its own shelf at reception. Items not collected by the end of term will be donated.', 'https://images.unsplash.com/photo-1586769852044-692d6e3703f0?w=1200&q=80&auto=format&fit=crop', false, true, now() - interval '432000 seconds'),
    (admin_id, 'School Office', 'Events', 'Parents’ evening for Years 9 and 10', 'Book a slot with each teacher through the school office.', 'Parents’ evening for Years 9 and 10 takes place on November 6 from 4 pm to 7 pm.', 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80&auto=format&fit=crop', false, true, now() - interval '518400 seconds');

  raise notice 'SchoolSwap demo data ready. Admin: %', admin_email;
end;
$$;
