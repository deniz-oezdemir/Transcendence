import { createComponent, Link, createCleanupContext } from '@component';
import styles from './ProfilePage.module.css';

export default function ProfilePage({ params, query }) {
  const cleanup = createCleanupContext();

  return createComponent('div', {
    className: styles.container,
    children: [
      createComponent('h1', {
        className: styles.profileTitle,
        content: `${params.username}'s Profile`,
      }),
      createComponent('p', {
        className: styles.profileDescription,
        content: 'Welcome to your Pong game profile page!',
      }),
      createComponent('hr', {}),

      // Profile Section
      createComponent('div', {
        className: styles.profileSection,
        children: [
          createComponent('div', {
            className: styles.profileCard,
            children: [
              createComponent('div', {
                className: styles.profileCardBody,
                children: [
                  createComponent('h5', {
                    className: styles.profileCardTitle,
                    content: params.username,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

      // Game Statistics Section
      createComponent('div', {
        className: styles.statsSection,
        children: [
          createComponent('h5', {
            className: styles.statsTitle,
            content: 'Game Statistics',
          }),
          createComponent('ul', {
            className: styles.statsList,
            children: [
              createComponent('li', {
                className: styles.statsItem,
                content: 'Total Games Played: 120',
              }),
              createComponent('li', {
                className: styles.statsItem,
                content: 'Wins: 80',
              }),
              createComponent('li', {
                className: styles.statsItem,
                content: 'Losses: 40',
              }),
              createComponent('li', {
                className: styles.statsItem,
                content: 'Win Rate: 66.67%',
              }),
            ],
          }),
        ],
      }),

      // Achievements Section
      createComponent('div', {
        className: styles.achievementsSection,
        children: [
          createComponent('h5', {
            className: styles.achievementsTitle,
            content: 'Achievements',
          }),
          createComponent('div', {
            className: styles.achievementsGrid,
            children: [
              createComponent('div', {
                className: styles.achievementCard,
                children: [
                  createComponent('h6', {
                    className: styles.achievementCardTitle,
                    content: 'First Win',
                  }),
                  createComponent('p', {
                    className: styles.achievementCardText,
                    content: 'Achieved on: 2023-01-15',
                  }),
                ],
              }),
              createComponent('div', {
                className: styles.achievementCard,
                children: [
                  createComponent('h6', {
                    className: styles.achievementCardTitle,
                    content: '10 Wins Streak',
                  }),
                  createComponent('p', {
                    className: styles.achievementCardText,
                    content: 'Achieved on: 2023-02-20',
                  }),
                ],
              }),
              createComponent('div', {
                className: styles.achievementCard,
                children: [
                  createComponent('h6', {
                    className: styles.achievementCardTitle,
                    content: '50 Games Played',
                  }),
                  createComponent('p', {
                    className: styles.achievementCardText,
                    content: 'Achieved on: 2023-03-10',
                  }),
                ],
              }),
              createComponent('div', {
                className: styles.achievementCard,
                children: [
                  createComponent('h6', {
                    className: styles.achievementCardTitle,
                    content: '100 Wins',
                  }),
                  createComponent('p', {
                    className: styles.achievementCardText,
                    content: 'Achieved on: 2023-04-05',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),

    ],
    cleanup,
  });
}