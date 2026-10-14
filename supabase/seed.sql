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
    (leo, 'Chemistry textbook, Year 10', 'Oxford GCSE Chemistry, 3rd edition. A few pencil notes in chapters 4–6, otherwise clean. Covers everything for the Year 10 course.', 12, 'Textbooks', 'Good', array['art:book:#0a3a6c', 'art:book:#123f6e:35%', 'art:flask:#0d3360'], 'active', now() - interval '7200 seconds'),
    (mia, 'Casio fx-CG50 graphing calculator', 'Used for one term of A-level Maths. Comes with the cover and a USB cable. Batteries included.', 45, 'Electronics', 'Like new', array['art:calc:#0a3a6c', 'art:calc:#16477a:40%'], 'active', now() - interval '18000 seconds'),
    (sofia, 'Braemar hoodie, size M', 'Official navy school hoodie. Worn twice, I ordered the wrong size.', 20, 'Clothing', 'Like new', array['art:hoodie:#0a3a6c'], 'active', now() - interval '86400 seconds'),
    (daniel, 'Wireless headphones', 'Over-ear, Bluetooth, about 20 hours of battery. Small scratch on the left side.', 30, 'Electronics', 'Good', array['art:headphones:#0f3c68'], 'active', now() - interval '120960 seconds'),
    (leo, 'Geometry set and scientific ruler', 'Unopened. Compass, protractor, set squares and a 30 cm ruler.', 5, 'School supplies', 'New', array['art:ruler:#0a3a6c'], 'active', now() - interval '172800 seconds'),
    (daniel, 'Acoustic guitar with soft case', 'Full-size, good for the music club. New strings in September.', 80, 'Other', 'Good', array['art:guitar:#0a3a6c', 'art:guitar:#123f6e:60%'], 'active', now() - interval '259200 seconds'),
    (sofia, 'English Literature set texts (3 books)', 'Macbeth, An Inspector Calls and A Christmas Carol. Annotated with useful quotes.', 15, 'Textbooks', 'Good', array['art:book:#0f3c68'], 'active', now() - interval '302400 seconds'),
    (mia, 'School backpack, navy', 'Fits a 15" laptop. Two side pockets for bottles.', 18, 'Clothing', 'Like new', array['art:bag:#0a3a6c'], 'active', now() - interval '345600 seconds'),
    (leo, 'Football boots, UK 7', 'Moulded studs. Good grip left, some wear on the toe.', 25, 'Other', 'Fair', array['art:ball:#0a3a6c'], 'sold', now() - interval '518400 seconds'),
    (sofia, 'Pack of 10 A4 exercise books', 'Lined, 80 pages each. Bought too many.', 6, 'School supplies', 'New', array['art:pencil:#0f3c68'], 'active', now() - interval '604800 seconds');

  delete from public.articles where is_demo;
  insert into public.articles (author_id, author_name, section, title, summary, body, photo_url, is_notice, is_demo, published_at)
  values
    (admin_id, 'School Office', 'Notices', 'East staircase closed for repairs until Friday', 'Use the main staircase or the lift by the library. The east stairs between floors 1 and 3 are closed while the handrails are replaced.', 'The east staircase will be closed from Wednesday morning until the end of the school day on Friday while contractors replace the handrails between the first and third floors.

Students with lessons in the science block should use the main staircase by reception. The lift next to the library is available for anyone who needs it.

Teachers on duty will be at both ends of the corridor during changeovers. Please allow a few extra minutes to get to class.', 'art:stairs:#5a2a1f', true, true, now() - interval '10800 seconds'),
    (admin_id, 'Student Council', 'Achievements', 'Year 11 team wins the regional robotics final', 'Four students built a sorting robot in six weeks and beat 22 schools to first place. They now go to the national round in March.', 'The Year 11 robotics team took first place at the regional final on Saturday, finishing ahead of 22 other schools.

Their robot sorted coloured blocks by weight and size in under two minutes. The judges praised the team’s design notebook and their clean wiring.

The team will represent the region at the national round in March. They are looking for two more members who can code in Python.', 'art:trophy:#0a3a6c', false, true, now() - interval '86400 seconds'),
    (admin_id, 'Music Department', 'Events', 'Winter concert tickets go on sale Monday', 'Choir, orchestra and the jazz band perform on December 12 in the main hall.', 'Tickets for the winter concert go on sale on Monday at the reception desk and cost $5 for students.

The programme includes the senior choir, the school orchestra and the jazz band, who will close the evening.', 'art:music:#1d4a7a', false, true, now() - interval '172800 seconds'),
    (admin_id, 'Library', 'Announcements', 'Library extends opening hours before exams', 'From November 1 the library stays open until 6 pm on weekdays.', 'The library will stay open until 6 pm from Monday to Thursday, starting November 1.

Quiet study rooms can be booked at the front desk for groups of up to four.', 'art:book:#123f6e', false, true, now() - interval '216000 seconds'),
    (admin_id, 'Science Department', 'Events', 'Science fair: projects due November 20', 'Register your project with your science teacher by the end of this month.', 'This year’s science fair takes place on November 27. Projects can be done alone or in pairs.', 'art:flask:#0d3360', false, true, now() - interval '259200 seconds'),
    (admin_id, 'PE Department', 'Achievements', 'Under-15 football team reaches cup semi-final', 'A 3–1 win on Thursday sends the team through.', 'Goals in both halves gave the under-15s a 3–1 win and a place in the semi-final.', 'art:ball:#0f3c68', false, true, now() - interval '345600 seconds'),
    (admin_id, 'School Office', 'Announcements', 'New lost property point at reception', 'Unclaimed items are donated at the end of each term.', 'Lost property now has its own shelf at reception. Items not collected by the end of term will be donated.', 'art:bag:#123f6e', false, true, now() - interval '432000 seconds'),
    (admin_id, 'School Office', 'Events', 'Parents’ evening for Years 9 and 10', 'Book a slot with each teacher through the school office.', 'Parents’ evening for Years 9 and 10 takes place on November 6 from 4 pm to 7 pm.', 'art:calendar:#0a3a6c', false, true, now() - interval '518400 seconds');

  raise notice 'SchoolSwap demo data ready. Admin: %', admin_email;
end;
$$;
