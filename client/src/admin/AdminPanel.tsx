import React, { useState } from 'react';
import AdminLayout from './components/layout/AdminLayout';
import {
  Dashboard, Users, Billing, KeywordResearch, Clusters,
  Citations, PageAnalysis, SeoBacklinks, Faq, PbnDetections,
  SystemHealth, ApiCache, Features,
} from './pages';
import type { AdminPage } from './types';
import './styles/globals.css';

/**
 * AdminPanel — drop this into your existing app wherever you want the admin UI.
 *
 * Usage:
 *   import AdminPanel from '@/admin/AdminPanel';
 *   // Then render it behind your auth guard:
 *   <AdminPanel />
 *
 * The component manages its own internal navigation state.
 * If you want to control the active page from outside (e.g. via your app router),
 * pass `page` and `onNavigate` props instead.
 */

interface AdminPanelProps {
  /** Optional: control active page externally (e.g. from React Router) */
  page?: AdminPage;
  /** Optional: called when user clicks a sidebar nav item */
  onNavigate?: (page: AdminPage) => void;
}

const PAGE_MAP: Record<AdminPage, React.ReactNode> = {
  dashboard:          <Dashboard />,
  users:              <Users />,
  billing:            <Billing />,
  'keyword-research': <KeywordResearch />,
  'keyword-clusters': <Clusters />,
  citations:          <Citations />,
  'page-analysis':    <PageAnalysis />,
  'seo-backlinks':    <SeoBacklinks />,
  faq:                <Faq />,
  'pbn-detections':   <PbnDetections />,
  'system-health':    <SystemHealth />,
  'api-cache':        <ApiCache />,
  features:           <Features />,
};

const AdminPanel: React.FC<AdminPanelProps> = ({ page: externalPage, onNavigate: externalNavigate }) => {
  const [internalPage, setInternalPage] = useState<AdminPage>('dashboard');

  // Use external control if provided, otherwise use internal state
  const activePage = externalPage ?? internalPage;
  const handleNavigate = externalNavigate ?? setInternalPage;

  return (
    <AdminLayout activePage={activePage} onNavigate={handleNavigate}>
      {PAGE_MAP[activePage]}
    </AdminLayout>
  );
};

export default AdminPanel;
