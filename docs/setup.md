Setup
---------

### Requirements

- CouchDB v1.3.0+
- PouchDB v2.0.0+

### PouchDB setup

Bower:

    bower install pouchdb
    bower install pouchdb-authentication

Browserify :

    npm install pouchdb --save
    npm install pouchdb-authentication --save

```javascript
var PouchDB = require("pouchdb");
PouchDB.plugin(require('pouchdb-authentication'));
```

Static :

Or, just grab the latest `pouchdb.authentication.min.js` from [the releases page](https://github.com/pouchdb-community/pouchdb-authentication/releases) and declare it after PouchDB:

```html
<script src="pouchdb-XXX.min.js"></script>
<script src="pouchdb.authentication.min.js"></script>
```

### CouchDB setup

Install CouchDB:

```
sudo apt-get install couchdb # debian, ubuntu, etc.
brew install couchdb         # mac
```

Next, set up CORS so that PouchDB can access your CouchDB from any URL. For convenience we'll use [add-cors-to-couchdb](https://github.com/pouchdb/add-cors-to-couchdb).

    npm install -g add-cors-to-couchdb # may require sudo
    add-cors-to-couchdb                #


In a production environment, don't forget to set up [SSL](https://wiki.apache.org/couchdb/How_to_enable_SSL).

### PouchDB setup

Create a `PouchDB` attached to an HTTP backend.  This is the one you'll use for `pouchdb-authentication` stuff.

```js
var db = new PouchDB('http://localhost:5984/mydb', {skip_setup: true});
```

*(Note that the users are shared across the entire CouchDB instance, not just `mydb`. Also, the `skip_setup` is to prevent PouchDB from doing any HTTP requests to the server while we're not logged in, which would cause a modal authentication popup.)*

Of course, you'll probably want to sync that database with a local one:

```js
var local = new PouchDB('local_db');
local.sync(db, {live: true, retry: true}).on('error', console.log.bind(console));
```

But the `pouchdb-authentication` API will operate on your remote `PouchDB` object, not your local one.
