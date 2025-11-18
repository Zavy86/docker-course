# Advanced dockerfile syntax

> __advanced dockerfile syntax__
>
> - order
> - layers
> - cache
> - from
> - stages
> - metadata
> - comments

In the previous chapters, we explored simple Dockerfiles to understand how Docker builds images. Now, we will examine
all the main instructions that can be used, from the simplest to the most advanced, to create more complex images 
tailored to our needs.

Let’s start with a quick recap:

All instructions are executed in the **order** in which they are written. Even though they may be cached and/or executed
in parallel, the execution order will always be respected.

Each instruction generates a new **layer** in the Docker image. Therefore, it is good practice to minimize the number of
instructions to reduce the number of layers created.

Docker **caches** each generated layer for subsequent builds. However, if the cache of one layer is invalidated, the 
cache of the following layers will likely also be invalidated.

Every image must start with and include at least one **FROM** instruction, which specifies the base image to use for
building the image. This instruction can be used multiple times within the same Dockerfile to create multiple **stage**
builds, which help reduce the final image size.

Some instructions, such as `CMD` and `ENTRYPOINT`, are used to set **metadata**. Consecutive executions of these 
commands will always modify the same attribute, meaning only the last instruction will take effect in the final image,
rendering the previous ones ineffective.

Finally, any instruction or text can be preceded by a `#` to add **comments** to the Dockerfile.

***

Let’s begin by creating a new Dockerfile starting from the Ubuntu image:

```dockerfile
# Simple Dockerfile example
FROM ubuntu
```

***

> __advanced dockerfile syntax__
>
> run
> - execute commands
> - filesystem changes
> - install packages

The `RUN` instruction is used to execute commands during the image build process and can be expressed in two ways: as a
simple shell command or as a JSON array.

This instruction can be used to run any command, make changes to the file system, or install packages, libraries, or any
other type of file.

However, it cannot be used to record the state of a process or to run a service, since it is executed only during the
image build phase and not when the container starts.

***

When using the shell form, shell wrapping will execute the specified command inside a shell using `/bin/sh -c`, which 
also enables automatic environment variable expansion and allows you to leverage a full shell environment.

```dockerfile
RUN apt-get update
```

However, if we deliberately want to avoid the command being interpreted through a shell or in lightweight images where 
a shell is not available, we can use the JSON format.

```dockerfile
RUN [ "apt-get", "update" ]
```

As mentioned earlier, each instruction creates a new layer within our image. Therefore, if we need to execute multiple 
commands, it is best practice to concatenate them into a single instruction:

```dockerfile
RUN apt-get update  && apt-get install -y nginx && apt-get clean
```

Or, in its more readable multi-line form using the backslash:

```dockerfile
RUN apt-get update \
 && apt-get install -y nginx \
 && apt-get clean
```

***

> __advanced dockerfile syntax__
>
> expose
> - declaration
> - private ports
> - public ports

The `EXPOSE` instruction lets Docker know which ports should be exposed once the container is started.

By default, all ports remain private; declaring them with this instruction is not enough to make them accessible from 
outside. To do so, you must use the `-P` parameter when starting the container to map all defined ports to random ports 
on the host, or use the `-p` parameter followed by the destination and source port numbers if you want full control over
the mapping.

Keep in mind that even if a port is not defined with this instruction, you can always open it manually using the `-p`
option when running the container.

***

You can declare a port as follows:

```dockerfile
EXPOSE 80
```

Or even more than one into the same instruction:

```dockerfile
EXPOSE 80 443
```

And if we want, we can also specify a single protocol:

```dockerfile
EXPOSE 80/tcp 443/tcp 53/udp
```

***

> __advanced dockerfile syntax__
>
> copy
> - files and directories
> - build context
> - ownership
> - permissions

The `COPY` instruction allows you to add files or directories from the build context into the Docker image.

This command is strictly dependent on the build context, which is the path specified as the last parameter in the 
`docker build` command.

Always pay close attention to the ownership and permissions of the files and directories you want to copy to avoid 
access issues once the container is running.

Regarding the cache, when copying files and directories, Docker will not only consider changes in the Dockerfile but 
will also check if the files have changed compared to the previous build.

***

It is always good practice to use `.` to refer to the current directory of the build context. For example, in this way
we are telling Docker to copy all files and directories present in the build context to the `/src` directory inside the
image:

```dockerfile
COPY . /src
```

Absolute paths are considered relative to the build context, so this line is equivalent to the previous one:

```dockerfile
COPY / /src
```

However, the first option is more readable and less misleading.

Attempts to use `..` to exit the build context will be detected and blocked by Docker, and the build will fail. This is
specifically to avoid the _"it works on my machine!"_ scenario, ensuring that an image can be built in the same way on
any host.

If we want to change the ownership of a file or directory during the copy process, we can use:

```dockerfile
COPY --chown=nginx:nginx . /src
```

In this way, all files and directories will be assigned to the `nginx` user and group.

***

> __advanced dockerfile syntax__
>
> add
> - unpack archives
> - remote files

The `ADD` instruction is very similar to `COPY`, but with some additional features. It can be used to copy and 
automatically extract compressed archives, or to add remote files downloadable via the `HTTP/S` protocol.

However, these two features are not cumulative: if you try to download a remote compressed archive, it will not be
automatically extracted. Hopefully, this behavior will change in the future.

Regarding caching, for local files `COPY` works exactly like `ADD`, while for remote files, they will always be
downloaded first to check if they have changed since the previous build.

***

If we wanted to automatically copy and extract an archive containing, for example, the release of an application, we 
could use the following instruction:

```dockerfile
ADD ./release.tar.gz /app 
```

In this way, all the contents of the `release.tar.gz` archive will be extracted into the `/app` directory.

Or, if we want to fetch a remote file directly, we could use for example:

```dockerfile
ADD http://fileserver/scripts/stats.sh /scripts
```

This way, we will fetch the `stats.sh` script from the file server and save it in the `/scripts` directory.

Be aware that in this case, if the remote server is not accessible, the image build process will fail.

***

> __advanced dockerfile syntax__
>
> volume
> - persistent data
> - bypass copy-on-write
> - writable on read-only

The `VOLUME` instruction allows Docker to treat a specific directory as a volume.

Accessing the file system in volumes bypasses the `copy-on-write` layer, offering native performance for operations
performed in such directories.

When starting a container based on an image containing this instruction, Docker will automatically create a volume for 
each specified directory with a unique name unless one is manually specified.

Volumes can also be mapped to local directories on the host for easier access.

When starting a container in `read-only` mode, the file system will be set to read-only, but volumes can still be used 
for both reading and writing if necessary.

***

To specify that a directory should be treated as a volume, we can use the following instruction:

```dockerfile
VOLUME /usr/share/nginx/html
```

In this way, when the container starts, Docker will create a volume with a unique name and associate it with the `/data`
directory.

***

> __advanced dockerfile syntax__
>
> workdir
> - working directory
> - multiple assignments
> - affect followings

The `WORKDIR` instruction allows you to set the working directory inside the container.

All commands such as `RUN`, `CMD`, `ENTRYPOINT`, etc., defined after this instruction in the Dockerfile will be executed
from the specified directory. If you connect interactively to the container's shell, you will also find yourself in this
directory.

***

To define the working directory, you can use the following instruction:

```dockerfile
WORKDIR /usr/share/nginx/html
```

Of course, this command can be specified multiple times within the same Dockerfile to change the working directory 
whenever needed. The last `WORKDIR` instruction will be considered the final working directory, which is where you will 
find yourself when connecting to the container's shell.

***

> __advanced dockerfile syntax__
>
> env
> - environment variables
> - multiple assignments
> - overwritable

The `ENV` instruction allows you to define environment variables that will be set in every container started from the 
image. These variables can also be overwritten at container startup.

If an environment variable is specified at startup that was not previously defined, it will be created automatically.

***

To define an environment variable, you can use the following instruction:

```dockerfile
ENV NGINX_PORT=80
```

In this way, we have defined the environment variable `NGINX_PORT` and assigned it the value `80`. If we want to change 
it when starting the container we can override it using the `-e` option followed by the variable name and its new value:

```shell
$ docker run -e NGINX_PORT=8080 webserver
```

***

> __advanced dockerfile syntax__
>
> user
> - change user
> - back to root

The `USER` instruction can be used to set the username (or its UID) to be used during the image build phase and when
running the container. It can be used multiple times, including to switch back to root without specifying any password.

***

To change the user, you can use the following instruction:

```dockerfile
USER nginx
```

In this way, we will no longer be root, as if we had executed the `su nginx` command to switch to that user.

***

> __advanced dockerfile syntax__
>
> cmd
> - default command
> - overwritable

The `CMD` instruction is metadata representing the default command executed when the container starts. Similar to the 
`RUN` instruction, it can be defined in two ways: as plain text or as a JSON object.

This allows you to avoid specifying any command after `docker run`, as the container will automatically execute the
default command. If a manual command is specified at startup, it will override the command defined in this instruction.

***

An example could be defining a command to run the nginx web server:

```dockerfile
CMD [ "nginx", "-g", "daemon off;" ]
```

In this way, once started, the container will automatically run the nginx web server with the specified parameters.

***

> __advanced dockerfile syntax__
>
> entrypoint
> - default entry point
> - overwritable

The `ENTRYPOINT` instruction is very similar to the `CMD` instruction, with the difference that the arguments provided 
on the command line when starting the container (or those specified in `CMD`) are appended to the `ENTRYPOINT`.

It can also be defined in both text and JSON formats and can be overridden using the `--entrypoint` option.

***

Referring to the previous example, we can split the command into two parts:

```dockerfile
ENTRYPOINT [ "nginx" ]
CMD [ "-g", "daemon off;" ]
```

In this way, the two instructions work together: the first starts the command, and the second specifies the parameters. 
If needed, you can manually provide different parameters at container startup to override them; for example, you could
pass `-t` to test the web server configuration.

***

> __advanced dockerfile syntax__
>
> - arg
> - label
> - shell
> - stopsignal
> - healthcheck
> - onbuild

Finally, here is a brief mention of some additional instructions, for which I refer you to the 
[official guide](https://docs.docker.com/reference/dockerfile/) if you wish to explore them further.

One of the most useful is probably `ARG`, which allows you to define build-time variables (optional or required) that 
can be set by passing them to the `docker build` command with the `--build-arg` option.

You can also use the `LABEL` instruction to add arbitrary metadata to the image, such as the maintainer's name, project
URL, license, or any other relevant information.

With `SHELL`, you can set the default program to interpret shell commands written with `RUN`, `CMD`, etc.

The `STOPSIGNAL` instruction lets you specify which signal Docker should listen for to stop the container. By default,
it is set to `TERM`, but you can change it as needed.

You can also define health check mechanisms for the container using `HEALTHCHECK`, specifying a script or command to be
executed periodically.

Lastly, `ONBUILD` allows you to store instructions that will be executed when this image is used as the base for another
image. This is useful, for example, for installing libraries or compiling application sources before startup.

***

> Resources:
> - [ubuntu](https://hub.docker.com/_/ubuntu)

[Prosegui](../22-application-configuration/IT.md) al prossimo capitolo.
