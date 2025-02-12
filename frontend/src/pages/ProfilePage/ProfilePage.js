import { createComponent, createCleanupContext } from '@component';
import { createSignal, createEffect } from '@reactivity';
import styles from './ProfilePage.module.css';
import { validateUsername, validatePassword, matchPasswords } from '../../core/utils';

const hostname = window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
const port = 8007;
const apiUrl = `${protocol}//${hostname}:${port}`;

const[usernameButtonPressed, setUsernameButtonPressed] = createSignal(false);
const[passwordButtonPressed, setPasswordButtonPressed] = createSignal(false);

//*********************************************************************************************//

async function handleDeleteAccount() {
  if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
    return;
  }

  try {
    const response = await fetch(`${apiUrl}/profile/`, {
      method: "DELETE",
      headers: {
        "Authorization": `Token ${localStorage.getItem("authToken")}`,
      },
    });

    if (response.ok) {
      alert("Your account has been deleted.");
      localStorage.removeItem("authToken");
      window.location.href = "/";
    } else {
      const data = await response.json();
      alert("Error: " + (data.error || "Failed to delete account."));
    }
  } catch (error) {
    console.error("Delete account error:", error);
    alert("Something went wrong.");
  }
}

//*********************************************************************************************//

function friendRequestForm(setReload) {
  const [username, setUsername] = createSignal("");
  const [usernameError, setUsernameError] = createSignal("");

  async function sendFriendRequest() {
    if (!username() || !validateUsername(username(), setUsernameError)) {
      return alert("Please enter a valid username!");
    }

    try {
      console.log("Sending friend request to", username());
      const response = await fetch(`${apiUrl}/friend-request/`, {
        method: "POST",
        headers: {
          "Authorization": `Token ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friend_username: username() }),
      });

      const data = await response.json();
      alert(data.message); // Show success or error message
      if (response.ok) {
        setUsername(""); // Reset input on success
        setReload(true);
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Failed to send request.");
    }
  }

  return createComponent("div", {
    className: styles.friendRequestBox,
    children: [
      createComponent("input", {
        className: styles.friendInput,
        attributes: {
          type: "text",
          placeholder: "Enter username...",
          value: username(),
        },
        events: {
          input: (event) => setUsername(event.target.value),
        },
      }),
      createComponent("button", {
        className: styles.friendButton,
        content: "Add Friend",
        events: {
          click : (event) => {
            console.log('Calling send friend request...');
            sendFriendRequest(event);
          }
        }
      }),
    ],
  });
}

//*********************************************************************************************//

function friendListComponent(user_data, setReload) {
  async function unfollowFriend(friend_username) {
    try {
      console.log("Sending unfollow request to", friend_username);
  
      const response = await fetch(`${apiUrl}/friend-request/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Token ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friend_username }),
      });
  
      const data = await response.json();
      alert(data.message); // Show success or error message
  
      if (response.ok) {
        setReload(true);
      }
    } catch (error) {
      console.error("Error unfollowing friend:", error);
      alert("Failed to unfollow friend.");
    }
  }

  let friendsComponents = [];
  if (user_data.friends && user_data.friends.length > 0) {
    friendsComponents = user_data.friends.map((friend, index) => {
      if (friend.avatar_url && friend.username) {
        console.log("Friend status:", friend.status);
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
                  console.log("Unfollow button clicked for:", friend.username);
                  unfollowFriend(friend.username);
                }
              },
            }),
          ],
        });
      }
      return createComponent('p', { content: 'Invalid friend data' });
    });
  } else {
    friendsComponents = [createComponent('p', { content: 'No friends added yet' })];
  }

  return createComponent('div', {
    className: styles.friendsBox,
    children: friendsComponents,
  });
}

//*********************************************************************************************//

function changeUsernameComponent(user_data, setReload) {
  const[username, setUsername] = createSignal("");
  const[usernameError, setUsernameError] = createSignal("");

  async function handleChangeUsername(setReload) {
    if (!username() || !validateUsername(username(), setUsernameError)) {
      setUsernameButtonPressed(false);
      setReload(true);
      return alert("Please enter a valid username!");
    }
    try {
      console.log("Sending change username request");
      let new_username = username();
      const response = await fetch(`${apiUrl}/change-username/`, {
        method: "PUT",
        headers: {
          "Authorization": `Token ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_username }),
      });
  
      if (response.ok) {
        setUsernameButtonPressed(false);
        setReload(true);
      } else {
        setUsernameButtonPressed(false);
        setReload(true);
        const data = await response.json();
        alert("Error: " + (data.error || "Failed to change username."));
      }
    } catch (error) {
      setUsernameButtonPressed(false);
      console.error("Change username error:", error);
    }
  }

  let changeUsernameComponent = [];
  if (usernameButtonPressed()) {
    return createComponent("div", {
      className: styles.changeBox,
      children: [
        createComponent("input", {
          className: styles.changeInput,
          attributes: {
            type: "text",
            placeholder: "Enter new username...",
            value: username(),
          },
          events: {
            input: (event) => setUsername(event.target.value),
          },
        }),
        createComponent("button", {
          className: styles.changeButton,
          content: "Change Username",
          events: {
            click : (event) => {
              console.log('Changing username...');
              handleChangeUsername(setReload);
            }
          }
        }),
      ],
    });
  } else {
    changeUsernameComponent = [createComponent('button', {
      className: styles.changeButton,
      content: 'Change Username',
      events: {
        click: (event) => {
          console.log("Change Username button clicked for:", user_data.username);
          setUsernameButtonPressed(true);
          setReload(true);
        }
      },
    }),
  ];
  }

  return createComponent('div', {
    className: styles.changeBox, // create own style!!
    children: changeUsernameComponent,
  });
}

//*********************************************************************************************//

function changePasswordComponent(user_data, setReload) {
  const[password, setPassword] = createSignal("");
  const[passwordRepeat, setPasswordRepeat] = createSignal("");
  const[passwordError, setPasswordError] = createSignal("");

  async function handleChangePassword(setReload) {
    try {
      if (!validatePassword(password(), setPasswordError) || !matchPasswords(password(), passwordRepeat(), setPasswordError)) {
        setPasswordButtonPressed(false);
        setReload(true);
        return alert(passwordError());
      }
      let new_password = password();
      const response = await fetch(`${apiUrl}/change-password/`, {
        method: "PUT",
        headers: {
          "Authorization": `Token ${localStorage.getItem("authToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_password }),
      });
  
      if (response.ok) {
        setPasswordButtonPressed(false);
        setReload(true);
      } else {
        setPasswordButtonPressed(false);
        setReload(true);
        const data = await response.json();
        alert("Error: " + (data.error || "Failed to change password."));
      }
    } catch (error) {
      setPasswordButtonPressed(false);
      console.error("Change password error:", error);
    }
  }

  let changePasswordComponent = [];
  if (passwordButtonPressed()) {
    return createComponent("div", {
      className: styles.changeBox,
      children: [
        createComponent("input", {
          className: styles.changeInput,
          attributes: {
            type: "password",
            placeholder: "Enter new password...",
            value: password(),
          },
          events: {
            input: (event) => setPassword(event.target.value),
          },
        }),
        createComponent("input", {
          className: styles.changeInput,
          attributes: {
            type: "password",
            placeholder: "Repeat new password...",
            value: passwordRepeat(),
          },
          events: {
            input: (event) => setPasswordRepeat(event.target.value),
          },
        }),
        createComponent("button", {
          className: styles.changeButton,
          content: "Change Password",
          events: {
            click : (event) => {
              console.log('Changing password...');
              handleChangePassword(setReload);
            }
          }
        }),
      ],
    });
  } else {
    changePasswordComponent = [createComponent('button', {
      className: styles.changeButton,
      content: 'Change Password',
      events: {
        click: (event) => {
          console.log("Change password button clicked for:", user_data.username);
          setPasswordButtonPressed(true);
          setReload(true);
        }
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

function dynamicData(user_data, setReload) {
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

      // Delete Account Button
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

      changeUsernameComponent(user_data, setReload),
      changePasswordComponent(user_data, setReload),
      
      // Friends List Section
      friendListComponent(user_data, setReload),
      friendRequestForm(setReload),

      // // Stats Section
      // createComponent('div', {
      //   className: styles.statsBox,
      //   children: [
      //     createComponent('h2', { content: 'Game Stats' }),
      //     createComponent('ul', {
      //       children: user_data.stats.length > 0
      //         ? user_data.stats.map((stat) =>
      //             createComponent('li', { content: `${stat.name}: ${stat.value}` })
      //           )
      //         : createComponent('p', { content: 'No games played yet' }),
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
  const[reload, setReload] = createSignal(true);

  async function fetchUserData() {
    try {
      console.log('Fetching user data...');
      const response = await fetch(`${apiUrl}/profile/`, {
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
      setContent(dynamicData(data, setReload));
    } catch (error) {
      console.error(error);
      setError(error.message);
      throw error;
    }
  }
  
  createEffect(() => {
    if (reload()) {
    fetchUserData().catch(err => console.error('Failed to load profile:', err));
    setReload(false);
    }
  });

  // //example code for fetching stats and achievements
  // const fetchStats = async () => {
  //   try {
  //     const response = await fetch(`http://localhost:8006/stats/`, {
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
    cleanup,
  });

return wrapper;
}
