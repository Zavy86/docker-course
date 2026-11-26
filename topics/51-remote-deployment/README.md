# Remote deployment

> __same model, different Docker Engine__
>
> - local client
> - remote daemon
> - explicit destination

Even if everything works on our own computer, moving the stack to a server can reveal problems we haven't run into
locally. Until now, the Compose file, the directories we mounted and the containers were all on the same machine.
Once we switch to a remote host, that changes. A command we run in our terminal could act on the wrong server or
look for files that don't exist on that server.

To manage this step more easily, we can use a Docker context, which retains the necessary information to connect to
the server's daemon without having to first connect to the server's terminal.

We'll continue using Compose from our computer, but we'll explicitly choose a different destination for the
commands. The stack model stays the same, while the machine running the containers and the place where the data are
stored change.

Choosing the destination is just the first part of the work. We'll also need to set up access to the server and
figure out which images, files, and directories are needed to run the application.

***

> __prepare the destination__
>
> - compatible Docker Engine
> - SSH access and verified host identity
> - documented storage and network requirements

In this chapter, we'll start with a small web service to see the full deployment journey. To follow this test,
you'll need a server that you control, whether it's online or a virtual machine on your own computer—it doesn't
matter.

Before we connect, let's distinguish the roles of the two machines. On our computer, we need the Docker client,
Compose, and the SSH client because that's where we'll read the configuration and send the commands. On the server,
instead, there must be a running Docker Engine, preferably of the same version, capable of running the selected
images, and an SSH server.

The user we SSH into the server must be able to use Docker. If the daemon runs as root, accessing its socket through
the `docker` group can give equivalent admin control. We should only grant this to users who need to manage the
machine. When using Docker in rootless mode, we need to check the socket and access requirements for that
configuration.

***

> __use an explicit context__
>
> - SSH protects daemon access
> - inspect before applying changes
> - avoid changing the global default

We can now set up the connection. In the commands below, `docker-user@lab.example.com` is a placeholder to be
replaced with the username and address of our test server.

First, let's make sure we can use Docker through SSH:

```shell
$ ssh docker-user@lab.example.com docker version
```
```terminaloutput
Client: Docker Engine - Community
 Version:           29.9.3
 API version:       1.56
 Go version:        go1.26.10
 Git commit:        5457199
 Built:             Tue Nov  3 21:42:05 2026
 OS/Arch:           linux/arm64
 Context:           default

Server: Docker Engine - Community
 Engine:
  Version:          29.9.3
  API version:      1.56 (minimum version 1.40)
  Go version:       go1.26.10
  Git commit:       70efc0e
  Built:            Tue Nov  3 21:42:05 2026
  OS/Arch:          linux/arm64
  Experimental:     false
 containerd:
  Version:          v2.4.2
  GitCommit:        b7a25261e029d68978bbf290df0a62fc819b3c51
 runc:
  Version:          1.5.3
  GitCommit:        v1.5.3-0-g46365c62
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
```

Then we create a context called `lab-demo` with the command:

```shell
$ docker context create lab-demo --docker host=ssh://docker-user@lab.example.com
```
```terminaloutput
lab-demo
Successfully created context "lab-demo"
```

And let's check the registered destination:

```shell
$ docker context inspect lab-demo
```
```json
[
    {
        "Name": "lab-demo",
        "Metadata": {},
        "Endpoints": {
            "docker": {
                "Host": "ssh://docker-user@lab.example.com",
                "SkipTLSVerify": false
            }
        },
       [...]
    }
]
```

The context retains the connection information, so we can refer to them by name in the commands that follow.

During this chapter's tests, we'll always use `--context lab-demo`, so the destination remains clear without
changing the machine's default context. Before creating resources, let's read the output of:

```shell
$ docker --context lab-demo info
```
```terminaloutput
Client:
 Version:    29.9.3
 Context:    lab-demo
 Debug Mode: false
 Plugins: [...]

Server:
 Containers: 0
  Running: 0
  Paused: 0
  Stopped: 0
 Images: 1
 Server Version: 29.9.3
 [...]
```

Make sure the displayed information matches the intended server.

The connection goes through SSH, so we don't need to expose the Docker API on TCP port 2375 without authentication.
We can manage the remote daemon by keeping this administrative access protected.

***

For our first deployment, we'll use a simple Nginx server, one we're already familiar with, so we can focus on
connecting to the server and verifying the service.

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

And let's move into the directory:

```shell
$ cd docker-course/sources/compose/remote
```

And let's verify the usual `compose.yaml` file:

```yaml
services:
  web:
    image: nginx
    restart: unless-stopped
    ports:
      - "18080:80"
```

So we start the stack, but we specify the name of the context though:

```shell
$ docker --context lab-demo compose up -d
```
```terminaloutput
[+] up 12/12
 ✔ Image nginx                 Pulled                                                                               3.0s
 ✔ Network remote-demo_default Created                                                                              0.0s
 ✔ Container remote-demo-web-1 Started                                                                              0.2s
```

If everything went well, let's check the container logs:

```shell
$ docker --context lab-demo compose logs web
```
```terminaloutput
web-1  | /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
web-1  | /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
web-1  | 10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
web-1  | 10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf
web-1  | /docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
web-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
web-1  | 2026/11/14 10:35:11 [notice] 1#1: using the "epoll" event method
web-1  | 2026/11/14 10:35:11 [notice] 1#1: nginx/1.31.8
web-1  | 2026/11/14 10:35:11 [notice] 1#1: built by gcc 14.2.0 (Debian 14.2.0-19) 
web-1  | 2026/11/14 10:35:11 [notice] 1#1: OS: Linux 7.0.0-38-generic
web-1  | 2026/11/14 10:35:11 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1024:524288
web-1  | 2026/11/14 10:35:11 [notice] 1#1: start worker processes
web-1  | 2026/11/14 10:35:11 [notice] 1#1: start worker process 29
web-1  | 2026/11/14 10:35:11 [notice] 1#1: start worker process 30
```

Even though we're running the commands from our terminal, the image is downloaded by the remote daemon and started
on the server. So, the server needs to be able to reach the registry and trust its certificates. If the registry is
private, we need to make sure to log in with the client using the necessary credentials, without including them in
the YAML file.

The same logic applies to the published port. The mapping `18080:80` makes port 18080 available on the server
interfaces, not on our computer.

To see the page, we can open our browser to the address `lab.example.com:18080`, making sure that any network issues
or firewall blocks don't interfere with the connection.

To stop the stack on the remote server, we use the usual command, of course, making sure to specify the context:

```shell
$ docker --context lab-demo compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container remote-demo-web-1 Removed                                                                              0.1s
 ✔ Network remote-demo_default Removed                                                                              0.0s
```

This example is super simple, but everything we've seen up to this point can also be done in a remote context.

***

> __know where every file lives__
>
> - Compose reads the model locally
> - bind mounts use daemon-side paths
> - deployment does not copy application data

Remote connection allows us to use the same commands, but it doesn't share the filesystem between the two machines.
The Compose file and the files used for interpolation are read by the client on our computer. Meanwhile, the
containers and named volumes are created by the daemon on the server, where the volume data also stays.

This distinction becomes important when we add a bind mount. The source path must be available on the daemon host
because the mount doesn't transfer a directory from our computer to the server. And even `configs` and `secrets`
defined from files can depend on file mounts in the local Compose implementation. So, simply using an SSH context
doesn't guarantee that their sources will be deployed.

We avoided binds in the first example precisely to keep these two aspects separate. When you need files on the
server, you have to transfer them explicitly and prepare absolute remote paths with the appropriate permissions.
Writing `./data` in the Compose file doesn't make the directory on our computer available to the daemon.

If the stack depends on multiple files, it might be simpler to transfer the non-sensitive release files to the
server and run Compose from the installation directory inside an SSH session. In that case, the configuration,
relative paths, and daemon settings are all on the same machine.

Secrets still require a separate transfer or retrieval through a protected channel with restricted access. Before
starting, we also prepare the directories and any external networks required by the stack. An example file with the
names of the variables helps document what we'll need without including real credentials.

***

> __ship images, not accidental workspaces__
>
> - build and publish deliberately
> - check architecture support
> - keep release inputs available

So far, we've been using an existing image. To deploy our application, we can build the image, publish it to a
registry, and have the server download it using the same process. This way, only what's needed to start the service
will arrive on the host of the remote server, without having to transfer all the source code.

If we decide to build the image from here, we need to make sure which builder will perform the build and where the
result will be available. The context used to manage containers doesn't alone clarify these aspects. When building
remotely, we also need to check which files we send as the build context, excluding local data and secrets through
the `.dockerignore` file.

The architecture must match that of the server. An image built only for ARM64 might not work on an AMD64 host. So,
we should either choose a compatible variant or prepare a verified multi-platform build, without assuming that
emulation will be available or provide the necessary performance.

To be able to replicate the deployment, we need to keep the release configuration, image references, and
instructions for restoring data. The context allows us to connect to the server, but it doesn't preserve a copy of
the stack and doesn't automatically transfer the volume contents.

After deployment, the first check is the state of the containers. We also read the logs and make a request to the
application. When the stack includes persistent data, we verify that the service can read and use it.

And remember, the stack depends on the server where we started it. The `unless-stopped` policy can restart the
containers when the remote daemon becomes available again. So, we need to make sure Docker starts with the server,
ensuring the containers can restart even if our computer is not connected.

***

> Resources
>
> - [Docker daemon access over SSH](https://docs.docker.com/engine/security/protect-access/)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../52-updates-rollbacks/README.md) to the next chapter.
