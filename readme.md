PouchDB Authentication
=====

You know what's hard?  Security.  You know what makes security really easy?  CouchDB.

As it turns out, CouchDB isn't just a database: it's also a REST server with a built-in authentication framework. And it boasts some top-notch security features:

* automatically salts and hashes your user passwords with strong PBKDF2 algorithm
* stores a cookie in the user's browser
* refreshes the cookie token periodically
* expires the token after 10 minutes by default

And best of all, CouchDB does it with good ol'-fashioned HTTP. Just open up the network tab and watch the JSON fly back and forth. You know it's secure, because you can see how it works.

To get started, just install CouchDB, throw in a little HTTPS to encrypt the user's password (that's what it's for), and then you've got everything you need for your site's user authentication.

Your users can rest easy because their data isn't shared with some third-party API, and you can rest easy because you didn't have to write the security stuff yourself.

Requirements
-----

- CouchDB v1.3.0+ or equivalent (Cloudant, IrisCouch)
- PouchDB v2.0.0+

Installation
----


    bower install pouchdb
    bower install pouchdb-authentication


Or just grab the latest `pouchdb-authentication.min.js` from [the releases page](https://github.com/pouchdb/authentication/releases) and declare it after PouchDB:

```html
<script src="pouchdb-XXX.min.js"></script>
<script src="pouchdb-authentication-XXX.min.js"></script>
```

CouchDB setup
---------

Install CouchDB:

```
sudo apt-get install couchdb # debian, ubuntu, etc.
brew install couchdb         # mac
```

Or, get yourself a hosted one at Cloudant, IrisCouch, etc. It works the same.

Set up CORS so that PouchDB can access your CouchDB from any URL, even if it has a different domain:


    HOST=http://localhost:5984 # or whatever you got
    curl -X POST $HOST/_config/httpd/enable_cors -d '"true"'
    curl -X PUT $HOST/_config/cors/origins -d '"*"'
    curl -X PUT $HOST/_config/cors/credentials -d '"true"'
    curl -X PUT $HOST/_config/cors/methods -d '"GET, PUT, POST, HEAD, DELETE"'
    curl -X PUT $HOST/_config/cors/headers -d '"accept, authorization, content-type, origin"'

PouchDB setup
------

We assume you're using a PouchDB attached to an HTTP backend.  If you're not, you're doing something wrong.

```js
var db = new PouchDB('http://localhost:5984/mydb');
```

Note that the users are shared across the entire CouchDB instance, not just `mydb`. But you can use `mydb` like you normally would.

API
-------

Just like PouchDB, every function takes a Node-style callback of the form `function(error, response)`. Or you can use promises:

```js
db.doSomething(args).then(function (response){
  return db.doSomethingElse(args);
}).then(function response) {
  // handle response
}).catch(function (error) {
  // handle error
});
```

#### db.signup(username, password [, options] [, callback])

Sign up a new user who doesn't exist yet.  Throws an error if the user already exists or if the username is invalid, or if some network error occurred.  CouchDB has some limitations on user names (e.g. they cannot contain the character `:`).

```js
db.signup('batman', 'brucewayne', function (err, response) {
  if (err) {
    if (err.name === 'conflict') {
      // "batman" already exists, choose another username
    } else if (err.name === 'forbidden') {
      // invalid username
    } else {
      // HTTP error, cosmic rays, etc.
    }
  }
});
```

##### Example response:

```js
{
  "ok":true,
  "id":"org.couchdb.user:batman",
  "rev":"1-575ed65bb40cbe90dc882ced8044a90f"
}
```

##### Options

* **metadata** : Object of metadata you want to store with the username, e.g. an email address or any other info. Can be as deeply structured as you want.

##### Example:

```js
db.signup('robin', 'dickgrayson', {
  metadata : {
    email : 'robin@boywonder.com',
    birthday : '1932-03-27T00:00:00.000Z'
    likes : ['acrobatics', 'short pants', 'sidekickin\''],
  }
}, function (err, response) {
  // etc.
});
```

Note that CouchDB does not enforce a password policy or a username policy, unless you add a security doc to the `_users` database.

You can also type `signUp()`.

#### db.login(username, password [, options] [ callback])

Log in an existing user. Throws an error if the user doesn't exist yet, the password is wrong, the HTTP server is unreachable, or a meteor struck your computer. 

```js
db.login('superman', 'clarkkent', function (err, response) {
  if (err) {
    if (err.name === 'unauthorized') {
      // name or password incorrect
    } else {
      // cosmic rays, a meteor, etc.
    }
  }
});
```

##### Example response:

```js
{"ok":true,"name":"david","roles":[]}
```

You can also type `logIn()`.

#### db.logout([callback])

Logs out whichever user is currently logged in. Or, does nothing if nobody's logged in.

##### Example:

```js
db.logout(function (err, response) {
  if (err) {
    // network error
  }
})
```

##### Example response:

```js
{"ok":true}
```

You can also type `logOut()`.

#### db.getSession([callback])

Returns information about the current session.  In other words, this tells you which user is currently logged in.

##### Example:

```js
db.getSession(function (err, response) {
  if (err) {
    // network error
  } else if (!response.userCtx.name) {
    // nobody's logged in
  } else{
    // response.userCtx.name is the current user
  }
});
```

##### Example response:

```js
{
    "info": {
        "authenticated": "cookie", 
        "authentication_db": "_users", 
        "authentication_handlers": ["oauth", "cookie", "default"]
    }, 
    "ok": true, 
    "userCtx": {
        "name": "batman", 
        "roles": []
    }
}

```

Tests
------

To test in the browser, run

    npm run build-test

Then install mongoose or some similar web server, and run

    mongoose

Then point your browser to [http://127.0.0.1:8080/test/index.html](http://127.0.0.1:8080/test/index.html)
