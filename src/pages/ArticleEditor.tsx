import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useArticle, useSaveArticle } from '../api/news';
import { uploadPhoto } from '../api/storage';
import { useAuth } from '../auth/AuthProvider';
import { NewsShell } from '../components/news/NewsShell';
import { Button, ButtonLink } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Photo } from '../components/ui/Photo';
import { useFeedback } from '../components/ui/feedback';
import { Loading } from '../components/ui/misc';
import { NEWS_SECTIONS, type NewsSection } from '../lib/constants';
import type { Article } from '../types';

/** Admin-only: create (/news/new) or edit (/news/:id/edit) an article. */
export function ArticleEditor() {
  const { id } = useParams();
  const { data: article, isPending } = useArticle(id);
  if (id && isPending) return <Loading />;
  return <EditorForm key={id ?? 'new'} article={article ?? null} />;
}

const today = () => new Date().toISOString().slice(0, 10);

function EditorForm({ article }: { article: Article | null }) {
  const { profile } = useAuth();
  const { toast } = useFeedback();
  const navigate = useNavigate();
  const save = useSaveArticle();

  const [title, setTitle] = useState(article?.title ?? '');
  const [summary, setSummary] = useState(article?.summary ?? '');
  const [section, setSection] = useState<NewsSection>(article?.section ?? 'Announcements');
  const [date, setDate] = useState(article ? article.published_at.slice(0, 10) : today());
  const [body, setBody] = useState(article?.body ?? '');
  const [isNotice, setIsNotice] = useState(article?.is_notice ?? false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(article?.photo_url ?? null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const backTo = article ? `/news/${article.id}` : '/news';

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 3) {
      toast('Add a headline first', 'error');
      return;
    }
    setBusy(true);
    try {
      const photo_url = file ? await uploadPhoto(profile!.id, file) : (article?.photo_url ?? null);
      // Keep the original time of day when only the date changes.
      const publishedAt =
        article && article.published_at.slice(0, 10) === date ? article.published_at : new Date(`${date}T12:00:00`).toISOString();
      const savedId = await save.mutateAsync({
        id: article?.id,
        input: {
          title: title.trim(),
          summary: summary.trim(),
          section,
          body: body.trim(),
          is_notice: isNotice,
          photo_url,
          published_at: publishedAt,
          ...(article ? {} : { author_name: profile!.name }),
        },
      });
      toast(article ? 'Article updated' : 'Article published');
      navigate(`/news/${savedId}`, { replace: true });
    } catch (err) {
      toast((err as Error).message, 'error');
      setBusy(false);
    }
  };

  return (
    <NewsShell showDemoFlag={false}>
      <form className="news-form" onSubmit={submit} noValidate>
        <Link className="back-news" to={backTo}>
          <Icon name="back" />
          Back
        </Link>
        <h1>{article ? 'Edit article' : 'New article'}</h1>

        <div className="news-field">
          <label htmlFor="n-title">Headline</label>
          <input
            className="input input--headline"
            id="n-title"
            maxLength={140}
            placeholder="What happened?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="news-field">
          <label htmlFor="n-summary">Summary</label>
          <textarea
            className="input input--short"
            id="n-summary"
            placeholder="One or two sentences shown on the front page"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        <div className="news-form__grid">
          <div className="news-field">
            <label htmlFor="n-section">Section</label>
            <select className="input" id="n-section" value={section} onChange={(e) => setSection(e.target.value as NewsSection)}>
              {NEWS_SECTIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="news-field">
            <label htmlFor="n-date">Date</label>
            <input className="input" id="n-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="news-field">
          <label htmlFor="n-photo">Photo</label>
          <div className="news-form__photo">
            <Photo src={preview} variant="news" />
            <div>
              <input id="n-photo" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              <p className="news-field__hint">JPG or PNG. Wide photos look best.</p>
            </div>
          </div>
        </div>

        <div className="news-field">
          <label htmlFor="n-body">Article text</label>
          <textarea
            className="input"
            id="n-body"
            placeholder="Write the full article. Leave an empty line between paragraphs."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <label className="news-check">
          <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)} />
          <span>
            <b>Show as important notice</b>
            <br />
            Pinned in a box at the top of School News. Use for closures, safety and urgent changes.
          </span>
        </label>

        <div className="news-form__actions">
          <ButtonLink to={backTo} variant="news-outline">
            Cancel
          </ButtonLink>
          <Button type="submit" variant="news" disabled={busy}>
            {busy ? 'Saving…' : article ? 'Save changes' : 'Publish article'}
          </Button>
        </div>
      </form>
    </NewsShell>
  );
}
