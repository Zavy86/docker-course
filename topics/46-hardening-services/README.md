# Hardening services

> __reduce unnecessary access__
>
> - start from application needs
> - grant only necessary privileges
> - verify after each change

When we develop an application, the first goal is to get it working. But once the service is up and running, it's
easy to leave the configuration as is without asking which permissions are actually necessary for it to work.

A container, though, could have access to files or resources that the application doesn't use. If an error or an
attack exploits these accesses, the consequences could be more severe than we can imagine.

The hardening process involves making a service more secure by reducing what it can do. An example of this could be
avoiding running the application as the root user when it's not necessary.

In this chapter, we'll start by defining the service requirements, limit the permissions, and verify that everything
continues to work correctly after each change.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/hardening
```

Let's look at the `compose.yaml` file.

```yaml
services:
  app:
    image: busybox
    command: [ "sleep", "infinity" ]
```

We'll start with the usual `busybox` image and the same `sleep infinity` command we've seen before.

We start by bringing up the stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network hardening_default Created                                                                                0.0s
 ✔ Container hardening-app-1 Started                                                                                0.1s
```

And let's check with which ID this image is run:

```shell
$ docker compose exec app id
```
```terminaloutput
uid=0(root) gid=0(root) groups=0(root),10(wheel)
```

As you can see in this image, the process starts as the root user.

This doesn't mean that every root container can automatically control the entire host, but we can avoid giving
privileges that aren't necessary for our small service, making everything more secure.

***

So we're going to modify the definition of our service by adding a specific user ID:

```yaml
[...]
user: "1000:1000"
```

And we restart the stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container hardening-app-1 Started                                                                                2.7s
```

At this point, if we re-run the same command:

```shell
$ docker compose exec app id
```
```terminaloutput
uid=1000 gid=1000 groups=1000
```

The process is now running with the user ID (UID) `1000` and the group ID (GID) `1000`.

These numbers are used by the system to recognize the user and group. For this example, it's not necessary for the
image to have a user with a name associated with that ID. However, some applications might require a user to be
present in the image and a usable home directory.

On Linux, without user remapping, the same UIDs are used to check the host directory permissions mounted into the
container. For example, if a directory belongs to the host user with UID `1000`, regardless of its name, the process
inside the container can end up owning it.

We don't choose a random number for any service; instead, we prefer the default non-root user from the image and
also take into account the owner and permissions of the host files that the application might need to modify
eventually. We make sure that the chosen user has access to all the necessary paths.

Remember that changing the `user` doesn't also change the owner or permissions of the files already in the volumes.

***

Another thing we can do if our process doesn't need to modify the image files is set the container's filesystem to
read-only, with a writable temporary area.

So let's modify the `compose.yml` file further by adding:

```yaml
[...]
read_only: true
tmpfs:
  - /tmp:size=16m,mode=1777
```

In this way, the `/tmp` directory will be set up as a 16 MiB writable temporary area thanks to the `1777` mode,
which allows writing for all users.

Restart the stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container hardening-app-1 Started                                                                                1.8s
```

If we then try to create a file:

```shell
$ docker compose exec app touch /etc/test-file
```
```terminaloutput
touch: /etc/test-file: Read-only file system
```

We'll address the specific error that indicates the file system is read-only.

If we try to read and write in the `tmp` directory:

```shell
$ docker compose exec app sh -c 'echo temporary > /tmp/test-file'
```
```shell
$ docker compose exec app cat /tmp/test-file
```
```terminaloutput
temporary
```

We'll see that we can do this without any problem.

Remember that `read_only` doesn't automatically make all mounts read-only. A writable volume or bind mount can still
be a point where the process can modify data. For sources that should only be read, we also set the mount with the
read-only flag.

***

We can then further reduce the process's privileges by removing any it doesn't need and preventing it from acquiring
new ones.

Let's finish off the service with this last snippet:

```yaml
cap_drop:
  - ALL
security_opt:
  - no-new-privileges:true
```

The capabilities allow us to assign specific privileges to a process. Our `sleep` doesn't require any, so we can
remove them all. For other applications, we should check and add only the ones that are necessary.

The `no-new-privileges` option, on the other hand, prevents the process from acquiring new privileges, for example
by running programs like `setuid`. However, it's still necessary to use a non-root user to completely avoid this
issue.

We restart the stack with:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container hardening-app-1 Started                                                                                3.6s
```

And let's verify that the security settings are active in the container:

```shell
$ docker compose exec app sh -c 'grep -E "CapEff|NoNewPrivs" /proc/1/status'
```
```terminaloutput
CapEff: 0000000000000000
NoNewPrivs:     1
```

Obviously in production, we should also verify everything with a functional test of the application. The absence of
errors at startup is not a guarantee that all expected functionalities are working.

Finally, let's stop the entire stack with the usual command:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container hardening-app-1 Removed                                                                                2.7s
 ✔ Network hardening_default Removed                                                                                0.1s
```

***

> __review what enters the host__
>
> - narrow mounts and networks
> - no unrestricted Docker socket
> - non-root container is not rootless Docker

A downloaded Compose file also describes what we're authorizing on our machine.

Before starting, we read the images, build, commands, mounts, ports, devices, and privileges. We also check the
files included by `include` and `extends`, and verify their sources.

Remember the `docker compose config` command, which can help us read the automatically resolved model.

DNS resolution for remote references can also download content, so let's start by reading the sources and pinning
reliable versions when we update or modify the configuration.

Let's avoid using options like `privileged`, host namespaces, devices, and host directories unless the service
actually needs them. Mounting the home directory can expose keys and credentials even in a container that's not
running as root.

The Docker socket deserves special attention. Applications like Portainer or similar ones that can command a
privileged daemon can gain very broad access to the host. And mounting the socket in read-only mode doesn't make API
Docker operations read-only, so it's not considered sufficient protection.

We also reduce the exposed network, publishing only the necessary ports, and use `loopback` for local tools.

On Linux, we don't assume that the firewall automatically filters all the ports exposed by Docker. We verify the
firewall integration and access from other devices, especially if we're operating on public VPS.

And remember that a non-root container can still read and send all the data it has access to outside.

Let's pay attention to the `user` option discussed in this chapter, which pertains only to the container's process.

The Docker rootless mode changes how both daemons and containers are run, without needing root on the host. But this
is a choice for the entire environment, not an option you enable in individual Compose files.

Rootless can also introduce differences in user mapping, networking, ports, and resource limits.

Hardening is a set of small, verifiable choices. In the next chapter, we'll apply the same criteria to the `HTTP`
entry point, exposing only a single access point to our entire system.

***

> Resources
>
> - [Compose trust model](https://docs.docker.com/compose/trust-model/)
> - [busybox](https://hub.docker.com/_/busybox)

[Continue](../47-reverse-proxy-https/README.md) to the next chapter.
