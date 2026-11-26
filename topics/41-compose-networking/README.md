# Compose networking

> __networking with compose__
>
> - service names instead of addresses
> - container ports and host ports
> - connect only what is needed

In the previous chapters, we've already seen that we can reach a service by its name. This is because Compose sets
up a network for each project, and Docker allows containers connected together to find each other through the
internal DNS.

We don't need to know the container's address in advance; we can use the service name, and Compose handles the
substitution and any address changes. The name is available to containers that share a network, while to reach a
service from the host machine, we usually need to publish a port.

The port used between containers is the one the service is listening on, but the published port on the host can be
different.

In this chapter, we'll see how to distinguish the two cases and how to connect each service only to the networks it
needs, limiting thus the possible communications, which is always a good practice.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/lookup
```

Let's look at the `compose.yaml` file.

```yaml
services:
  server:
    image: nginx
    ports:
      - "8080:80"
  client:
    image: busybox
    command: [ "sleep", "infinity" ]
```

How can we see, it's a simple stack with two services inside, a web server (nginx) exposed on port `80` of the
container and `8080` on the host. We then proceed by starting it in the background:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 3/3
 ✔ Network lookup_default    Created                                                                                0.0s
 ✔ Container lookup-server-1 Started                                                                                0.3s
 ✔ Container lookup-client-1 Started                                                                                0.2s
```

Now let's try to perform a lookup:

```shell
$ docker compose exec client nslookup server
```
```terminaloutput
Server:  127.0.0.11
Address: 127.0.0.11:53

Non-authoritative answer:
Name:    server
Address: 10.10.5.3
```

How can we see this by looking up the IP address associated with the container through the service name we obtained
(of course, on your computer these addresses might be different).

Now let's try to request the page using `wget`:

```shell
$ docker compose exec client wget -q -O - http://server:80
```
```terminaloutput
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, nginx is successfully installed and working.
Further configuration is required for the web server, reverse proxy,
API gateway, load balancer, content cache, or other features.</p>
<p>For online documentation and support please refer to
<a href="https://nginx.org/">nginx.org</a>.<br/>
To engage with the community please visit
<a href="https://community.nginx.org/">community.nginx.org</a>.<br/>
For enterprise grade support, professional services, additional
security features and capabilities please refer to
<a href="https://f5.com/nginx">f5.com/nginx</a>.</p>
<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

Inside the network, the containers can communicate using each service's name and port. To open the same page in our
browser, we can't use the name `server` or port `80`. We need to visit
[http://localhost:8080](http://localhost:8080).

Once the tests are complete, stop everything with:

```shell
$ docker compose down
```
```terminaloutput
[+] down 3/3
 ✔ Container lookup-server-1 Removed                                                                                0.3s
 ✔ Container lookup-client-1 Removed                                                                                3.3s
 ✔ Network lookup_default Removed                                                                                   1.8s
```

***

> __names and reachability__
>
> - localhost means this container
> - dns does not guarantee readiness
> - expose is not a firewall

Inside the containers (like `client` in our example), we didn't use `localhost` because it would have pointed to
itself, not to the Nginx container or our host. To communicate with Nginx, we need to use `server`, on the shared
network.

The application recipient must also listen on an address reachable from the container, typically `0.0.0.0`, not just
its loopback. If we publish a port from a container that listens exclusively on `127.0.0.1`, it will remain
unreachable both from inside and outside.

If you try removing the `ports` snippet from the file and restart the stack, the request from `client` to `server`
will continue to work, but accessing it via the host port will no longer be available.

One last note, be careful with the `EXPOSE` instruction we saw in the first part of the course for describing the
exposed ports, **it's not a list of allowed ports**, it doesn't act as a firewall. On the shared network, all ports
on which there is a service listening can be reached, regardless of whether they were exposed or not in the
Dockerfile.

It's really important to segment the networks based on your specific needs.

***

Let's move to the directory `sources/compose/networks` and take a look at the `compose.yaml` file:

```yaml
networks:
  proxy:
  front:
    internal: true
  back:
    internal: true

services:
  app:
    image: busybox
    command: [ "sleep", "infinity" ]
    networks:
      - proxy
      - front
  frontend:
    image: busybox
    command: [ "sleep", "infinity" ]
    networks:
      - front
      - back
  backend:
    image: nginx
    networks:
      back:
        aliases:
          - data-service
```

In this example, the names describe the roles of the test, we're not deploying a real three-tier application.

The server called `backend` serves the usual Nginx page, while the other two containers are again simple containers
that will allow us to make requests from different networks.

The service called `app` belongs to the network `proxy` and shares the network `front` with the `frontend` service,
which in turn shares the network `back` with the `backend`, creating a sort of chain.

In this example, each service has an explicit list of networks, so none are connected to the default network and
Compose doesn't need to create it. Simply declaring the `networks` block at the top level isn't enough; a service
without its own network assignment would still use the default network.

We start up the stack with:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 6/6
 ✔ Network networks_proxy        Created                                                                            0.0s
 ✔ Network networks_front        Created                                                                            0.0s
 ✔ Network networks_back         Created                                                                            0.1s
 ✔ Container networks-app-1      Started                                                                            0.3s
 ✔ Container networks-frontend-1 Started                                                                            0.4s
 ✔ Container networks-backend-1  Started                                                                            0.5s
```

And as we can see, unlike before, now we're only seeing the three networks that we specified.

Let's test some connections starting from the `app` container:

```shell
$ docker compose exec app nslookup backend
```
```terminaloutput
Server:         127.0.0.11
Address:        127.0.0.11:53

Non-authoritative answer:
*** Can't find backend: No answer
```

How can we see that we're not able to resolve the service address for `backend`, let alone get its web page?

```shell
$ docker compose exec app wget -q -T 3 -O - http://backend
```
```terminaloutput
wget: bad address 'backend'
```

While we do the same test from the `frontend` container:

```shell
$ docker compose exec frontend wget -q -T 3 -O - http://backend
```
```terminaloutput
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, nginx is successfully installed and working.
Further configuration is required for the web server, reverse proxy,
API gateway, load balancer, content cache, or other features.</p>
<p>For online documentation and support please refer to
<a href="https://nginx.org/">nginx.org</a>.<br/>
To engage with the community please visit
<a href="https://community.nginx.org/">community.nginx.org</a>.<br/>
For enterprise grade support, professional services, additional
security features and capabilities please refer to
<a href="https://f5.com/nginx">f5.com/nginx</a>.</p>
<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

We'll be able to get the web page, even by using the alias `data-service`:

```shell
$ docker compose up -d
$ docker compose exec frontend wget -q -T 3 -O - http://data-service
```
```terminaloutput
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, nginx is successfully installed and working.
Further configuration is required for the web server, reverse proxy,
API gateway, load balancer, content cache, or other features.</p>
<p>For online documentation and support please refer to
<a href="https://nginx.org/">nginx.org</a>.<br/>
To engage with the community please visit
<a href="https://community.nginx.org/">community.nginx.org</a>.<br/>
For enterprise grade support, professional services, additional
security features and capabilities please refer to
<a href="https://f5.com/nginx">f5.com/nginx</a>.</p>
<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

Alias only apply to the networks where they are defined, they are not global names on the computer. We should avoid
using the same alias for different services if we want to be certain which service we are contacting.

This setup could be useful if we replaced the demo service with a reverse proxy, exposing its ports `80` and `443`
to access the stack without directly exposing the internal services.

If we notice, the two networks `front` and `back` are defined with the option `internal: true`. This means these
networks are isolated from the usual external connectivity and private access through the bridge network.

***

If instead we wanted to manage multiple projects through a shared proxy, we could use an external network, as
discussed in the [chapter on project isolation](../31-project-isolation/README.md).

Simply to the network `proxy`, we add the option:

```yaml
networks:
  proxy:
    external: true
```

In this case, the network `proxy` needs to already exist on our host. Whoever administers the machine will need to
create it once with the command `docker network create proxy`, after which other projects will declare it as
external and only connect the services that need to communicate with the outside world.

Let's stop everything with the usual:

```shell
$ docker compose down
```
```terminaloutput
[+] down 5/5
 ✔ Container networks-frontend-1 Removed                                                                            3.4s
 ✔ Container networks-backend-1  Removed                                                                            0.3s
 ✔ Container networks-app-1      Removed                                                                            3.3s
 ✔ Network networks_front        Removed                                                                            0.3s
 ✔ Network networks_back         Removed                                                                            0.1s
```

And remember, if a network is defined as external, it won't be removed when you run the `down` command.

***

> __host and external access__
>
> - publish intentionally
> - test from the actual client
> - distinguish client dns from docker dns

Let's go back to the network port of the first example. The binding `8080:80` typically uses all host interfaces and
can make the service reachable on the local network or even the internet.

When we set up access, we also try from a second device using the port and the local or remote IP address of the
host. It's not guaranteed that what works on `localhost` will work correctly from other addresses.

And DNS resolution for service names internally within Docker networks is handled by Docker's DNS, not by the
browser running on our computer. If we want a name that's readable by clients, we need to configure a DNS service on
our internal network or use a public DNS.

Moreover, firewalls, VPNs, routers, and Docker configuration can affect the reachability of services, especially
when we're working with online VPS.

***

> Resources
>
> - [Networking in Compose](https://docs.docker.com/compose/how-tos/networking/)
> - [busybox](https://hub.docker.com/_/busybox)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../42-persistent-data/README.md) to the next chapter.
