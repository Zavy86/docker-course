# Restarting and attaching to containers

> __restarting and attaching to containers__
> 
> - attach background containers
> - restart stopped containers

In the previous chapters, we have seen how to run containers in the foreground, interactively, and in the background.
Now we will see how to reattach to a background container to interact with it again, and how to restart a stopped 
container.

The distinction between background and foreground containers is entirely arbitrary. From Docker's perspective, all 
containers are the same, and there is no difference. They are all executed in the same way, regardless of whether or not 
an interactive client is attached.

**It is always possible to detach from a container and reattach to it at a later time.**

As an analogy, think of attaching to a container as connecting a keyboard and a monitor to a physical server in a
physical datacenter.

***

If we start a container in interactive mode, as we did before, with the command:

```shell
$ docker run -ti alpine
```

You can detach from the container at any time using the shortcut sequence `^P` and `^Q`. Be careful not to use the `^C` 
shortcut, as this sends the `SIGINT` signal, which, as we have seen, will terminate the container in most cases.

_Note for Windows users: if you are using Command Prompt or PowerShell, the sequences are different. It is highly 
recommended to use either [Git Bash Shell](https://git-scm.com/downloads/win) or the
[Windows Subsystem for Linux](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux)._

If you want to manually change this shortcut sequence, you can do so with the `--detach-keys` option followed by the 
desired key sequence string. For example:

```shell
$ docker run -ti --detach-keys ctrl-x alpine
```

Then, press `^X` to detach from the container and verify that the container is still running with:

```shell
$ docker ps -l
```
```terminaloutput
CONTAINER ID   IMAGE     COMMAND     [...]
9dde841e8f2d   alpine    "/bin/sh"   [...]
```

This option can also be configured globally, but we will cover this in a future video dedicated to the Docker 
configuration file.

If we are running a container in non-interactive mode, for example, by relaunching the container:

```shell
$ docker run zavy86/clock
```

If we try to detach from the container using the `^P` and `^Q` shortcut, nothing will happen, because since we are not
connected interactively, we cannot detach from the container in this way.

```terminaloutput
[...]
Thu Aug 07 21:42:18 UTC 2025
Thu Aug 07 21:42:19 UTC 2025
Thu Aug 07 21:42:20 UTC 2025
[...]
```

In this case, the only way to disconnect without killing the container is to terminate the client, in this case your 
terminal.

***

To reattach to a background container, you can use the `attach` command followed by the container ID:

```shell
$ docker attach 9dd
```

To use this command, the container must still be running and keep in mind that multiple clients can attach to the same 
container. This is where things get interesting: if you open two terminals and attach both to the same container, you 
will notice that both terminals receive the same output and both can send commands to the container. It is just like
connecting two keyboards and two monitors to the same server.

In any case, remember that if you only want to view the container's status, you do not need to attach interactively. In
that case, you can simply use the `logs` command with the `--follow` option to monitor it in real time.

***

If instead you want to reattach to a container that has been stopped, first find its ID with the command:

```shell
$ docker ps -a
```

And indeed, if the container is in the Exited state, as in the case of our previous alpine container:

```terminaloutput
CONTAINER ID   IMAGE     COMMAND     [...]   STATUS                       [...]
76b621f7b82f   alpine    "/bin/sh"   [...]   Exited (130) 2 minutes ago   [...]
```

Before we can reattach, we need to restart the container using the `start` command followed by the container ID:

```shell
$ docker start 76b
```

In this way, the container will be restarted with the exact same settings with which it was originally created, and you
can then reconnect to it using the `attach` command:

```shell
$ docker attach 76b
```

As you can see, we are once again in the container's shell.

However, sometimes you may not see any output when reconnecting to a container. This can happen if the program running 
inside operates in REPL (Read-Eval-Print-Loop) mode, because simply attaching does not send any input, so the system may
not know it needs to display anything. In these cases, just send the `^L` or `Enter` command to restore the prompt.

In most cases, when you reattach, Docker sends the `SIGWINCH` signal to the container, which notifies the program that 
there has been a terminal size change. Most programs respond to this signal by automatically redrawing the screen.

***

> Resources:
> - [alpine](https://hub.docker.com/_/alpine)
> - [clock](../../sources/clock)
> - [zavy86/clock](https://hub.docker.com/r/zavy86/clock)

[Continue](../06-understanding-images/IT.md) to the next topic.
