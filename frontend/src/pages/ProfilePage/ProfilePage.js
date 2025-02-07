import { createComponent, createCleanupContext } from '@component';
import { createSignal, createEffect } from '@reactivity';
import styles from './ProfilePage.module.css';

function dynamicData(user_data) {
  return createComponent('div', {
    className: 'user-info',
    children: [
      createComponent('img', {
        className: 'avatar',
        attributes: {
          src: user_data.avatar_url || '/avatars/default.png',
          alt: `${user_data.username}'s avatar`,
        }
      }),
      createComponent('h1', {
        className: 'username',
        content: user_data.username,
      }),
      // createComponent('div', {
      //   className: 'friends-list',
      //   children: [
      //     createComponent('h2', { content: 'Friends' }),
      //     createComponent('ul', {
      //       children: user_data.friends.map((friend) =>
      //         createComponent('li', {
      //           className: `friend ${friend.online ? 'online' : 'offline'}`,
      //           content: `${friend.username} (${friend.online ? 'Online' : 'Offline'})`,
      //         })
      //       ),
      //     }),
      //   ],
      // }),
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
    fetchUserData()
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
    content: content,
    cleanup,
  });

return wrapper;
}
