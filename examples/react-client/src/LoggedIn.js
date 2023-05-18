import React from 'react';
import { useAuth } from 'oidc-react';
import axios from 'axios';

const LoggedIn = () => {
  const auth = useAuth();

  const sessionEndHandler = async (e) => {
    e.preventDefault();
    //redirect user to logout page
    await auth.signOut();
    window.location.href = 'https://xauth.xauth.mvpworkshop.co/session/end';
  };

  if (auth && auth.userData) {
    return (
      <div>
        <h1>Welcome {auth.userData.profile.given_name}!</h1>
        <ul>
          {
            /* Iterate throgh auth.userData.profile keys and map it to li element */
            Object.keys(auth.userData.profile).map((key) => (
              <li key={key}>
                <strong>{key}:</strong> {auth.userData.profile[key]}
              </li>
            ))
          }
        </ul>
        <strong>Logged in! 🎉</strong>
        <br />
        <button onClick={(e) => sessionEndHandler(e)}>End session!</button>
      </div>
    );
  }
};

export default LoggedIn;
