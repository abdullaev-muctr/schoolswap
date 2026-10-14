// Seeds the School Office admin, demo students, demo listings and DEMO news stories.
// Safe to run again: it updates the accounts and replaces earlier demo content.
//
//   npm run seed            (reads .env.seed.local, see .env.seed.example)

import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_PASSWORD } = process.env;
for (const [key, value] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD, DEMO_PASSWORD })) {
  if (!value) throw new Error(`Missing ${key}. Copy .env.seed.example to .env.seed.local and fill it in.`);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const HOUR = 3600e3;
const DAY = 24 * HOUR;
const ago = (ms) => new Date(Date.now() - ms).toISOString();

const STUDENTS = [
  { key: 'mia', name: 'Mia Thompson', email: 'mia.demo@example.com' },
  { key: 'leo', name: 'Leo Park', email: 'leo.demo@example.com' },
  { key: 'sofia', name: 'Sofia Reyes', email: 'sofia.demo@example.com' },
  { key: 'daniel', name: 'Daniel Okafor', email: 'daniel.demo@example.com' },
];

const LISTINGS = [
  { seller: 'leo', title: 'Chemistry textbook, Year 10', price: 12, condition: 'Good', category: 'Textbooks', age: 2 * HOUR, photos: ['art:book:#0a3a6c', 'art:book:#123f6e:35%', 'art:flask:#0d3360'], description: 'Oxford GCSE Chemistry, 3rd edition. A few pencil notes in chapters 4–6, otherwise clean. Covers everything for the Year 10 course.' },
  { seller: 'mia', title: 'Casio fx-CG50 graphing calculator', price: 45, condition: 'Like new', category: 'Electronics', age: 5 * HOUR, photos: ['art:calc:#0a3a6c', 'art:calc:#16477a:40%'], description: 'Used for one term of A-level Maths. Comes with the cover and a USB cable. Batteries included.' },
  { seller: 'sofia', title: 'Braemar hoodie, size M', price: 20, condition: 'Like new', category: 'Clothing', age: DAY, photos: ['art:hoodie:#0a3a6c'], description: 'Official navy school hoodie. Worn twice, I ordered the wrong size.' },
  { seller: 'daniel', title: 'Wireless headphones', price: 30, condition: 'Good', category: 'Electronics', age: 1.4 * DAY, photos: ['art:headphones:#0f3c68'], description: 'Over-ear, Bluetooth, about 20 hours of battery. Small scratch on the left side.' },
  { seller: 'leo', title: 'Geometry set and scientific ruler', price: 5, condition: 'New', category: 'School supplies', age: 2 * DAY, photos: ['art:ruler:#0a3a6c'], description: 'Unopened. Compass, protractor, set squares and a 30 cm ruler.' },
  { seller: 'daniel', title: 'Acoustic guitar with soft case', price: 80, condition: 'Good', category: 'Other', age: 3 * DAY, photos: ['art:guitar:#0a3a6c', 'art:guitar:#123f6e:60%'], description: 'Full-size, good for the music club. New strings in September.' },
  { seller: 'sofia', title: 'English Literature set texts (3 books)', price: 15, condition: 'Good', category: 'Textbooks', age: 3.5 * DAY, photos: ['art:book:#0f3c68'], description: 'Macbeth, An Inspector Calls and A Christmas Carol. Annotated with useful quotes.' },
  { seller: 'mia', title: 'School backpack, navy', price: 18, condition: 'Like new', category: 'Clothing', age: 4 * DAY, photos: ['art:bag:#0a3a6c'], description: 'Fits a 15" laptop. Two side pockets for bottles.' },
  { seller: 'leo', title: 'Football boots, UK 7', price: 25, condition: 'Fair', category: 'Other', age: 6 * DAY, status: 'sold', photos: ['art:ball:#0a3a6c'], description: 'Moulded studs. Good grip left, some wear on the toe.' },
  { seller: 'sofia', title: 'Pack of 10 A4 exercise books', price: 6, condition: 'New', category: 'School supplies', age: 7 * DAY, photos: ['art:pencil:#0f3c68'], description: 'Lined, 80 pages each. Bought too many.' },
];

const ARTICLES = [
  { section: 'Notices', is_notice: true, title: 'East staircase closed for repairs until Friday', author: 'School Office', age: 3 * HOUR, photo: 'art:stairs:#5a2a1f', summary: 'Use the main staircase or the lift by the library. The east stairs between floors 1 and 3 are closed while the handrails are replaced.', body: ['The east staircase will be closed from Wednesday morning until the end of the school day on Friday while contractors replace the handrails between the first and third floors.', 'Students with lessons in the science block should use the main staircase by reception. The lift next to the library is available for anyone who needs it.', 'Teachers on duty will be at both ends of the corridor during changeovers. Please allow a few extra minutes to get to class.'] },
  { section: 'Achievements', title: 'Year 11 team wins the regional robotics final', author: 'Student Council', age: DAY, photo: 'art:trophy:#0a3a6c', summary: 'Four students built a sorting robot in six weeks and beat 22 schools to first place. They now go to the national round in March.', body: ['The Year 11 robotics team took first place at the regional final on Saturday, finishing ahead of 22 other schools.', 'Their robot sorted coloured blocks by weight and size in under two minutes. The judges praised the team’s design notebook and their clean wiring.', 'The team will represent the region at the national round in March. They are looking for two more members who can code in Python.'] },
  { section: 'Events', title: 'Winter concert tickets go on sale Monday', author: 'Music Department', age: 2 * DAY, photo: 'art:music:#1d4a7a', summary: 'Choir, orchestra and the jazz band perform on December 12 in the main hall.', body: ['Tickets for the winter concert go on sale on Monday at the reception desk and cost $5 for students.', 'The programme includes the senior choir, the school orchestra and the jazz band, who will close the evening.'] },
  { section: 'Announcements', title: 'Library extends opening hours before exams', author: 'Library', age: 2.5 * DAY, photo: 'art:book:#123f6e', summary: 'From November 1 the library stays open until 6 pm on weekdays.', body: ['The library will stay open until 6 pm from Monday to Thursday, starting November 1.', 'Quiet study rooms can be booked at the front desk for groups of up to four.'] },
  { section: 'Events', title: 'Science fair: projects due November 20', author: 'Science Department', age: 3 * DAY, photo: 'art:flask:#0d3360', summary: 'Register your project with your science teacher by the end of this month.', body: ['This year’s science fair takes place on November 27. Projects can be done alone or in pairs.'] },
  { section: 'Achievements', title: 'Under-15 football team reaches cup semi-final', author: 'PE Department', age: 4 * DAY, photo: 'art:ball:#0f3c68', summary: 'A 3–1 win on Thursday sends the team through.', body: ['Goals in both halves gave the under-15s a 3–1 win and a place in the semi-final.'] },
  { section: 'Announcements', title: 'New lost property point at reception', author: 'School Office', age: 5 * DAY, photo: 'art:bag:#123f6e', summary: 'Unclaimed items are donated at the end of each term.', body: ['Lost property now has its own shelf at reception. Items not collected by the end of term will be donated.'] },
  { section: 'Events', title: 'Parents’ evening for Years 9 and 10', author: 'School Office', age: 6 * DAY, photo: 'art:calendar:#0a3a6c', summary: 'Book a slot with each teacher through the school office.', body: ['Parents’ evening for Years 9 and 10 takes place on November 6 from 4 pm to 7 pm.'] },
];

async function check(promise) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return data;
}

/** Creates the account, or resets its name and password if it already exists. */
async function upsertUser(existing, { name, email, password }) {
  const found = existing.find((u) => u.email === email);
  if (found) {
    await check(db.auth.admin.updateUserById(found.id, { password, user_metadata: { name } }));
    await check(db.from('profiles').update({ name }).eq('id', found.id));
    return found.id;
  }
  const { user } = await check(
    db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } }),
  );
  return user.id;
}

const { users: existing } = await check(db.auth.admin.listUsers({ perPage: 1000 }));

const adminId = await upsertUser(existing, { name: 'School Office', email: ADMIN_EMAIL.toLowerCase(), password: ADMIN_PASSWORD });
await check(db.from('profiles').update({ role: 'admin' }).eq('id', adminId));
console.log(`Admin ready: ${ADMIN_EMAIL}`);

const ids = {};
for (const s of STUDENTS) ids[s.key] = await upsertUser(existing, { ...s, password: DEMO_PASSWORD });
console.log(`Demo students ready: ${STUDENTS.map((s) => s.email).join(', ')}`);

await check(db.from('listings').delete().in('seller_id', Object.values(ids)));
await check(
  db.from('listings').insert(
    LISTINGS.map(({ seller, age, status = 'active', ...l }) => ({ ...l, status, seller_id: ids[seller], created_at: ago(age) })),
  ),
);
console.log(`Demo listings: ${LISTINGS.length}`);

await check(db.from('articles').delete().eq('is_demo', true));
await check(
  db.from('articles').insert(
    ARTICLES.map(({ author, age, photo, body, is_notice = false, ...a }) => ({
      ...a,
      is_notice,
      is_demo: true,
      author_id: adminId,
      author_name: author,
      photo_url: photo,
      body: body.join('\n\n'),
      published_at: ago(age),
    })),
  ),
);
console.log(`Demo articles: ${ARTICLES.length}`);
