import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../ui/Button';
import { EmptyState, Page } from '../ui/misc';

/** Shows a recoverable message instead of a blank page if rendering crashes. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('SchoolSwap crashed:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <Page>
        <EmptyState icon="alert" title="Something went wrong">
          <p>Reload the page to continue. Your account and listings are safe.</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </EmptyState>
      </Page>
    );
  }
}
