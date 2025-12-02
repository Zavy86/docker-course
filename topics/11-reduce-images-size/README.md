# Reduce images size

> __reduce images size__
>
> - hello executable
> - hello.c source code
> - gcc compiler with libs
> - alpine base image

In the previous chapter, the image we created contained: the compiled program `hello`, its source code `hello.c`, the
`gcc` compiler, supporting libraries like `libc-dev`, and everything already present in the base `alpine` image.

As you may have noticed, this image ended up being **over 170 megabytes** in size.

However, if you think about it, for running our container, the only essential components we need are the first and the
last: the base image and the compiled program.

And since, as we have often said, optimization is one of the fundamentals of our profession, publishing such a large
image with a lot of unnecessary components inside is far from ideal.

***

> __reduce images size__
>```
> alpine
> └ install gcc and libc-dev
>   └ copying hello.c
>     └ compiling hello
>       └ removing hello.c
>         └ uninstall gcc and libc-dev
>           └ (read-write layer)
>```

The first thing that might come to mind is simply adding another step to our Dockerfile where we remove the source file,
and another step to uninstall the compiler using apk.

However, doing so would not achieve the desired effect; paradoxically, the image would end up being even larger.

This is because we would simply be adding additional layers, and each layer would contain its own metadata and files.

***

> __reduce images size__
>
> - collapsing layers
> - build binaries outside
> - squashing final image
> - multi-stage build

There are various techniques to reduce the size of our final image, such as collapsing layers, building executables 
externally, squashing the final image into a single layer, or performing a multi-stage build.

Let's explore them together.

***

> __reduce images size__
>
> collapsing layers
>
> pro:
> - works on all versions
> - no extra tools required
>
> cons:
> - low readability
> - slow to build
> - no cache

The first technique consists of ensuring that all steps are executed within a single layer, that is, in a single `RUN`
action. This way, we install, compile, remove, and uninstall everything needed in one go, leaving only the compiled 
program at the end of the command.

This technique is certainly effective; however, you end up with a Dockerfile like this:

```dockerfile
FROM alpine
COPY hello.c
RUN apk add gcc libc-dev && gcc /hello.c -o /hello && apk remove gcc libc-dev && rm /hello.c
CMD /hello
```

Or perhaps something like this:

```dockerfile
FROM alpine
COPY hello.c
RUN apk add gcc libc-dev \
  && gcc /hello.c -o /hello \
  && apk remove gcc libc-dev \
  && rm /hello.c
CMD /hello
```

In any case, this approach is always hard to read and challenging to maintain.

Here we are performing just a few simple operations, but imagine a more complex and intricate Dockerfile...

It could also happen that unnecessary files are left behind, such as log files or temporary files.

Moreover, this method does not take advantage of the cache for unchanged layers, making the build process less efficient 
and slower.

***

> __reduce images size__
>
> build binaries outside
>
> pro:
> - tiny images
>
> cons:
> - extra tools required
> - dependency hell
> - portability breaks

With this second technique, that is, building the application outside the Dockerfile, we will definitely save space by
generating ultra-light images composed of just a few instructions:

```dockerfile
FROM alpine
COPY hello /
CMD /hello
```

However, the drawbacks are numerous and hard to ignore.

Every machine where we want to perform the build must necessarily have a compiler, libraries, and other dependencies, 
making us once again reliant on a specific development environment, leading back to the potential issue of _"it works
on my machine!"_.

Additionally, if the application is compiled on an architecture such as `x86`, the resulting image would not be 
compatible, for example, with execution on `arm` machines, effectively reducing portability.

***

> __reduce images size__
>
> squashing final image
>
> pro:
> - single layer
>
> cons:
> - manual removal
> - take a lot of time
> - no cache

The squashing technique allows us to create an image composed of a single layer by simply adding the `--squash` option
to the `docker build` command.

This might seem like an optimal solution; however, it also has some drawbacks.

First, we still need to manually uninstall all unnecessary components and remove all files. As mentioned earlier, there
might often be scattered files that are hard to track.

Additionally, even with this method, we lose the ability to leverage Docker's caching system.

Finally, the squashing operation, especially for large images, can take a significant amount of time to complete.

***

> __reduce images size__
>
> multi-stage build
>
> pro:
> - small image
> - clean image
> - more secure
> - cacheable
>
> cons:
> - limited support

Finally, the multi-stage build technique is undoubtedly the most modern and elegant among those we have seen so far.

The only drawback that comes to mind is that it is not supported in older versions of Docker. However, nowadays, it is 
rare to work with such outdated systems. And if you do encounter them: update them! ;-)

As for the advantages, this technique allows us to create lightweight, clean, and secure images. As we will see shortly, 
it limits the final components to only what is strictly necessary, avoiding the proliferation of files, applications,
and source code. This effectively reduces the attack surface by mitigating potential vulnerabilities.

***

To see how the multi-stage build works in practice, let's create a new working directory:

```shell
$ mkdir hello-multi-stage && cd $_
```

Let's copy the source file we created earlier:

```shell
$ cp ../hello/hello.c ./
```

And now let's create our multi-stage Dockerfile:

```shell
$ nano Dockerfile
```

As we saw in previous chapters, the first instruction in a Dockerfile must always be `FROM`. In this case, 
`FROM alpine`. However, this instruction can also be repeated multiple times within the same Dockerfile.

```dockerfile
FROM alpine
RUN apk add gcc libc-dev
COPY hello.c /
RUN gcc /hello.c -o /hello
```

Each time the builder encounters a `FROM` instruction, it knows to start creating a new build stage.

Each stage can be labeled using the `AS` instruction, allowing it to be referenced in subsequent instructions. If no 
name is assigned, the stage can still be referred to by an incrementing number starting from 0.

In our case, the first stage handles the installation and compilation of the program, so in the second stage, we only
need to copy the executable file and add the execution command.

```dockerfile
FROM alpine AS compiler
RUN apk add gcc libc-dev
COPY hello.c /
RUN gcc /hello.c -o /hello

FROM alpine
COPY --from=compiler /hello /
CMD /hello
```

As we can see, this code is definitely much more readable and easier to manage.

When we build and tag the image, Docker will create the first stage, copy the file into the second stage (a new clean 
image containing only the Alpine base image), and once the process is complete, the first image will be discarded (while 
still available for cache usage). The result will be only the second, super lightweight image.

```shell
$ docker build -t hello-multi-stage .
```
```terminaloutput
[+] Building 0.2s (10/10) FINISHED                                                                                                                                docker:linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 184B                                                                                                                                      0.0s 
 => WARN: JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 8)                                           0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [internal] load build context                                                                                                                                         0.0s 
 => => transferring context: 106B                                                                                                                                         0.0s 
 => CACHED [compiler 1/4] FROM docker.io/library/alpine:latest                                                                                                            0.0s 
 => CACHED [compiler 2/4] RUN apk add gcc libc-dev                                                                                                                        0.0s 
 => CACHED [compiler 3/4] COPY hello.c /                                                                                                                                  0.0s 
 => CACHED [compiler 4/4] RUN gcc /hello.c -o /hello                                                                                                                      0.0s 
 => [stage-1 2/2] COPY --from=compiler /hello /                                                                                                                           0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:5311a310b00979ff846df48ce5d6b25ed4ac8483c86e610b15f6987cbac04706                                                                              0.0s 
 => => naming to docker.io/library/hello-multi-stage                                                                                                                      0.0s 
 1 warning found (use docker --debug to expand):
 - JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 8)
```

In fact, if we try running the following command:

```shell
$ docker image ls
```

You will see that the two images have significantly different sizes:

```terminaloutput
REPOSITORY          TAG        IMAGE ID       CREATED         SIZE
hello-multi-stage    latest    5311a310b009   2 minutes ago   8.58MB
hello                latest    0d0307813688   1 days ago      174MB
```

And if we try to run our container, we will see that everything continues to work as expected:

```shell
$ docker run hello-multi-stage
```
```terminaloutput
Hello World!
```

For completeness, it is worth mentioning that you can use stage aliases to allow the builder to export an image at a 
specific stage. For example, we might want to create:

```shell
$ docker build --target compiler -t hello-compiler .
```
```terminaloutput
[+] Building 0.0s (9/9) FINISHED                                                                                                                                  docker:linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 184B                                                                                                                                      0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s 
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [compiler 1/4] FROM docker.io/library/alpine:latest                                                                                                                   0.0s 
 => [internal] load build context                                                                                                                                         0.0s 
 => => transferring context: 28B                                                                                                                                          0.0s 
 => CACHED [compiler 2/4] RUN apk add gcc libc-dev                                                                                                                        0.0s 
 => CACHED [compiler 3/4] COPY hello.c /                                                                                                                                  0.0s 
 => CACHED [compiler 4/4] RUN gcc /hello.c -o /hello                                                                                                                      0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:a793d46ba2fbbb750cc3c3a57c5c2e5c6f35d73b532c7550394e8622f4835239                                                                              0.0s 
 => => naming to docker.io/library/hello-compiler                                                                                                                         0.0s
```

In this case, the generated image will be the one used for compiling the program, which we can then access to perform 
debugging or testing if needed:

```shell
$ docker run -ti hello-compiler sh
```
```shell
# ls -l
```
```terminaloutput
drwxr-xr-x     2 root   root    4096   Jul 15   10:42   bin
drwxr-xr-x     5 root   root     360   Sep 20   08:09   dev
drwxr-xr-x     1 root   root    4096   Sep 20   08:09   etc
-rwxr-xr-x     1 root   root   72888   Sep 17   15:03   hello
-rw-r--r--     1 root   root      72   Sep 17   15:03   hello.c
drwxr-xr-x     2 root   root    4096   Jul 15   10:42   home
drwxr-xr-x     1 root   root    4096   Jul 15   10:42   lib
drwxr-xr-x     5 root   root    4096   Jul 15   10:42   media
drwxr-xr-x     2 root   root    4096   Jul 15   10:42   mnt
drwxr-xr-x     2 root   root    4096   Jul 15   10:42   opt
dr-xr-xr-x   215 root   root       0   Sep 20   08:09   proc
drwx------     1 root   root    4096   Sep 20   08:09   root
drwxr-xr-x     3 root   root    4096   Jul 15   10:42   run
drwxr-xr-x     2 root   root    4096   Jul 15   10:42   sbin
drwxr-xr-x     2 root   root    4096   Jul 15   10:42   srv
dr-xr-xr-x    11 root   root       0   Sep 20   08:09   sys
drwxrwxrwt     1 root   root    4096   Sep 17   15:03   tmp
drwxr-xr-x     1 root   root    4096   Sep 17   15:00   usr
drwxr-xr-x     1 root   root    4096   Jul 15   10:42   var
```

Another use case could be to create a single Dockerfile capable of generating multiple images, for example for different 
versions of our program. In this scenario we could compile multiple versions in the `compiler` stage then create various 
stages that copy only the files related to each version, and perform multiple builds targeting the desired stage. This 
way, we can maximize cache usage and avoid duplicating the same code across multiple Dockerfiles.

***

> Resources:
> - [alpine](https://hub.docker.com/_/alpine)
> - [hello-multi-stage](../../sources/hello-multi-stage)

[Continue](../12-images-registry/README.md) to the next topic.
