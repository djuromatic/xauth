import React from 'react';
import { AuthProvider } from 'oidc-react';
import logo from './logo.svg';
import './App.css';
import LoggedIn from './LoggedIn';
import AdminPanel from './adminPanel';

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

  postLogoutRedirectUri: `${process.env.REACT_APP_AUTHORITY_URL}/session/end`,
  audiance: 'https://xauth.test:3000',
  scope: process.env.REACT_APP_SCOPE,
  authority: `${process.env.REACT_APP_AUTHORITY_URL}`,
  clientId: process.env.REACT_APP_CLIENT_ID,
  responseType: process.env.REACT_APP_RESPONSE_TYPE,
  loadUserInfo: false,
  redirectUri: `${process.env.REACT_APP_REDIRECT_URL}`
};

function App() {
  console.log(oidcConfig);
  return (
    <AuthProvider {...oidcConfig}>
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>OIDC React</p>
          <AdminPanel />
          <LoggedIn />
        </header>
      </div>
    </AuthProvider>
  );
}

export default App;
