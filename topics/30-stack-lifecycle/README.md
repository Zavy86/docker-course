# Stack lifecycle

> __managing the stack lifecycle__
>
> - create and start
> - stop and restart
> - recreate and remove

In this chapter, we'll see how to manage the lifecycle of a Docker Compose stack.

Creating a container, stopping it, restarting it, and recreating it might seem like similar operations, but they
have different consequences.

Let's go through them one by one, starting from our small web server.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/syntax
```

Let's look at `compose.yaml` again.

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

First things first, we'll proceed with starting up the project:

```shell
$ docker compose up
```
```terminaloutput
[+] up 2/2
 ✔ Network compose_default Created                                                                                  0.0s
 ✔ Container compose-web-1 Created                                                                                  0.0s
Attaching to web-1
web-1  | /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
web-1  | /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
web-1  | 10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
web-1  | 10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
web-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
web-1  | 2026/09/24 09:29:18 [notice] 1#1: using the "epoll" event method
web-1  | 2026/09/24 09:29:18 [notice] 1#1: nginx/1.23.3
web-1  | 2026/09/24 09:29:18 [notice] 1#1: built by gcc 10.2.1 20210110 (Debian 10.2.1-6) 
web-1  | 2026/09/24 09:29:18 [notice] 1#1: OS: Linux 6.12.76-linuxkit
web-1  | 2026/09/24 09:29:18 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1048576:1048576
web-1  | 2026/09/24 09:29:18 [notice] 1#1: start worker processes
```

Compose will spin up the necessary resources and start Nginx. This time, since we didn't add the `-d` option, the
terminal will stay connected to the logs.

Opening [http://localhost:8080](http://localhost:8080), we could, as usual, visit the site exposed by the web
server.

If we press `Ctrl+C` in the terminal, Compose will stop the service, but it won't remove the container.

```terminaloutput
Container compose-web-1 Killing 
Container compose-web-1 Killed 
Container compose-web-1 Stopped 
```
```shell
$ docker compose ps -a
```
```terminaloutput
NAME            IMAGE   COMMAND                  SERVICE   CREATED          STATUS                       PORTS
compose-web-1   nginx   "/docker-entrypoint.…"   web       54 seconds ago   Exited (137) 9 seconds ago   
```

The `-a` parameter, like in the classic `docker ps`, shows also the stopped containers.

To keep it running in the background, we use the usual `-d` option:

```shell
$ docker compose up -d
```

We can see that the terminal becomes available right away, and with `ps`, we can check the service status:

```shell
$ docker compose ps
```
```terminaloutput
NAME            IMAGE   COMMAND                  SERVICE   CREATED         STATUS         PORTS
compose-web-1   nginx   "/docker-entrypoint.…"   web       2 minutes ago   Up 9 seconds   0.0.0.0:8080->80/tcp
```

We can still connect and view the logs when we need to using the command:

```shell
$ docker compose logs -f web
```

If we press `Ctrl+C` from here, we'll only stop the log reading, **we won't shut down Nginx** like before.

As mentioned in a previous chapter, running `up` again doesn't add more servers if the configuration and images
haven't changed. Compose keeps the existing containers running.

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-web-1 Running                                                                                  0.1s
```

Starting a container, however, doesn't guarantee that the application is ready to respond. We'll delve into this
distinction more in the chapter on dependencies and health checks. For now, let's manually check the logs.

***

If we wanted to pause and turn off this stack without deleting it, we would use the command:

```shell
$ docker compose stop
```
```terminaloutput
[+] stop 1/1
 ✔ Container compose-web-1 Stopped                                                                                  0.1s
```
```shell
$ docker compose ps -a
```
```terminaloutput
NAME            IMAGE   COMMAND                  SERVICE   CREATED         STATUS                      PORTS
compose-web-1   nginx   "/docker-entrypoint.…"   web       9 minutes ago   Exited (0) 18 seconds ago
```

The process has finished, but the container is still running. To restart it, we just need to use the command:

```shell
$ docker compose start
```
```terminaloutput
[+] start 1/1
 ✔ Container compose-web-1 Started                                                                                  0.1s
```

This instruction starts existing containers without creating any missing containers or applying any new changes to
the `compose.yaml` file.

***

If we wanted to separate the initial creation from the start, we could use `create` (instead of `up`), followed by
`start`.

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-web-1 Removed                                                                                  0.2s
 ✔ Network compose_default Removed                                                                                  0.1s
```
```shell
$ docker compose create
```
```terminaloutput
[+] create 2/2
 ✔ Network compose_default Created                                                                                  0.0s
 ✔ Container compose-web-1 Created                                                                                  0.0s
```
```shell
$ docker compose start
```
```terminaloutput
[+] start 1/1
 ✔ Container compose-web-1 Started                                                                                  0.1s
```

In practice, `up -d` lets us do both with a single command.

***

To stop and restart the same container in one operation, we can use the command instead:

```shell
$ docker compose restart web
```
```terminaloutput
[+] restart 0/1
 ✔ Container compose-web-1 Restarting                                                                               0.3s
```

In our case, `web` is the name of the service we chose in the file, not the full name of the container.

We can also specify it for `stop`, `start`, and `up` to choose the service you want to act on.

Without a name, these commands operate on all services in the project, with `up web` for example, we can start any
dependencies of `web`. In our current example, there's only one service, but when we have multiple services, we can
restart the web server without having to restart the database as well. We'll also see how to manage these
dependencies.

***

Now let's change the port in the file by replacing `"8080:80"` with `"8081:80"` and restart the service:

```shell
$ docker compose restart web
```
```terminaloutput
[+] restart 0/1
 ✔ Container compose-web-1 Restarting                                                                               0.1s
```

We'll note that the port remains the same, it's not an error. We've simply asked to restart the same container,
which retains the settings it was created with. To apply the change, we'll need to recreate it:

```shell
$ docker compose up -d web
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-web-1 Started                                                                                  0.1s
```

With this command (which, as we saw before, is equivalent to `create` + `start`), Compose detects that the service
configuration has changed and _recreates_ the container. It stops and removes the previous one, then creates a new
one applying the new configuration.

If we wanted to revisit the Nginx page now, we would navigate to [http://localhost:8081](http://localhost:8081).

Another way to replace a single container, maybe because we want to reset its filesystem or for any other reason, we
just need to use the `--force-recreate` option to force recreation even without changes to the file.

With `ps -q`, we can also get the ID of the running container:

```shell
$ docker compose ps -q web
```
```terminaloutput
f5f554bb14e3c4e92b2ef1f075f482ff23c9a0b946ed378774734fdda745d8d6
```

So let's proceed with applying the forced recreation:

```shell
$ docker compose up -d --force-recreate web
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-web-1 Started                                                                                  0.1s
```

And let's double-check the container ID:

```shell
$ docker compose ps -q web
```
```terminaloutput
e0e7f70400d3f1ea957eef151586c1bec66c8773f431ef99a920756509e116a2
```

***

> __graceful shutdown__
>
> - graceful shutdown
> - stop signal
> - grace period

When we stop a container, Docker shouldn't just "flip the switch" and kill the process.

As seen in the first part of this course, you send a signal to ask it to terminate, giving it time to close
connections and save what it needs. That's what we call a _graceful shutdown_.

The signal is usually `SIGTERM`, but the image can define a different one: for example, the official Nginx image
uses `SIGQUIT`. In these cases, we can modify the `stop_signal` if the application requires it.

The wait isn't infinite, of course. For Linux containers, the default timeout is 10 seconds. If the process doesn't
finish within that limit, Docker automatically sends a `SIGKILL` signal, which forcibly stops it. If we wanted to
give more time, we can customize `stop_grace_period`. For example, we could set it to `30s` or `1m30s`, depending on
how long the application needs to shut down properly.

However, giving more time doesn't solve the problem for an application that ignores a certain signal. The main
process of the container must handle it correctly, and any startup script must forward it to its children.

***

> __restart policies__
>
> - no
> - on-failure
> - always
> - unless-stopped

So far, we've been manually deciding when to restart the service, but when an application is in production, it might
stop due to a crash, a bug, or other issues.

In these cases, if we want the container to restart automatically without human intervention, we can configure
Compose with a _restart policy_.

The main choices are four:

- `no`: no automatic restart, the default behavior.
- `on-failure`: restarts if the process exits with a non-zero code.
- `always`: restarts the container when the process exits, even if there are no errors.
- `unless-stopped`: behaves similarly to `always`, but retains our decision to keep it running even after a Docker
  restart or a full host reboot.

A necessary clarification, these rules react to the _termination of the process_, not in situations where the
process is active but blocked for some other reason.

***

Now let's modify the `compose.yaml` file by adding the `restart: unless-stopped` directive to the `web` service:

```yaml
services:
  web:
    image: nginx
    ports:
      - "8081:80"
    restart: unless-stopped
```

Apply the change with the usual command:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-web-1 Started                                                                                  0.1s
```

And let's manually stop the web service:

```shell
$ docker compose stop web
```
```terminaloutput
[+] stop 1/1
 ✔ Container compose-web-1 Stopped                                                                                  0.1s
```

If we run `ps -a`, we'll see that the container remains stopped as we expect:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME            IMAGE   COMMAND                  SERVICE   CREATED         STATUS                          PORTS
compose-web-1   nginx   "/docker-entrypoint.…"   web       2 minutes ago   Exited (0) About a minute ago
```

Docker follows the explicit request we made.

Now let's add a new service:

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
    restart: unless-stopped
  echo:
    image: alpine
    command: [ "sh", "-c", "echo Started; sleep 15; exit 1" ]
    restart: no
```

The command you see simply makes the base image `Alpine` print the message _Started_, wait for 15 seconds, and then
exit with an error, represented by `exit 1`.

Let's run it again:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Container compose-web-1 Started                                                                                  0.1s
 ✔ Container compose-echo-1 Started                                                                                 0.1s
```

And let's connect to the logs of the `echo` service to observe the behavior:

```shell
$ docker compose logs -f echo
```
```terminaloutput
echo-1  | Started
echo-1 exited with code 1
```

After termination, you can check with the command:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME             IMAGE    COMMAND                    SERVICE   CREATED          STATUS                     PORTS
compose-echo-1   alpine   "sh -c 'echo Started; …"   echo      36 seconds ago   Exited (1) 9 seconds ago
compose-web-1    nginx    "/docker-entrypoint.…"     web       36 seconds ago   Up About a minute          0.0.0.0:8080->80/tcp
```

Without automatic restart, the container stays stopped with an exit code `1`.

Now we'll replace `restart: no` with `restart: on-failure`, restart the stack, and follow the logs again:

```shell
$ docker compose up -d
$ docker compose logs -f echo
```
```terminaloutput
echo-1  | Started
echo-1 exited with code 1
echo-1  | Started
echo-1 exited with code 1
echo-1  | Started
echo-1 exited with code 1
...
```

The message `Started` will repeat, and after each error, the container will be restarted infinitely.

If we change the exit code to `exit 0`, the container will terminate without any errors and won't be restarted
anymore.

```shell
$ docker compose up -d
$ docker compose logs -f echo
```
```terminaloutput
echo-1  | Started
echo-1 exited with code 0
```

If we change the value of `restart` to `always`, we'll see that it will be restarted infinitely.

```shell
$ docker compose up -d
$ docker compose logs -f echo
```
```terminaloutput
echo-1  | Started
echo-1 exited with code 0
echo-1  | Started
echo-1 exited with code 0
echo-1  | Started
echo-1 exited with code 0
...
```

***

> __removing a stack and its data__
>
> - remove containers
> - keep persistent data
> - clean up intentionally

To remove just the container of a service, we need to stop it first:

```shell
$ docker compose stop web
```
```terminaloutput
[+] stop 1/1
 ✔ Container compose-web-1 Stopped                                                                                  0.1s
```

Then use the remove command, Compose will ask for confirmation and you respond with `y`:

```shell
$ docker compose rm web
```
```terminaloutput
? Going to remove compose-web-1 (y/N) y
[+] remove 1/1
 ✔ Container compose-web-1 Removed                                                                                  0.1s
```

The definition of `web` still remains in the file, so we can recreate it simply with:

```shell
$ docker compose up -d web
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-web-1 Started                                                                                  0.1s
```

***

Once all our tests are complete, we'll execute:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-echo-1 Removed                                                                                 0.4s
 ✔ Container compose-web-1 Removed                                                                                  0.2s
 ✔ Network compose_default Removed                                                                                  0.1s
```

This command stops and removes all the containers and networks managed by the project. It doesn't delete the Compose
file, nor, by default, does it remove images or volumes. The networks and volumes declared _external_ are left out
of the cleanup.

This doesn't mean that all data is safe, though. Files that are only in the filesystem of a container are lost when
that container is removed.

Named volumes, on the other hand, remain available and can be reused by the project. Even anonymous volumes stay on
the disk, but a subsequent `up` doesn't automatically reconnect them to the new containers. The files from bind
mounts remain in the host path. We'll explore these cases in more detail in the chapter on data persistence.

If instead we wanted to remove all the volumes attached to the containers, along with the data they contain, we
would need to add the `-v` option to the `down` command.

***

> Resources:
>
> - [Restart policies](https://docs.docker.com/engine/containers/start-containers-automatically/)
> - [alpine](https://hub.docker.com/_/alpine)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../31-project-isolation/README.md) to the next chapter.
