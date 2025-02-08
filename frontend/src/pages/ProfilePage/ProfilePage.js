import { createComponent, createCleanupContext } from '@component';
import { createSignal, createEffect } from '@reactivity';
import styles from './ProfilePage.module.css';

function dynamicData(user_data) {
  if (!user_data) {
    return createComponent('div', {
      className: styles.profileContainer,
      content: 'Error loading profile data',
    });
  }
  return createComponent('div', {
    className: styles.profileContainer,
    children: [
      // User Info Box
      createComponent('div', {
        className: styles.userBox,
        children: [
          createComponent('img', {
            className: styles.avatar,
            attributes: {
              src: user_data.avatar_url,
              alt: `${user_data.username}'s avatar`,
            }
          }),
          createComponent('h1', {
            className: styles.username,
            content: user_data.username,
          }),
        ],
      }),

      // Action Buttons
      createComponent('div', {
        className: styles.actions,
        children: [
          createComponent('button', {
            className: styles.actionButton,
            content: 'Change Avatar',
            events: {
              click : (event) => {
                console.log('Change Avatar button clicked');
                handleChangeAvatar(event);
              }
            }
          }),
          createComponent('button', {
            className: styles.actionButton,
            content: 'Change Username',
            events: {
              click : (event) => {
                console.log('Change Username button clicked');
                handleChangeUsername(event);
              }
            }
          }),
          createComponent('button', {
            className: styles.actionButton,
            content: 'Change Password',
            events: {
              click : (event) => {
                console.log('Change Password button clicked');
                handleChangePassword(event);
              }
            }
          }),
          createComponent('button', {
            className: styles.deleteButton,
            content: 'Delete Account',
            events: {
              click : (event) => {
                console.log('Delete Account button clicked');
                handleDeleteAccount(event);
              }
            }
          }),
        ],
      }),

      // // Stats Section
      // // createComponent('div', {
      // //   className: styles.statsBox,
      // //   children: [
      // //     createComponent('h2', { content: 'Game Stats' }),
      // //     createComponent('ul', {
      // //       children: user_data.stats.length > 0
      // //         ? user_data.stats.map((stat) =>
      // //             createComponent('li', { content: `${stat.name}: ${stat.value}` })
      // //           )
      // //         : createComponent('p', { content: 'No games played yet' }),
      // //     }),
      // //   ],
      // // }),

      // // Friends List Section
      // // createComponent('div', {
      // //   className: styles.friendsBox,
      // //   children: user_data.friends,
      // // }),
      // // createComponent('div', {
      // //   className: styles.friendsBox,
      // //   children: user_data.friends.length > 0
      // //     ? user_data.friends.map((friend) =>
      // //         createComponent('div', {
      // //           className: styles.friend,
      // //           children: [
      // //             createComponent('img', {
      // //               className: styles.friendAvatar,
      // //               attributes: { src: friend.avatar_url, alt: friend.username },
      // //             }),
      // //             createComponent('span', {
      // //               className: styles.friendName,
      // //               content: friend.username,
      // //             }),
      // //             createComponent('span', {
      // //               className: `${styles.status} ${friend.online ? styles.online : styles.offline}`,
      // //             }),
      // //           ],
      // //         })
      // //       )
      // //     : createComponent('p', { content: 'No friends added yet' }),
      // // }),
    ],
  });
}

export default function ProfilePage({ params, query }) {
  const cleanup = createCleanupContext();

  const[content, setContent] = createSignal(null);
  const[error, setError] = createSignal(null);

  async function fetchUserData() {
    try {
      console.log('Fetching user data...');
      const response = await fetch(`http://localhost:8006/profile/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await response.json();
      setContent(dynamicData(data));
    } catch (error) {
      console.error(error);
      setError(error.message);
      throw error;
    }
  }
  
  createEffect(() => {
    fetchUserData().catch(err => console.error('Failed to load profile:', err));
  });

  // //example code for fetching stats and achievements
  // const fetchStats = async () => {
  //   try {
  //     const response = await fetch(`http://localhost:8007/stats/`, {
  //       method: 'GET',
  //       headers: {
  //         'Authorization': `Token ${localStorage.getItem('authToken')}`,
  //         'Content-Type': 'application/json',
  //       },
  //     });
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch stats');
  //     }
  //     const data = await response.json();
  //     setStats(data);
  //     return data;
  //   } catch (error) {
  //     console.error(error);
  //     setError(error.message);
  //     throw error;
  //   }
  // };

  const wrapper = createComponent('div', {
    className: styles.container,
    content: () => content() || 'Loading...',
    // content: content,
    cleanup,
  });

return wrapper;
}
