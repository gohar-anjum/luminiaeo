import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import type { AdminPage } from '../../types';

interface AdminLayoutProps {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  children: ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ activePage, onNavigate, children }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} />
      <div style={{ marginLeft: 'var(--sidebar)', flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar activePage={activePage} />
        <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
