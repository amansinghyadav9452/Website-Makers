import React from 'react';
import { useTranslation } from 'react-i18next';

export function MobileMenu({ isOpen, onClose, children }) {
  const { t } = useTranslation();
  
  if (!isOpen) return null;
  
  return (
    <div className="mobile-menu-overlay" onClick={onClose}>
      <div className="mobile-menu" onClick={e => e.stopPropagation()}>
        <button className="mobile-menu-close" onClick={onClose}>✕</button>
        <nav className="mobile-nav">
          <a href="#services" onClick={onClose}>{t('nav.services')}</a>
          <a href="#portfolio" onClick={onClose}>{t('nav.portfolio')}</a>
          <a href="#contact" onClick={onClose}>{t('nav.contact')}</a>
          <a href="/blog" onClick={onClose}>{t('nav.blog')}</a>
          <a href="/admin" onClick={onClose}>{t('nav.admin')}</a>
          <a href="/portal" onClick={onClose}>{t('nav.portal')}</a>
        </nav>
        {children}
      </div>
    </div>
  );
}