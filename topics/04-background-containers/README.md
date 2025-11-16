# Run containers in background

> __run containers in background__
> 
> - run non-interactive
> - run in background
> - list running containers
> - check the logs
> - stop a container
> - list stopped containers

In the previous chapter, we saw how to run a container in interactive mode using the `-ti` option.

Now we will see how to run containers in non-interactive and background mode, how to get the list of all running 
containers, how to read their logs, how to stop them, and how to get the list of all stopped containers.

***

Let's start by running a small [container](/sources/clock/) in non-interactive mode.

```shell
$ docker run zavy86/clock
```

Once started, it will simply print the current date and time every second.

```terminaloutput
Thu Aug 07 18:27:45 UTC 2025
Thu Aug 07 18:27:46 UTC 2025
Thu Aug 07 18:27:47 UTC 2025
...
```

This container will keep running indefinitely, and there is no way to interact with it; in fact, if you try to enter any
command, it will simply be ignored since there is no shell available.

The only thing you can do is press `^C` to stop it.

Since we have never used this image before, as previously seen with the Alpine image, the system automatically 
downloaded it from the Docker Hub registry.

We will return to the concept of images and registries later; for now, just consider that this is a custom image created 
by the user `Zavy86`.

***

> __run containers in background__
> 
> - SIGINT
>   - interactive -> foreground process
>   - default -> process PID 1

Sometimes pressing `^C` is not enough to stop a container. Let's understand why.

When we press `^C`, an interrupt signal `SIGINT` is sent to the container. If we started the container in interactive 
mode with the `-ti` option, the signal is sent to the foreground process. However, if we launched the container in 
non-interactive mode, as in this case, the signal is sent to the process with `PID 1`. This process is special: unless 
it has been specifically programmed to handle this signal, by default it ignores `SIGINT` and only responds to `SIGKILL`
and `SIGTERM`.

The `PID 1` process is special because it has some extra responsibilities. Directly or indirectly, it is responsible for
starting all other processes in the container. When the `PID 1` process terminates everything else stops: on traditional
machines, stopping it would cause a kernel panic; in a container, it means killing all processes running inside it.

To prevent this from happening accidentally, this extra layer of protection has been added.

So, how can we stop these containers?

At the moment, we have only one solution: open another terminal session and run the `docker kill` command.

***

Now, let's look at the background mode.

To run a container in the background, we need to add the `-d` option, which stands for detached, to the `docker run` 
command:

```shell
$ docker run -d zavy86/clock
```

And this time, the output will only show the ID of the newly started container:

```terminaloutput
66e1d31f67d9551b8efca347b7c1d6e978decb30f381a21059dc86fbb435681a
```

Unlike before, we will no longer see any output, but don’t worry! Docker is working for us: it is collecting all the
data in the background and saving it to a log.

***

How can we check which containers are running?

On Unix systems, the `ps` command allows us to see running processes; similarly, Docker provides us with the following 
command:

```shell
$ docker ps
```

With this command, we can see some useful information about the running containers.

For example, we can view the container ID, the image used to start it, the time elapsed since its creation, and its 
current status. In this case, we can see that it has been running for a few minutes.

```terminaloutput
CONTAINER ID   IMAGE          [...]   CREATED         STATUS         [...]
66e1d31f67d9   zavy86/clock   [...]   2 minutes ago   Up 2 minutes   [...]
```

It also shows us other information such as COMMAND, PORTS, and NAMES, which we can ignore for now; we will cover them in
the next chapters.

Now let's start two more containers in the background:

```shell
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
```

And we will get two different IDs as output:

```terminaloutput
a658e9ee5d97afd72bdc52653f118f0881bf481f13aa4f2f35b616ff9ea20a8e
58f2e75907e201206ce072667bf9d1d6c2b6023033c4ba548015ed874690b067
```

Let's run the command again:

```shell
$ docker ps
```

And we can see that there are three containers running:

```terminaloutput
CONTAINER ID   IMAGE          [...]   CREATED              STATUS              [...]
58f2e75907e2   zavy86/clock   [...]   About a minute ago   Up About a minute   [...]
a658e9ee5d97   zavy86/clock   [...]   About a minute ago   Up About a minute   [...]
66e1d31f67d9   zavy86/clock   [...]   3 minutes ago        Up 3 minutes        [...]
```

In a production environment, it is very likely that there are dozens, if not hundreds, or even thousands of containers
running. In these cases, the output of the `docker ps` command can become very long and difficult to read. This is where 
the `-l` option comes into play, allowing us to display only the last started container.

```shell
$ docker ps -l
```

As we can see, the command now returns only one container:

```terminaloutput
CONTAINER ID   IMAGE          [...]   CREATED              STATUS              [...]
58f2e75907e2   zavy86/clock   [...]   2 minutes ago        Up 2 minutes        [...]
```

Another interesting option is `-q`, which stands for Quick:

```shell
$ docker ps -q
``` 

Which allows us to display only the IDs of the running containers:

```terminaloutput
58f2e75907e2
a658e9ee5d97
66e1d31f67d9
```

Of course, these options can be combined together:

```shell
$ docker ps -lq
``` 

By using both options together, we will get the ID of the last container we started as a result:

```terminaloutput
58f2e75907e2
```

If you are familiar with UNIX systems, you might already realize how useful this command can be when combined with 
pipelining. However, be aware that this command is subject to so-called race conditions. That is, if another container 
is started immediately after, you might get an unexpected result.

***

Returning to the output of containers, as mentioned earlier, Docker collects all data in the background and saves it to
a log. To view these logs, you can use the following command:

```shell
$ docker logs 58f
``` 

As previously mentioned, you can enter just a part of the container ID as long as it is unique. As we can see, this 
command returns exactly the output we expected, namely the current date and time:

```terminaloutput
[...]
Thu Aug 07 18:36:09 UTC 2025
Thu Aug 07 18:36:10 UTC 2025
Thu Aug 07 18:36:11 UTC 2025
```

This command shows us all the logs captured from the container, which can often be very long. In these situations, we 
can use the `--tail` parameter to display only a specified number of lines:

```shell
$ docker logs --tail 1 58f
``` 

In this way, we will obtain only one line from the log, starting from the end:

```terminaloutput
[...]
Thu Aug 07 18:36:36 UTC 2025
```

Another useful thing is to listen to the logs in real time. To achieve this, we need to use the `--follow` option:

```shell
$ docker logs --tail 1 --follow 58f
``` 

As you will notice, this command does not return any output until a change occurs in the log, in the case of our 
container, every second:

```terminaloutput
[...]
Thu Aug 07 18:36:54 UTC 2025
Thu Aug 07 18:36:55 UTC 2025
Thu Aug 07 18:36:56 UTC 2025
```

To exit and return to our terminal, press `^C`.

***

> __run containers in background__
>
> - docker stop -> SIGTERM + SIGKILL
> - docker kill -> SIGKILL

Let's now see how to stop containers.

To stop containers running in the background, we have two commands available: `docker stop` and `docker kill`. These
respectively send the `SIGTERM` and `SIGKILL` signals to the container.

The second command is more aggressive, as it immediately sends the `SIGKILL` signal, forcefully stopping the container.

The first command is slightly more graceful: it sends the `SIGTERM` signal, and if the running process is able to handle
it, your application will terminate cleanly. If the container is still running after ten seconds, Docker will send a 
`SIGKILL` signal to force its immediate termination.

***

Let's proceed with the following command:

```shell
$ docker stop 58f
```

You will notice that nothing happens, since the container contains a simple shell script that was not designed to handle
the `SIGTERM` signal. Therefore, you will need to wait ten seconds for the `SIGKILL` signal to be sent and forcefully 
terminate the process.

For the next two containers, we will use the more aggressive command directly:

```shell
$ docker kill a65 66e
```

As we can see, both containers will be stopped immediately.

If we now run the command again:

```shell
$ docker ps
```

We will no longer see anything running.

```terminaloutput
CONTAINER ID   IMAGE   [...]   CREATED   STATUS   [...]
```

***

If we finally want to see what happened to the containers we stopped, we need to use the following command:

```shell
$ docker ps -a
```

Which stands for `all`, and as expected, it returns all containers, including those that have been stopped:

```terminaloutput
CONTAINER ID   IMAGE          [...]   CREATED         STATUS                           [...]
58f2e75907e2   zavy86/clock   [...]   5 minutes ago   Exited(137) About a minute ago   [...]
a658e9ee5d97   zavy86/clock   [...]   5 minutes ago   Exited(137) About a minute ago   [...]
66e1d31f67d9   zavy86/clock   [...]   5 minutes ago   Exited(137) About a minute ago   [...]
```

We will see in the following chapters how to remove containers from this list.

***

> Resources:
> - [clock](../../sources/clock)
> - [zavy86/clock](https://hub.docker.com/r/zavy86/clock)

[Prosegui](../05-restarting-attaching/IT.md) al prossimo capitolo.
