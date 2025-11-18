# Local development workflow

> __local development workflow__
>
> - missing dependencies
> - inconsistent environments
> - it works on my machine!

Using containers in your local development environment is an excellent solution to address some of the main issues found 
in traditional development workflows, such as dependency management and consistency across team members' environments.
As previously mentioned, this approach solves the _"It works on my machine!"_ problem once and for all.

Let’s see what a simple local development workflow for a **Node.js** application might look like.

***

If you haven’t already, clone the repository for this course:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

This could represent any repository where we will insert our project and then move to the directory:

```shell
$ cd docker-course/source/namer
```

Here we have our Node web application project called **namer**, which includes a Dockerfile.

Let’s take a look around:

```shell
$ tree
```

Inside the `public` directory, you can find the `index.html` file, which serves as the main web page of our application,
along with the `style.css` and `favicon.ico` files. There is also a `package.json` file containing all the information
about our application, and a `server.js` file with the Node server code.

Let’s take a closer look at the [`Dockerfile`](../../sources/namer/Dockerfile):

```shell
$ cat Dockerfile
```

As we can see, it is quite simple. It starts from the official Node image and globally installs `nodemon`, a package
that allows us to track code changes and automatically restart the Node server. It runs a shell script that displays
some information, installs the dependencies, starts the server in development mode, and finally exposes port 3000, the 
standard port for Node.js.

Let’s proceed with building the image:

```shell
$ docker build -t namer .
```
```terminaloutput
[+] Building 1.2s (8/8) FINISHED                                                                                                                                  docker:linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 334B                                                                                                                                      0.0s 
 => [internal] load metadata for docker.io/library/node:24-alpine                                                                                                         1.1s 
 => [auth] library/node:pull token for registry-1.docker.io                                                                                                               0.0s
 => [internal] load .dockerignore                                                                                                                                         0.0s
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/3] FROM docker.io/library/node:24-alpine@sha256:775ba24d35a13e74dedce1d2af4ad510337b68d8e22be89e0ce2ccc299329083                                                   0.0s 
 => CACHED [2/3] WORKDIR /app                                                                                                                                             0.0s 
 => CACHED [3/3] RUN [ "npm", "install", "-g", "nodemon" ]                                                                                                                0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:c3cef0d1ca3d2595187841b8b01b70959a381e067d901ac61c408aa574e72de0                                                                              0.0s 
 => => naming to docker.io/library/namer                                                                                                                                  0.0s 
```

At this point, all that remains is to start the container with some additional parameters:

```shell
$ docker run --rm -ti -p 3000:3000 -v $(pwd):/app namer
```

The first parameter `--rm` means that the container will be removed after execution. The `-ti` parameter, as previously
mentioned, allows us to interact with the container in terminal mode. The `-p 3000:3000` parameter exposes the port on 
our host, and the `-v` parameter mounts the current directory `$(pwd)` inside the `/app` directory of the container.

```terminaloutput
Namer - Development Container
Installing or updating dependencies...

added 99 packages, and audited 100 packages in 840ms

18 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
Starting development server with nodemon...

> namer@1.0.0 dev
> nodemon server.js

[nodemon] 3.1.10
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node server.js`
Server running on port 3000
```

When the container starts, it will install the dependencies using `npm` (Node Package Manager) and launch the server. 
Thanks to `nodemon`, the container will also detect any changes made to the code and automatically restart the server to
apply the updates.

Now, if we open the browser at the IP address of our host, specifying port `3000`, we will see our application running. 
As we can observe, it is a very simple application that generates random names.

---

Let’s assume we want to modify something in the code of our project.

Open the `server.js` file:

```shell
$ nano server.js
```

And let’s modify line `31` to add a log for each generated name.

```js
console.log(`Last generated name: ${name}`);
```

As soon as we save the file, we will notice that in the console where the container is running, `nodemon` will detect 
the change and automatically restart the server.

By refreshing the page, we will see that our log is correctly displayed in the console.

Now all that remains is to commit the change, and all other team members will be able to start their container and see
the applied changes.

This is, of course, a simple example. We could modify the dependencies in the `package.json`, add new files, or make any
other changes, with the assurance that everyone will always be aligned with our development environment.

---

You will now notice a new directory, `node_modules`, which contains all the dependencies installed from our 
`package.json`.

```shell
$ ls -l
```
```terminaloutput
total 120
-rw-r--r--@  1 zavy  staff    295 Aug 07 15:57 Dockerfile
-rw-r--r--@  1 zavy  staff    377 Aug 07 16:41 README.md
drwxr-xr-x  98 zavy  staff   3136 Aug 07 16:50 node_modules
-rw-r--r--   1 zavy  staff  42398 Aug 07 16:50 package-lock.json
-rw-r--r--@  1 zavy  staff    271 Aug 07 15:39 package.json
drwxr-xr-x@  5 zavy  staff    160 Aug 07 16:40 public
-rw-r--r--@  1 zavy  staff   1099 Aug 07 16:38 server.js
```

This directory is created the first time our server starts. Keeping it available on our computer means we do not need to 
install dependencies every time the container starts, saving both time and bandwidth.

If, for any reason, we delete this folder:

```shell
$ rm -R node_modules 
```

At the next container startup, it will be automatically recreated.

***

> __local development workflow__
>
> - missing dependencies
> - inconsistent environments
> - it works on my machine!

As you can see, this approach completely frees us from our local machine. We didn’t even need to install Node.js, as it
was executed directly through a container. Thanks to the `package-lock.json`, we ensure a consistent environment across 
all team members, with Git taking care of the rest.

***

> Resources:
> - [namer](../../sources/namer)
> - [node](https://hub.docker.com/_/node)

[Prosegui](../20-compose-development-stack/IT.md) al prossimo capitolo.
