Test this library
------

First off, install the library's dependencies:

```
npm install
```

### Using a self-managed CouchDB instance

Your CouchDB instance must be accessible at `http://localhost:5984`. You can specify an alternative URL by setting a `SERVER_HOST` environment variable.

Also remember that the CouchDB instance must be in [Admin Party](http://guide.couchdb.org/draft/security.html#party)! CORS is automatically enabled by the test script.

#### To test in the browser (locally)

```bash
CLIENT=local npm run test
# or simply
npm run test-local
```

#### To test in PhantomJS

```bash
CLIENT=phantom npm run test
# or simply
npm run test-phantom
```

#### To test in NodeJS

```bash
CLIENT=node npm run test
# or simply
npm run test-node
```

### Using a docker CouchDB instance

First you need to install Docker, start the daemon service, and enable access permissions to `/var/run/docker.sock`. As an example, on Fedora Linux you would do as root:

```bash
dnf install docker
systemctl start docker
chmod a+rw /var/run/docker.sock
```

Then you can run the tests as user.

#### Using the latest CouchDB 2.x

```bash
SERVER=couchdb:2 CLIENT=local npm run test
```

#### Using the latest CouchDB 1.x

```bash
SERVER=couchdb:1 CLIENT=local npm run test
```

#### Using PouchDB Server

```bash
SERVER=pouchdb-server CLIENT=local npm run test
```
