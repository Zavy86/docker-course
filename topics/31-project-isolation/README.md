# Project isolation

> __project names and stack isolation__
>
> - one definition
> - multiple projects
> - independent lifecycles

In the [previous chapter](../30-stack-lifecycle/README.md), we managed the lifecycle of a small stack.

So how does Compose know which containers belong specifically to that stack?

Let's say we want to keep two instances of the same application open: one for development and one for testing.

Both will have a service called `web`, we don't need to come up with a different name for each service. Instead, we
can assign a different name to the entire **project**.

The project is the grouping that Docker Compose uses to identify and manage the resources for a particular instance
of the stack. The `compose.yaml` file describes what to create, while the project name distinguishes one execution
from others.

Let's see it in practice.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/projects
```

Let's look at `compose.yaml` again.

```yaml
services:
  web:
    image: nginx
    ports:
      - target: 80
        host_ip: 0.0.0.0
```

It's still our Nginx. This time we're indicating the container's port `80`, but we let Docker choose a free port on
the host.

Let's start the two project instances:

```shell
$ docker compose -p blue up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network blue_default  Created                                                                                    0.0s
 ✔ Container blue-web-1  Started                                                                                    0.2s
```
```shell
$ docker compose -p green up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network green_default  Created                                                                                   0.0s
 ✔ Container green-web-1  Started                                                                                   0.2s
```

The `-p` option allows us to choose the name of the project, by the way. With the default settings, we'll see names
like `blue-web-1` and `green-web-1` (project-service-container).

The default networks are also distinct: `blue_default` and `green_default`. If we declared a volume named `data`,
without customizing its name, we would similarly have `blue_data` and `green_data`.

If we ran the `ps` command now, Compose wouldn't find any active stacks in the current directory.

```shell
$ docker compose ps
```
```terminaloutput
NAME   IMAGE   COMMAND   SERVICE   CREATED   STATUS    PORTS
```

We should specify the right project with `-p` to see the active containers:

```shell
$ docker compose -p blue ps
```
```terminaloutput
NAME         IMAGE   COMMAND                  SERVICE   CREATED         STATUS         PORTS
blue-web-1   nginx   "/docker-entrypoint.…"   web       9 seconds ago   Up 9 seconds   0.0.0.0:49957->80/tcp
```

In this case, we can also see which port was assigned to the `blue` project.

To find the port assigned to the project `green`, we can use the same command or the command:

```shell
$ docker compose -p green port web 80
```
```terminaloutput
0.0.0.0:49978
```

If we open these two URLs in the browser, we'll see the same pages, but served by two different containers.

Obviously, the actual ports depend on the machine; on yours, they might be different and can also change after
recreating the containers.

***

Although container names can help us spot them in the list, if we like working with scripts, Compose also provides
handy _labels_, which are metadata about various resources.

With example containers using the command:

```shell
docker inspect green-web-1
```
```terminaloutput
[
    {
        "Id": "3f35ddc7cb9f2ad113b0d09951566df54d9fd50b16c27c6710723e2830b3eee1",
        ...
        "Config": {
            ...
            "Labels": {
                "com.docker.compose.config-hash": "c5fae9444dba6cf20755250384a79074cbbfca481b2a0b47ec2856f69d7ecc53",
                "com.docker.compose.container-number": "1",
                "com.docker.compose.depends_on": "",
                "com.docker.compose.image": "sha256:114aa6a9f20362f71d64d65bf60aa438fc971a656cec9fa69e732838c6f2425f",
                "com.docker.compose.oneoff": "False",
                "com.docker.compose.project": "green",
                "com.docker.compose.project.config_files": ".../compose.yaml",
                "com.docker.compose.project.working_dir": ".../compose-projects",
                "com.docker.compose.service": "web",
                "com.docker.compose.version": "5.5.1",
                "maintainer": "NGINX Docker Maintainers \u003cdocker-maint@nginx.com\u003e"
            },
            ...
        },
        ...
    }
]
```

We can see, among other things, `com.docker.compose.project` and `com.docker.compose.service`, which are incredibly
useful for filtering containers of a specific project or service without knowing their full name:

```shell
$ docker ps -a --filter label=com.docker.compose.project=blue
```
```terminaloutput
CONTAINER ID   IMAGE   COMMAND                  CREATED          STATUS          PORTS                     NAMES
d89b023209d1   nginx   "/docker-entrypoint.…"   18 seconds ago   Up 18 seconds   0.0.0.0:49957->80/tcp   blue-web-1
```

The prefix `com.docker.compose` is reserved for Compose, so we can't use it for our labels.

***

Now let's stop only the project `blue`:

```shell
$ docker compose -p blue stop
```
```terminaloutput
[+] stop 1/1
 ✔ Container blue-web-1 Stopped                                                                                     0.2s
```

As you can see, the project `green` is still running smoothly:

```shell
$ docker compose -p green ps
```
```terminaloutput
NAME          IMAGE   COMMAND                  SERVICE   CREATED          STATUS          PORTS
green-web-1   nginx   "/docker-entrypoint.…"   web       27 seconds ago   Up 27 seconds   0.0.0.0:49978->80/tcp
```

We can then restart it with the command:

```shell
$ docker compose -p blue start
```
```terminaloutput
[+] start 1/1
 ✔ Container blue-web-1 Started                                                                                     0.2s
```

The same rule applies to `logs`, `restart`, and `down`. If we launch a stack with the `up` command and specify a
project name manually, we'll always need to continue using that name to interact with it.

If we omit the `-p` parameter, Compose might show us an empty stack:

```shell
$ docker compose ps
```
```terminaloutput
NAME   IMAGE   COMMAND   SERVICE   CREATED   STATUS   PORTS
```

It doesn't mean the containers have disappeared, in fact, if we check with:

```shell
$ docker compose ls -a
```
```terminaloutput
NAME            STATUS       CONFIG FILES
blue            running(1)   .../sources/compose/projects/compose.yaml
green           running(1)   .../sources/compose/projects/compose.yaml
```

We'll see that both projects are still active, but Compose didn't know which stack we wanted to work with.

***

> __choosing a project name__
>
> - command-line override
> - explicit project name
> - directory default

Besides using `-p`, we can set the project name in `compose.yaml` or specify it through an environment variable.
That way we don't have to remember to pass `-p` with every command.

The priority Docker Compose uses to determine the project name is first the command-line option, then the
environment variable, followed by the name assigned within the file, and lastly the name of the project directory.

***

To lock down the name in our file, we can add this line before `services`:

```yaml
name: demo
```

Let's remember in these cases to use simple names with lowercase letters, numbers, or dashes to avoid issues.

Changing the project name doesn't rename or migrate the previous stack if we launch it again with the new name. If
we run something like:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network demo_default Created                                                                                     0.0s
 ✔ Container demo-web-1 Created                                                                                     0.2s
```

We'll look at a third project called `demo`, with its own network and containers.

***

> __the limits of project isolation__
>
> - host ports are shared
> - avoid fixed container names
> - isolation has boundaries

If you remember, in the `compose.yaml` file configuration, we didn't specify which port on the host to use for the
`web` service. Instead, we only exposed port `80` of the container.

```yaml
services:
  web:
    image: nginx
    ports:
      - target: 80
        host_ip: 0.0.0.0
```

In this example, it was intentional because if we had specified a fixed port, like `"8080:80"`, when we tried to
launch the second instance of the project, it wouldn't have worked since port `8080` would already be in use by the
first project.

Two containers can't occupy the same combination of address, port, and protocol simultaneously, even if they belong
to different projects, because they are sharing the host's resources.

Another obstacle could be the `container_name` option, which allows us to assign a fixed name to the container that
Compose will create. In this case, the second project copy would try to reuse it, resulting in an error. This also
prevents us from starting multiple replicas of the same service.

In our examples, we'll let Compose generate the names to avoid any issues.

There are also other resources we can share without even realizing it.

Two bind mounts to the same host directory see the same files.

An explicit `name` under a network or volume definition uses that name exactly as it is, without the project prefix.

Local images belong to the daemon, so two projects can use the same image without duplicating its layers.

So we always have to be careful because not everything that a stack uses is a private resource of that project.

This separation helps us organize our work, but **it's not a complete security boundary**.

Projects can share the host, published ports, mounts, and common networks, linking them together.

And even the person controlling the Docker daemon can intervene in both.

***

> __sharing a network between projects__
>
> - independent applications
> - shared reverse proxy
> - explicit network ownership

Now let's think about a host where we want to run multiple independent applications, each with its own lifecycle,
but all accessible through the host's `80` or `443` port.

In these situations, a reverse proxy can route requests to the right containers. That way we can avoid publishing a
port for every service and prevent _race conditions_ when services compete for host ports.

In these cases, it's best to run the reverse proxy in a separate project with its own "public" network, and then
connect all the services we want to make accessible from the outside to that network.

***

In this simple example, we won't see a real reverse proxy in action, but let's first see how to set up a network
that is shareable by the projects.

First, let's stop and remove the `demo` project so we can also delete its default network before we change the
configuration.

```shell
$ docker compose -p demo down
```
```terminaloutput
[+] down 2/2
 ✔ Container demo-web-1 Removed                                                                                     0.0s
 ✔ Network demo_default Removed                                                                                     0.1s
```

The other two instances remain active. So let's run the command:

```shell
$ docker network create ingress
```
```terminaloutput
af43623359f4a70fdf3432defa0c426338e4181cf62b56dbe30a2e6ff04273ce
```

And then we'll modify our project by linking the `web` service to the network we just created.

```yaml
name: demo

networks:
  ingress:
    external: true
    name: ingress

services:
  web:
    image: nginx
    ports:
      - target: 80
        host_ip: 0.0.0.0
    networks:
      - ingress
```

In the `web` service, we're telling it to use the `ingress` network, while at the top level, we've added a new
`networks` section where we declare the `ingress` network as external, using the name we created earlier.

Restart the project with:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container demo-web-1 Started                                                                                     0.2s
```

And let's check that the container is connected to the network `ingress`:

```shell
$ docker network inspect ingress
```
```terminaloutput
[
    {
        "Name": "ingress",
        "Id": "af43623359f4a70fdf3432defa0c426338e4181cf62b56dbe30a2e6ff04273ce",
        ...
        "Containers": {
            "09d50e861c5f156f33c23e67bb16e984f36b656ecea3e2324f366123e759c1a9": {
                "Name": "demo-web-1",
                "EndpointID": "79d37d083445c9478a837d54caa61e6b7b54040b3cdb3344c533c63488c81f6e",
                "MacAddress": "e6:98:15:83:0e:99",
                "IPv4Address": "172.30.0.2/16",
                "IPv6Address": ""
            }
        },
        ...
    }
]
```

As we can see, the container `demo-web-1` has been correctly connected to the network `ingress`.

The reverse proxy project will then declare the same external network and will need to reserve ports `80` and `443`.

We'll then point our DNS records there, and the proxy can route requests to the correct containers without them
having to expose their ports.

In this case, the shared network remains under the responsibility of whoever manages the infrastructure.
Alternatively, we could have declared the network within the reverse proxy project to have Compose create it, but in
that case, the reverse proxy project would have needed to be started before all the others. I always prefer to
create the network manually.

***

Let's do some cleanup by stopping and removing the three projects we created in this chapter:

```shell
$ docker compose -p demo down
$ docker compose -p blue down
$ docker compose -p green down
```

The external network is not removed with `down`. In this test, we created it ourselves, and after removing all the
containers that used it, we can delete it separately with the command:

```shell
$ docker network rm ingress
```
```terminaloutput
ingress
```

***

> Resources:
>
> - [Project names](https://docs.docker.com/compose/how-tos/project-name/)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../32-images-compose/README.md) to the next chapter.
