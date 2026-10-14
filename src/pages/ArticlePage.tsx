import { Link, useNavigate, useParams } from 'react-router-dom';
import { useArticle, useDeleteArticle } from '../api/news';
import { useAuth } from '../auth/AuthProvider';
import { Kicker, NewsShell } from '../components/news/NewsShell';
import { Button, ButtonLink } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Photo } from '../components/ui/Photo';
import { useFeedback } from '../components/ui/feedback';
import { Loading } from '../components/ui/misc';
import { dateLong } from '../lib/format';

export function ArticlePage() {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const { toast, confirm } = useFeedback();
  const navigate = useNavigate();
  const { data: article, isPending } = useArticle(id);
  const deleteArticle = useDeleteArticle();

  if (isPending) return <Loading />;

  const back = (
    <Link className="back-news" to="/news">
      <Icon name="back" />
      School News
    </Link>
  );

  if (!article) {
    return (
      <NewsShell showDemoFlag={false}>
        <div className="article">
          {back}
          <p className="news-empty">This article was removed.</p>
        </div>
      </NewsShell>
    );
  }

  const remove = async () => {
    const ok = await confirm({ title: 'Delete article?', text: 'It disappears from School News for everyone.', okLabel: 'Delete' });
    if (!ok) return;
    try {
      await deleteArticle.mutateAsync(article.id);
      toast('Article deleted');
      navigate('/news');
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  };

  const paragraphs = article.body.split(/\n\s*\n/).filter((p) => p.trim());

  return (
    <NewsShell showDemoFlag={article.is_demo}>
      <article className="article">
        {back}
        <Kicker article={article} notice />
        <h1>{article.title}</h1>
        {article.summary && <p className="article__deck">{article.summary}</p>}

        <div className="article__by">
          <span>
            By <b>{article.author_name}</b> · {dateLong(article.published_at)}
          </span>
          {isAdmin && (
            <span className="row">
              <ButtonLink to={`/news/${article.id}/edit`} variant="news-outline">
                <Icon name="edit" />
                Edit
              </ButtonLink>
              <Button variant="news-outline" onClick={remove}>
                <Icon name="trash" />
                Delete
              </Button>
            </span>
          )}
        </div>

        <figure>
          <Photo src={article.photo_url} variant="news" fallback="megaphone" alt="" />
          {!article.photo_url?.startsWith('http') && <figcaption>Illustration. A real photo can be added by the school office.</figcaption>}
        </figure>

        <div className="article__body">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>
    </NewsShell>
  );
}
