# Understanding Docker images

> __understanding docker images__
>
> - files
> - metadata
> - layers 

A Docker image is made up of **files** and **metadata**: the files make up the filesystem of the container, while the 
metadata includes a set of information related to the image, such as its description, author name, environment variables
to set, startup commands, and more.

Docker images are built from **layers**, a series of stacked layers where each one can modify the metadata or the
filesystem by adding, changing, or removing files.

Multiple images can share one or more layers to optimize disk space usage, network transfer times, and memory 
consumption.

***

> __understanding docker images__
>```
> alpine
> └ node.js
>   └ dependencies
>     └ code and assets
>       └ configurations
>         └ (read-write layer)
>```

This could be an example of a Docker image containing a Node application. For instance, you might start from the base 
Alpine image, which only includes a lightweight version of Linux, then proceed with the installation of Node, install 
all the required dependencies, copy the application code and assets, and set the various configuration parameters.

The result is a complete and functional image of our Node application that can be run in a container.

All the layers of our image are locked in read-only mode. Once we start a container from this image, Docker will create 
an additional layer on top of all the others in read-write mode, which will contain all the changes made to the 
container's filesystem during its execution.

***

> __understanding docker images__
> 
> - read-only shared
> - read-write copy
> - copy-on-write

When we start a new container and already have the image available, it will be ready instantly. This is because Docker 
does not create a full copy of the image's filesystem; instead, it simply creates a new empty layer where only the
changes made with respect to the image are saved.

This means that we can start multiple containers from the same image, each sharing all layers in read-only mode, but 
each with its own personal read-write layer.

To draw an analogy with object-oriented programming, we can think of **images** as **classes**, **layers** as 
**inheritance**, and **containers** as **instances**.

***

> __understanding docker images__
>
> - chicken and egg
> - scratch image
> - commit
> - build

As we have seen previously, Docker images are read-only, so how can we create one?

The only way to create an image is to "freeze" the state of a container, but the only way to start a container is from 
an image... It seems a bit like the classic dilemma: _Which came first, the chicken or the egg?_

In this case, the answer is a bit simpler and less paradoxical: there is a special image called `scratch`, which allows
you to create a container from scratch, although you will rarely need to do this.

In any case, once a container is running, and you have made the necessary changes, you can freeze its state into a new
layer using the `docker commit` command, which will create an image that is an exact copy of the running container.

Alternatively, you can use the more common method, which you will likely use daily: the `docker build` command, which
builds an image from a **Dockerfile**.

In the next chapters, we will see how to use these two methods to create our first Docker images.

***

> __understanding docker images__
>
> - official images
> - community images
> - self-hosted images

Docker images can be divided into three main categories, also known as namespaces: official images, community images,
and images hosted by third parties outside of Docker Hub.

Official images (those found in the **root namespace** such as `busybox`, `alpine`, `ubuntu`, etc.) are guaranteed by
Docker and are usually created and maintained by the Docker team or verified third parties. They typically include small
utilities, base operating system distributions, and ready-to-use components and services such as popular databases and 
web applications.

Community images are distributed under the namespace of users or organizations on the Docker registry (for example,
`zavy86/clock`), where the first segment represents the username or organization, and the second segment is the image 
name itself.

The third category includes images that are not found on the Docker registry but are instead hosted on a private or
public third-party server. In this case, the image reference must also include the URL (or IP address and optional port) 
of the registry. An example is the [Actions Runner](https://ghcr.io/actions/actions-runner) image, which is hosted on
Google's public registry.

***

In any case, a Docker image can only reside in two places: either within a **registry** or on a **host** where the 
Docker engine is installed.

Using the Docker client, we can instruct the server to connect to a registry (official or self-hosted) to search for,
download, or upload images as needed.

Let's now see which images are present on our machine:

```shell
$ docker image ls
```

You will receive as output a list of all the images you own:

```terminaloutput
REPOSITORY     TAG        IMAGE ID       CREATED      SIZE
alpine         latest     02f8efbefad6   1 hour ago   8.51MB
busybox        latest     e8291c1a323a   1 hour ago   4.17MB
zavy86/clock   latest     ed98027af201   1 hour ago   4.17MB
```

We can see the image name, tag, unique identifier, creation date, and disk size.

If we want to search for a new image on the official Docker registry, we can use the following command:

```shell
$ docker search wordpress
```

Searching for WordPress will return a lot of images; the most important column to check is OFFICIAL. If there is an
official image available, you should always prefer it unless you have a specific reason not to. Another indicator of an
image's popularity is the number of STARS it has received from the community.

In this case, for example, you can see both an official image and a community image, and the difference is clear:

```terminaloutput
NAME                DESCRIPTION                                     STARS   OFFICIAL
wordpress           The WordPress rich content management system…   5819    [OK]
bitnami/wordpress   Bitnami container image for WordPress           274
[...]
```

Once you have identified the name of the image you are interested in, you can download it using the following command:

```shell
$ docker pull wordpress
```

After a short period of execution, depending on your connection speed, you will receive an output similar to this:

```terminaloutput
Using default tag: latest
latest: Pulling from library/wordpress
[...]
3c5574f7ca95: Pull complete 
f0b9fe21862b: Pull complete 
d033883923aa: Pull complete 
Digest: sha256:c5f075fe71c9120e769edbf761bcf20bf0b73d72d49dfde042a06aafcdfef08d
Status: Downloaded newer image for wordpress:latest
docker.io/library/wordpress:latest
```

This will indicate that the image has been downloaded successfully. As we have already seen in previous chapters, if we
try to start a container with an image that is not present on our machine, Docker will automatically download it before
actually starting the container.

When downloading an image, we can also specify its version using a tag. If we do not specify anything, Docker will use
the `latest` tag by default, which should represent the latest stable version available.

***

> __understanding docker images__
>
> - latest
>   - testing
>   - prototyping
>   - newest
> - specific
>   - production
>   - repeatability
>   - stability

As we have just seen, the default tag is `latest`, but what does it actually mean and when should we use it?

If we are running tests, experimenting, or want to try the latest version of an image, we can confidently use the 
`latest` tag.

However, if we are deploying a service to production, want to make our procedures and scripts reproducible, and need to
ensure a minimum level of stability, it is always advisable to use a specific tag.

This is similar to what we already do daily with dependencies in our projects.

Some images—fortunately, an increasing number—natively support multiple architectures. This means we can use the same 
image on an x86 computer, an ARM computer, a Raspberry Pi, etc. Other images, however, differentiate by tag, with each 
architecture having its own tag. Still, others are only available for certain platforms, so we can use them only on 
compatible machines or by resorting to emulation.

***

Resources:
> - [wordpress](https://hub.docker.com/_/wordpress)

[Continue](../07-interactive-images/IT.md) to the next topic.
