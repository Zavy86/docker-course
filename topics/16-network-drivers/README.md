# Container network drivers

> __container network drivers__
>
> - bridge
> - null/none
> - host
> - container

After briefly reviewing how networking works in Docker in the previous chapter, let's now look at the various network 
drivers that Docker provides.

---

By default, unless otherwise specified, each container receives a virtual network interface via the `bridge` driver 
assigned to `eth0` (in addition to the private loopback interface assigned to `lo`).

This virtual interface is provided through a pair of virtual ethernet devices (`veth`) that act as a network tunnel
between the container and the Docker engine.

The connection is made through a bridge network, which by default is named `docker0`, and the addresses for this private 
network are allocated from an internal subnet, typically `172.17.0.0/16`.

Outgoing traffic is masqueraded using a firewall rule, allowing packets to leave the container's private network to the 
outside, while incoming traffic passes through a routing table.

Each container can, of course, have its own routing and firewall rules, etc.

---

If we choose to use the `null` network driver, the container will not be assigned any virtual network interface and will
only have the loopback interface available.

The container will not be able to send or receive any network traffic.

This driver is often used in testing scenarios or to isolate containers from the host environment.

---

If we start a container using the `host` network, it will be able to see and access all network interfaces of the host
system.

It will therefore be able to bind to any address and any available port on the system, for better or worse.

Traffic will not be filtered or masqueraded, and performance will match the native network interface.

This scenario is often used to run applications that require low latency or a high number of simultaneous connections, 
such as VOIP systems, streaming servers, gaming servers, etc.

---

Finally, with the `container` driver, we can force a container to reuse the network interface of another container. This
means they will share the exact same network, IP address, routing rules, firewall rules, etc.

In this case, containers can communicate directly with each other through their loopback interfaces.

***

To manage networks in Docker, just like with images, we can use the group of commands under `network`, for example with
the command:

```shell
$ docker network ls
```

We will see the list of currently available networks:

```terminaloutput
NETWORK ID     NAME     DRIVER    SCOPE
c43104847bdb   bridge   bridge    local
ed6460e832d4   host     host      local
40ad1bedef47   none     null      local
```

Of course, we can also create other custom networks, and during creation we can specify the network driver to use and 
assign a specific subnet.

***

> __container network drivers__
>
> - isolated
> - multiple
> - aliases

By default, Docker networks are isolated from each other, meaning that containers on one network cannot communicate with
containers on another network.

However, a container can also be connected to multiple networks at the same time; in this case, it will receive a
different IP address for each network it joins.

For each assigned network, you can also specify one or more aliases, which can be used to reach the container instead of
its IP address. The container name is always used as the default alias.

***

Let's now create a new custom network called `tutorial`:

```shell
$ docker network create tutorial
```

And as we can see, by default the `bridge` driver will be used:

```shell
$ docker network ls
```
```terminaloutput
NETWORK ID     NAME       DRIVER    SCOPE
c43104847bdb   bridge     bridge    local
ed6460e832d4   host       host      local
40ad1bedef47   none       null      local
40ad1bedef47   tutorial   bridge    local
```

Let's launch a container and assign it to this new network:

```shell
$ docker run -d --name webserver --net tutorial nginx
```

Now let's launch a new container on the same network:

```shell
$ docker run -ti --net tutorial busybox
```

And let's try to ping the Nginx container:

```shell
# ping webserver
```

As we can see, the ping was successful using the alias assigned from the container name.

```terminaloutput
PING webserver (172.26.0.2): 56 data bytes
64 bytes from 172.26.0.2: seq=0 ttl=64 time=0.302 ms
```

As we can see, the subnet used for this network in my case is `172.26.0.0/16`.

However, if we try to ping a container on a different network, such as the Nginx container we launched in the previous 
chapter:

```shell
# ping 172.17.0.2
```

We will not receive any response.

***

> Resources:
> - [busybox](https://hub.docker.com/_/busybox)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../17-service-discovery/README.md) to the next topic.
