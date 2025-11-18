# Run our first container

> __run our first container__
> 
> - seen Docker in action
> - start our first container

In this chapter, we will finally see Docker in action by running our first container.

Let's start by launching the well-known `hello-world` container, which will allow us to verify that the installation was
successful.

So, let's not waste any more time and open up our terminal.

***

The official Docker documentation suggests running the following command:

```shell
$ docker run hello-world
```
```terminaloutput
Unable to find image 'hello-world:latest' locally
latest: Pulling from library/hello-world
17eec7bbc9d7: Pull complete 
Digest: sha256:56433a6be3fda188089fb548eae3d91df3ed0d6589f7c2656121b911198df065
Status: Downloaded newer image for hello-world:latest

Hello from Docker!
This message shows that your installation appears to be working correctly.

To generate this message, Docker took the following steps:
 1. The Docker client contacted the Docker daemon.
 2. The Docker daemon pulled the "hello-world" image from the Docker Hub.
    (amd64)
 3. The Docker daemon created a new container from that image which runs the
    executable that produces the output you are currently reading.
 4. The Docker daemon streamed that output to the Docker client, which sent it
    to your terminal.

To try something more ambitious, you can run an Ubuntu container with:
 $ docker run -it ubuntu bash

Share images, automate workflows, and more with a free Docker ID:
 https://hub.docker.com/

For more examples and ideas, visit:
 https://docs.docker.com/get-started/
```

If you get this output, it means the installation was successful, and you are ready to continue.

***

Let's proceed with a slightly more complex command than the one suggested by the installer:

```shell
$ docker run busybox echo hello world
```

By running this command, we instruct the Docker engine to create and start a container from the image called `busybox`, 
one of the smallest and simplest images provided by the Docker team.

[Busybox](https://linux.die.net/man/1/busybox) is a tool often used in embedded systems, smartphones, or routers, and is
considered a sort of Swiss Army knife for the Linux world.

The `echo hello world` command following the image name tells Docker to execute the `echo` command with the argument
`hello world`, and the result is exactly what you see printed in the terminal.

```terminaloutput
Unable to find image 'busybox:latest' locally
latest: Pulling from library/busybox
499bcf3c8ead: Already exists 
Digest: sha256:ab33eacc8251e3807b85bb6dba570e4698c3998eca6f0fc2ccb60575a563ea74
Status: Downloaded newer image for busybox:latest
hello world
```

If this is the first time you run this command, in addition to the `hello world` message you will also see some extra
log lines related to the image download, but we will cover these concepts later.

***

Now, let's move on to something more interesting. With the previous command, we simply started a container and got a 
message as output. Now let's try running the `run` command again, but with different parameters.

```shell
$ docker run -ti alpine
```

This command starts a new container, completely isolated from the previous one.

```terminaloutput
Unable to find image 'alpine:latest' locally
latest: Pulling from library/alpine
6e174226ea69: Pull complete 
Digest: sha256:4bcff63911fcb4448bd4fdacec207030997caf25e9bea4045fa6c8c44de311d1
Status: Downloaded newer image for alpine:latest
/ #
```

The `-ti` parameter is a shorthand for `--tty --interactive` and allows us to start the container in interactive mode; 
that is, it tells Docker to connect us to the container's STDIN and allocate a pseudo-terminal.

In fact, if we use the following command:

```shell
# echo $0
```

You will see that the container responds with `sh`, which is simply the shell you are currently using.

```terminaloutput
/bin/sh
```

So, now that we have a shell available, we can start running some commands. For example, let's try the following:

```shell
# figlet "Hello World!"
```

[Figlet](https://www.figlet.org/) is a program that allows you to render a given text in ASCII format. However, as shown
by the error message, this utility is not included in the Alpine image, nor is it available in our container.

```terminaloutput
/bin/sh: figlet: not found
```

Let's proceed with the installation of this program.

```shell
# apk add figlet
```
```terminaloutput
fetch https://dl-cdn.alpinelinux.org/alpine/v3.22/main/aarch64/APKINDEX.tar.gz
fetch https://dl-cdn.alpinelinux.org/alpine/v3.22/community/aarch64/APKINDEX.tar.gz
(1/1) Installing figlet (2.2.5-r3)
Executing busybox-1.37.0-r18.trigger
OK: 8 MiB in 17 packages
```

Once the installation is complete, let's try running the previous command again. This time, you will see a beautiful 
phrase rendered in ASCII format:

```terminaloutput
 _   _      _ _        __        __         _     _ _ 
| | | | ___| | | ___   \ \      / /__  _ __| | __| | |
| |_| |/ _ \ | |/ _ \   \ \ /\ / / _ \| '__| |/ _` | |
|  _  |  __/ | | (_) |   \ V  V / (_) | |  | | (_| |_|
|_| |_|\___|_|_|\___/     \_/\_/ \___/|_|  |_|\__,_(_)
```

Fantastic, right?

Now, if we exit the container using the `exit` command or the `^D` shortcut, and try to run the `figlet` command in the 
terminal, we will see that the system notifies us that no such program is found (unless you had previously installed it 
on your system).

***

> __run our first container__
>
> - shared kernel
> - independent packages
> - any container in any host

This happens because the _host_ where Docker is installed and the _containers_ that are started and managed within it 
are completely separate and independent entities.

Although they share the same kernel, each container is independent, and any package installed inside a container is not 
exposed to the host and vice versa. Even if we run the same Linux distribution on both the host and a container, there
will be no conflicts or interdependencies.

This allows us to run any container on any host, even with different Linux distributions.

***

> __run our first container__
>
> - stopped state
> - exists on disk
> - all resources freed

But what happened to our container once we disconnected?

When a container finishes its execution, it is stopped and all resources that were allocated for it are released. 
However, it still remains on disk, with all its files, ready to be started again if needed.

***

So, let's go back to our terminal and run the command again:

```shell
$ docker run -ti alpine
```

And once reconnected to the shell, let's try running the `figlet` command again:

```terminaloutput
/bin/sh: figlet: not found
```

What happens? Why can't we find the program we installed earlier?

This happens because every time you start a new container, it is created from scratch based on the specified image—in 
this case, `alpine`. As we saw previously, the `figlet` utility was not included in that image, and we installed it
manually.

So, how can we reuse the container that we carefully customized?

***

> __run our first container__
>
> - yes, we can
> - not a good practice
> - docker workflow
> - custom image

Is it possible that there is no way to reuse the container we created? Of course there is, but this approach is not
considered the best practice.

Docker provides a kind of _workflow_ that allows us to solve this problem in a more robust way.

If we need something inside our containers that is not present in the original image, we can create a custom image and 
then use it to start our future containers.

This might sound very complicated, but in reality, it is quite simple.

The key point of this practice is that it emphasizes automation and repeatability, which are fundamental concepts in 
Docker.

***

> __run our first container__
>
> - pets
>   - distinctive name
>   - unique configuration
>   - irreplaceable
> - cattle
>   - generic name
>   - generic configuration
>   - replaceable

A highly effective metaphor is the distinction between pets and cattle.

Imagine two types of servers: the first has a distinctive name, a unique configuration, and you would go to great 
lengths to keep it running reliably and securely; the second has a generic name, a generic configuration that can be 
easily replicated—perhaps even managed through centralized systems—and if any issues arise, you would have no hesitation
in immediately replacing it with a new clone.

***

> __run our first container__
>
> - create a virtual machine
> - install packages
> - setup environment
> - work on a project
> - tweak environment
> - repeat

What is the connection between this metaphor and Docker?

Let's think about our development environments: we usually start by creating a virtual machine, installing the packages 
and dependencies we need, configuring the development environment, and beginning to work on the project.

We shut down the machine, and when we need to return to the project, we restart it, possibly modify the environment, 
continue working on the project, and so on.

This process may happen multiple times, possibly on different machines, or with different people working on it, and in
the end, no one has full control over the situation. There is no reliable way to recreate the environment from scratch 
on a new machine without relying on documentation and specifications, if they even exist.

***

> __run our first container__
>
> - create image
> - run container
> - work on a project
> - repeat

Development with Docker becomes a much simpler cycle: we create an image containing all the dependencies and environment
configurations required for the project, start a container from this image, and continue working on the project.

When we need to return to the project or modify its configuration, we create a new image and start a new container from 
this updated image.

We commit the image to the project repository so that anyone who wants to work on it will always have the exact same
configuration, fully documented and completely reproducible.

In the next chapters, we will see how to create a custom Alpine image with the Figlet utility included. But before 
diving into image creation, we still need to cover some basic concepts.

***

> Resources:
> - [alpine](https://hub.docker.com/_/alpine)
> - [busybox](https://hub.docker.com/_/busybox)
> - [hello-world](https://hub.docker.com/_/hello-world)

[Continue](../04-background-containers/README.md) to the next topic.
