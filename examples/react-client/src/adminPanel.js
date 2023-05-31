import React, { useEffect, useState } from 'react';
import { useAuth } from 'oidc-react';
import axios from 'axios';

const AdminPanel = () => {
  const auth = useAuth();

  const [roleName, setRoleName] = useState('');

  const [assignRole, setAssignRole] = useState({
    accountId: '',
    roleName: ''
  });

  const [revokeRole, setRevokeRole] = useState({
    accountId: '',
    roleName: ''
  });

  const [deleteRole, setDeleteRole] = useState('');

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  const getRolesHandler = () => {
    axios
      .get(`${process.env.REACT_APP_AUTHORITY_URL}/roles`, {
        headers: {
          Authorization: `Bearer ${auth.userData.access_token}`
        }
      })
      .then((response) => {
        console.log('roles', response.data.roles);
        setRoles(response.data.roles);
      })
      .catch((error) => {
        alert('Error getting roles');
      });
  };

  const getAllUsersHandler = () => {
    axios
      .get(`${process.env.REACT_APP_AUTHORITY_URL}/users`, {
        headers: {
          Authorization: `Bearer ${auth.userData.access_token}`
        }
      })
      .then((response) => {
        console.log('users', response.data.accounts);
        setUsers(response.data.accounts.sort((a, b) => a.id - b.id));
      })
      .catch((error) => {
        alert('Error getting Users');
      });
  };

  useEffect(() => {
    if (auth.userData) {
      getRolesHandler();
      getAllUsersHandler();
    }
  }, [auth.userData]);

  const isAdmin = () => {
    const roles = auth.userData.profile.roles;
    console.log(roles);
    return roles.includes('admin');
  };
  const assignRoleToUser = (e) => {
    e.preventDefault();
    //make post request to /roles/assign with bearer token
    axios

      .post(
        `${process.env.REACT_APP_AUTHORITY_URL}/roles/assign`,
        { accountId: assignRole.accountId, roleName: assignRole.roleName },
        {
          headers: {
            Authorization: `Bearer ${auth.userData.access_token}`
          }
        }
      )
      .then((response) => {
        getAllUsersHandler();
        getRolesHandler();
        alert('Role Assigned');
      })
      .catch((error) => {
        alert('Error assigning role');
      });
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
        getAllUsersHandler();
        getRolesHandler();
        alert('Role Created');
      })
      .catch((error) => {
        alert('Error creating role');
      });
  };

  const deleteRoleHandler = (e) => {
    e.preventDefault();
    //make post request to /roles/assign with bearer token
    axios

      .post(
        `${process.env.REACT_APP_AUTHORITY_URL}/roles/delete`,
        { roleName: deleteRole },
        {
          headers: {
            Authorization: `Bearer ${auth.userData.access_token}`
          }
        }
      )
      .then((response) => {
        getAllUsersHandler();
        getRolesHandler();
        alert('Role Deleted');
      })
      .catch((error) => {
        alert('Error deleting role');
      });
  };

  const revokeUserRole = (e) => {
    e.preventDefault();
    //make post request to /roles/assign with bearer token
    axios

      .post(
        `${process.env.REACT_APP_AUTHORITY_URL}/roles/revoke`,
        { accountId: revokeRole.accountId, roleName: revokeRole.roleName },
        {
          headers: {
            Authorization: `Bearer ${auth.userData.access_token}`
          }
        }
      )
      .then((response) => {
        getAllUsersHandler();
        getRolesHandler();
        alert('Role revoked');
      })
      .catch((error) => {
        alert('Error revoke role');
      });
  };

  const getRolesInString = (roles) => {
    let rolesString = '';
    roles.forEach((role) => {
      rolesString += role + ', ';
    });

    //remove last comma
    rolesString = rolesString.substring(0, rolesString.length - 2);
    return rolesString;
  };

  const adminPanel = () => {
    return (
      <div>
        {isAdmin() ? (
          <div class="flex-container">
            <div class="card">
              <input
                type="text"
                name="create-role"
                value={roleName}
                placeholder="Role Name"
                onChange={(event) => setRoleName(event.target.value)}
              />
              <button onClick={(e) => createRole(e)}> Create Role </button>
            </div>
            <br />
            <div class="card">
              <input
                type="text"
                name="assign-role-accountId"
                value={assignRole.accountId}
                placeholder="User Id"
                onChange={(event) => setAssignRole({ ...assignRole, accountId: event.target.value })}
              />
              <input
                type="text"
                name="assign-role-name"
                value={assignRole.roleName}
                placeholder="Role Name"
                onChange={(event) => setAssignRole({ ...assignRole, roleName: event.target.value })}
              />
              <button onClick={(e) => assignRoleToUser(e)}> Assign Role </button>
            </div>

            <br />
            <div class="card">
              <input
                type="text"
                name="revoke-role-accountId"
                value={revokeRole.accountId}
                placeholder="User Id"
                onChange={(event) => setRevokeRole({ ...revokeRole, accountId: event.target.value })}
              />
              <input
                type="text"
                name="revoke-role-name"
                value={revokeRole.roleName}
                placeholder="Role Name"
                onChange={(event) => setRevokeRole({ ...revokeRole, roleName: event.target.value })}
              />
              <button onClick={(e) => revokeUserRole(e)}> Revoke Role </button>
            </div>
            <br />
            <div class="card">
              <input
                type="text"
                name="delete-role"
                value={deleteRole}
                placeholder="Role Name"
                onChange={(event) => setDeleteRole(event.target.value)}
              />
              <button onClick={(e) => deleteRoleHandler(e)}> Delete Role </button>
            </div>
            <br />
            <div class="card">
              {roles && roles.length > 0 ? (
                <div>
                  <h3>Roles</h3>
                  <ul>
                    {roles.map((role) => (
                      <li>{role.name}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>No Roles</div>
              )}
            </div>
            <div class="card">
              {users && users.length > 0 ? (
                <div>
                  <h3>Users</h3>
                  <ul>
                    {users.map((user) => (
                      <div key={user.accountId}>
                        <li>
                          {user.accountId}
                          <ul>
                            <li>
                              Roles:
                              {getRolesInString(user.roles)}
                            </li>
                            <li>Email: {user.profile.email}</li>
                          </ul>
                        </li>
                      </div>
                    ))}
                  </ul>
                </div>
              ) : (
                <div>No Users</div>
              )}
            </div>
          </div>
        ) : (
          <div>Not Admin</div>
        )}
      </div>
    );
  };

  if (auth && auth.userData && auth.userData.profile) {
    return <div className="container">{adminPanel()}</div>;
  }
};

export default AdminPanel;
