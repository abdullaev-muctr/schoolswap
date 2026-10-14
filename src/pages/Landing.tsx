import { Link } from 'react-router-dom';
import { useListings } from '../api/listings';
import { useArticles } from '../api/news';
import { useAuth } from '../auth/AuthProvider';
import { Footer } from '../components/layout/Footer';
import { Intro } from '../components/layout/Intro';
import { ListingGrid } from '../components/market/ListingCard';
import { ButtonLink } from '../components/ui/Button';
import { Avatar } from '../components/ui/misc';
import { SITE, TEAM } from '../config';

const STEPS = [
  { title: 'List it in a minute', text: 'Add photos, a price and the condition. Only students of our school use SchoolSwap.' },
  { title: 'Find what you need', text: 'Search or browse by category: textbooks, supplies, electronics, clothing and more.' },
  { title: 'Message and meet', text: 'Chat with the seller inside SchoolSwap and hand it over at school. No online payment.' },
];

export function Landing() {
  const { profile } = useAuth();
  const { data: listings = [] } = useListings();
  const { data: articles = [] } = useArticles();
  const featured = listings.filter((l) => l.status === 'active').slice(0, 4);

  return (
    <>
      <Intro />

      <section className="hero">
        <div className="wrap">
          <div>
            <div className="label">{SITE.school} · Student marketplace</div>
            <h1>
              School<span>Swap</span>
            </h1>
            <p className="hero__lead">
              Made by students, for students. Sell the things you no longer need and find what you do, without leaving
              school.
            </p>
            <div className="hero__cta">
              <ButtonLink to="/market" variant="primary">
                Open marketplace
              </ButtonLink>
              {profile ? (
                <ButtonLink to="/sell">Sell an item</ButtonLink>
              ) : (
                <ButtonLink to="/signup">Create account</ButtonLink>
              )}
            </div>
            <div className="made">
              <i />A student production · {TEAM.name}
            </div>
          </div>
          <div className="hero__crest">
            <div className="hero__ring" />
            <img className="crest" src="/crest.webp" alt={`${SITE.school} crest`} />
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec__head">
            <h2>Why we built it</h2>
            <p>
              Textbooks get used for one year. Calculators, hoodies and guitars sit in cupboards. Someone two classes
              down needs exactly that.
            </p>
          </div>
          <div className="steps">
            {STEPS.map((step, i) => (
              <div key={step.title}>
                <div className="steps__n">{i + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="sec">
          <div className="wrap">
            <div className="sec__head">
              <h2>On the shelf now</h2>
              <p>The latest listings from students at {SITE.school}.</p>
            </div>
            <ListingGrid listings={featured} />
          </div>
        </section>
      )}

      <section className="sec">
        <div className="wrap">
          <div className="news-band">
            <div>
              <h2>School News</h2>
              <p>Events, announcements, student achievements and notices from the school office, in one place.</p>
              <ButtonLink to="/news">Read the news</ButtonLink>
            </div>
            <ul>
              {articles.slice(0, 3).map((a) => (
                <li key={a.id}>
                  <Link to={`/news/${a.id}`}>
                    <small>{a.section}</small>
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="sec__head">
            <h2>The team</h2>
            <p>
              Students of {SITE.school} built {SITE.name} as {TEAM.name}.
            </p>
          </div>
          <div className="team">
            {TEAM.members.map((m) => (
              <div key={m.name}>
                <Avatar name={m.name} large />
                <div className="team__name">{m.name}</div>
                <div className="team__role">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <img className="ghost-crest" src="/crest.webp" alt="" />
        <div className="wrap">
          <div>
            <h2>Ready to swap?</h2>
            <p>Create an account with your name and email and post your first listing today.</p>
          </div>
          <div className="cta-band__btns">
            <ButtonLink to="/market" variant="light">
              Go to marketplace
            </ButtonLink>
            {!profile && (
              <>
                <ButtonLink to="/signup">Sign up</ButtonLink>
                <ButtonLink to="/login">Log in</ButtonLink>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
