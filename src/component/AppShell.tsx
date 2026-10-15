import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronsUpDown,
  CircleHelp,
  LayoutGrid,
  PieChart,
  SlidersHorizontal,
  Sprout,
  SquarePen,
  Tags,
  TrendingUp,
  Wallet,
} from 'lucide-react'

import './AppShell.css'

type AppShellProps = {
  children: ReactNode
}

const navigationItems = [
  { label: 'Ringkasan', href: '#ringkasan', icon: LayoutGrid, active: true },
  { label: 'Transaksi', href: '#transaksi', icon: ArrowLeftRight },
  { label: 'Kategori', href: '#kategori', icon: Tags },
  { label: 'Anggaran', href: '#anggaran', icon: PieChart },
  { label: 'Laporan', href: '#laporan', icon: TrendingUp },
]

function AppShell({ children }: AppShellProps) {
  const [activeHref, setActiveHref] = useState(() => window.location.hash || '#ringkasan')

  useEffect(() => {
    function updateActiveHref() {
      setActiveHref(window.location.hash || '#ringkasan')
    }

    window.addEventListener('hashchange', updateActiveHref)
    return () => window.removeEventListener('hashchange', updateActiveHref)
  }, [])

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__top">
          <a className="app-brand" href="#ringkasan" aria-label="catat, ke ringkasan">
            <span className="app-brand__icon" aria-hidden="true">
              <SquarePen size={20} strokeWidth={2.2} />
            </span>
            <span className="app-brand__text">catat</span>
          </a>

          <button className="workspace-selector" type="button" aria-label="Pilih ruang kerja">
            <span className="workspace-selector__icon" aria-hidden="true">
              <Wallet size={18} />
            </span>
            <span className="workspace-selector__copy">
              <strong>Keuangan pribadi</strong>
              <small>Ruang kerja Nabila</small>
            </span>
            <ChevronsUpDown size={16} className="workspace-selector__chevron" aria-hidden="true" />
          </button>

          <nav className="app-navigation" aria-label="Navigasi utama">
            <p className="app-navigation__label">RUANG KERJA</p>
            <ul className="app-navigation__list">
              {navigationItems.map(({ label, href, icon: Icon, active }) => {
                const isCurrent = active || activeHref === href
                return (
                  <li key={label}>
                    <a
                      className={`app-navigation__item${isCurrent ? ' app-navigation__item--active' : ''}`}
                      href={href}
                      aria-current={isCurrent ? 'page' : undefined}
                    >
                      <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                      <span>{label}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>

        <div className="app-sidebar__bottom">
          <div className="sidebar-tip">
            <div className="sidebar-tip__icon" aria-hidden="true">
              <Sprout size={18} />
            </div>
            <strong className="sidebar-tip__title">Langkah kecil, setiap hari.</strong>
            <span className="sidebar-tip__body">
              Catatan yang rapi membantu keputusan yang lebih tenang.
            </span>
          </div>

          <div className="sidebar-footer-nav">
            <a className="sidebar-footer__link" href="#pengaturan">
              <SlidersHorizontal size={18} aria-hidden="true" />
              <span>Pengaturan</span>
            </a>
            <a className="sidebar-footer__link" href="#bantuan">
              <CircleHelp size={18} aria-hidden="true" />
              <span>Bantuan</span>
            </a>
          </div>

          <div className="profile-summary">
            <span className="profile-summary__avatar" aria-hidden="true">
              NP
            </span>
            <span className="profile-summary__copy">
              <strong>Nabila Putri</strong>
              <small>Akun pribadi</small>
            </span>
            <ChevronDown size={16} className="profile-summary__chevron" aria-hidden="true" />
          </div>
        </div>
      </aside>
      <main className="app-main">{children}</main>
    </div>
  )
}

export default AppShell
