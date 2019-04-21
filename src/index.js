'use strict';

import makeAdminsAPI from "./admins";
import makeAuthenticationAPI from "./authentication";
import makeUsersAPI from "./users";
import { makeFetchWithCredentials } from "./utils";

function initPlugin(PouchDB) {
  var fetchWithCredentials = makeFetchWithCredentials(PouchDB.fetch);
  var { deleteAdmin, getMembership, signUpAdmin } = makeAdminsAPI(fetchWithCredentials);
  var { getSession, logIn, logOut } = makeAuthenticationAPI(fetchWithCredentials);
  var {
    changePassword,
    changeUsername,
    deleteUser,
    getUser,
    getUsersDatabaseUrl,
    putUser,
    signUp,
  } = makeUsersAPI(fetchWithCredentials);

  PouchDB.fetch = fetchWithCredentials;

  PouchDB.prototype.login = logIn;
  PouchDB.prototype.logIn = logIn;
  PouchDB.prototype.logout = logOut;
  PouchDB.prototype.logOut = logOut;
  PouchDB.prototype.getSession = getSession;

  PouchDB.prototype.getMembership = getMembership;
  PouchDB.prototype.signUpAdmin = signUpAdmin;
  PouchDB.prototype.deleteAdmin = deleteAdmin;

  PouchDB.prototype.getUsersDatabaseUrl = getUsersDatabaseUrl;
  PouchDB.prototype.signup = signUp;
  PouchDB.prototype.signUp = signUp;
  PouchDB.prototype.getUser = getUser;
  PouchDB.prototype.putUser = putUser;
  PouchDB.prototype.deleteUser = deleteUser;
  PouchDB.prototype.changePassword = changePassword;
  PouchDB.prototype.changeUsername = changeUsername;
}

if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(initPlugin);
}

export default initPlugin;
