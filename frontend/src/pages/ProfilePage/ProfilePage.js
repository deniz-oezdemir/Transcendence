// import { createComponent } from '@component';

// import { createSignal, createEffect } from '@reactivity';
// import styles from './ProfilePage.module.css';

// export default function ProfilePage({ params, query }) {
//   const username = localStorage.getItem('username');
//   const userId = localStorage.getItem('userId');
//   const [userData, setUserData] = createSignal(null);
//   const [error, setError] = createSignal(null);
//   const [loading, setLoading] = createSignal(true);

//   const fetchUserData = async () => {
//     try {
//       const response = await fetch(`http://localhost:8006/profile/`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Token ${localStorage.getItem('token')}`,
//           'Content-Type': 'application/json',
//         },
//       });
//       if (!response.ok) {
//         throw new Error('Failed to fetch user data');
//       }
//       const data = await response.json();
//       setUserData(data);
//     } catch (error) {
//       console.error(error);
//       setError(error.message);
//     }
//   }

//   // //example code for fetching stats and achievements
//   // const fetchStats = async () => {
//   //   try {
//   //     const response = await fetch(`/stats/${username}`);
//   //     if (!response.ok) throw new Error('Failed to fetch stats');
//   //     const data = await response.json();
//   //     setStats(data);
//   //   } catch (err) {
//   //     setError(err.message);
//   //   }
//   // };

//   // createEffect(() => {
//   //   setLoading(true);
//   //   Promise.all([fetchUserData(), fetchStats()]).finally(() => {
//   //     setLoading(false);
//   //   });
//   // });
//   createEffect(() => {
//     setLoading(true);
//     fetchUserData().finally(() => {
//       setLoading(false);
//     });
//   });

//   if (loading()) {
//     return createComponent('div', {
//       className: 'loading',
//       content: 'Loading...',
//     });
//   }

//   if (error()) {
//     return createComponent('div', {
//       className: 'error',
//       content: error(),
//     });
//   }

//   return createComponent('div', {
//     className: styles.container,
//     children: [
//       // User Info Section
//       createComponent('div', {
//         className: 'user-info',
//         children: [
//           createComponent('img', {
//             className: 'avatar',
//             attributes: {
//               src: userData().avatar_url || '/avatars/default.png',
//               alt: `${username}'s avatar`,
//             },
//           }),
//           createComponent('h1', {
//             className: 'username',
//             content: username,
//           }),
//         ],
//       }),

//       // Friends List Section
//       createComponent('div', {
//         className: 'friends-list',
//         children: [
//           createComponent('h2', { content: 'Friends' }),
//           createComponent('ul', {
//             children: userData().friends.map((friend) =>
//               createComponent('li', {
//                 className: `friend ${friend.online ? 'online' : 'offline'}`,
//                 content: `${friend.username} (${friend.online ? 'Online' : 'Offline'})`,
//               })
//             ),
//           }),
//         ],
//       }),

//       // Stats and Achievements Section
//       createComponent('div', {
//         className: 'stats-achievements',
//         children: [
//           createComponent('h2', { content: 'Stats' }),
//           createComponent('ul', {
//             children: Object.entries(stats().stats).map(([key, value]) =>
//               createComponent('li', {
//                 content: `${key}: ${value}`,
//               })
//             ),
//           }),
//           createComponent('h2', { content: 'Achievements' }),
//           createComponent('ul', {
//             children: stats().achievements.map((achievement) =>
//               createComponent('li', {
//                 content: achievement,
//               })
//             ),
//           }),
//         ],
//       }),
//     ],
//     cleanup,
//   });
// }
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