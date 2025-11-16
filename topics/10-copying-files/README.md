# Copying files during the build

> __copying files during the build__
>
> - copy
> - context
> - .dockerignore

In the previous chapters, we saw how to create a custom image by installing a package using the distribution's package
manager.

Of course, we can also copy files into our images. However, to perform this operation, we need to take a closer look at
the build context.

If you recall, we created a directory and inside it, we created a Dockerfile. Then, when we ran the build command, we 
specified the build context by adding a dot `.` at the end of the command.

When we run this command, all the contents within the specified directory are sent to the builder for image creation. 
This directory must contain a Dockerfile. All files passed to the build context are not automatically copied into the 
image but are made available to the Docker builder to perform any operations defined in the Dockerfile.

As you may have already seen in Git, Docker also allows you to specify files and directories to exclude from the build
context using the `.dockerignore` file.

Let's see how this works in practice.

***

Let's start by creating a new working directory and moving into it:

```shell
$ mkdir hello && cd $_
```

Let's imagine we want to create an image that allows us to compile and run a simple program written in `C`.

So let's create our source file:

```shell
$ nano hello.c
```
```c
#include <stdio.h>

int main () {
  puts("Hello World");
  return 0;
}
```

It is not important to know the `C` language; as you can see, it is a simple hello world. However, you should know that 
the `C` language needs to be compiled before it can be executed. To do this, we will need to install the `gcc` compiler, 
and we will do this inside our Dockerfile, so you do not need to install anything on your machine.

Let's now create the Dockerfile:

```shell
$ nano Dockerfile
```
```dockerfile
FROM alpine
RUN apk add gcc libc-dev
COPY hello.c /
RUN gcc /hello.c -o /hello
CMD /hello
```

As we did previously, we start from the base `alpine` image and install the `gcc` compiler along with its supporting
libraries.

Next, the `COPY` command comes into play, allowing us to copy our source file into the image. The first parameter is the 
name of the file to copy, and the second is the destination path inside the image. As you can see, I did not specify a 
full path, so the file will be taken from the current directory, relative to the build context. Therefore, we expect the
`hello.c` file to be in the exact same location as the `Dockerfile`. It will be copied to the root directory of our 
image. For clarity, you could also specify `./hello.c` to make the source path explicit.

Then, using the `RUN` command, we compile the source file to generate the `hello` executable. On UNIX systems, file 
extensions are not mandatory.

Finally, with `CMD`, as seen previously, we configure the container to execute the program on startup.

Let’s now build the image:

```shell
$ docker build -t hello .
```
```terminaloutput
[+] Building 3.3s (9/9) FINISHED                                                                                                                                  docker:linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 138B                                                                                                                                      0.0s 
 => WARN: JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 5)                                           0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => CACHED [1/4] FROM docker.io/library/alpine:latest                                                                                                                     0.0s 
 => [internal] load build context                                                                                                                                         0.0s 
 => => transferring context: 107B                                                                                                                                         0.0s 
 => [2/4] RUN apk add gcc libc-dev                                                                                                                                        2.8s 
 => [3/4] COPY hello.c /                                                                                                                                                  0.0s 
 => [4/4] RUN gcc /hello.c -o /hello                                                                                                                                      0.1s 
 => exporting to image                                                                                                                                                    0.3s 
 => => exporting layers                                                                                                                                                   0.3s
 => => writing image sha256:b491cabe6103759a93b4547183d7eba842b3e996aeb0b333f5179ce159b16fab                                                                              0.0s 
 => => naming to docker.io/library/hello                                                                                                                                  0.0s 
 1 warning found (use docker --debug to expand):
 - JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 5)                                                       
```

Ok, ignoring the usual warnings suggesting we use the JSON format for our command arguments, we can see from the log
that the file copy and the compilation of our program were successful.

Let's now check if it works:

```shell
$ docker run hello
```
```terminaloutput
Hello World
```

Absolutely yes!

Now, let's see how the builder cache works when dealing with external files.

If we try to run the same build again without changing anything:

```shell
$ docker build -t hello .
```
```terminaloutput
[+] Building 0.0s (9/9) FINISHED                                                                                                                                  docker:linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 127B                                                                                                                                      0.0s 
 => WARN: JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 5)                                           0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/4] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => [internal] load build context                                                                                                                                         0.0s 
 => => transferring context: 28B                                                                                                                                          0.0s 
 => CACHED [2/4] RUN apk add gcc libc-dev                                                                                                                                 0.0s 
 => CACHED [3/4] COPY hello.c /                                                                                                                                           0.0s 
 => CACHED [4/4] RUN gcc /hello.c -o /hello                                                                                                                               0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:0917280deb4532e7960fbc4e59f0f8c7eb8c2b1a6fbb5693d03ac80b2424b92b                                                                              0.0s 
 => => naming to docker.io/library/hello                                                                                                                                  0.0s 
 1 warning found (use docker --debug to expand):
 - JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 5)
```

You will see that all operations have been executed using the cache.

If, on the other hand, we make a small change to our source file:

```shell
$ nano hello.c
```
```c
[...]
  puts("Hello World!");
[...]
```

And let's build again:

```shell
$ docker build -t hello .
```
```terminaloutput
[+] Building 0.2s (9/9) FINISHED                                                                                                                                  docker:linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 127B                                                                                                                                      0.0s 
 => WARN: JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 5)                                           0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/4] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => [internal] load build context                                                                                                                                         0.0s 
 => => transferring context: 106B                                                                                                                                         0.0s 
 => CACHED [2/4] RUN apk add gcc libc-dev                                                                                                                                 0.0s 
 => [3/4] COPY hello.c /                                                                                                                                                  0.0s 
 => [4/4] RUN gcc /hello.c -o /hello                                                                                                                                      0.2s 
 => exporting to image                                                                                                                                                    0.0s
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:0d0307813688cf3cd2c91522a80bb3dd109aab183833be1430646f81f9ac9c05                                                                              0.0s 
 => => naming to docker.io/library/hello                                                                                                                                  0.0s 
 1 warning found (use docker --debug to expand):
 - JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 5)                                                       
```

As we can see, the cache was still used for the entire compiler installation step, which is also the most time-consuming
part. After that, the file copy was performed normally because the builder detected that the file had changed. It also
invalidated the cache for the subsequent command, since it was linked to the modified file, and therefore re-executed 
the compilation step.

If we run the container again:

```shell
$ docker run hello
```
```terminaloutput
Hello World!
```

We will see the updated message!

Just to conclude, the `COPY` command allows us to copy both individual files and entire directories. In this case, the 
copy is performed recursively. For example, if we create a directory containing a test file:

```shell
$ mkdir test
$ echo "test" > test/file.txt
$ echo "hello" > readme.txt
```

And let's modify the Dockerfile as follows:

```dockerfile
[...]
COPY . /
[...]
```

We will copy all files, directories, and subdirectories present within the build context.

```shell
$ docker build -t hello .
```

As we can verify inside the container:

```shell
$ docker run -ti hello sh
# ls -l
```
```terminaloutput
Dockerfile  dev         hello       home        media       opt         readme.txt  root         srv         test        ust         
bin         etc         hello.c     lib         mnt         proc        run         sbin         sys         tmp         var
```

If we also add a `.dockerignore` file containing the name of the `readme.txt` file:

```shell
$ echo "readme.txt" > .dockerignore
```

And let's run the build again:

```shell
$ docker build -t hello .
```

We will copy all files, directories, and subdirectories present within the build context except for those specified in 
the `.dockerignore` file, as we can easily verify inside the container:

```shell
$ docker run -ti hello sh
# ls -l
```
```terminaloutput
Dockerfile  dev         hello       home        media       opt         root        sbin        sys         tmp         var
bin         etc         hello.c     lib         mnt         proc        run         srv         test        usr
```

***

> Resources:
> - [alpine](https://hub.docker.com/_/alpine)
> - [hello](../../sources/hello)

[Prosegui](../11-reduce-images-size/IT.md) al prossimo capitolo.
