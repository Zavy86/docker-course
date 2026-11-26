# Compose Watch

> __local development__
>
> - edit files on the host
> - update the running service
> - rebuild only when needed

During development, the workflow is often the same: we modify a file on our computer, save it, and then verify the
result in the application. But if the service is running in a container, the files copied into the image during the
build won't automatically change when we modify them on the computer. Rebuilding the image and recreating the
service after every small change can significantly slow down our workflow.

In the [previous chapter](../42-persistent-data/README.md), we saw how a bind mount gives a container access to
files in a directory on the host.

Compose **Watch** gives us another interesting option. It watches the paths we specify in the file and, when it
detects a change, carries out the action we chose for the service.

We can simply sync the sources into the container, sync the files, and restart the container, or rebuild the image
and recreate the service when something related to the build changes.

This way, we can choose the most appropriate action based on the type of change, without having to rebuild
everything every time.

One thing to keep in mind is that file synchronization updates the files within the container, but this doesn't
guarantee that the application will re-read them. This behavior depends on the process running. Additionally, the
synchronized files live within the container and do not modify the initial image, which will eventually need to be
rebuilt to include them.

In this chapter, we'll try these actions and see how to manage a Watch session.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/watch
```

And let's break down the structure of this stack:

```shell
$ tree
```
```terminaloutput
.watch/
├── compose.yaml
├── Dockerfile
├── httpd.conf
└── site/
    └── index.html
```

In the file `site/index.html`, we can see a simple web page:

```html
<!doctype html>
<html lang="en">
  <meta charset="utf-8">
  <title>Compose Watch</title>
  <h1>First version</h1>
</html>
```

The `httpd.conf` file currently only contains a comment, we'll need it later for the restart test.

```conf
# Demo server configuration
```

The `Dockerfile` copies the files and starts a simple web server on the internal port 8080:

```dockerfile
FROM busybox
COPY site/ /site/
COPY httpd.conf /etc/httpd.conf
CMD [ "httpd", "-f", "-p", "8080", "-h", "/site", "-c", "/etc/httpd.conf" ]
```

Obviously, this simple image is only for this local demonstration, not a complete setup for publishing a site in
production.

While the heart of it all, of course, is in the `compose.yaml` file:

```yaml
services:
  web:
    build: .
    ports:
      - "8080:8080"
    develop:
      watch:
        - action: sync
          path: ./site
          target: /site
          ignore:
            - drafts/
```

The `web` service is built from our Dockerfile. The rule under `develop.watch` watches the `site` directory on the
host and synchronizes any changes within that directory to `/site` inside the container without rebuilding the
image.

In this map, `path` represents the relative path to the project directory, while `target` is the absolute path
inside the container. The optional `ignore` option is always relative to the observed path, so `drafts/` in this
example means `site/drafts/`.

***

Let's launch the stack and see what happens:

```shell
$ docker compose up --build --watch
```
```terminaloutput
[+] Building 0.3s (10/10) FINISHED                                                                  
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 542B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 178B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/busybox:latest                                                   0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [1/3] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => => resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => => extracting sha256:55d2dadd4bbc7132e31b89f47d8f7cc517cac013563328b707c933d42c4a2c07                           0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 249B                                                                                   0.0s 
 => [2/3] COPY site/ /site/                                                                                         0.0s 
 => [3/3] COPY httpd.conf /etc/httpd.conf                                                                           0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s
 => => exporting manifest sha256:206ccf8c6e599f4f7b0071dbd522b41ca17328d08e9a4e8975826f3df6de                       0.0s 
 => => exporting config sha256:47a8cea4a867d0df8b087bcfdae8380f314bf205c01975569d80431219bb43                       0.0s
 => => exporting attestation manifest sha256:b783793db3d74de5570d900d6ed24cccddffa1e1c4c93970                       0.0s 
 => => exporting manifest list sha256:da6a5c9df66fba82c6b18bf28ce6009440c14df5b0dbfb593696a02                       0.0s 
 => => naming to docker.io/library/watch-web:latest                                                                 0.0s 
 => => unpacking to docker.io/library/watch-web:latest                                                              0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] up 3/3
 ✔ Image watch-web       Built                                                                                      1.5s
 ✔ Network watch_default Created                                                                                    0.0s
 ✔ Container watch-web-1 Created                                                                                    0.0s
        ⦿ Watch enabled
Attaching to web-1
```

After building the image, creating the network, and starting the container, Compose enables the `watch` feature and
attaches to the logs.

If we open our browser to [http://localhost:8080](http://localhost:8080), we'll actually see the web page that's
exposed.

In another terminal, we're then going to modify its source code:

```shell
$ nano site/index.html
```
```html
<!doctype html>
<html lang="en">
  <meta charset="utf-8">
  <title>Compose Watch</title>
  <h1>Second version</h1>
</html>
```

And we'll immediately notice that Compose has synced the changes:

```terminaloutput
[...]
        ⦿ Syncing service "web" after 1 changes were detected
```

If we refresh the page in the browser, the text changes without needing to rebuild the image or restart the web
server container.

***

> __sync is not hot reload__
>
> - files and application state are different
> - use the application's development mode
> - keep dependencies inside the image

In a real application, updating the file doesn't mean that the process will automatically re-read it.

Some frameworks might offer the option for hot reload, but in other cases, you might need a restart or a
recompilation.

Watch copies the files into the container, and the subsequent behavior depends on the application.

A simple bind mount makes a host directory accessible, but Watch instead synchronizes changes to the container's
filesystem in real time. But let's not consider it a bidirectional sync tool or a way to recover data produced by
the service.

We don't mount a bind mount to the same path we want to synchronize at the same time.

Let's choose the clearest mechanism for that part of the project.

For a future `Node` application, for example, we could sync the sources, exclude the `node_modules` directory, and
rebuild the image when our dependency lockfile changes.

***

Now let's move on to a second mode.

Stop the session with `Ctrl+C` and add this second rule to the `watch` list:

```yaml
[...]
- action: sync+restart
  path: ./httpd.conf
  target: /etc/httpd.conf
```

And we restart the stack again:

```shell
$ docker compose up --build --watch
```
```terminaloutput
[+] Building 0.2s (10/10) FINISHED                                                                  
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 542B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 178B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/busybox:latest                                                   0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 215B                                                                                   0.0s 
 => [1/3] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => => resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => CACHED [2/3] COPY site/ /site/                                                                                  0.0s 
 => CACHED [3/3] COPY httpd.conf /etc/httpd.conf                                                                    0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => exporting manifest sha256:206ccf8c6e599f4f7b0071dbd522b41ca17328d08e9a4e8975826f3df6de                       0.0s 
 => => exporting config sha256:47a8cea4a867d0df8b087bcfdae8380f314bf205c01975569d80431219bb43                       0.0s 
 => => exporting attestation manifest sha256:1a5ae4dc934983e533be9ca8c04c8cd27d2a1df7eeb62457                       0.0s 
 => => exporting manifest list sha256:4fdf7acaf1da263ed737026495d4445b3f8892442693669f0439c56                       0.0s 
 => => naming to docker.io/library/watch-web:latest                                                                 0.0s 
 => => unpacking to docker.io/library/watch-web:latest                                                              0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] up 2/2
 ✔ Image watch-web       Built                                                                                      0.2s
 ✔ Container watch-web-1 Recreated                                                                                  0.0s
        ⦿ Watch enabled
Attaching to web-1
```

In another terminal, modify the comment in `httpd.conf`:

```shell
$ nano httpd.conf
```
```conf
# Demo server configuration updated
```

And checking in the first terminal:

```
Container watch-web-1 Restarting
        ⦿ service(s) ["web"] restarted
web-1 exited with code 137 (restarting)
```

We'll note that the server container has been correctly restarted.

***

We stop the session again with `Ctrl+C` and add a third rule:

```yaml
[...]
- action: rebuild
  path: ./Dockerfile
```

And we restart the new stack:

```shell
$ docker compose up --build --watch
```
```terminaloutput
[+] Building 0.2s (10/10) FINISHED                                                                  
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 542B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 178B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/busybox:latest                                                   0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 215B                                                                                   0.0s 
 => [1/3] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => => resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => CACHED [2/3] COPY site/ /site/                                                                                  0.0s 
 => CACHED [3/3] COPY httpd.conf /etc/httpd.conf                                                                    0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => exporting manifest sha256:206ccf8c6e599f4f7b0071dbd522b41ca17328d08e9a4e8975826f3df6de                       0.0s 
 => => exporting config sha256:47a8cea4a867d0df8b087bcfdae8380f314bf205c01975569d80431219bb43                       0.0s 
 => => exporting attestation manifest sha256:1a5ae4dc934983e533be9ca8c04c8cd27d2a1df7eeb62457                       0.0s 
 => => exporting manifest list sha256:4fdf7acaf1da263ed737026495d4445b3f8892442693669f0439c56                       0.0s 
 => => naming to docker.io/library/watch-web:latest                                                                 0.0s 
 => => unpacking to docker.io/library/watch-web:latest                                                              0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] up 2/2
 ✔ Image watch-web       Built                                                                                      0.2s
 ✔ Container watch-web-1 Recreated                                                                                  0.0s
        ⦿ Watch enabled
Attaching to web-1
```

In another terminal, we're going to modify the `Dockerfile` by adding an environment variable, for example:

```shell
$ nano Dockerfile
```
```dockerfile
ENV DEMO_BUILD=test
```

Once the file is saved, you'll see a new build start, followed by the recreation of the service:

```terminaloutput
        ⦿ Rebuilding service(s) ["web"] after changes were detected...
Image watch-web Building 
        ⦿ #1 [internal] load local bake definitions
        ⦿ #1 reading from stdin 542B done
        ⦿ #1 DONE 0.0s
        ⦿ 
        ⦿ #2 [internal] load build definition from Dockerfile
        ⦿ #2 transferring dockerfile: 198B done
        ⦿ #2 DONE 0.0s
        ⦿ 
        ⦿ #3 [internal] load metadata for docker.io/library/busybox:latest
        ⦿ #3 DONE 0.0s
        ⦿ 
        ⦿ #4 [internal] load .dockerignore
        ⦿ #4 transferring context: 2B done
        ⦿ #4 DONE 0.0s
        ⦿ 
        ⦿ #5 [internal] load build context
        ⦿ #5 transferring context: 89B done
        ⦿ #5 DONE 0.0s
        ⦿ 
        ⦿ #6 [1/3] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d9896389ca60a1a59d3463db586e5fa4
        ⦿ #6 resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d9896389ca60a1a59d3463db586e5fa4 done
        ⦿ #6 DONE 0.0s
        ⦿ 
        ⦿ #7 [2/3] COPY site/ /site/
        ⦿ #7 CACHED
        ⦿ 
        ⦿ #8 [3/3] COPY httpd.conf /etc/httpd.conf
        ⦿ #8 CACHED
        ⦿ 
        ⦿ #9 exporting to image
        ⦿ #9 exporting layers done
        ⦿ #9 exporting manifest sha256:21c85548d7fd9c2f9047628de650bc9896f2eca2412b8c16b88caac2e00c4477 done
        ⦿ #9 exporting config sha256:5055582daddc622d976eeb17c4bf076b1d39fa751620680026538b12a1a4b807 done
        ⦿ #9 exporting attestation manifest sha256:f8b1375e70e1dfc8202e233f9cf9a4c39b8737319982ecef892742b60c2fe644 done
        ⦿ #9 exporting manifest list sha256:99b63e30f22acd6fd68560efbd68bc9bab9906041569638a3039cac95b128592 done
        ⦿ #9 naming to docker.io/library/watch-web:latest done
        ⦿ #9 unpacking to docker.io/library/watch-web:latest done
        ⦿ #9 DONE 0.0s
        ⦿ 
        ⦿ #10 resolving provenance for metadata file
        ⦿ #10 DONE 0.0s
Image watch-web Built 
        ⦿ service(s) ["web"] successfully built
Container watch-web-1 Recreate 
web-1 has been recreated                                                                            
web-1 exited with code 137                                                                          
Container watch-web-1 Recreated
```

Obviously, this time the container ID will change too, and when it becomes available again, we can check the
variable:

```shell
$ docker compose exec web printenv DEMO_BUILD
```
```terminaloutput
test
```

We notice that `rebuild` uses the service's build configuration and leverages the cache when it's available.

***

An extra detail, if we prefer to separate the application logs from the Watch messages, we can stop the session with
the usual `CTRL+C` and restart it with these two separate commands: first, the build:

```shell
$ docker compose up -d --build
```
```terminaloutput
[+] Building 0.2s (10/10) FINISHED                                                                  
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 542B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 198B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/busybox:latest                                                   0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [1/3] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => => resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 89B                                                                                    0.0s 
 => CACHED [2/3] COPY site/ /site/                                                                                  0.0s 
 => CACHED [3/3] COPY httpd.conf /etc/httpd.conf                                                                    0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => exporting manifest sha256:21c85548d7fd9c2f9047628de650bc9896f2eca2412b8c16b88caac2e00c                       0.0s 
 => => exporting config sha256:5055582daddc622d976eeb17c4bf076b1d39fa751620680026538b12a1a4b8                       0.0s 
 => => exporting attestation manifest sha256:4ec67415a53ae42f8cb3f8e49da4e929b929c164de88e257                       0.0s 
 => => exporting manifest list sha256:50c8f3835aafa54b7e36f0d903aa1d20673458829b5e0d9e6ec0c22                       0.0s 
 => => naming to docker.io/library/watch-web:latest                                                                 0.0s 
 => => unpacking to docker.io/library/watch-web:latest                                                              0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] up 2/2                     
 ✔ Image watch-web       Built                                                                                      0.2s
 ✔ Container watch-web-1 Running                                                                                    0.0s
```

And then there's the watch:

```shell
$ docker compose watch --no-up
```
```terminaloutput
Watch enabled
```

In this way, by modifying the comment again in `httpd.conf`:

```shell
$ nano httpd.conf
```
```conf
# Demo server configuration
```

In the first terminal, we'll simply see:

```terminaloutput
Container watch-web-1 Restarting 
service(s) ["web"] restarted
```

And we won't see the log of the container itself anymore.

The `--no-up` option observes services that are already running. Pressing `Ctrl+C` to stop this command will only
halt the Watch, not the background services that were started previously.

```shell
$ docker ps
```
```terminaloutput
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                    NAMES
00c4d7568c9c   99b63e30f22a   "httpd -f -p 8080 -h…"   9 minutes ago   Up 2 minutes   0.0.0.0:8080->8080/tcp   watch-web-1
```

So as always, we stop the whole stack with the command:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container watch-web-1 Removed                                                                                    3.1s
 ✔ Network watch_default Removed                                                                                    0.1s
```

***

> Resources
>
> - [Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/)
> - [busybox](https://hub.docker.com/_/busybox)

[Continue](../44-resource-limits/README.md) to the next chapter.
