# Our training environment

> __our training environment__
>
> - on desktop
> - on linux server
> - play with docker

To follow this course, you do not need any prerequisites; you can simply watch the videos or read this documentation.  
However, the real value of this course lies in the opportunity to experiment: trying things out and getting hands-on
with Docker is the most effective way to truly absorb each concept.

That’s why you will need your own personal training environment.

There are several options, but in this chapter we will cover the three most common ones.

If you are using Windows, macOS, or even Linux, the fastest solution is to visit the official Docker website in the
[Desktop](https://docker.com/desktop) section and download the **Docker Desktop** application. This application includes
everything you need to run Docker on your computer. If you are not in a Linux environment, a virtual machine will be 
created to manage everything transparently.

With this application, you can also perform many operations through its convenient graphical interface.  
However, throughout this course, you will see me using only the **CLI** in the terminal, which is the most common and
universal way to interact with Docker.

If you want the full experience of what it’s like to use Docker on a production server, if you have some experience with
virtual machines, and you have access to a cloud VPS, a local VM, or any physical server (even a simple Raspberry Pi),
you can install the **Docker Engine** directly by following the instructions available on the Docker website in the
[Engine Install](https://docs.docker.com/engine/install/) section.

But to get started and play with the first commands, you can also skip ahead to this section and use the very handy  
[Play with Docker](https://labs.play-with-docker.com/) website, which gives you access to a ready-to-use, disposable
Docker environment without installing anything. The environment will be reset after two hours.

You can always switch to the other solutions at any time if you find it appropriate.

Maybe right now you are not yet convinced that Docker is for you, and I understand that, but by the end of this course
I bet you will be eager to dive into the world of containerization.

***

> __our training environment__
>
> - engine
> - desktop
> - cli

Let’s take a step back. What is Docker and how does it work?

When we talk about "installing Docker", we essentially mean installing the **Docker Engine** (the core service) and the
**Docker CLI** (the command-line interface). These are the two minimal components that make up Docker.

The Docker Engine is a _daemon_, a background service responsible for managing containers, similar to how a _hypervisor_
manages virtual machines, though in a much simpler way.

To interact with this service, you use the Docker CLI, a command-line program you run in the terminal which communicates
with the Docker Engine through a set of APIs (Application Programming Interfaces).

**Docker Desktop** is an additional abstraction, a GUI that also communicates with the Docker Engine via its APIs. It 
makes common operations easier by providing a graphical interface, so you don’t have to type commands manually and can 
see all container status information at a glance.

***

If you have chosen to use Play With Docker, you will need to login with a Docker account (which you can create for free)
and press the `ADD NEW INSTANCE` button. At this point, a new node will appear; select it, and you will have access to
an interactive shell (and, if you wish, you can also connect via your preferred SSH client).

If you have chosen to install Docker Desktop, simply download the installation file for your operating system and follow
the instructions. Once completed, open your preferred terminal.

If you are on Windows, it is recommended to use a terminal compatible with the POSIX standard, so you can run all the 
commands exactly as shown in this course. For example, you might opt for [Git Bash](https://git-scm.com/downloads/win),
which is already pre-installed if you have Git on your computer, or [Cygwin](https://cygwin.com/), which includes a 
collection of tools such as the Bash shell.

If you are on macOS, the native terminal is fully compatible with all the commands used in this course.

If instead you have chosen to use Docker Engine on a Linux server, the easiest way to install it is to use the following 
command:

```shell
$ sudo curl -fsSL get.docker.com | sh
```

This will use a very convenient script provided by Docker to install Docker on your system. Afterward, if you do not 
want to use `sudo` for every Docker command, add your user to the `docker` group with the following command:

```shell
$ sudo usermod -aG docker $USER
```

And log in to the terminal again to reload your new permissions.

---

Whichever of the previous options you have chosen, you should now be able to run the following command:

```shell
$ docker version
```

```terminaloutput
Client: Docker Engine - Community
 Version:           28.5.1
 API version:       1.51
 Go version:        go1.24.8
 Git commit:        e180ab8
 Built:             Wed Oct  8 12:18:19 2025
 OS/Arch:           linux/arm64
 Context:           default

Server: Docker Engine - Community
 Engine:
  Version:          28.5.1
  API version:      1.51 (minimum version 1.24)
  Go version:       go1.24.8
  Git commit:       f8215cc
  Built:            Wed Oct  8 12:18:19 2025
  OS/Arch:          linux/arm64
  Experimental:     false
 containerd:
  Version:          v1.7.28
  GitCommit:        b98a3aace656320842a23f4a392a33f46af97866
 runc:
  Version:          1.3.0
  GitCommit:        v1.3.0-0-g4ca628d1
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
```

This will allow you to verify that Docker is installed and working correctly.

***

[Prosegui](../03-first-container/IT.md) al prossimo capitolo.
