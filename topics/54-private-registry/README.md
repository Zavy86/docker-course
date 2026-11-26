# Private registry

> __from a local build to a distributed application__
>
> - host our own registry
> - build and push with Compose
> - run the application without its sources

If we were to distribute our application by sending the Dockerfile and all its sources each time, it could make
things more complicated for whoever needs to run it. Every machine would have to rebuild the image, access the
necessary dependencies, and redo a setup that we've already completed on our computer.

To simplify this step, we could build the image once and publish it to a private registry, so that other
installations can download the version we've prepared.

In [chapter 32](../32-images-compose/README.md), we used Compose to publish images to Docker Hub. This time we'll
also manage the private registry where we'll store them.

In this last chapter of the second part of this course, we'll set up a small, complete environment by starting our
registry, building a custom application, and publishing its image. Finally, we'll move into a directory that
contains only a Compose file and use the distributed image, without having access to the Dockerfile or the sources
to rebuild it. We'll be able to run the entire test on the same computer, using only our Docker Engine to host the
registry as well.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/registry
```

And then we analyze the `compose.yaml` file:

```yaml
volumes:
  registry-data:

services:
  registry:
    image: registry:3
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - registry-data:/var/lib/registry
  app:
    build: .
    image: localhost:5000/compose-custom-app:1.0
```

The stack includes two services. The first one, `registry`, uses the official image and stores the received images
in the `/var/lib/registry` directory, which is linked to the volume `registry-data`. So, the content will remain
available even when we stop and recreate the container, just like with the other persistent data we've encountered
in the course.

The mapping publishes port `5000` on the host interfaces, so the registry can be reached from other machines if the
network and firewall allow it. For our test, we'll use `localhost` and won't configure authentication or HTTPS. For
a shared installation, we would instead set up TLS and access control.

The second service, `app`, describes the application we'll build. `build: .` means we'll use the current directory
as the build context, while `image` assigns the full name we'll use to publish the image. The `localhost:5000` part
identifies the registry, `compose-custom-app` is the repository within it, and `1.0` is the tag.

This address will be used by the tools that transfer the image, not by the Nginx process in the container.

For this, we don't write `registry:5000`, because the service name would be resolvable within the Compose network,
but it wouldn't automatically identify a registry that the daemon or builder can access. In our example, both are
working in the local Docker environment, with a builder making the image available to the daemon.

If we wanted to publish or download images from another computer, it would be better to use a DNS name, like
`registry.example.com`, which is configured to point to the IP address of the host where the registry is running. We
would then use a reference like `registry.example.com:5000/compose-custom-app:1.0`, keeping the same address across
different installations. `localhost`, on the other hand, would always refer to the computer running the operation.

***

Next to the Compose file, we have our `Dockerfile`:

```dockerfile
FROM nginx:stable-alpine
COPY index.html /usr/share/nginx/html/index.html
```

Let's start again with Nginx and replace the default homepage with our `index.html` file:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Our Compose application</title>
  </head>
  <body>
    <h1>Hello from our registry!</h1>
    <p>This page is part of our custom image.</p>
  </body>
</html>
```

It's a small static app, but it will allow us to recognize our image right away when we pull it from the registry.
The page is copied during the build and isn't linked to the container with a bind mount, so it will be part of what
we distribute.

The `.dockerignore` file also limits the context to the files necessary for this build:

```text
**
!Dockerfile
!index.html
```

We exclude all files and only allow the Dockerfile and the page to pass through. This way, we don't send the
directory we'll use to consume the image or any other files we might add later in the lab to the builder.

***

Let's start with running just the registry first:

```shell
$ docker compose up -d registry
```
```terminaloutput
[+] up 1/1
 ✔ Container registry-registry-1 Started                                                                            0.1s
```

We've selected the service explicitly, so for now, we're neither building nor starting `app`.

Compose will create the project volume and network, then start the registry container.

Let's check the service and try to contact its API:

```shell
$ curl --fail http://localhost:5000/v2/
```
```terminaloutput
{}
```

If we get a small empty JSON object, that means the registry is up and running.

***

We can now build the application image:

```shell
$ docker compose build app
```
```terminaloutput
[+] Building 1.1s (9/9) FINISHED                                                                    
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 579B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s
 => => transferring dockerfile: 111B                                                                                0.0s
 => [internal] load metadata for docker.io/library/nginx:stable-alpine                                              0.6s
 => [internal] load .dockerignore                                                                                   0.0s
 => => transferring context: 67B                                                                                    0.0s
 => [internal] load build context                                                                                   0.0s
 => => transferring context: 276B                                                                                   0.0s
 => [1/2] FROM docker.io/library/nginx:stable-alpine@sha256:901e593c95dc85f5a729f576551632136                       0.0s
 => => resolve docker.io/library/nginx:stable-alpine@sha256:901e593c95dc85f5a729f576551632136                       0.0s
 => CACHED [2/2] COPY index.html /usr/share/nginx/html/index.html                                                   0.0s
 => exporting to image                                                                                              0.3s
 => => exporting layers                                                                                             0.0s
 => => exporting manifest sha256:ee1f6fe6ffe6a452d789850bf08414d262d80939758f00c79d87109d9f47                       0.0s
 => => exporting config sha256:b606baf727c10c919b4183abb1012827f789f9c52e8787fb52688285f7e482                       0.0s
 => => exporting attestation manifest sha256:d42ac86bfe4a13d1f8ecdad729a67afc1240bc2be24c4401                       0.0s
 => => exporting manifest list sha256:acfa1929da1c846455f4aa95340e941f7373701f99d10fda7ae3911                       0.0s
 => => naming to localhost:5000/compose-custom-app:1.0                                                              0.0s
 => => unpacking to localhost:5000/compose-custom-app:1.0                                                           0.2s
 => resolving provenance for metadata file                                                                          0.0s
[+] build 1/1                     
 ✔ Image localhost:5000/compose-custom-app:1.0 Built                                                                1.1s
```

Compose reads the Dockerfile, builds the image, tags it as `localhost:5000/compose-custom-app:1.0`, and assigns it
that name.

The fact that the registry address is in the image name doesn't mean the image has already been sent. At the end of
the build, the result is still on our local daemon.

So let's move on to publishing:

```shell
$ docker compose push app
```
```terminaloutput
[+] push 12/12
 ✔ localhost:5000/compose-custom-app:1.0 Pushed                                                                     0.7s
```

This time, Compose uploads the image to the registry specified in the `image` field. We'll just select `app`,
because we want to publish our application, not the image of the service that hosts the registry.

The registry doesn't have a web page to browse through the images, but we can query its API to see the tags of the
repository we just created:

```shell
$ curl --fail http://localhost:5000/v2/compose-custom-app/tags/list
```
```terminaloutput
{"name":"compose-custom-app","tags":["1.0"]}
```

In the response, you'll find the name of the image and the published tag.

***

To make the passage from the registry visible, we remove the local copy of the just-built image:

```shell
$ docker image rm localhost:5000/compose-custom-app:1.0
```
```terminaloutput
Untagged: localhost:5000/compose-custom-app:1.0
Deleted: sha256:acfa1929da1c846455f4aa95340e941f7373701f99d10fda7ae39117588e26e9
```

We haven't started any application containers yet, so this image isn't being used in our example. We're removing the
local copy from the daemon, while the one published in the registry volume remains available.

The base Nginx and any shared layers can stay in the cache; we don't need to run any prune.

With the registry still running, let's move into the `consumer` directory:

```shell
$ cd consumer
```

Where do we find another `compose.yaml` file?

```yaml
services:
  app:
    image: localhost:5000/compose-custom-app:1.0
    ports:
      - "8080:80"
```

The service only contains the image reference and the port to publish, we don't find any `build`, or a Dockerfile,
nor a copy of the page to mount.

Download the image with:

```shell
$ docker compose pull app
```
```terminaloutput
[+] pull 12/12
 ✔ Image localhost:5000/compose-custom-app:1.0 Pulled                                                               1.3s
```

This time, the daemon pulls it from our registry. It doesn't rebuild it, so you don't need to read the sources in
the previous directory. Even so, the available layers can be reused without downloading them again.

We start the application with:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network consumer_default Created                                                                                 0.0s
 ✔ Container consumer-app-1 Started                                                                                 0.1s
```

Open [http://localhost:8080](http://localhost:8080) in your browser and you'll see our custom page.

This is exactly what we wanted to achieve. The installation uses the version we built and published, while anyone
running it only needs to know the image reference and the configuration needed to run it.

***

> __keep distribution and execution separate__
>
> - the registry stores images
> - running containers use local images
> - publishing an image does not include volumes or secrets

After downloading the image, the container uses the copy present on the daemon. Requests to our page don't go
through the registry, which will only be used again when we need to download an image or a different version. That's
why it makes sense to manage it as an infrastructure service with persistent storage and its own lifecycle.

If we were to repeat this installation on another computer, `localhost:5000` would refer to that computer, not ours.
We'd need to replace it with the address of the registry actually reachable from that machine, along with setting up
certificates and access. In the lab, we stayed on the same host just to focus on the simplest path from building the
image to using it, without the complications of a remote registry.

Finally, let's pay attention to the command names, `docker compose push` publishes the service images, just as we
did. However, we should still be careful that publishing doesn't transform the data from volumes or our secrets into
content to share alongside the application. What we publish is only the image.

***

Finally, let's stop and remove first the project that runs the application:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container consumer-app-1 Removed                                                                                 0.1s
 ✔ Network consumer_default Removed                                                                                 0.1s
```

Then we go back to the previous directory:

```shell
$ cd ..
```

And we also remove the registry project:

```shell
$ docker compose down -v
```
```terminaloutput
[+] down 2/2
 ✔ Container registry-registry-1 Removed                                                                            0.1s
 ✔ Volume registry_registry-data Removed                                                                            0.0s
 ✔ Network registry_default      Removed                                                                            0.1s
```

***

> __thank you for watching__
>
> - build your own projects
> - keep experimenting
> - see you next time

With this section, we wrap up our Docker course. We started with running a container and have now covered building,
configuring, deploying, and maintaining applications composed of multiple services. Now we can deliver a ready image
and a configuration to run it, knowing how to observe the stack's behavior, update it, and recover its data. The
next step will be applying these skills to our projects, choosing what we need each time and verifying that the
result matches what we want to achieve.

Thanks for following this course with me. Good luck with your projects, and I'll see you in the next video!

Bye!

***

> Resources
>
> - [Distribution registry](https://distribution.github.io/distribution/about/deploying/)
> - [registry](https://hub.docker.com/_/registry)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../../contribute/README.md) to the final page.
