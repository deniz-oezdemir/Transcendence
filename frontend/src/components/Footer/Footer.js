import { createComponent } from '@component';
import styles from './Footer.module.css';

export default function Footer() {
  return createComponent('footer', {
    className: styles.footer,
    content: `
      <div class="${styles.content}">
        <span class="${styles.text}">Made with <span class="${styles.emoji}">❤️</span> and <span class="${styles.emoji}">☕</span> by <strong>The42Team</strong></span>
        <span class="${styles.divider}">|</span>
        <span class="${styles.links}">
          <a href="#" class="${styles.link}">Twitter</a>
          <span class="${styles.divider}">•</span>
          <a href="#" class="${styles.link}">Instagram</a>
          <span class="${styles.divider}">•</span>
          <a href="#" class="${styles.link}">GitHub</a>
        </span>
        <span class="${styles.divider}">|</span>
        <span class="${styles.copyright}">© 2025 - All rights reserved</span>
      </div>
    `,
  });
}
