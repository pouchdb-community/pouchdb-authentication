// Type definitions for pouchdb-authentication 1.0
// Project: https://pouchdb.com/
// Definitions by: Didier Villevalois <ptitjes@free.fr>
// Definitions: https://github.com/pouchdb-community/pouchdb-authentication
// TypeScript Version: 2.3

/// <reference types="pouchdb-core" />

// TODO: Fixing this lint error will require a large refactor
/* tslint:disable:no-single-declare-module */

declare namespace PouchDB {
  namespace Authentication {

    interface UserContext {
      name: string;
      roles?: string[];
    }

    interface User extends UserContext {
    }

    interface LoginResponse extends Core.BasicResponse, UserContext {
    }

    interface SessionResponse extends Core.BasicResponse {
      info: {
        authenticated: string;
        authentication_db: string;
        authentication_handlers: string[];
      };
      userCtx: UserContext;
    }

    interface PutUserOptions extends Core.Options {
      metadata?: any;
      roles?: string[];
    }
  }

  interface Database<Content extends {} = {}> {
    /**
     * Log in an existing user.
     * Throws an error if the user doesn't exist yet, the password is wrong, the HTTP server is unreachable, or a meteor struck your computer.
     */
    logIn(username: string, password: string,
          callback: Core.Callback<Authentication.LoginResponse>): void;

    logIn(username: string, password: string,
          options: Core.Options,
          callback: Core.Callback<Authentication.LoginResponse>): void;

    logIn(username: string, password: string,
          options?: Core.Options): Promise<Authentication.LoginResponse>;

    /**
     * Logs out whichever user is currently logged in.
     * If nobody's logged in, it does nothing and just returns `{"ok" : true}`.
     */
    logOut(callback: Core.Callback<Core.BasicResponse>): void;

    logOut(): Promise<Core.BasicResponse>;

    /**
     * Returns information about the current session.
     * In other words, this tells you which user is currently logged in.
     */
    getSession(callback: Core.Callback<Authentication.SessionResponse>): void;

    getSession(): Promise<Authentication.SessionResponse>;

    /**
     * Sign up a new user who doesn't exist yet.
     * Throws an error if the user already exists or if the username is invalid, or if some network error occurred.
     * CouchDB has some limitations on user names (e.g. they cannot contain the character `:`).
     */
    signUp(username: string, password: string,
           callback: Core.Callback<Core.Response>): void;

    signUp(username: string, password: string,
           options: Authentication.PutUserOptions,
           callback: Core.Callback<Core.Response>): void;

    signUp(username: string, password: string,
           options?: Authentication.PutUserOptions): Promise<Core.Response>;

    /**
     * Returns the user document associated with a username.
     * (CouchDB, in a pleasing show of consistency, stores users as JSON documents in the special `_users` database.)
     * This is the primary way to get metadata about a user.
     */
    getUser(username: string,
            callback: Core.Callback<Core.Document<Content & Authentication.User> & Core.GetMeta>): void;

    getUser(username: string,
            options: PouchDB.Core.Options,
            callback: Core.Callback<Core.Document<Content & Authentication.User> & Core.GetMeta>): void;

    getUser(username: string,
            options?: PouchDB.Core.Options): Promise<Core.Document<Content & Authentication.User> & Core.GetMeta>;

    /**
     * Update the metadata of a user.
     */
    putUser(username: string,
            callback: Core.Callback<Core.Response>): void;

    putUser(username: string, options: Authentication.PutUserOptions,
            callback: Core.Callback<Core.Response>): void;

    putUser(username: string, options?: Authentication.PutUserOptions): Promise<Core.Response>;

    /**
     * Delete a user.
     */
    deleteUser(username: string,
               callback: Core.Callback<Core.Response>): void;

    deleteUser(username: string,
               options: Core.Options,
               callback: Core.Callback<Core.Response>): void;

    deleteUser(username: string,
               options?: Core.Options): Promise<Core.Response>;

    /**
     * Set new `password` for user `username`.
     */
    changePassword(username: string, password: string,
                   callback: Core.Callback<Core.Response>): void;

    changePassword(username: string, password: string,
                   options: Core.Options,
                   callback: Core.Callback<Core.Response>): void;

    changePassword(username: string, password: string,
                   options?: Core.Options): Promise<Core.Response>;

    /**
     * Renames `oldUsername` to `newUsername`.
     */
    changeUsername(oldUsername: string, newUsername: string,
                   callback: Core.Callback<Core.Response>): void;

    changeUsername(oldUsername: string, newUsername: string,
                   options: Core.Options,
                   callback: Core.Callback<Core.Response>): void;

    changeUsername(oldUsername: string, newUsername: string,
                   options?: Core.Options): Promise<Core.Response>;

    /**
     * Sign up a new admin.
     */
    signUpAdmin(username: string, password: string,
                callback: Core.Callback<string>): void;

    signUpAdmin(username: string, password: string,
                options: Authentication.PutUserOptions,
                callback: Core.Callback<string>): void;

    signUpAdmin(username: string, password: string,
                options?: Authentication.PutUserOptions): Promise<string>;

    /**
     * Delete an admin.
     */
    deleteAdmin(username: string,
                callback: Core.Callback<string>): void;

    deleteAdmin(username: string, options: Core.Options,
                callback: Core.Callback<string>): void;

    deleteAdmin(username: string, options?: Core.Options): Promise<string>;
  }
}

declare module 'pouchdb-authentication' {
  const plugin: PouchDB.Plugin;
  export = plugin;
}
