import React from 'react';
import { AuthProvider } from 'oidc-react';
import logo from './logo.svg';
import './App.css';
import LoggedIn from './LoggedIn';

const clearSearchParams = () => {
  const searchParams = new URLSearchParams(window.location.search);

  // Remove all search parameters
  for (const param of searchParams.keys()) {
    searchParams.delete(param);
  }

  // Replace the current URL with the updated search parameters
  const newUrl = `${window.location.origin}${window.location.pathname}`;
  window.history.replaceState({}, '', newUrl);
};

const oidcConfig = {
  onSignIn: async (user) => {
    console.log(user);
    clearSearchParams();
  },

  postLogoutRedirectUri: 'https://xauth.xauth.mvpworkshop.co/session/end',

  scope: 'openid email profile',
  authority: 'https://xauth.xauth.mvpworkshop.co',
  clientId: 'xauth',
  responseType: 'code',
  loadUserInfo: false,
  redirectUri: 'https://xauth.test:6001'
};

function App() {
  return (
    <AuthProvider {...oidcConfig}>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>OIDC React</p>
          <LoggedIn />
        </header>
      </div>
    </AuthProvider>
  );
}

export default App;
