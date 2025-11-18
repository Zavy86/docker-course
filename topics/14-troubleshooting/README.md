# Getting inside a container

> __getting inside a container__
>
> - logging into
> - install or update
> - change configurations
> - view logs and metrics
> - analyze the disk

Often, when dealing with servers, we may need to access the console to modify some configuration, install or update 
packages, view events, or analyze metrics.

In an ideal world, all these operations could be performed externally using tools like Chef, Ansible, Puppet, Salt, or
similar for configuration management, and centralized platforms for event and metric collection such as Datalog, Fluent,
Prometheus, etc.

In reality, however, we often find ourselves connecting via SSH, or when things stop working, we might need to start the 
system in recovery mode or even attach the disk to another VM just to recover the data.

***

> __getting inside a container__
>
> - images
> - volumes
> - environments
> - console

With Docker, many of these tasks can, and should, be performed without accessing a terminal.

Package installation should be handled at the image level.

Configurations should be stored in volumes or passed through environment variables.

Events should be written to the console so they can be automatically collected by Docker.

Process information and metrics can be viewed directly from the host.

However, sometimes it may be necessary to go beyond the standard practices...

***

Let's set aside events and volumes for a moment and take a look at process information.

If you are running Docker on Linux (refer to the [second chapter](../02-training-environment/IT.md) for more 
information), Docker processes are tightly integrated with the operating system and can be viewed using the standard
Linux `ps` command.

Let's start a container in the background:

```shell
$ docker run -d zavy86/clock
```
```terminaloutput
f4a54b52f0cf3d687d4ea00c1e5d798609ee4fb17fd3ab740db12279543218f3
```

And if we now run the following command:

```shell
$ ps faux
```

At the bottom, we will see a process that, coincidentally, has the same ID as our container:

```terminaloutput
[...] /usr/bin/containerd-shim-runc-v2 -namespace moby -id f4a54b52f0cf3d687d4ea00c1e5d798609ee4fb17fd3ab740db12279543218f3 -addres
[...]  \_ /bin/sh -c while date; do sleep 1; done;
[...]      \_ sleep 1
```

This means that, at the system level, a containerized process is not so different from any other process.

Therefore, we can use all standard commands such as `lsof`, `strace`, `gdb`, etc. to analyze it.

***

If for any reason we need to access a container's terminal, we could certainly connect via SSH (if we had set up an SSH 
server), but this is not the best solution.

As we have seen previously, we can use the following command:

```shell
$ docker exec -ti f4a sh
```

This command will create a new `sh` process inside the container and attach you to its terminal.

However, this can only be done if the container is running. How can we proceed if the container has been stopped or has
crashed?

A stopped container exists only on disk; it is nothing more than the file system layer created from the image and the 
changes made during its execution. You can think of it as a USB drive.

You certainly cannot SSH into a USB drive; instead, you would need to plug that drive into another machine to access its
files.

Let's see how to perform this operation with a Docker container.

If we try to run [this](../../sources/crash) image:

```shell
$ docker run zavy86/crash
```

You will notice that the container crashes immediately without providing any output.

Let's proceed to find out the container ID with the usual command:

```shell
$ docker ps -aql
```
```terminaloutput
ec2e3030bac2
```

At this point, let's check if there are any differences compared to the image:

```shell
$ docker diff ec2
```
```terminaloutput
C /var
C /var/log
C /var/log/nginx
A /var/log/nginx/error.log
```

As we can see, there are some interesting files that we may want to inspect.

Let's use the `cp` command to copy the `error.log` file to the current directory:

```shell
$ docker cp ec2:/var/log/nginx/error.log .
```

And let's view its contents:

```shell
$ cat error.log
```
```terminaloutput
[emerg] 1#1: unknown directive "invalid_directive" in /etc/nginx/nginx.conf:1
```

As we can see, there is an error in the Nginx configuration file, specifically an invalid directive.

At this point, we could try to restart the container using the `docker start` command, but we would most likely 
encounter the exact same error, and unfortunately, this command does not allow us to specify new processes to run.

However, we can create a new image from the stopped container:

```shell
$ docker commit ec2 debug
```

And launch a new container from this image, specifying a new entrypoint:

```shell
$ docker run -ti --entrypoint sh debug
```

In this way, we can perform any operation inside the container and observe the results.

```shell
$ cat /var/log/nginx/error.log
```
```terminaloutput
[emerg] 1#1: unknown directive "invalid_directive" in /etc/nginx/nginx.conf:1
```

***

Another very useful operation could be to create a dump of the entire file system of the container.

This can be achieved using the following command:

```shell
$ docker export ec2 | tar tv
```

We can obtain a detailed list of the entire container's contents:

```terminaloutput
-rwxr-xr-x  0 0      0           0 Sep 24 09:50 .dockerenv
drwxr-xr-x  0 0      0           0 Jul 15 12:42 bin/
lrwxrwxrwx  0 0      0           0 Jul 15 12:42 bin/arch -> /bin/busybox
lrwxrwxrwx  0 0      0           0 Jul 15 12:42 bin/ash -> /bin/busybox
lrwxrwxrwx  0 0      0           0 Jul 15 12:42 bin/base64 -> /bin/busybox
lrwxrwxrwx  0 0      0           0 Jul 15 12:42 bin/bbconfig -> /bin/busybox
[...]
```

The `export` command generates a tar file containing all the files from the container. This file can then be downloaded 
and extracted. In our case, by using the `tv` options, we simply obtained a verbose list and no file was downloaded, so 
no disk space was used.

***

> Resources:
> - [crash](../../sources/crash)
> - [zavy86/clock](https://hub.docker.com/r/zavy86/clock)
> - [zavy86/crash](https://hub.docker.com/r/zavy86/crash)

[Continue](../15-understanding-networks/README.md) to the next topic.
