import { createComponent, createCleanupContext } from '@component';
import { createSignal, createEffect } from '@reactivity';
import styles from './ProfilePage.module.css';
import {
  validateUsername,
  validatePassword,
  matchPasswords,
} from '../../core/utils';
import { updateUserData } from '@/auth.js';

const hostname = window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
const nginxPort = 8443;
const apiUrl = `${protocol}//${hostname}:${nginxPort}`;

//*********************************************************************************************//

async function handleDeleteAccount() {
  if (
    !confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )
  ) {
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/api/uam/profile/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Token ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      alert('Your account has been deleted.');
      localStorage.removeItem('authToken');
      window.location.href = '/';
    } else {
      const data = await response.json();
      alert('Error: ' + (data.error || 'Failed to delete account.'));
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Delete account error:', error);
    alert('Something went wrong.');
  }
}

//*********************************************************************************************//

function friendRequestForm(setReload) {
  const [username, setUsername] = createSignal('');
  const [usernameError, setUsernameError] = createSignal('');

  async function sendFriendRequest() {
    if (!username() || !validateUsername(username(), setUsernameError)) {
      return alert('Please enter a valid username!');
    }

    try {
      //console.log('Sending friend request to', username());
      const response = await fetch(`${apiUrl}/api/uam/friend-request/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friend_username: username() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }
      setUsername('');
      setReload(true);
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert(error.message);
    }
  }

  return createComponent('div', {
    className: styles.friendRequestBox,
    children: [
      createComponent('input', {
        className: styles.friendInput,
        attributes: {
          type: 'text',
          placeholder: 'Enter username...',
          value: username(),
        },
        events: {
          input: (event) => setUsername(event.target.value),
        },
      }),
      createComponent('button', {
        className: styles.friendButton,
        content: 'Add Friend',
        events: {
          click: (event) => {
            //console.log('Calling send friend request...');
            sendFriendRequest(event);
          },
        },
      }),
    ],
  });
}

//*********************************************************************************************//

function friendListComponent(user_data, setReload) {
  async function unfollowFriend(friend_username) {
    try {
      //console.log('Sending unfollow request to', friend_username);

      const response = await fetch(`${apiUrl}/api/uam/friend-request/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friend_username }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }
      setReload(true);
    } catch (error) {
      // console.error('Error unfollowing friend:', error);
      // alert('Something went wrong.');
      setReload(true);
    }
  }

  let friendsComponents = [];
  if (user_data.friends && user_data.friends.length > 0) {
    friendsComponents = user_data.friends.map((friend, index) => {
      if (friend.avatar_url && friend.username) {
        //console.log('Friend status:', friend.status);
        return createComponent('div', {
          key: `friend-${index}`,
          className: styles.friend,
          children: [
            createComponent('img', {
              className: styles.friendAvatar,
              attributes: { src: friend.avatar_url, alt: friend.username },
            }),
            createComponent('span', {
              className: styles.friendName,
              content: friend.username,
            }),
            createComponent('span', {
              className: `${styles.status} ${friend.status === 'online' ? styles.online : styles.offline}`,
            }),
            createComponent('button', {
              className: styles.unfollowButton,
              content: 'Unfollow',
              events: {
                click: (event) => {
                  //console.log('Unfollow button clicked for:', friend.username);
                  unfollowFriend(friend.username);
                },
              },
            }),
          ],
        });
      }
      return createComponent('p', { content: 'Invalid friend data' });
    });
  } else {
    friendsComponents = [
      createComponent('p', { content: 'No friends added yet' }),
    ];
  }

  return createComponent('div', {
    className: styles.friendsBox,
    children: friendsComponents,
  });
}

//*********************************************************************************************//

function changeUsernameComponent(
  user_data,
  setReload,
  usernameButtonPressed,
  setUsernameButtonPressed
) {
  const [username, setUsername] = createSignal('');
  const [usernameError, setUsernameError] = createSignal('');

  async function handleChangeUsername(setReload) {
    if (!username() || !validateUsername(username(), setUsernameError)) {
      setUsernameButtonPressed(false);
      setReload(true);
      return alert('Please enter a valid username!');
    }
    try {
      //console.log('Sending change username request');
      let new_username = username();
      const response = await fetch(`${apiUrl}/api/uam/change-username/`, {
        method: 'PUT',
        headers: {
          Authorization: `Token ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_username }),
      });

      const data = await response.json();
      updateUserData(data);
      setUsernameButtonPressed(false);
      setReload(true);
      if (!response.ok) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Change username error:', error);
      alert(error.message);
    }
  }

  let changeUsernameComponent = [];
  if (usernameButtonPressed()) {
    return createComponent('div', {
      className: styles.changeBox,
      children: [
        createComponent('input', {
          className: styles.changeInput,
          attributes: {
            type: 'text',
            placeholder: 'Enter new username...',
            value: username(),
          },
          events: {
            input: (event) => setUsername(event.target.value),
          },
        }),
        createComponent('button', {
          className: styles.changeButton,
          content: 'Change Username',
          events: {
            click: (event) => {
              //console.log('Changing username...');
              handleChangeUsername(setReload);
            },
          },
        }),
      ],
    });
  } else {
    changeUsernameComponent = [
      createComponent('button', {
        className: styles.changeButton,
        content: 'Change Username',
        events: {
          click: (event) => {
            /*console.log(
              'Change Username button clicked for:',
              user_data.username
            );*/
            setUsernameButtonPressed(true);
            setReload(true);
          },
        },
      }),
    ];
  }

  return createComponent('div', {
    className: styles.changeBox,
    children: changeUsernameComponent,
  });
}

//*********************************************************************************************//

function changePasswordComponent(
  user_data,
  setReload,
  passwordButtonPressed,
  setPasswordButtonPressed
) {
  const [password, setPassword] = createSignal('');
  const [passwordRepeat, setPasswordRepeat] = createSignal('');
  const [passwordError, setPasswordError] = createSignal('');

  async function handleChangePassword(setReload) {
    try {
      if (
        !validatePassword(password(), setPasswordError) ||
        !matchPasswords(password(), passwordRepeat(), setPasswordError)
      ) {
        setPasswordButtonPressed(false);
        setReload(true);
        return alert(passwordError());
      }
      let new_password = password();
      const response = await fetch(`${apiUrl}/api/uam/change-password/`, {
        method: 'PUT',
        headers: {
          Authorization: `Token ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ new_password }),
      });

      const data = await response.json();
      setPasswordButtonPressed(false);
      setReload(true);
      if (!response.ok) {
        throw new Error(data.error);
      }
      alert('Password changed successfully.');
    } catch (error) {
      console.error('Change password error:', error);
      alert(error.message);
    }
  }

  let changePasswordComponent = [];
  if (passwordButtonPressed()) {
    return createComponent('div', {
      className: styles.changeBox,
      children: [
        createComponent('input', {
          className: styles.changeInput,
          attributes: {
            type: 'password',
            placeholder: 'Enter new password...',
            value: password(),
          },
          events: {
            input: (event) => setPassword(event.target.value),
          },
        }),
        createComponent('input', {
          className: styles.changeInput,
          attributes: {
            type: 'password',
            placeholder: 'Repeat new password...',
            value: passwordRepeat(),
          },
          events: {
            input: (event) => setPasswordRepeat(event.target.value),
          },
        }),
        createComponent('button', {
          className: styles.changeButton,
          content: 'Change Password',
          events: {
            click: (event) => {
              //console.log('Changing password...');
              handleChangePassword(setReload);
            },
          },
        }),
      ],
    });
  } else {
    changePasswordComponent = [
      createComponent('button', {
        className: styles.changeButton,
        content: 'Change Password',
        events: {
          click: (event) => {
            /*console.log(
              'Change password button clicked for:',
              user_data.username
            );*/
            setPasswordButtonPressed(true);
            setReload(true);
          },
        },
      }),
    ];
  }

  return createComponent('div', {
    className: styles.changeBox,
    children: changePasswordComponent,
  });
}

//*********************************************************************************************//

function changeAvatarComponent(
  user_data,
  setReload,
  avatarButtonPressed,
  setAvatarButtonPressed
) {
  const [avatar, setAvatar] = createSignal('');

  function validateImage(file) {
    const allowedTypes = ['image/jpeg', 'image/png'];
    const maxSize = 2 * 1024 * 1024;
    if (!file) return false;
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG and PNG are allowed.');
      return false;
    }
    if (file.size > maxSize) {
      alert('File must be less than 2MB.');
      return false;
    }
    return true;
  }

  const handleChangeAvatar = async (file, setReload) => {
    try {
      //console.log('Uploading avatar...', file);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${apiUrl}/api/uam/change-avatar/`, {
        method: 'PUT',
        headers: {
          Authorization: `Token ${localStorage.getItem('authToken')}`,
        },
        body: formData,
      });

      const data = await response.json();
      setAvatarButtonPressed(false);
      setReload(true);
      if (!response.ok) {
        throw new Error(data.error);
      }
      //console.log('Avatar changed successfully!');
      // setReload((prev) => !prev);
    } catch (error) {
      console.error('Change avatar error:', error);
      // setReload((prev) => !prev);
      setReload(true);
      alert(error.message);
    }
  };

  let changeAvatarComponent = [];
  if (avatarButtonPressed()) {
    return createComponent('div', {
      className: styles.changeBox,
      children: [
        createComponent('input', {
          className: styles.changeInput,
          attributes: {
            type: 'file',
            accept: 'image/*',
          },
          events: {
            change: (event) => {
              const file = event.target.files[0];
              if (validateImage(file)) {
                //console.log('Selected file:', file.name);
                setAvatar(file);
              }
            },
          },
        }),
        createComponent('button', {
          className: styles.changeButton,
          content: 'Change Avatar',
          events: {
            click: async () => {
              if (!avatar()) {
                alert('Please select an image first.');
                return;
              }
              //console.log('Calling avatar handler...');
              await handleChangeAvatar(avatar(), setReload);
            },
          },
        }),
      ],
    });
  } else {
    changeAvatarComponent = [
      createComponent('button', {
        className: styles.changeButton,
        content: 'Change Avatar',
        events: {
          click: (event) => {
            /*console.log(
              'Change Avatar button clicked for:',
              user_data.username
            );*/
            setAvatarButtonPressed(true);
            setReload(true);
          },
        },
      }),
    ];
  }

  return createComponent('div', {
    className: styles.changeBox,
    children: changeAvatarComponent,
  });
}

//*********************************************************************************************//

function dynamicData(
  user_data,
  user_stats,
  setReload,
  usernameButtonPressed,
  setUsernameButtonPressed,
  passwordButtonPressed,
  setPasswordButtonPressed,
  avatarButtonPressed,
  setAvatarButtonPressed
) {
  if (!user_data) {
    return createComponent('div', {
      className: styles.profileContainer,
      content: 'Error loading profile data',
    });
  }

  function displayHistory(user_stats, data) {
    // console.log('Displaying player game history, user_stats: ', user_stats);
    const parent = createComponent('ul', {
      className: 'list-group list-group-flush',
    });
    if (user_stats) {
      user_stats.games_played
        .slice()
        .reverse()
        .map((game) => {
          const date = new Date(game.end_time).toISOString().split('T')[0];
          const element = createComponent('li', {
            className: 'list-group-item',
            content: `<div class="row">
		  <p class="col">Date: </p>${date}
		  <p class="col">Result: </p>${data.id == game.winner_id ? 'Won' : 'Lost'}
		  <p class="col">Your score: </p>${data.id == game.player_1_id ? game.player_1_score : game.player_2_score}
		  <p class="col">Opponents score: </p>${data.id == game.player_1_id ? game.player_2_score : game.player_1_score}
		  </div>`,
          });

          parent.element.appendChild(element.element);
        });
    } else {
      const element = createComponent('li', {
        className: 'list-group-item',
        content: 'No games played yet',
      });
      parent.element.appendChild(element.element);
    }
    return parent;
  }

  return createComponent('div', {
    className: styles.profileContainer,
    children: [
      createComponent('div', {
        className: styles.userBox,
        children: [
          createComponent('img', {
            className: styles.avatar,
            attributes: {
              src: `${apiUrl}${user_data.avatar_url}`,
              alt: `${user_data.username}'s avatar`,
            },
          }),
          createComponent('h1', {
            className: styles.username,
            content: user_data.username,
          }),
        ],
      }),
      createComponent('button', {
        className: styles.deleteButton,
        content: 'Delete Account',
        events: {
          click: (event) => {
            //console.log('Delete Account button clicked');
            handleDeleteAccount(event);
          },
        },
      }),

      changeUsernameComponent(
        user_data,
        setReload,
        usernameButtonPressed,
        setUsernameButtonPressed
      ),
      changePasswordComponent(
        user_data,
        setReload,
        passwordButtonPressed,
        setPasswordButtonPressed
      ),
      changeAvatarComponent(
        user_data,
        setReload,
        avatarButtonPressed,
        setAvatarButtonPressed
      ),
      friendListComponent(user_data, setReload),
      friendRequestForm(setReload),

      // Stats Section
      createComponent('div', {
        className: `${styles.statsBox} card`,
        children: [
          createComponent('div', {
            className: 'card-header',
            content: 'Game Stats',
          }),
          createComponent('ul', {
            className: 'list-group list-group-flush',
            children: user_stats
              ? [
                  createComponent('li', {
                    className: 'list-group-item',
                    content: `Wins: ${user_stats.games_won}`,
                  }),
                  createComponent('li', {
                    className: 'list-group-item',
                    content: `Losses: ${user_stats.games_lost}`,
                  }),
                  createComponent('li', {
                    className: 'list-group-item',
                    content: `Total Play Time: ${user_stats.total_time_played}`,
                  }),
                ]
              : [
                  createComponent('li', {
                    className: 'list-group-item',
                    content: 'No games played yet',
                  }),
                ],
          }),
        ],
      }),
      createComponent('div', {
        className: 'card-header',
        content: 'Game History',
      }),
      displayHistory(user_stats, user_data),
    ],
  });
}

export default function ProfilePage({ params, query }) {
  const cleanup = createCleanupContext();

  const [content, setContent] = createSignal(null);
  const [error, setError] = createSignal(null);
  const [reload, setReload] = createSignal(true);
  const [stats, setStats] = createSignal(null);
  const [usernameButtonPressed, setUsernameButtonPressed] = createSignal(false);
  const [passwordButtonPressed, setPasswordButtonPressed] = createSignal(false);
  const [avatarButtonPressed, setAvatarButtonPressed] = createSignal(false);

  async function fetchUserData() {
    try {
      //console.log('Fetching user data...');
      const response = await fetch(`${apiUrl}/api/uam/profile/`, {
        method: 'GET',
        headers: {
          Authorization: `Token ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });
      //console.log('Fetched user data:', response);
      if (!response.ok) {
        //console.log('Failed to fetch user data');
        // throw new Error('Failed to fetch user data');
      }
      let data = await response.json();
      //console.log('User data:', data);
      const userStats = await fetchStats(data.id);
      // console.log('userStats:', userStats);
      setContent(
        dynamicData(
          data,
          userStats,
          setReload,
          usernameButtonPressed,
          setUsernameButtonPressed,
          passwordButtonPressed,
          setPasswordButtonPressed,
          avatarButtonPressed,
          setAvatarButtonPressed
        )
      );
    } catch (error) {
      console.error('fetch user data fails with error: ', error);
      setError(error.message);
      throw error;
    }
  }

  async function fetchStats(id) {
    try {
      //console.log('Fetching user stats...');
      const userID = id;
      let data = '';
      const url = `${apiUrl}/api/game-history/api/player/${userID}/`;
      //console.log('url to fecth is: ', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        //console.log('No stats for user');
      } else {
        //console.log('Response for stats: ', data);
        data = await response.json();
      }
      setStats(data);
      return data;
    } catch (error) {
      console.error('fetch user statistics fails with error: ', error);
      setError(error.message);
      throw error;
    }
  }

  createEffect(() => {
    if (reload()) {
      fetchUserData().catch((err) =>
        console.error('Failed to load profile:', err)
      );
      setReload(false);
    }
  });

  const wrapper = createComponent('div', {
    className: styles.container,
    content: () => content() || 'Loading...',
    cleanup,
  });

  //console.log('ProfilePage.js: wrapper:', wrapper);
  return wrapper;
}
