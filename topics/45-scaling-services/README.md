# Scaling services

> __scale a service__
>
> - one definition, multiple containers
> - each replica consumes resources
> - one host is still one host

When the workload increases, a single instance of a service might not be able to handle it. Compose allows us to
start multiple replicas from the same definition, but we need to evaluate how to distribute the requests, manage
state, and share available resources.

In the [previous chapter](../44-resource-limits/README.md), we set resource limits for a service. With multiple
replicas, those limits apply to each container, so we also need to consider their total resource use.

But as always, we see in practice how to leverage this feature directly from the terminal.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/scaling
```

Let's look at the `compose.yaml` file.

```yaml
services:
  client:
      image: busybox
      command: [ "sleep", "infinity" ]
  server:
    image: busybox
    command:
      - sh
      - -ec
      - |
        mkdir -p /www
        hostname > /www/index.html
        echo "Starting HTTP server on $(hostname)"
        exec httpd -f -p 8080 -h /www

```

In this simple example, we'll start a client, which we could then connect to for our tests, and a web server that
will simply display its own hostname on the internal port 8080. This way, we can easily recognize which container
responded without developing a full-fledged application.

So let's launch the stack with the usual:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 3/3
 ✔ Network scaling_default    Created                                                                               0.0s
 ✔ Container scaling-server-1 Started                                                                               0.1s
 ✔ Container scaling-client-1 Started                                                                               0.1s
```

If we wanted to manually scale our server, we could do it using the scale option directly in the up command:

```shell
$ docker compose up -d --scale server=3
```
```terminaloutput
[+] up 4/4
 ✔ Container scaling-server-1 Started                                                                               3.4s
 ✔ Container scaling-server-3 Started                                                                               3.3s
 ✔ Container scaling-server-2 Started                                                                               3.3s
 ✔ Container scaling-client-1 Started                                                                               3.2s
```

How can we see from the log or with the command:

```shell
$ docker compose ps
```
```terminaloutput
NAME               IMAGE     COMMAND                  SERVICE   CREATED          STATUS          
scaling-client-1   busybox   "sleep infinity"         client    45 seconds ago   Up 44 seconds   
scaling-server-1   busybox   "sh -ec 'mkdir -p /w…"   server    45 seconds ago   Up 43 seconds   
scaling-server-2   busybox   "sh -ec 'mkdir -p /w…"   server    45 seconds ago   Up 42 seconds   
scaling-server-3   busybox   "sh -ec 'mkdir -p /w…"   server    45 seconds ago   Up 41 seconds
```

We get three containers for `server` and one for `client`. The three server instances share the same image and
service configuration, but they have their own writable processes, network, and file system.

If we wanted to run a command on a specific replica at this point, we would have to specify its index:

```shell
$ docker compose exec --index 1 server hostname
```
```terminaloutput
91e0911b4c12
```

```shell
$ docker compose exec --index 2 server hostname
```
```terminaloutput
edce81ee79d7
```

The two commands show the hostnames of the respective replicas.

If we don't specify the index but only the name of the service:

```shell
$ docker compose logs server
```
```terminaloutput
server-3 | Starting HTTP server on 73155d675b5c
server-2 | Starting HTTP server on c1396943faa3
server-1 | Starting HTTP server on d96346db532a
```

We'll see the logs for each replica with a prefix that indicates its instance, so we can distinguish between the
replicas.

***

To reduce the number of instances, we can use the same command always:

```shell
$ docker compose up -d --scale server=1
```
```terminaloutput
[+] up 4/4
 ✔ Container scaling-server-1 Running                                                                               0.0s
 ✔ Container scaling-client-1 Running                                                                               0.0s
 ✔ Container scaling-server-2 Removed                                                                               3.1s
 ✔ Container scaling-server-3 Removed                                                                               3.1s
```

And automatically, Compose will take care of reducing the number of replicas by starting from the ones with the
highest index.

***

To keep the desired number in the configuration, we can set `scale` directly in the service:

```yaml
[...]
server:
  image: busybox
  scale: 3
[...]
```

At this point, if we restart the stack without specifying the number of replicas:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 4/4
 ✔ Container scaling-server-1 Running                                                                               0.0s
 ✔ Container scaling-client-1 Running                                                                               0.0s
 ✔ Container scaling-server-3 Started                                                                               0.1s
 ✔ Container scaling-server-2 Started                                                                               0.1s
```

Restart our three replicas of the server.

***

At this point, let's use the client to run a couple of tests:

```shell
$ docker compose exec client nslookup server
```
```terminaloutput
Server:  127.0.0.11
Address: 127.0.0.11:53

Non-authoritative answer:
Name:    server
Address: 172.18.0.4
Name:    server
Address: 172.18.0.3
Name:    server
Address: 172.18.0.5
```

Through the lookup, we can see that the DNS resolves the service name to three IP addresses instead of just one.

If we then try to download the web page using the client always:

```shell
$ docker compose exec client wget -q -O - http://server:8080
```
```terminaloutput
835b0a608735
```

Each request will return the hostname of one of the three servers; repeating the request might yield different
replicas.

```shell
$ docker compose exec client wget -q -O - http://server:8080
```
```terminaloutput
d96346db532a
```

But we shouldn't expect a regular rotation or an even distribution:

```shell
$ docker compose exec client wget -q -O - http://server:8080
```
```terminaloutput
93d595a28bd5
```

The behavior also depends on the client, the DNS cache, and reused connections.

The DNS doesn't decide how to distribute each HTTP request and doesn't provide its own health check control.

For a single entry point, you need a proxy or a load balancer configured to recognize the instances, update when
they change, and handle the ones that are not available.

***

For these tests, I deliberately added a client instead of connecting the server port to the host port for a specific
reason. It's not possible to assign the same TCP port on the host and each replica.

The three replicas can listen on the internal port `8080` because each has its own network space, but they can't
simultaneously occupy the same IP address and TCP port on the host.

A fixed publish like:

```yaml
server:
  image: busybox
  scale: 3
  ports:
    - "8080:8080"
```

It would therefore conflict as soon as Docker Compose tried to start the second replica:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/4
 ✔ Container scaling-client-1 Running                                                                               0.0s
 ✔ Container scaling-server-1 Started                                                                               3.3s
 ⠸ Container scaling-server-2 Starting                                                                              3.2s
 ⠸ Container scaling-server-3 Starting                                                                              3.4s
Error response from daemon: failed to set up container networking: driver failed programming external connectivity on 
endpoint scaling-server-3 (c450b901078b7e36e254390cbc9e3353849b9ef5b36d00caad5ed26169a5cbf2): Bind for 0.0.0.0:8080 
failed: port is already allocated
```

To observe access from the host without generating this conflict, we expose the service port without specifying a
fixed port on the host:

```yaml
server:
  image: busybox
  scale: 3
  ports:
    - ":8080"
```

This way, Docker will choose an available port for each container:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 4/4
 ✔ Container scaling-client-1 Running                                                                               0.0s
 ✔ Container scaling-server-1 Started                                                                               3.3s
 ✔ Container scaling-server-3 Started                                                                               3.2s
 ✔ Container scaling-server-2 Started                                                                               3.3s
```

With the usual:

```shell
$ docker compose ps
```
```terminaloutput
NAME               IMAGE     COMMAND                  SERVICE   CREATED          STATUS          PORTS
scaling-client-1   busybox   "sleep infinity"         client    27 minutes ago   Up 27 minutes   
scaling-server-1   busybox   "sh -ec 'mkdir -p /w…"   server    45 seconds ago   Up 45 seconds   0.0.0.0:52987->8080/tcp
scaling-server-2   busybox   "sh -ec 'mkdir -p /w…"   server    45 seconds ago   Up 44 seconds   0.0.0.0:52986->8080/tcp
scaling-server-3   busybox   "sh -ec 'mkdir -p /w…"   server    45 seconds ago   Up 43 seconds   0.0.0.0:52985->8080/tcp
```

We'll see which ports have been assigned to the replicas, and by opening our browser on these ports, we'll get the
name of the container they're associated with.

This technique allows us to reach individual replicas, but it doesn't create a single load-balanced endpoint.
Additionally, the ports can change after recreating the service. In a stack with a proxy, we typically publish only
the proxy's ports and make the application replicas reachable only on the Docker network.

But as already mentioned, we'll tackle this specific topic in the next chapter.

Finally, let's stop this stack with the usual command:

```shell
$ docker compose down
```
```terminaloutput
[+] down 5/5
 ✔ Container scaling-server-3 Removed                                                                               3.3s
 ✔ Container scaling-server-2 Removed                                                                               3.1s
 ✔ Container scaling-server-1 Removed                                                                               3.2s
 ✔ Container scaling-client-1 Removed                                                                               3.2s
 ✔ Network scaling_default    Removed                                                                               0.1s
```

***

> __application state__
>
> - replicas need independent work
> - shared files need some coordination
> - sessions must survive instance changes

Scaling works well when the application is set up to handle multiple instances. For example, a server that stores
the session in local memory could lose the user's login when a subsequent request hits a different replica.

We can use a shared session storage or an application model that doesn't depend on that local state. But regarding
storage, even the uploads and files you want to keep need a place that won't disappear when you remove a replica.

We also need to be careful that if we attach a named volume to the service, all replicas will mount the same exact
volume. The same goes for a bind mount with the same source. In this case, we should pay close attention to locking
and concurrency to avoid replicas stepping on each other's toes.

More processes writing to the same files do indeed require application-level coordination. So, we're not going to
try to get three reliable databases by increasing `--scale` and sharing the same data directory. Replicating and
handling failover for a database requires a specific configuration and is not as simple as it might seem.

In event patterns, it's not enough for the queue to distribute jobs among the various workers; it also needs to
handle confirmations, retries, and possible duplicates. A worker that gets interrupted shouldn't lose an activity or
cause uncontrolled repetition of an operation with external effects.

Migrations, global imports and periodic tasks shouldn't start automatically in every replica. For those operations
we should use separate jobs, as we saw in [chapter 40](../40-running-one-off-jobs/README.md).

***

> __Compose on a single host__
>
> - more replicas are not high availability
> - no automatic cross-host failover
> - plan capacity and recovery

Moreover, if the host shuts down, all replicas running on its Docker Engine will stop simultaneously. Even a local
shared volume depends on the storage of the same machine. Therefore, to continue offering the service during a host
failure, you need a recovery strategy and a distributed infrastructure across multiple machines.

Increasing the number of replicas with Compose alone doesn't guarantee what's known as high availability.

Compose doesn't automatically move containers to another host, doesn't add replicas in response to traffic, and
doesn't continuously recreate containers to maintain the configured number. A restart policy can restart an existing
container, while the number of replicas is applied when we run the appropriate Compose commands.

For failover and automatic scaling across hosts, you need a specific orchestration solution.

Increasing replicas can also exhaust available resources and degrade performance. Three replicas, each limited to
256 MiB, can require a total of up to 768 MiB, in addition to the resources of other services.

Before increasing the number, let's evaluate the host's capacity and any potential bottlenecks, like disk or
database.

Finally, having more replicas doesn't automatically make an update stack interruption-free. To mitigate this, you
need a controlled ingress, readiness checks, version compatibility, and an application strategy to shut down and
replace instances one at a time.

Compose is still useful for describing and managing a stack on a single host, but for a production system, we need
to plan ahead for capacity, backup, and service recovery. And based on the project's needs, we adopt the right
orchestration solution.

***

> Resources
>
> - [Starting and scaling services](https://docs.docker.com/reference/cli/docker/compose/up/)
> - [busybox](https://hub.docker.com/_/busybox)

[Continue](../46-hardening-services/README.md) to the next chapter.
