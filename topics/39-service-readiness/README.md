# Service readiness

> __startup dependencies and readiness__
>
> - running is not ready
> - check the service, not just the process
> - recover after startup too

If we were to start a stack where one service depends on another, the first requests could still fail even with the
containers starting in the expected order. A container can indeed appear to be running while the application inside
is still initializing and needs a bit of time before it can respond.

With a **healthcheck**, we can verify when the service is ready to respond, and make sure Compose waits for the
positive result of the check before starting the services that depend on it.

A dependency could also stop responding on a stack that's already up. In that case, we can handle the service
interruption by making it retry the requests until the dependency becomes available again.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/readiness
```

Let's look at the `compose.yaml` file.

```yaml
services:
  server:
    image: busybox
    command:
      - sh
      - -c
      - |
        sleep 9
        mkdir -p /www
        echo ready > /www/ready
        exec httpd -f -p 8080 -h /www
  client:
    image: busybox
    init: true
    depends_on:
      - server
    command:
      - sh
      - -c
      - |
        while true; do
          if wget -q -T 2 -O /dev/null http://server:8080/ready; then
            echo "Request succeeded"
          else
            echo "Service unavailable, retrying"
          fi
          sleep 2
        done
```

We'll use the `busybox` image, which contains a small HTTP server and the client we need for this example.

In the first service, called `server`, we've defined a command that waits for nine seconds, creates a `ready` file,
and then starts an HTTP server in the foreground using `exec`.

The delay in this example is only there to make the initialization process visible...

In the `client` service, the command tries to make a request every two seconds. If it fails, it prints a message and
retries instead of terminating.

The `init: true` option starts a small init process in the container, which is useful in this example for forwarding
signals correctly and cleaning up any terminated child processes.

So let's try to start the stack and see what happens:

```shell
$ docker compose up
```
```terminaloutput
[+] up 6/6
 ✔ Image busybox                        Pulled                                                                      2.9s
 ✔ Network compose-readiness_default    Created                                                                     0.0s
 ✔ Container compose-readiness-server-1 Created                                                                     0.0s
 ✔ Container compose-readiness-client-1 Created                                                                     0.0s
Attaching to client-1, server-1
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
Gracefully Stopping... press Ctrl+C again to force
Container compose-readiness-client-1 Stopping 
Container compose-readiness-client-1 Stopped 
Container compose-readiness-server-1 Stopping 
client-1 exited with code 143                                                                                
Container compose-readiness-server-1 Stopped                                                                 
server-1 exited with code 137
```

Apart from possible differences in IP addresses, you should see something similar. In the first few seconds of
startup, you might observe some requests failing and then succeeding correctly after the nine seconds defined.

Thanks to the `depends_on` option, Compose did respect the order, but it didn't wait for the server to be ready to
receive HTTP connections. The result was exactly client-side errors.

We use `Ctrl+C` to exit and stop the stack with the command:

```shell
$ docker compose down
```
```terminaloutput
[+] down 3/3
 ✔ Container compose-readiness-client-1 Removed                                                                     0.0s
 ✔ Container compose-readiness-server-1 Removed                                                                     0.0s
 ✔ Network compose-readiness_default    Removed                                                                     0.1s
```

***

Now let's modify the `server` service by adding a block dedicated to health checks.

```yaml
services:
  server:
    [...]
    healthcheck:
      test: [ "CMD", "wget", "-q", "-T", "2", "-O", "/dev/null", "http://127.0.0.1:8080/ready" ]
      interval: 2s
      timeout: 5s
      retries: 3
      start_period: 30s
    [...]
```

This check is performed inside the container itself, as you can see from the address `127.0.0.1`.

The `CMD` instruction runs the program and its arguments without a shell. If we need to use complex expressions with
`&&`, pipes, or shell-interpreted variables, we should use `CMD-SHELL`.

Beyond just the test, we also need to specify an `interval`, which is the frequency at which the checks will be
performed, a `timeout` to limit the duration of each attempt, the number of `retries` to indicate how many
consecutive failures are needed to consider the container `unhealthy`, and a `start_period` that defines an initial
period during which failures are not counted.

The start period doesn't require waiting for thirty seconds; a successful health check can mark the container as
`healthy` earlier.

Finally, in the `client` service, we replace the `depends_on` list with this map:

```yaml
[...]
  client:
    image: busybox
    depends_on:
      server:
        condition: service_healthy
  [...]
```

Let's redo the test by restarting the stack with:

```shell
$ docker compose up
```
```terminaloutput
[+] up 3/3
 ✔ Network compose-readiness_default    Created                                                                     0.0s
 ✔ Container compose-readiness-server-1 Created                                                                     0.0s
 ✔ Container compose-readiness-client-1 Created                                                                     0.0s
Attaching to client-1, server-1
Container compose-readiness-server-1 Waiting 
Container compose-readiness-server-1 Healthy 
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
Gracefully Stopping... press Ctrl+C again to force
Container compose-readiness-client-1 Stopping 
Container compose-readiness-client-1 Stopped 
Container compose-readiness-server-1 Stopping 
client-1 exited with code 143                                                                                
Container compose-readiness-server-1 Stopped 
server-1 exited with code 137
```

And we'll see now that Compose will wait for the `server`'s healthcheck to respond positively before starting the
`client`.

The initial wait is visible in the startup command, when it completes correctly, `server` turns to `healthy`, and
the client starts sending requests, immediately getting successful responses.

***

> __dependency conditions and health status__
>
> - wait for a service to start
> - wait for a healthy status
> - wait for successful completion

The available conditions represent three different needs: `service_started` corresponds to waiting for the simple
start, like in the initial list. `service_healthy` requires a successful healthcheck, while
`service_completed_successfully` waits for a service to terminate with a zero exit code, which is suitable for
initialization tasks, which we'll delve into in the next chapter.

We don't set `service_completed_successfully` on a server that needs to stay up because Compose would wait for its
completion, never managing to get a result.

The health status starts at `starting` and changes based on the check results.

Remember that a healthcheck tells us only what we've decided to measure.

***

Now we restart the stack in the background with:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Container compose-readiness-server-1 Healthy                                                                    10.1s
 ✔ Container compose-readiness-client-1 Started                                                                     0.1s
```

And we manually stop the server with the command:

```shell
$ docker compose stop server
```
```terminaloutput
[+] stop 1/1
 ✔ Container compose-readiness-server-1 Stopped                                                                     3.1s
```

And let's take a look at the latest logs from the client:

```shell
$ docker compose logs --tail 10 -f client
```
```terminaloutput
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | wget: bad address 'server:8080'
client-1  | Service unavailable, retrying
client-1  | wget: bad address 'server:8080'
client-1  | Service unavailable, retrying
client-1  | wget: bad address 'server:8080'
client-1  | Service unavailable, retrying
```

As we can see, the client continues to live and reports that the service is not available.

Exit the logs with `Ctrl+C`, then restart the server:

```shell
$ docker compose start server
```
```terminaloutput
[+] start 1/1
 ✔ Container compose-readiness-server-1 Started                                                                     0.1s
```

And let's take a look at the client log:

```shell
$ docker compose logs --tail 10 -f client
```
```terminaloutput
client-1  | wget: bad address 'server:8080'
client-1  | Service unavailable, retrying
client-1  | wget: bad address 'server:8080'
client-1  | Service unavailable, retrying
client-1  | wget: bad address 'server:8080'
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
```

We'll note that after the initial delay, the requests start succeeding again.

***

Now let's do one last test without stopping the server. Exit from the logs and temporarily move the demo file inside
the container:

```shell
$ docker compose exec server mv /www/ready /www/ready.off
```

After some checks fail, Docker will show `server` as still running but `unhealthy`.

```shell
$ docker compose ps
```
```terminaloutput
NAME                         IMAGE     COMMAND                   SERVICE   CREATED          STATUS
compose-readiness-client-1   busybox   "sh -c 'while true; …"    client    18 minutes ago   Up 9 minutes               
compose-readiness-server-1   busybox   "sh -c 'sleep 9\nmkdi…"   server    18 minutes ago   Up 3 minutes (unhealthy)  
```

The server is up, but that URL no longer responds successfully. The client will also register the issue:

```shell
$ docker compose logs --tail 10 -f client
```
```terminaloutput
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
```

The usual `restart` policies, like `unless-stopped`, react to the termination of the process, not just to the
`unhealthy` state. Compose doesn't automatically replace the container for this reason, and it doesn't stop services
that had already passed the `service_healthy` condition.

So we restore the file:

```shell
$ docker compose exec server mv /www/ready.off /www/ready
```

And we'll note that the state will revert to being `healthy`:

```shell
$ docker compose ps
```
```terminaloutput
NAME                         IMAGE     COMMAND                   SERVICE   CREATED          STATUS
compose-readiness-client-1   busybox   "sh -c 'while true; …"    client    20 minutes ago   Up 11 minutes               
compose-readiness-server-1   busybox   "sh -c 'sleep 9\nmkdi…"   server    20 minutes ago   Up 5 minutes (healthy)  
```

We finally remove the stack with the usual command:

```shell
$ docker compose down
```
```terminaloutput
[+] down 3/3
 ✔ Container compose-readiness-client-1 Removed                                                                     0.1s
 ✔ Container compose-readiness-server-1 Removed                                                                     3.1s
 ✔ Network compose-readiness_default    Removed                                                                     0.1s
```

A good start and a good recovery are therefore two complementary responsibilities. Compose can coordinate the
initial conditions, while the application must know how to handle what happens during operation.

The healthcheck makes a condition observable, but it doesn't fix services on its own.

***

> Resources:
>
> - [Control startup and shutdown order](https://docs.docker.com/compose/how-tos/startup-order/)
> - [busybox](https://hub.docker.com/_/busybox)

[Continue](../40-running-one-off-jobs/README.md) to the next chapter.
