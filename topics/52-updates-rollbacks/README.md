# Updates and rollbacks

> __prepare before replacing a service__
>
> - identify the current release
> - verify the new release
> - keep a recovery path

If after an update users were no longer able to access our application, the priority would be to restore the service
as quickly as possible. However, rolling back to the previous version, while it might seem like the fastest path,
may not always be the best solution, and especially without having saved the previous image and configuration, it
could be difficult to revert to.

To handle a situation like this, we need to _prepare beforehand_ by keeping the current version running alongside
its configuration. Make sure to define what checks to perform after the swap. This way, if the new version doesn't
work as expected, you'll have everything you need to revert to the previous one.

This operation is called a rollback, and as we'll see, it requires a bit more attention compared to simply
rebuilding the stack.

Beyond just the application version, we also need to consider what might have changed in the data. For example, if a
database was modified during an update, perhaps through a migration, simply running the old image might not be
enough. The application might no longer be able to read the data in the new format.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/updates
```

And let's see which files it contains:

```shell
$ ls
```
```terminaloutput
compose.yaml
Dockerfile
index.html
```

In the file HTML, we find:

```html
<h1>version one</h1>
```

A simple header that will allow us to recognize which version is running.

An example Dockerfile:

```dockerfile
FROM busybox
COPY index.html /www/index.html
CMD [ "httpd", "-f", "-p", "8080", "-h", "/www" ]
```

An image that will be built starting from the `busybox` base image, copies the `index.html` file, and ends with the
`CMD` command that starts the HTTP server.

As we know with `COPY`, the page is included directly in the image and remains tied to the version we are building.
Consequently, even if we were to modify the file on our computer, the running container would continue to show the
previous content.

Finally, in the `compose.yaml` file:

```yaml
services:
  web:
    image: compose-update-demo:v1
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://localhost:8080"]
      interval: 2s
      timeout: 2s
      retries: 5
```

In the chapter, we look at where the name of the image, the version we want to run, the port mapped to the host, and
a healthcheck that tries to reach the HTTP server from inside the container, giving us our first check on its actual
functionality.

So let's move on to building the image:

```shell
$ docker build -t compose-update-demo:v1 .
```
```terminaloutput
[+] Building 0.1s (7/7) FINISHED                                                                    docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                0.0s
 => => transferring dockerfile: 132B                                                                                0.0s
 => [internal] load metadata for docker.io/library/busybox:latest                                                   0.0s
 => [internal] load .dockerignore                                                                                   0.0s
 => => transferring context: 2B                                                                                     0.0s
 => [internal] load build context                                                                                   0.0s
 => => transferring context: 58B                                                                                    0.0s
 => CACHED [1/2] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a5                       0.0s
 => => resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s
 => [2/2] COPY index.html /www/index.html                                                                           0.0s
 => exporting to image                                                                                              0.0s
 => => exporting layers                                                                                             0.0s
 => => exporting manifest sha256:06c4219876b44693dad45db7bb431e3c82eb68c0626a4e72b51eb29f4220                       0.0s
 => => exporting config sha256:863888ec288a66fcb0e08b743bd888c02a9d1fccf42c060689d288d3a92c8c                       0.0s
 => => exporting attestation manifest sha256:36fb2f5ae6cd41b1746a380304bbc4b60287ece7f2be3e8a                       0.0s
 => => exporting manifest list sha256:d1cf35333ec49f8da3f0449d9a36c831e1e51935dd2f51191373e63                       0.0s
 => => naming to docker.io/library/compose-update-demo:v1                                                           0.0s
 => => unpacking to docker.io/library/compose-update-demo:v1                                                        0.0s
```

And the service startup:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network updates_default Created                                                                                  0.0s
 ✔ Container updates-web-1 Started                                                                                  0.1s
```

Once the startup is complete, send an HTTP request to check the page:

```shell
$ curl --fail http://localhost:8080
```
```terminaloutput
<h1>version one</h1>
```

And just as we expected, we'll get version one.

We also retrieve the ID of the image actually used by the service with the command:

```shell
$ docker inspect $(docker compose ps -q web) --format '{{.Config.Image}} {{.Image}}' 
```
```terminaloutput
compose-update-demo:v1 sha256:d1cf35333ec49f8da3f0449d9a36c831e1e51935dd2f51191373e632a7533914
```

This passage is useful because while the tag allows us to recognize a version, it can be assigned to a different
image later. The ID, on the other hand, lets us identify the specific local image actually used by the container.
When we distribute images through a registry, we can pin the reference using a digest and store it with the release
configuration, so we know exactly which image we need to retrieve.

We also need to keep in mind that assigning a tag to our build isn't enough on its own to make it reproducible.

In the example Dockerfile, we use `busybox` as the base image, but that image could change over time too. If we want
to be able to rebuild the exact same version, we'd need to pin the base image reference as well.

But in our case, in this simple example, it would be superfluous...

***

Now that the first version is up and running, let's prepare for the update.

So let's change the page by replacing the text with `version two` and update the tag in the `compose.yaml` file.

So let's proceed with building the image with the tag `v2`:

```shell
$ docker build -t compose-update-demo:v2 .
```
```terminaloutput
[+] Building 0.1s (7/7) FINISHED                                                                    docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                0.0s
 => => transferring dockerfile: 132B                                                                                0.0s
 => [internal] load metadata for docker.io/library/busybox:latest                                                   0.0s
 => [internal] load .dockerignore                                                                                   0.0s
 => => transferring context: 2B                                                                                     0.0s
 => [internal] load build context                                                                                   0.0s
 => => transferring context: 58B                                                                                    0.0s
 => CACHED [1/2] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a5                       0.0s
 => => resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s
 => [2/2] COPY index.html /www/index.html                                                                           0.0s
 => exporting to image                                                                                              0.0s
 => => exporting layers                                                                                             0.0s
 => => exporting manifest sha256:0340e4438ba7585fc95862ceaa9021d0cc820ad8a37fa35350d2c4c58e90                       0.0s
 => => exporting config sha256:3743e3944fe33ac7cc5a8e178ba7a7667553c4bf35a780ae297873da381001                       0.0s
 => => exporting attestation manifest sha256:58987a453706e533c249dd5eecd7c2952c51c7190f06c4ba                       0.0s
 => => exporting manifest list sha256:6cf673c6d986892e59a65a850496aa16ac4094a9bdd91579c6332d5                       0.0s
 => => naming to docker.io/library/compose-update-demo:v2                                                           0.0s
 => => unpacking to docker.io/library/compose-update-demo:v2                                                        0.0s
```

Even though the build prepared the second image and the tag update was included in the stack definition, the running
container continues to use the first version and therefore displays the previous page.

We can verify it by opening the browser at the page [http://localhost:8080](http://localhost:8080), where we'll
still be reading `version one`.

So we proceed by asking Compose to apply the change to the service:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container updates-web-1 Started                                                                                  3.2s
```

At the end of the update, go back to the browser and verify the result of the substitution.

Then we also check the image ID:

```shell
$ docker inspect $(docker compose ps -q web) --format '{{.Config.Image}} {{.Image}}' 
```
```terminaloutput
compose-update-demo:v2 sha256:6cf673c6d986892e59a65a850496aa16ac4094a9bdd91579c6332d5048fff1b6
```

Confirming that the stack is using the correct updated version with tags and IDs as before.

***

If after the update we detect a problem, we could roll back to the initial version by simply, in this example,
changing the image value in the service to `compose-update-demo:v1`.

Without having to modify the HTML file, we can simply tell Docker to use the previous version of the image. If we
restart the stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container updates-web-1 Started                                                                                  3.2s
```

We'll go back to the browse and see the previous version with the label `version one`.

This has been possible because the previous image was still present on our host. If we don't use a registry, we need
to be very careful to regularly backup the images as well. We shouldn't assume we'll always be able to rebuild them.
For example, the starting image in the future might no longer be available if we use certain specific images.

If the old tag was assigned to another image, we can also specify, on the same host, the digest of the image in the
compose.yaml file. If we try to insert the image ID (including `sha256:`) of the first version, we'll see that
everything continues to work correctly:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container updates-web-1 Started                                                                                  2.7s
```

Finish the browser checks as always, and we wrap up with a:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container updates-web-1 Removed                                                                                  3.1s
 ✔ Network updates_default Removed                                                                                  0.1s
```

***

> __application rollback is not data rollback__
>
> - schema compatibility
> - writes made after the update
> - tested backups and recovery time

On our static site, we managed to revert to the first version without much trouble because the app wasn't changing
any persistent data. But if we had a database, we'd need to think about what the new version might have written or
modified while it was running. To go back, the old app would need to still be able to read and use those data,
otherwise restoring the image wouldn't be enough.

An update that drops a column or changes the data format could then prevent us from using the previous version, even
if the image is still available. For this reason, before updating, if the application wasn't created by us, we read
the release notes and test the migrations on an isolated copy, so we understand what changes they introduce. We also
prepare a consistent backup and verify that we can restore it, because simply having a copy doesn't guarantee we can
use it when we need to.

When we have the flexibility to manage how our application evolves, we can separate the introduction of
backward-compatible changes from definitive removals. This allows us to have a period where the data schema is used
by both the old and new versions, making rollbacks much simpler. If a migration introduced incompatible changes,
however, we need to plan how to recover first, without assuming that the tool used has a safe reverse procedure.

Even restoring a backup might not be consequence-free, as it could roll back the data to a previous state and we
might lose any writes that were made in the meantime. So, before proceeding, we need to define up to which point in
time we want to recover them and stop or coordinate any processes that are still modifying them. It would be much
better to always test rollbacks on an isolated copy, especially to avoid connecting two incompatible versions to the
same database at the same time.

If completing these steps required interrupting the service, we would need to schedule maintenance windows with
active users and organize the update accordingly. The presence of a proxy and multiple replicas doesn't
automatically resolve version compatibility issues and doesn't prevent us from managing open connections or
in-progress operations. The ability to keep the service available, with two different versions running concurrently,
therefore depends on how the application handles the update.

Keeping previous images and configurations allows us to prepare for a potential rollback. However, before going
back, we always need to check the data compatibility as well, because restoring the old image might not be enough to
get the service running again.

***

> Resources
>
> - [Using Compose in production](https://docs.docker.com/compose/how-tos/production/)
> - [busybox](https://hub.docker.com/_/busybox)

[Continue](../53-backup-restore/README.md) to the next chapter.
