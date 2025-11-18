# Understanding Docker networks

> __understanding docker networks__
>
> - run network services
> - connect to that service
> - container ip addresses

In this chapter, we will provide a brief introduction to Docker network services.

Specifically, we will learn how to run a network service inside a container, how to expose the service on a port of our 
Docker host, and how to connect to that service.

Finally, we will explore some useful ways to discover the IP addresses assigned to containers and how they communicate 
with each other.

***

To understand the basics of Docker network services, we need a small and easy-to-configure application. Or even better,
an application that requires no configuration at all. So, we will use the official Nginx image, a simple web server that 
listens on port 80 and serves a basic HTML page.

Let's run it!

```shell
$ docker run -d -P nginx
```

The command is the same as we have seen so far, but this time we have simply added a new option: `-P` (uppercase) which
stands for ports.

This option tells Docker to publish all the ports that the container declares as exposed.

Let's find out what is happening:

```shell
$ docker ps -l
```

As we can see from the output of this command, in the `ports` section we now observe a specific indication:

```terminaloutput
CONTAINER ID   IMAGE     [...]   PORTS                   [...]
91a00c1d561c   nginx     [...]   0.0.0.0:50001->80/tcp   [...]
```

The first quartet of zeros represents the IP address of the Docker host (in this case `0.0.0.0`), followed by a randomly
assigned port number (in my case `50001`), and finally an arrow indicating which container port it refers to (in this 
case `80`).

We can obtain a similar result with the following command:

```shell
$ docker port 91a
```

But in this case, the output will be reversed: on the left, we will have the container port, and on the right, the port 
of our host:

```terminaloutput
80/tcp -> 0.0.0.0:50001
```

In simple terms, this means that by connecting to port `50001` on the Docker host (using localhost or the private/public 
IP address of the server), we can access the nginx web server exposed on port `80` of the container.

You can verify this by pointing your browser to [http://localhost:50001](http://localhost:55001).

Just make sure to replace `50001` with the random port number generated in your case.

Alternatively, if you prefer to stay in the terminal, you can use the following command:

```shell
$ curl localhost:50001
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
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>
<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>
<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

But how did Docker know it had to expose port `80` of the container?

Let's take a look at the details of the Nginx image:

```shell
$ docker inspect nginx | jq
```

Towards the end, we will notice a section called `ExposedPorts` where the port `80/tcp` is listed:

```terminaloutput
[...]
      "ExposedPorts": {
        "80/tcp": {}
      },
[...]
```

This port has been defined within the image using the `EXPOSE 80` instruction.

We can easily verify this by checking the image history:

```shell
$ docker history nginx
```
```terminaloutput
IMAGE          CREATED       CREATED BY                                      SIZE      COMMENT
114aa6a9f203   2 years ago   /bin/sh -c #(nop)  CMD ["nginx" "-g" "daemon…   0B        
<missing>      2 years ago   /bin/sh -c #(nop)  STOPSIGNAL SIGQUIT           0B        
<missing>      2 years ago   /bin/sh -c #(nop)  EXPOSE 80                    0B        
<missing>      2 years ago   /bin/sh -c #(nop)  ENTRYPOINT ["/docker-entr…   0B        
<missing>      2 years ago   /bin/sh -c #(nop)  COPY file:e57eef017a414ca7…  4.62kB    
<missing>      2 years ago   /bin/sh -c #(nop)  COPY file:abbcbf84dc17ee44…  1.27kB    
<missing>      2 years ago   /bin/sh -c #(nop)  COPY file:5c18272734349488…  2.12kB    
<missing>      2 years ago   /bin/sh -c #(nop)  COPY file:7b307b62e82255f0…  1.62kB    
<missing>      2 years ago   /bin/sh -c set -x     && addgroup --system -…   60.3MB    
<missing>      2 years ago   /bin/sh -c #(nop)  ENV PKG_RELEASE=1~bullseye   0B        
<missing>      2 years ago   /bin/sh -c #(nop)  ENV NJS_VERSION=0.7.9        0B        
<missing>      2 years ago   /bin/sh -c #(nop)  ENV NGINX_VERSION=1.23.3     0B        
<missing>      2 years ago   /bin/sh -c #(nop)  LABEL maintainer=NGINX Do…   0B        
<missing>      2 years ago   /bin/sh -c #(nop)  CMD ["bash"]                 0B        
<missing>      2 years ago   /bin/sh -c #(nop)  ADD file:9dc5c6fb6431df801…  74.3MB
```

But why did we have to connect to port `50001` instead of simply using port `80`?

If you have some basic networking knowledge, you know that each port can only be exposed once per host. Since we might 
run multiple containers on our host, Docker assigns a random port number for each exposed container port unless you have
specified otherwise.

If we try to launch a second Nginx container with the same `-P` (uppercase) option and check the details of the last
container started:

```shell
$ docker run -d -P nginx
$ docker ps -l
```

We will see that this one also points to port `80` of the container, but this time it is mapped to another random port:

```terminaloutput
CONTAINER ID   IMAGE     [...]   PORTS                   [...]
91a00c1d561c   nginx     [...]   0.0.0.0:50002->80/tcp   [...]
```

If instead we want to manually specify the port number to use, instead of using the `-P` (uppercase) option, we must use 
the `-p` (lowercase) option, which stay for port, and specify the desired port number:

```shell
$ docker run -d -p 80:80 nginx
$ docker run -d -p 8000:80 nginx
$ docker run -d -p 8080:80 -p 8888:80 nginx
$ docker ps
```

With these three commands, we have launched three Nginx containers, each with its own exposed port:

```terminaloutput
CONTAINER ID   IMAGE     [...]   PORTS                                        [...]
d4078cdfe1cb   nginx     [...]   0.0.0.0:8080->80/tcp, 0.0.0.0:8888->80/tcp   [...]
895506e71e00   nginx     [...]   0.0.0.0:8000->80/tcp                         [...]
7d6bea3f17b5   nginx     [...]   0.0.0.0:80->80/tcp                           [...]
```

Now, whichever of these ports you open in your browser or access using curl, you will always get the default Nginx page
served by the corresponding container:

```shell
$ curl localhost:8080
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
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>
<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>
<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

***

To retrieve the IP address assigned to the container, we can use the following command:

```shell
$ docker inspect --format '{{ json .NetworkSettings.IPAddress }}' 91a
```

Obtaining, as output, the IP address assigned to the container:

```terminaloutput
172.17.0.2
```

If we are on a Linux system, we can also ping the container's IP address directly:

```shell
$ ping 172.17.0.2
```

However, if we are on MacOS or Windows using Docker Desktop, you will not be able to access this IP address directly due 
to Docker's internal routing techniques. Instead, you can verify that the container is reachable by performing a ping 
from another container:

```shell
$ docker run busybox ping 172.17.0.2
```
```terminaloutput
PING 172.17.0.2 (172.17.0.2): 56 data bytes
64 bytes from 172.17.0.2: seq=0 ttl=64 time=0.182 ms
```

And as we can see, the response is almost immediate, confirming that everything is working as expected.

***

> Resources:
> - [busybox](https://hub.docker.com/_/busybox)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../16-network-drivers/README.md) to the next topic.
