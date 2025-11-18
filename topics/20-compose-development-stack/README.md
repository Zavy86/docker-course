# Compose for development stack

> __compose for development stack__
>
> - stack definition
> - multiple containers
> - networking management
> - environment variables

In the previous chapter, we explored how to leverage containers in a local development environment to mitigate some of 
the main issues of traditional development workflow, such as dependency management and consistency across collaborators'
development environments.

However, the described approach is not without flaws. Without relying on external scripts, it can be quite challenging 
to manage the build and launch of multiple containers, handle their network connections, or even replicate launch 
parameters and environment variables.

The solution to these "problems" is provided by **Docker Compose**, a tool that allows you to define and manage
applications and configurations through a single configuration file for the entire stack.

Let's see it in action with a local development stack for a **Node.js** application with a **Postgres** database.

***

If you haven't already, clone the repository for this course:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Now let's move into the directory:

```shell
$ cd docker-course/source/subscriptions
```

Here we have our Node/Postgres web application project called **subscriptions**, which includes the Docker Compose
configuration file.

Let's take a look around:

```shell
$ tree
```

Inside the directory, we can see the `package.json` file containing all the information about our web application, the
`server.js` file with the code for our Node server, the `Dockerfile` that defines the application container image, and
finally the `docker-compose.yml` file that defines the entire local development stack.

The `Dockerfile` is very similar to the one shown in the previous chapter, so let's focus on the
[`docker-compose.yml`](../../sources/subscriptions/docker-compose.yml) file:

```shell
$ cat docker-compose.yml
```

Without dwelling too much on the YAML syntax of Compose, we can see that the file is structured into multiple sections. 
The `services` section defines the various services that make up our stack: the `db` service represents the Postgres
database, and the `app` service represents our Node application.

As we can observe, the two services are defined differently. For example, the `db` service uses an official Postgres 
image, while the `app` service uses the `build` instruction, which is passed the build context `./`, just as we did when 
manually running the `docker build` command.

Both services have an `environment` section that allows us to define the configurations necessary for their proper
functioning.

The `app` service also includes a `volumes` section that maps the current directory `./` to the `/app` directory inside
the container, ensuring that the application source code is always up to date in the container. This allows `nodemon` to
detect changes in real time and automatically restart the server. Additionally, there is a `ports` section that maps
port `3000` on our host to port `3000` in the container, and a `depends_on` section that specifies that the `app`
service depends on the `db` service, ensuring that Docker Compose starts the database before the application.

Let's proceed with starting the stack. To do so, we simply need to run the command:

```shell
$ docker compose up
```
```terminaloutput
[+] Running 11/11
 ✔ db Pulled                                                                                                                                                                   8.4s 
   ✔ 6b59a28fa201 Already exists                                                                                                                                               0.0s 
   ✔ e268d9926fd7 Pull complete                                                                                                                                                0.6s 
   ✔ fa72dc705f57 Pull complete                                                                                                                                                0.7s 
   ✔ b0ad42f9114e Pull complete                                                                                                                                                0.7s 
   ✔ b8766da0c426 Pull complete                                                                                                                                                6.2s 
   ✔ 9f71dc4be8f8 Pull complete                                                                                                                                                6.2s 
   ✔ d9708c695497 Pull complete                                                                                                                                                6.2s 
   ✔ 94800f566750 Pull complete                                                                                                                                                6.2s 
   ✔ aa4fc12bd3e6 Pull complete                                                                                                                                                6.2s 
   ✔ e0cd6769e23c Pull complete                                                                                                                                                6.3s 
[+] Building 1.3s (10/10) FINISHED                                                                                                                                                  
 => [internal] load local bake definitions                                                                                                                                     0.0s
 => => reading from stdin 559B                                                                                                                                                 0.0s
 => [internal] load build definition from Dockerfile                                                                                                                           0.0s 
 => => transferring dockerfile: 342B                                                                                                                                           0.0s 
 => [internal] load metadata for docker.io/library/node:24-alpine                                                                                                              1.0s 
 => [auth] library/node:pull token for registry-1.docker.io                                                                                                                    0.0s
 => [internal] load .dockerignore                                                                                                                                              0.0s
 => => transferring context: 2B                                                                                                                                                0.0s 
 => [1/3] FROM docker.io/library/node:24-alpine@sha256:775ba24d35a13e74dedce1d2af4ad510337b68d8e22be89e0ce2ccc299329083                                                        0.0s 
 => CACHED [2/3] WORKDIR /app                                                                                                                                                  0.0s 
 => CACHED [3/3] RUN [ "npm", "install", "-g", "nodemon" ]                                                                                                                     0.0s 
 => exporting to image                                                                                                                                                         0.0s 
 => => exporting layers                                                                                                                                                        0.0s 
 => => writing image sha256:550e48e80e11e826e848d89b4862b5f9ea061118c29ea51cebaac2396fb63527                                                                                   0.0s 
 => => naming to docker.io/library/subscriptions-app                                                                                                                           0.0s 
 => resolving provenance for metadata file                                                                                                                                     0.0s 
[+] Running 4/4                                                                                                                                                                     
 ✔ subscriptions-app              Built                                                                                                                                        0.0s 
 ✔ Network subscriptions_default  Created                                                                                                                                      0.0s 
 ✔ Container subscriptions-db-1   Created                                                                                                                                      0.2s 
 ✔ Container subscriptions-app-1  Created                                                                                                                                      0.1s 
Attaching to app-1, db-1
db-1   | The files belonging to this database system will be owned by user "postgres".
db-1   | This user must also own the server process.
db-1   | 
db-1   | The database cluster will be initialized with locale "en_US.utf8".
db-1   | The default database encoding has accordingly been set to "UTF8".
db-1   | The default text search configuration will be set to "english".
db-1   | 
db-1   | Data page checksums are enabled.
db-1   | 
db-1   | fixing permissions on existing directory /var/lib/postgresql/18/docker ... ok
db-1   | creating subdirectories ... ok
db-1   | selecting dynamic shared memory implementation ... posix
db-1   | selecting default "max_connections" ... 100
db-1   | selecting default "shared_buffers" ... 128MB
db-1   | selecting default time zone ... UTC
db-1   | creating configuration files ... ok
db-1   | running bootstrap script ... ok
db-1   | sh: locale: not found
db-1   | 2025-10-24 15:01:59.303 UTC [38] WARNING:  no usable system locales were found
db-1   | performing post-bootstrap initialization ... ok
db-1   | initdb: warning: enabling "trust" authentication for local connections
db-1   | initdb: hint: You can change this by editing pg_hba.conf or using the option -A, or --auth-local and --auth-host, the next time you run initdb.
db-1   | syncing data to disk ... ok
db-1   | 
db-1   | 
db-1   | Success. You can now start the database server using:
db-1   | 
db-1   |     pg_ctl -D /var/lib/postgresql/18/docker -l logfile start
db-1   | 
db-1   | waiting for server to start....2025-10-24 15:01:59.640 UTC [44] LOG:  starting PostgreSQL 18.0 on aarch64-unknown-linux-musl, compiled by gcc (Alpine 14.2.0) 14.2.0, 64-bit
db-1   | 2025-10-24 15:01:59.641 UTC [44] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
db-1   | 2025-10-24 15:01:59.646 UTC [50] LOG:  database system was shut down at 2025-10-24 15:01:59 UTC
db-1   | 2025-10-24 15:01:59.650 UTC [44] LOG:  database system is ready to accept connections
db-1   |  done
db-1   | server started
db-1   | CREATE DATABASE
db-1   | 
db-1   | 
db-1   | /usr/local/bin/docker-entrypoint.sh: ignoring /docker-entrypoint-initdb.d/*
db-1   | 
db-1   | waiting for server to shut down....2025-10-24 15:01:59.796 UTC [44] LOG:  received fast shutdown request
db-1   | 2025-10-24 15:01:59.798 UTC [44] LOG:  aborting any active transactions
db-1   | 2025-10-24 15:01:59.800 UTC [44] LOG:  background worker "logical replication launcher" (PID 53) exited with exit code 1
db-1   | 2025-10-24 15:01:59.800 UTC [48] LOG:  shutting down
db-1   | 2025-10-24 15:01:59.801 UTC [48] LOG:  checkpoint starting: shutdown immediate
db-1   | 2025-10-24 15:01:59.827 UTC [48] LOG:  checkpoint complete: wrote 943 buffers (5.8%), wrote 3 SLRU buffers; 0 WAL file(s) added, 0 removed, 0 recycled; write=0.011 s, sync=0.014 s, total=0.027 s; sync files=303, longest=0.005 s, average=0.001 s; distance=4352 kB, estimate=4352 kB; lsn=0/1B9F350, redo lsn=0/1B9F350
db-1   | 2025-10-24 15:01:59.832 UTC [44] LOG:  database system is shut down
db-1   |  done
db-1   | server stopped
db-1   | 
db-1   | PostgreSQL init process complete; ready for start up.
db-1   | 
db-1   | 2025-10-24 15:01:59.913 UTC [1] LOG:  starting PostgreSQL 18.0 on aarch64-unknown-linux-musl, compiled by gcc (Alpine 14.2.0) 14.2.0, 64-bit
db-1   | 2025-10-24 15:01:59.914 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
db-1   | 2025-10-24 15:01:59.914 UTC [1] LOG:  listening on IPv6 address "::", port 5432
db-1   | 2025-10-24 15:01:59.916 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
db-1   | 2025-10-24 15:01:59.920 UTC [66] LOG:  database system was shut down at 2025-10-24 15:01:59 UTC
db-1   | 2025-10-24 15:01:59.922 UTC [1] LOG:  database system is ready to accept connections
app-1  | Subscriptions - Development Container
app-1  | Installing or updating dependencies...
app-1  | 
app-1  | up to date, audited 133 packages in 1s
app-1  | 
app-1  | 19 packages are looking for funding
app-1  |   run `npm fund` for details
app-1  | 
app-1  | 2 moderate severity vulnerabilities
app-1  | 
app-1  | To address all issues (including breaking changes), run:
app-1  |   npm audit fix --force
app-1  | 
app-1  | Run `npm audit` for details.
app-1  | Starting development server with nodemon...
app-1  | 
app-1  | > subscriptions@1.0.0 dev
app-1  | > nodemon server.js
app-1  | 
app-1  | [nodemon] 3.1.10
app-1  | [nodemon] to restart at any time, enter `rs`
app-1  | [nodemon] watching path(s): *.*
app-1  | [nodemon] watching extensions: js,mjs,cjs,json
app-1  | [nodemon] starting `node server.js`
app-1  | Server running on port 3000
```

As we can see from the extensive log, Docker Compose handled downloading the Postgres image from the registry, built the
image for our Node application from the build context, created a dedicated network for this stack, and finally started
both containers.

Since we did not specify the `-d` parameter for background execution, Docker Compose also attached the logs of both
containers to our console, allowing us to monitor their execution in real time. As you can see above, we have the logs 
for the database startup, and below, the logs for our application startup.

As we saw in the previous chapter, the application container installed the dependencies using `npm` and started the
server with `nodemon` on port `3000`.

Now, if we open the browser at the IP address of our host, specifying port `3000`, we can see our application running.

As we can see, it is a very simple subscription management application.

---

Now, if we want to stop working on the project, to stop the local development stack, we just need to press `^C` in the
console we are connected to. This way, Docker Compose will send a termination signal to both containers and stop them.

Alternatively, we could open a new console, navigate to the project directory, and run the command:

```shell
$ docker compose stop
```

To restart the stack at a later time, we could use the following command:

```shell
$ docker compose start
```

If we wanted to completely remove the stack, including containers, network, and volumes, we could use the following 
command:

```shell
$ docker compose down
```

In this case, however, unlike using stop and start, we will also lose all the data saved within the volume of the
Postgres database container. To restart the stack in the future, we would need to run the command again:

```shell
$ docker compose up -d
```

This command will take care of recreating the entire stack from scratch and then running it in the background.

***

> __compose for development stack__
>
> - stack definition
> - multiple containers
> - networking management
> - environment variables

Of course, in this case as well, we can proceed to modify the source code of our application, or for example change the
Postgres version to test an upgrade to a new release or any other scenario, knowing that once we commit the changes,
every team member will be able to replicate the same local development environment simply by running a single command.

You can probably already imagine how fast onboarding procedures will be for new team members!

In this course, I have not covered all the details of Docker Compose, but have limited myself to showing you a simple 
way to use it in a local development context. I do plan to expand this course in the future with a section dedicated 
exclusively to Docker Compose and orchestration systems such as Docker Swarm and Kubernetes. For now, if you want to
learn more, I recommend the official [Docker Compose documentation](https://docs.docker.com/compose/).

***

> Resources:
> - [node](https://hub.docker.com/_/node)
> - [postgres](https://hub.docker.com/_/postgres)
> - [subscriptions](../../sources/subscriptions)

[Continue](../21-advanced-syntax/README.md) to the next topic.
