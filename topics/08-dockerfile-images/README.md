# Building images with a Dockerfile

> __building images with a Dockerfile__
>
> - Dockerfile
> - builder
> - caching
> - history

As mentioned at the end of the previous chapter, creating images interactively can be useful for educational purposes, 
but it is certainly not the best way to build Docker images.

As programmers, we are naturally inclined to automate every repetitive process as much as possible. The Docker 
developers, aware of this, have provided us with a powerful tool called the `Dockerfile`, which allows us to create 
images in a fully automated way.

You can think of a Dockerfile as a recipe for building an image. It is a simple text file containing a series of 
instructions that tell Docker how the image should be built.

These instructions are then processed by a tool called the `builder`, which executes them to transform the text file 
into a real Docker image.

Additionally, Docker features an advanced `caching` system that can greatly speed up the image build process by avoiding
the re-execution of instructions that have not changed.

Finally, to help us understand how an image is composed, Docker also provides the `history` command, which allows us to 
see the list of instructions that contributed to the creation of an image.

***

Let's get straight to how it all works.

Let's start by creating a working directory and moving into it:

```shell
$ mkdir figlet && cd $_
```

Let's proceed with creating our first Dockerfile using your preferred editor. If you are experienced with Linux, you are
probably a wizard with `vim`, but if you are a beginner, I recommend using:

```shell
$ nano Dockerfile
```

Nano is a text editor that allows you to create and edit files in a simple and intuitive way. At the bottom, you can see
a bar with the most common commands you can use. For our purposes, you just need to know that to save the file you need
to press `^O` and to exit the editor you need to press `^X`.

Now, let's add the following content to our Dockerfile:

```dockerfile
FROM alpine
RUN apk add figlet
```

If we think back to what we did in the previous chapter, with this Dockerfile our goal is to do exactly the same things.

The first line `FROM alpine`, tells Docker that our image should be based on the official Alpine image. The second line
`RUN apk add figlet`, tells Docker that during the build phase it should `execute` the command `apk add figlet` to 
install the Figlet package, just as we did manually.

Keep in mind that the `RUN` command can be used to execute any command, not just those for installing packages. The 
important thing is that the command runs in non-interactive mode, so it does not require user input. If needed, always 
specify flags like `-y` or `-f` to automatically accept or force actions when necessary.

Now, as mentioned, save and exit the editor. You can do both by pressing `^X`, then `Y` and `ENTER` to confirm saving, 
and continue with building our image.

To do this, we will use Docker's builder by running the following command:

```shell
$ docker build .
```

The dot `.` at the end of the command tells Docker the build context. We will cover this topic in more detail later, but
for now, it is enough to know that the build context represents the directory where the Dockerfile is located and all
the files needed to build the image.

```terminaloutput
[+] Building 0.6s (6/6) FINISHED                                                                                                                                  docker:linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 69B                                                                                                                                       0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s 
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/2] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => [2/2] RUN apk add figlet                                                                                                                                              0.6s 
 => exporting to image                                                                                                                                                    0.0s
 => => exporting layers                                                                                                                                                   0.0s
 => => writing image sha256:d5e7ae0b40c2cd1ea64a8c2b888c7652bf7a6a7ace92c2f898290c55b87b6856                                                                              0.0s
```

The output you see may be slightly different depending on the Docker version you are using, especially if the build is
performed with the `classic builder` or the new `buildkit`, but the concept remains the same.

Once the command has finished, several things have happened:

* Docker loaded the Dockerfile and read the instructions inside it.
* The metadata for the base image, in this case `alpine`, was downloaded.
* If present, the `.dockerignore` file was loaded to exclude any files from the build context.
* The build context was then copied; in this case, we only had the Dockerfile.
* The first actual instruction was executed, which is downloading the base image `alpine`.
* Immediately after, the second instruction was executed, which is the command to install the Figlet package.
* Finally, the newly created image was exported, its additional layers were added, and it was assigned a unique ID.

Due to the way Docker's new builder works, some instructions may be executed in parallel to speed up the build process,
but the order of the instructions is always respected to ensure a consistent final result.

As usual, let's test it by running a container in interactive mode:

```shell
$ docker run -ti d5e
$ figlet "Hello Builder!"
```

And as expected, everything works perfectly:

```terminaloutput
 _   _      _ _         ____        _ _     _           _ 
| | | | ___| | | ___   | __ ) _   _(_) | __| | ___ _ __| |
| |_| |/ _ \ | |/ _ \  |  _ \| | | | | |/ _` |/ _ \ '__| |
|  _  |  __/ | | (_) | | |_) | |_| | | | (_| |  __/ |  |_|
|_| |_|\___|_|_|\___/  |____/ \__,_|_|_|\__,_|\___|_|  (_)
```

At this point, as we did previously, we can tag our image to give it a more user-friendly name. Again, there are two 
ways to do this: either directly during the build phase by adding the `-t` option before the `.` context, or by using 
the `tag` command followed by the ID of the image that was just created.

```shell
$ docker build -t figlet .
$ docker tag d5e figlet
```

If we run the `build` command again, we will notice that the execution is almost instantaneous:

```terminaloutput
[+] Building 0.0s (6/6) FINISHED                                                                                                                                  docker:linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 69B                                                                                                                                       0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s 
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => CACHED [1/2] FROM docker.io/library/alpine:latest                                                                                                                     0.0s 
 => CACHED [2/2] RUN apk add figlet                                                                                                                                       0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:d5e7ae0b40c2cd1ea64a8c2b888c7652bf7a6a7ace92c2f898290c55b87b6856                                                                              0.0s 
 => => naming to docker.io/library/figlet                                                                                                                                 0.0s 
```

This happens because Docker's builder uses a highly efficient caching system that avoids re-executing instructions that
have not changed since the previous build.

In practice, before executing each instruction, the builder checks if that instruction has already been executed in a 
previous build and if the build context has not changed. In that case, it retrieves the ID of the previously created 
layer and reuses it, thus skipping the execution of the instruction.

However, keep in mind that this system checks that the command is written in exactly the same way, so even a small
change such as adding an extra space or removing a letter will cause the instruction to be executed again, invalidating
the cache.

If you want to force the builder not to use the cache, you can add the `--no-cache` option to the command:

```shell
$ docker build -t figlet --no-cache .
```

And you will see that in this case all the instructions will be executed again:

```terminaloutput
[+] Building 0.6s (6/6) FINISHED                                                                                                                                  docker:linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 69B                                                                                                                                       0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s 
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/2] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => [2/2] RUN apk add figlet                                                                                                                                              0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:d5e7ae0b40c2cd1ea64a8c2b888c7652bf7a6a7ace92c2f898290c55b87b6856                                                                              0.0s 
 => => naming to docker.io/library/figlet                                                                                                                                 0.0s 
```

If we want to see in detail which layers make up our image, we can view the history of our image with the command:

```shell
$ docker history figlet
```

This will show us a list of all the commands that contributed to the creation of the image, the layer ID, its size, the
creation date, and any comments:

```terminaloutput
IMAGE          CREATED         CREATED BY                                      SIZE      COMMENT
75a72894db5f   5 minutes ago   RUN /bin/sh -c apk add figlet # buildkit        3.32MB    buildkit.dockerfile.v0
<missing>      2 months ago    CMD ["/bin/sh"]                                 0B        buildkit.dockerfile.v0
<missing>      2 months ago    ADD alpine-minirootfs-3.22.1-aarch64.tar.gz …   8.51MB    buildkit.dockerfile.v0
```

In this case, starting from the bottom, we can see that the first layer is the base `alpine` image, followed by the 
command that launches the shell `/bin/sh` (we will cover this part in more detail later), and finally the `RUN` command 
associated with our instruction to install Figlet.

The first two lines, unlike the last one, have their ID set to `<missing>`. This happens because they are part of the
base image and were not created by our builder.

Additionally, if you look close, our command has been slightly modified by prepending `/bin/sh -c`. Why is that?

***

> __building images with a Dockerfile__
>
> - fork
> - execve

To understand this, we need to take a brief deep dive into how UNIX systems work.

To run a new program, the operating system provides two system calls: `fork()` and `execve()`. The first creates a new 
child process, while the second loads a new program into an existing process.

The `execve(program, [ list, of, arguments ])` command takes as arguments the path to the program to execute and a list
of arguments to pass to it.

When we run a command from the terminal, the terminal itself actually creates a new child process with `fork`, and then
uses `execve` to load the specified program into that child process. For example, if we type `ls -l ~`, the terminal 
first parses the command (splitting it into commands and arguments) and, if necessary, expands any variables or special 
characters like `~` for the user's home directory. It then creates a new process with `fork` and executes 
`execve("/bin/ls", [ "ls", "-l", "/home/ubuntu" ])`.

All these operations, performed by the shell, are transparent to the user, who only sees the command they typed. Docker 
could have implemented its own command parser, but to avoid reinventing the wheel, it relies on the shell to handle 
parsing.

The `-c` option of `sh` tells the shell to treat the following command as a string and parse it accordingly.

***

Alternatively, if we want to avoid having the command parsed by the shell, we can use an alternative way to specify the 
arguments of the `RUN` command by using the JSON syntax:

```shell
$ nano Dockerfile
```

Let\`s now modify our Dockerfile as follows:

```dockerfile
FROM alpine
RUN [ "apk", "add", "figlet" ]
```

Exit the editor by saving the file, and proceed again with the build:

```shell
$ docker build -t figlet .
```

As we can see, the output is practically identical to before, except for the RUN command that we modified:

```terminaloutput
[+] Building 0.5s (6/6) FINISHED                                                                                                                                  docker:linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 69B                                                                                                                                       0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s 
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/2] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => [2/2] RUN [ "apk", "add", "figlet" ]                                                                                                                                  0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:d5e7ae0b40c2cd1ea64a8c2b888c7652bf7a6a7ace92c2f898290c55b87b6856                                                                              0.0s 
 => => naming to docker.io/library/figlet                                                                                                                                 0.0s 
```

If we take a look at the history of our image:

```shell
$ docker history figlet
```

You will notice that the `RUN` command this time is exactly as we specified in the Dockerfile, without any modification, 
and its resulting size is the same as before:

```terminaloutput
IMAGE          CREATED         CREATED BY                                      SIZE      COMMENT
75a72894db5f   2 minutes ago   RUN apk add figlet # buildkit                   3.32MB    buildkit.dockerfile.v0
<missing>      2 months ago    CMD ["/bin/sh"]                                 0B        buildkit.dockerfile.v0
<missing>      2 months ago    ADD alpine-minirootfs-3.22.1-aarch64.tar.gz …   8.51MB    buildkit.dockerfile.v0
```

***

> __building images with a Dockerfile__
>
> - shell syntax
>   - easy to write
>   - more flexible
>   - extra process
>   - require sh
> - exec syntax
>   - harder to write
>   - no extra process
>   - sh is not required

So, to recap, when should you prefer one syntax over the other?

In short, the `shell` syntax is easier to write and more flexible, as it allows you to use aliases and environment 
variables. However, it requires an extra process and the presence of a shell in the image to parse the command.

The `exec` syntax, on the other hand, is a bit harder to write since you must specify each argument as an array element, 
but it does not require an extra process or a shell in the image. Additionally, since no parsing is performed, you can 
be sure the command will be executed exactly as written.

***

> Resources:
> - [alpine](https://hub.docker.com/_/alpine)
> - [figlet](../../sources/figlet)
> - [figlet-exec](../../sources/figlet-exec)

[Continue](../09-entrypoint-cmd/IT.md) to the next topic.
