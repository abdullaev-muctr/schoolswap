import { Route, Routes } from 'react-router-dom';
import { AppLayout, RequireAuth } from './components/layout/AppLayout';
import { ButtonLink } from './components/ui/Button';
import { EmptyState, Page } from './components/ui/misc';
import { ArticleEditor } from './pages/ArticleEditor';
import { ArticlePage } from './pages/ArticlePage';
import { Login, Signup } from './pages/Auth';
import { Landing } from './pages/Landing';
import { ListingPage } from './pages/ListingPage';
import { Market } from './pages/Market';
import { Messages } from './pages/Messages';
import { MyListings } from './pages/MyListings';
import { News } from './pages/News';
import { SellPage } from './pages/SellPage';

function NotFound() {
  return (
    <Page>
      <EmptyState icon="search" title="Page not found">
        <ButtonLink to="/">Go home</ButtonLink>
      </EmptyState>
    </Page>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="news" element={<News />} />
        <Route path="news/:id" element={<ArticlePage />} />

        <Route element={<RequireAuth />}>
          <Route path="market" element={<Market />} />
          <Route path="market/:id" element={<ListingPage />} />
          <Route path="market/:id/edit" element={<SellPage />} />
          <Route path="sell" element={<SellPage />} />
          <Route path="me" element={<MyListings />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:id" element={<Messages />} />
        </Route>

        <Route element={<RequireAuth admin />}>
          <Route path="news/new" element={<ArticleEditor />} />
          <Route path="news/:id/edit" element={<ArticleEditor />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
