import React, { useState } from 'react';
import { useAuth } from 'oidc-react';
import axios from 'axios';

const AdminPanel = () => {
  const auth = useAuth();

  const [roleName, setRoleName] = useState('');

  const isAdmin = () => {
    const roles = auth.userData.profile.roles;
    console.log(roles);
    return roles.includes('admin');
  };
  const createRole = (e) => {
    e.preventDefault();
    //make post request to /roles/create with bearer token
    axios
      .post(
        `${process.env.REACT_APP_AUTHORITY_URL}/roles/create`,
        { roleName },
        {
          headers: {
            Authorization: `Bearer ${auth.userData.access_token}`
          }
        }
      )
      .then((response) => {
        console.log('Role Created', response);
      })
      .catch((error) => {
        console.log('Error creating role', error);
      });
  };

  const adminPanel = () => {
    return (
      <div>
        <h1>Admin Panel</h1>
        <ul>
          <li>
            <input name="create-role" value={roleName} onChange={(event) => setRoleName(event.target.value)} />
            <button onClick={(e) => createRole(e)} />
          </li>
          <li>Assign Role</li>
        </ul>
      </div>
    );
  };

  if (auth && auth.userData && auth.userData.profile) {
    return <div>{isAdmin() ? adminPanel() : <div>Not Admin</div>}</div>;
  }
};

export default AdminPanel;
