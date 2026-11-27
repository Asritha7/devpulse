import type { ReactNode } from 'react';
import { ThemeControl } from './ThemeControl';
import { Icon } from '../ui/Icon';

export function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className="app-layout">
    <a className="skip-link" href="#main">Skip to content</a>
    <aside className="sidebar" aria-label="Workspace sidebar">
      <a className="brand" href="#main"><span className="brand-mark"><Icon name="pulse" /></span>DevPulse<span className="brand-label">LOCAL</span></a>
      <div className="workspace-label"><span className="workspace-avatar" aria-hidden="true">D</span><div>Personal workspace<small>Your space to build</small></div></div>
      <nav aria-label="Main navigation">
        <p className="eyebrow">Workspace</p>
        <a className="nav-item active" href="#main" aria-current="page"><Icon name="overview" />Overview</a>
        <a className="nav-item" href="#tasks"><Icon name="tasks" /><span>Tasks</span></a>
        <a className="nav-item" href="#projects"><Icon name="projects" /><span>Projects</span></a>
      </nav>
      <div className="sidebar-bottom"><div className="privacy-note"><Icon name="shield" /><span>Private by design<small>Stored in this browser</small></span></div><ThemeControl /></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><span>Workspace <span className="breadcrumb-divider">/</span> <strong>Overview</strong></span><span className="pill">Workshop edition</span></header>
      <main id="main" tabIndex={-1}>{children}</main>
      <footer><span>DevPulse <span aria-hidden="true">·</span> Make room for meaningful work.</span><span>Local workspace</span></footer>
    </div>
  </div>;
}
