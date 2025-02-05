import { createComponent, Link, createCleanupContext } from '@component';
import styles from './LeaderboardPage.module.css';

// Mock data for the leaderboard
const topPlayers = [
  { rank: 1, username: 'Player1', wins: 150, losses: 20, winRate: '88.24%' },
  { rank: 2, username: 'Player2', wins: 140, losses: 30, winRate: '82.35%' },
  { rank: 3, username: 'Player3', wins: 130, losses: 40, winRate: '76.47%' },
  { rank: 4, username: 'Player4', wins: 120, losses: 50, winRate: '70.59%' },
  { rank: 5, username: 'Player5', wins: 110, losses: 60, winRate: '64.71%' },
  { rank: 6, username: 'Player6', wins: 100, losses: 70, winRate: '58.82%' },
  { rank: 7, username: 'Player7', wins: 90, losses: 80, winRate: '52.94%' },
  { rank: 8, username: 'Player8', wins: 80, losses: 90, winRate: '47.06%' },
  { rank: 9, username: 'Player9', wins: 70, losses: 100, winRate: '41.18%' },
  { rank: 10, username: 'Player10', wins: 60, losses: 110, winRate: '35.29%' },
];

export default function LeaderboardPage() {
  const cleanup = createCleanupContext();

  return createComponent('div', {
    className: styles.container,
    children: [
      createComponent('h1', {
        className: styles.leaderboardTitle,
        content: 'Top 10 Players',
      }),
      createComponent('p', {
        className: styles.leaderboardDescription,
        content: 'Check out the best players in the Pong game!',
      }),
      createComponent('hr', {}),

      // Leaderboard Table
      createComponent('div', {
        className: styles.leaderboardTable,
        children: [
          createComponent('div', {
            className: styles.tableHeader,
            children: [
              createComponent('span', { className: styles.headerCell, content: 'Rank' }),
              createComponent('span', { className: styles.headerCell, content: 'Username' }),
              createComponent('span', { className: styles.headerCell, content: 'Wins' }),
              createComponent('span', { className: styles.headerCell, content: 'Losses' }),
              createComponent('span', { className: styles.headerCell, content: 'Win Rate' }),
            ],
          }),
          ...topPlayers.map((player) =>
            createComponent('div', {
              className: styles.tableRow,
              children: [
                createComponent('span', {
                  className: styles.tableCell,
                  content: player.rank,
                }),
                createComponent('span', {
                  className: styles.tableCell,
                  content: player.username,
                }),
                createComponent('span', {
                  className: styles.tableCell,
                  content: player.wins,
                }),
                createComponent('span', {
                  className: styles.tableCell,
                  content: player.losses,
                }),
                createComponent('span', {
                  className: styles.tableCell,
                  content: player.winRate,
                }),
              ],
            }),
          ),
        ],
      }),

    ],
    cleanup,
  });
}