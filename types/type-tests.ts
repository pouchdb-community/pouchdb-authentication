function testAuthentication() {
  const db = new PouchDB<{ foo: number }>();

  db.logIn('username', 'password');

  db.logOut();

  db.getSession();

  db.signUp('username', 'password', {
    roles: ['role1', 'role2'], metadata: { anyStuff: 'whatever' },
  });

  db.putUser('username', {
    roles: ['role1', 'role2'], metadata: { anyStuff: 'whatever' },
  });

  db.getUser('username');

  db.deleteUser('username');

  db.changePassword('username', 'password');

  db.changeUsername('oldUsername', 'newUsername');

  db.signUpAdmin('username', 'password');

  db.deleteAdmin('username');
}
