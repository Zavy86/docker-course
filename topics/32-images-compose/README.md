# Images with Compose

> __building, pulling, and publishing images__
>
> - pull existing images
> - build our own images
> - publish to a registry

In this chapter, we'll focus on the images.

We'll see how to download a ready-made image, how to build a custom image, and finally how to publish it on a
registry so that it becomes accessible from other machines.

We've already had a look at registries in the first part of this course. Compose doesn't replace them; it simply
allows us to describe, next to each service, which image to use or how to build it.

Let's keep in mind three verbs: **build** builds, **pull** downloads, **push** publishes.

None of the three, by themselves, update a running container.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/image
```

Let's look at `compose.yaml` again.

```yaml
services:
  web:
    image: nginx:stable-alpine
    ports:
      - "8080:80"
```

In this example for the web service, we've chosen a variant compared to the usual Nginx image, which is based on
Alpine Linux. This version is smaller and has fewer libraries, but most importantly, it's not present on our host.

To download the image, we use the command:

```shell
$ docker compose pull
```
```terminaloutput
[+] pull 9/9
 ✔ Image nginx:stable-alpine Pulled                                                                                 4.5s
```

We can start the service with:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network compose-image_default Created                                                                            0.0s
 ✔ Container compose-image-web-1 Started                                                                            0.1s
```

And as we've noticed, in this case the `up` command was quick because we had already downloaded the image with the
`pull` command previously.

As usual, we can see that the service is active by opening our browser to the address:
[http://localhost:8080](http://localhost:8080).

As always, to remove the stack, we use the command:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-image-web-1 Removed                                                                            0.0s
 ✔ Network compose-image_default Removed                                                                            0.0s
```

***

Now, to see how the `build` command works, we'll replace the welcome page with our own custom page.

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/image-build
```

In which we find the file `index.html`:

```html
<!doctype html>
<html lang="it">
  <meta charset="utf-8">
  <title>Compose build</title>
  <h1>Welcome from the image!</h1>
</html>
```

The `Dockerfile`:

```dockerfile
FROM nginx:stable-alpine
COPY index.html /usr/share/nginx/html/index.html
```

And finally the `compose.yaml`:

```yaml
services:
  web:
    build: .
    ports:
      - "8080:80"
```

Here, instead of naming a prebuilt image, we use `build` with a dot. This sets the build context to the directory
containing the Compose file. That's where the builder looks for the `Dockerfile` and the files to copy.

We're not mounting a file in this case; instead, we're copying the `index.html` file directly into the image.

Now we'll build our custom image with the command:

```shell
$ docker compose build
```
```terminaloutput
[+] Building 0.3s (9/9) FINISHED
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 562B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 111B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/nginx:stable-alpine                                              0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [1/2] FROM docker.io/library/nginx:stable-alpine                                                                0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 171B                                                                                   0.0s 
 => [2/2] COPY index.html /usr/share/nginx/html/index.html                                                          0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => writing image sha256:ef085dfbf11f4826156c76a82d0639bca913d02f2a897e45279310b32d14716e                        0.0s 
 => => naming to docker.io/library/compose-image-web                                                                0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] build 1/1
 ✔ Image compose-image-build-web Built\                                                                              0.4s
```

Without an `image` field, Compose assigns the built image a name based on the project and service.

```shell
$ docker image ls
```
```terminaloutput
...
IMAGE                                       ID             DISK USAGE   CONTENT SIZE   EXTRA
compose-image-build-web:latest              ef085dfbf11f       61.8MB             0B
...
```

We then start the stack again with the command:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network compose-image-build_default Created                                                                      0.0s
 ✔ Container compose-image-build-web-1 Started                                                                      0.1s
```

And if we reopen the browser, we'll find the customized page with our greeting.

***

Now, unlike with a volume mount, if we change the content of `index.html` and reload the page, we won't see any
difference because the file was copied during the build directly into the image as it was.

So, after you've made changes to the file, to rebuild the image and restart the stack in one step, you use:

```shell
$ docker compose up -d --build
```
```terminaloutput
[+] Building 0.2s (9/9) FINISHED
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 562B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 111B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/nginx:stable-alpine                                              0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 179B                                                                                   0.0s 
 => CACHED [1/2] FROM docker.io/library/nginx:stable-alpine                                                         0.0s 
 => [2/2] COPY index.html /usr/share/nginx/html/index.html                                                          0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => writing image sha256:92b22ee4b912c84bf16c2ae3c114c6132acd3f66e79e0242c60e1bc96e58c072                        0.0s 
 => => naming to docker.io/library/compose-image-web                                                                0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] up 2/2
 ✔ Image compose-image-build-web       Built                                                                        0.3s
 ✔ Container compose-image-build-web-1 Started                                                                      0.3s
```

And the page will update with the new content.

Finally, we remove the stack with the command:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-image-build-web-1 Removed                                                                      0.0s
 ✔ Network compose-image-build_default Removed                                                                      0.0s
```

***

If we needed more control and wanted to use additional parameters, we can convert `build` into a map.

Let's look at a small variation of the same example. Copy this directory into the `compose-image-build-args`
directory and modify the `Dockerfile` like this:

```dockerfile
FROM nginx:stable-alpine AS runtime
ARG VERSION=dev
LABEL org.opencontainers.image.version=$VERSION
COPY index.html /usr/share/nginx/html/index.html
```

And then, instead of the dot, we write this snippet:

```yaml
build:
  context: .
  dockerfile: Dockerfile
  target: runtime
  args:
    VERSION: "1.0"
```

In this map, we find `context`, which indicates the build context path, always relative to Compose. `dockerfile`
specifies which recipe to use, with a path relative to the context, and `target` chooses which named stage to use if
present in the Dockerfile. In this case, we have only one, `runtime`, so we could omit it, but I showed it for
completeness because it might be useful for multi-stage Dockerfiles.

Finally, `args` provides values to the Dockerfile's `ARG` instructions, in this case, we'll then save that value as
a label in the image.

We start the stack with the command:

```shell
$ docker compose up -d --build
```
```terminaloutput
[+] Building 0.2s (9/9) FINISHED
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 683B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 188B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/nginx:stable-alpine                                              0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 171B                                                                                   0.0s 
 => [1/2] FROM docker.io/library/nginx:stable-alpine                                                                0.0s 
 => CACHED [2/2] COPY index.html /usr/share/nginx/html/index.html                                                   0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => writing image sha256:a5fe1beb61a4070f2797d9c996ee633818af3ad69bc89b37eb571bc0ac5b85eb                        0.0s 
 => => naming to docker.io/library/compose-image-build-args-web                                                     0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] up 3/3
 ✔ Image compose-image-build-args-web       Built                                                                   0.3s
 ✔ Network compose-image-build-args_default Created                                                                 0.0s
 ✔ Container compose-image-build-args-web-1 Started                                                                 0.1s
```

Beyond the usual web page, we can check that the label has been applied with the command:

```shell
$ docker image inspect compose-image-build-args-web --format '{{ index .Config.Labels "org.opencontainers.image.version" }}'
```
```terminaloutput
1.0
```

***

When we repeat a build multiple times, Docker can reuse the unchanged steps using its cache, as we can observe in
the log of the last build we ran.

If we want to check if there's a newer version of the image specified by `FROM`, we can force it by using:

```shell
$ docker compose build --pull
```

In this case, it will take a few extra seconds because it will pull the most recent base image before starting the
build.

If instead we want to run all the steps again without reusing the build cache, we can use:

```shell
$ docker compose build --no-cache
```

In this case, as we see, the base image stays cached, but all the subsequent steps are re-executed.

There are different choices: `--no-cache` on its own doesn't require a new base image. We can combine it with
`--pull` when we need both.

And let's not confuse `docker compose pull`, which downloads the service image, with `docker compose build --pull`,
which updates the base images during the build process.

We also remove this stack with the command:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-image-build-args-web-1 Removed                                                                 0.0s
 ✔ Network compose-image-build-args_default Removed                                                                 0.0s
```

***

So far, it works on our machine, but if we want to make our image available to other people, we would need to
publish it to a registry.

This passage is obviously optional and requires an account and a repository where we have the permission to write.
In this example, I'll use the classic **Docker Hub** that we've already seen in the first part of this course.

Copy this directory into the `compose-image-build-push` directory and modify the `compose.yaml`, adding before the
build section:

```yaml
image: zavy86/compose-web:latest
pull_policy: build
```

Obviously, you'll replace `zavy86` with your Docker Hub username.

Then with the command:

```shell
$ docker login
```
```terminaloutput
USING WEB-BASED LOGIN
Your one-time device confirmation code is: XXXX-YYYY
Press ENTER to open your browser or submit your device code here: https://login.docker.com/activate

Waiting for authentication in the browser…
Login Succeeded
```

We log in, then proceed to rebuild the image with:

```shell
$ docker compose build web
```
```terminaloutput
[+] Building 0.2s (9/9) FINISHED
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 676B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 188B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/nginx:stable-alpine                                              0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 32B                                                                                    0.0s 
 => [1/2] FROM docker.io/library/nginx:stable-alpine                                                                0.0s 
 => CACHED [2/2] COPY index.html /usr/share/nginx/html/index.html                                                   0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => writing image sha256:7764a633ada7d6ffa8550bed0d293c2d10a5c197d7082887f27b639feed4142f                        0.0s 
 => => naming to docker.io/zavy86/compose-web:latest                                                                0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] build 1/1
 ✔ Image zavy86/compose-web:latest Built                                                                            0.2s
```

Now we can see that the image has a full name that includes the namespace of our Docker Hub account, and not the
auto-generated composite name with the project name and service name.

So let's move on to publishing the image with the command:

```shell
$ docker compose push web
```
```terminaloutput
[+] push 2/10
 ✔ zavy86/compose-web:latest Pushed                                                                                 7.6s
```

At this point, if we wanted to reuse the image on another host or in a new stack, we would only need to specify the
name of the image and no longer the `build` section or `pull_policy`:

```yaml
services:
  web:
    image: zavy86/compose-web:latest
    ports:
      - "8080:80"
```

If we restart the stack, we'll see that everything continues to work correctly:

```shell
$ docker compose up -d
```
``` terminaloutput
[+] up 2/2
 ✔ Network compose-image-build-push_default Created                                                                 0.0s
 ✔ Container compose-image-build-push-web-1 Started                                                                 0.1s
```

And we remove the stack with the command:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-image-build-push-web-1 Removed                                                                 0.0s
 ✔ Network compose-image-build-push_default Removed                                                                 0.0s
```

***

One last thing we need to be careful about is that the computer we build the image on and the one we run it on could
have different architectures.

A local build on AMD64 doesn't guarantee a runnable image natively on an ARM server.

If a multi-platform Docker image is available, you typically select the variant that matches the host, or you can
specify something like `platform: linux/amd64` to request a specific one.

If we want to distribute our image for both architectures, we restore the `build` map and add the option:

```yaml
platforms:
  - linux/amd64
  - linux/arm64
```

We'll restart the build with:

```shell
$ docker compose build --builder multiarch --push web
```
```terminaloutput
[+] Building 19.0s (14/14) FINISHED                                                                                                                                     
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 760B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 188B                                                                                0.0s 
 => [linux/amd64 internal] load metadata for docker.io/library/nginx:stable-alpine                                  2.8s 
 => [linux/arm64 internal] load metadata for docker.io/library/nginx:stable-alpine                                  1.8s
 => [auth] library/nginx:pull token for registry-1.docker.io                                                        0.0s
 => [internal] load .dockerignore                                                                                   0.0s
 => => transferring context: 2B                                                                                     0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 171B                                                                                   0.0s 
 => [linux/amd64 1/2] FROM docker.io/library/nginx:stable-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e8     4.6s 
 => => resolve docker.io/library/nginx:stable-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed4307154     0.0s 
 => => sha256:b27cf3f7c39dd0da0aa52a285f0c0cce938ac61472babfea353b1daa83586c49 20.34MB / 20.34MB                    3.4s
 => => sha256:b335b7ac3a400afa780d0d89e0b778ee19dc3e3df95bed4b274a763af2264fd7 1.40kB / 1.40kB                      0.9s 
 => => sha256:703c5424632fab32aa3327bebe6e5202ac53a93740062efb830f8188e580b9db 1.21kB / 1.21kB                      0.2s 
 => => sha256:6b4dfb2e8f8a72d7ae1380b667f50faccdc19147869b2afa09aeddfdea59ce64 403B / 403B                          0.8s 
 => => sha256:22e5a8a110ec69c6af30325ccfe8bb0bfb94e5783117808061bae5115e1e3dcb 963B / 963B                          0.5s 
 => => sha256:3d85d110b167fae23d8eb3a7060cd079682b682b04d295fc7bbdf454c9e722c8 626B / 626B                          0.1s 
 => => sha256:e3320d02d5786716dcc40d9f6267baec5d3d2c46945082958050c3ac5ea23751 1.88MB / 1.88MB                      0.6s 
 => => sha256:e2de96513ba9eb53b431787ec8a65cdde380ac4772a3e4c4b714dcfde2a102b5 3.85MB / 3.85MB                      1.3s 
 => => extracting sha256:e2de96513ba9eb53b431787ec8a65cdde380ac4772a3e4c4b714dcfde2a102b5                           0.1s 
 => => extracting sha256:e3320d02d5786716dcc40d9f6267baec5d3d2c46945082958050c3ac5ea23751                           0.1s 
 => => extracting sha256:3d85d110b167fae23d8eb3a7060cd079682b682b04d295fc7bbdf454c9e722c8                           0.0s 
 => => extracting sha256:22e5a8a110ec69c6af30325ccfe8bb0bfb94e5783117808061bae5115e1e3dcb                           0.0s 
 => => extracting sha256:6b4dfb2e8f8a72d7ae1380b667f50faccdc19147869b2afa09aeddfdea59ce64                           0.0s 
 => => extracting sha256:703c5424632fab32aa3327bebe6e5202ac53a93740062efb830f8188e580b9db                           0.0s 
 => => extracting sha256:b335b7ac3a400afa780d0d89e0b778ee19dc3e3df95bed4b274a763af2264fd7                           0.0s 
 => => extracting sha256:b27cf3f7c39dd0da0aa52a285f0c0cce938ac61472babfea353b1daa83586c49                           0.2s 
 => [linux/arm64 1/2] FROM docker.io/library/nginx:stable-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e8     3.1s 
 => => resolve docker.io/library/nginx:stable-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed4307154     0.0s 
 => => sha256:e5cd9cbe35d334211e0dbba7a16b55a0e0cd9575b5393fdcd5302176a0fec16d 1.40kB / 1.40kB                      0.1s 
 => => sha256:de314aae67cdc0a41219ddace8b5a494f3112e8281a485494f265cf9e67f71b6 19.87MB / 19.87MB                    1.5s 
 => => sha256:5ba2889293520adc2c5eec4ddf3c93559a5a800b893407d1f2b7cd351baf70a5 1.21kB / 1.21kB                      0.3s 
 => => sha256:28a16c1011b2ed831d1f9d44e11c5b22e165d09e4719e1b609d875fdb3c91171 402B / 402B                          0.3s 
 => => sha256:5e7de8c59e40521648a206e684d8f7a81bb88132ac05285a9c0ec0d430d40cbf 963B / 963B                          0.3s 
 => => sha256:a8783588284d97127365463f7fa1bf9afddf0ba38cfc8bb0a993643b09b7d493 1.90MB / 1.90MB                      1.5s 
 => => sha256:08c08ab5f9f755ce5a830d30a27f33a9dfdd795223e50b600fd8fe983cf759d8 626B / 626B                          0.2s 
 => => sha256:a9986cd6f37dbddae7862a6d4be71683472e7c2ea708e87db14f8a6393c00f00 4.19MB / 4.19MB                      2.2s 
 => => extracting sha256:a9986cd6f37dbddae7862a6d4be71683472e7c2ea708e87db14f8a6393c00f00                           0.1s 
 => => extracting sha256:a8783588284d97127365463f7fa1bf9afddf0ba38cfc8bb0a993643b09b7d493                           0.1s 
 => => extracting sha256:08c08ab5f9f755ce5a830d30a27f33a9dfdd795223e50b600fd8fe983cf759d8                           0.0s 
 => => extracting sha256:5e7de8c59e40521648a206e684d8f7a81bb88132ac05285a9c0ec0d430d40cbf                           0.0s 
 => => extracting sha256:28a16c1011b2ed831d1f9d44e11c5b22e165d09e4719e1b609d875fdb3c91171                           0.0s 
 => => extracting sha256:5ba2889293520adc2c5eec4ddf3c93559a5a800b893407d1f2b7cd351baf70a5                           0.0s 
 => => extracting sha256:e5cd9cbe35d334211e0dbba7a16b55a0e0cd9575b5393fdcd5302176a0fec16d                           0.0s 
 => => extracting sha256:de314aae67cdc0a41219ddace8b5a494f3112e8281a485494f265cf9e67f71b6                           0.2s 
 => [linux/arm64 2/2] COPY index.html /usr/share/nginx/html/index.html                                              0.1s 
 => [linux/amd64 2/2] COPY index.html /usr/share/nginx/html/index.html                                              0.1s 
 => exporting to image                                                                                             11.2s 
 => => exporting layers                                                                                             0.0s 
 => => exporting manifest sha256:45eddf1a6944226f6a2337aa9098bef37fdee1f45d7c1f6baf598b79cfbc60b9                   0.0s 
 => => exporting config sha256:93d0dba8bf39c8ae4bd02bbaeb6c628c8a9ee26952e21e17ab8d8ad274523972                     0.0s 
 => => exporting attestation manifest sha256:7034432082dbc6aca7ca35645ff1595ab6495008bc43b5e851472f2e38465074       0.0s 
 => => exporting manifest sha256:2f7ece5601da9d3cebb619803b1127022f162d08d50b7e40adaa08496e232fa0                   0.0s 
 => => exporting config sha256:d603bbbf4991f43b7c32f28e0705b049efeb4896c2973cf92c9a4f38242c1342                     0.0s 
 => => exporting attestation manifest sha256:2261fb7106c0273ef8ebd46879ecd8f906d4537795865ea9e4122a51f8be9152       0.0s 
 => => exporting manifest list sha256:2a86cbbe1a625c8e6248c5080ceb732bfde23df5779f62427e370d237cee01cd              0.0s 
 => => pushing layers                                                                                               6.9s 
 => => pushing manifest for docker.io/zavy86/compose-web:latest@sha256:2a86cbbe1a625c8e6248c5080ceb732bfde23df5     4.2s 
 => [auth] zavy86/compose-web:pull,push token for registry-1.docker.io                                              0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] build 1/1                                                                                                            
 ✔ Image zavy86/compose-web:latest Built                                                                           19.1s
```

Obviously, as you can see in this case, it will take much more time because the builder has to build two images and
then push both of them to Docker Hub.

If this passage gives you an error, you probably haven't yet configured the builder with multi-architecture support.
Install it with the command:

```shell
$ docker buildx create --name multiarch --driver docker-container --use
```

And you rebuild the images again using the command.

***

> Resources:
>
> - [Compose builds](https://docs.docker.com/reference/compose-file/build/)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../33-environment-variables/README.md) to the next chapter.
