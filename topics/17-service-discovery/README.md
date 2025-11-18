# Service discovery with containers

> __service discovery with containers__
>
> - web server
> - data store
> - tutorial network

Imagine you have a simple web application that uses a data store to persist data.

In this case, we will use a Node.js application that exposes a counter. When you press the button, the counter will be 
increased and the value will be stored in a Redis data store.

To allow the two containers to communicate, we will place both of them in the `tutorial` network created earlier.

***

Let's run the application using the image found at [this](../../sources/clickster) location:

```shell
$ docker run --net tutorial -dP zavy86/clickster
```

And let's see on which port the service has been exposed:

```shell
$ docker ps -l
```
```terminaloutput
CONTAINER ID   IMAGE              [...]   PORTS                     [...]
3cae1216a1c1   zavy86/clickster   [...]   0.0.0.0:50003->8080/tcp   [...]
```

If we now point the browser to `http://localhost:50003` we will see the web application running, but we will immediately 
encounter an error: `Unable to connect to Redis!`. This is because no Redis server is currently running, and when our
application tries to resolve the name `redis` to connect, it finds nothing.

Let's proceed with running a Redis container:

```shell
$ docker run --net tutorial --net-alias redis -d redis
```

The container must have both the `--net tutorial` option to be added to the network, and the `--net-alias redis` option
to be reachable by the name `redis`. This way, we do not need to refer to the IP address.

If we now refresh the web page, if everything went well, we will see the error replaced by a nice button labeled 
`0 Clicks!`.

If we try clicking the button, we will see the counter increase!

If we then experiment with the `stop` and `start` commands on the Redis container:

```shell
$ docker stop $(docker ps -lq)
$ docker start $(docker ps -lq)
```

You will see that the application will stop working and then start working again as soon as the Redis container is
running again, with the counter value correctly preserved.

Let's now proceed to stop and completely remove the Redis container:

```shell
$ docker stop $(docker ps -lq)
$ docker rm $(docker ps -lq)
```

And let's try to launch a new instance of Redis, but this time without the network alias, specifying only a name:

```shell
$ docker run --net tutorial --name redis -d redis
```

As we can observe in the browser, the application works correctly in this case as well, because Docker assigns a network
alias equal to the container name by default.

However, it is important to note that container names must be unique, while network aliases can be the same for multiple
containers within the same network. If there are two containers with the same alias on the same network, Docker will 
resolve them using a round-robin algorithm.

For example, let's launch two more containers with the same alias:

```shell
$ docker run --net tutorial --net-alias redis -d redis
$ docker run --net tutorial --net-alias redis -d redis
```

Let's now perform a lookup using a busybox container:

```shell
$ docker run --net tutorial --rm busybox nslookup redis
```

As we can see from the output, in this case Docker resolves the name `redis` through all containers with the name or 
alias `redis` within the `tutorial` network.

```terminaloutput
Server:         127.0.0.11
Address:        127.0.0.11:53
Non-authoritative answer:
Name:   redis
Address: 10.86.9.3
Name:   redis
Address: 10.86.9.4
Name:   redis
Address: 10.86.9.5
```

> An important thing to keep in mind is that Docker does not create aliases in the default `bridge` network, so if you
> want to use this feature you must always remember to create a custom network.

---

Additionally, for completeness, it is worth mentioning that it is also possible to connect and disconnect a container 
from a network "on the fly" and not only at runtime.

For example, if we launch another `busybox` container in interactive mode:

```shell
$ docker run --name busybox -ti busybox
```

And let's try to perform the lookup again using this container:

```shell
# nslookup redis
```

You will see that the command will not succeed:

```terminaloutput
Server:         192.168.65.7
Address:        192.168.65.7:53

Non-authoritative answer:

** server can't find redis: NXDOMAIN
```

But if from another shell we connect the `tutorial` network to the `busybox` container:

```shell
$ docker network connect tutorial busybox
```

And let's try performing the lookup again:

```shell
# nslookup redis
```

You will see that this time the command will succeed:

```terminaloutput
Server:         127.0.0.11
Address:        127.0.0.11:53

Non-authoritative answer:
Name:   redis
Address: 10.86.9.3
Name:   redis
Address: 10.86.9.4
Name:   redis
Address: 10.86.9.5
```

Similarly to `connect`, we can use `disconnect` to detach a container from a network:

```shell
$ docker network disconnect tutorial busybox
```

In any case, you will see that all these aspects can be managed much more easily and conveniently thanks to a tool that 
we will cover in one of the next chapters: Docker Compose!

***

> Resources:
> - [busybox](https://hub.docker.com/_/busybox)
> - [clickster](../../sources/clickster)
> - [redis](https://hub.docker.com/_/redis)
> - [zavy86/clickster](https://hub.docker.com/r/zavy86/clickster)

[Continue](../18-understanding-volumes/IT.md) to the next topic.
