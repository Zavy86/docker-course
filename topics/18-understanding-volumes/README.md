# Working with volumes

> __working with volumes__
>
> - holding volumes
> - share volumes
> - host directories

Docker volumes can be used for many purposes, such as bypassing the limitations of the standard copy-on-write filesystem
to achieve native read and write performance, sharing files and directories between multiple containers or directly with
the host, and even using custom or remote storage through dedicated drivers.

In simple terms, Docker volumes are special directories declared directly in images using the `VOLUME` instruction in
the Dockerfile, or created on the fly when running a container with the `-v` option of the `docker run` command.
Whichever method you choose, Docker will manage the specified directory as a volume.

Additionally, volumes exist independently of containers. If a container is stopped or removed, the volume remains on the 
host and can always be reused by another container.

***

To list the volumes available on your host, you can use the following command:

```shell
$ docker volume ls
```

You will get a list of all existing volumes with their respective driver and unique identifier.

```terminaloutput
DRIVER    VOLUME NAME
local     0d5c47295b66a2cf1e4354db5aee95e548a0c6e64bc34971b735fa93602901ff
local     6b09acd4ae00e1f5e7919a435f2c66188bd7979f6bc5078a643a65bd0ec20445
local     6d0b2522c626ca3a4fe08a69e916541cd0da1fa775a190b26d492239535fc886
```

The hexadecimal names identify the volumes automatically created by Docker, but as we will see shortly, during the
container startup phase or when creating it manually, we can specify a more readable name for the volumes we create.

Let's try to create a volume to manage the pages of a web server:

```shell
$ docker volume create nginx-www
$ docker volume ls
```

In this case, you will see the chosen label as the volume name instead of the hexadecimal identifier:

```terminaloutput
DRIVER    VOLUME NAME
[...]
local     nginx-www
[...]
```

At this point, let's launch a container with Nginx, mapping the web server's directory to the volume we just created:

```shell
$ docker run -d -p 8080:80 -v nginx-www:/usr/share/nginx/html nginx
``` 

This way, the web server will serve the pages stored in the volume, as we can verify by opening the browser at:  
`http://localhost:8080`.

Now, let's launch a second container pointing to the same volume:

```shell
$ docker run -ti -v nginx-www:/www alpine
```

In this case, we used a different path inside the `alpine` container. Let's check what it contains:

```shell
# ls -l /www
```

And here is the content of the volume:

```terminaloutput
total 8
-rw-r--r--    1 root     root           497 Aug 13 14:33 50x.html
-rw-r--r--    1 root     root           615 Aug 13 14:33 index.html
```

Let's now try editing the index file:

```shell
# apk add nano
# nano /www/index.html
```

And let's modify the content of the file:

```html
[...]
<h1>Welcome from Volume</h1>
[...]
```

Exit by saving with `^X` and `Y`, then return to the browser and refresh the page at `http://localhost:8080`. You will
see that the page is now served with the updated content!

***

> __working with volumes__
>
> - all empty
> - empty volumes
> - non-empty volumes

When mounting a volume in a container, there are three possible scenarios.

If the volume being mounted is empty, and it is mounted to an empty (or non-existent) directory, Docker will simply 
create the directory inside the container.

If you mount an empty volume into an existing and non-empty directory in the container, Docker will copy all the 
contents of the existing directory into the volume.

If you mount a non-empty volume, regardless of whether the directory exists inside the container or not, the contents of
the volume will overwrite anything present in the directory.

***

If we try to stop and remove the nginx container:

```shell
$ docker ps
$ docker stop 171
$ docker rm 171
```

And let's relaunch it with the same parameters as before:

```shell
$ docker run -d -p 8080:80 -v nginx-www:/usr/share/nginx/html nginx
``` 

And let's go back to the browser and refresh the page: (http://localhost:8080)[http://localhost:8080] and you will see 
that the page now serves the content as we updated it in the volume!

***

> __working with volumes__
>
> - bind
> - storage
> - development

Classic Docker volumes are convenient, centralized, and manageable using CLI commands.

However, there are cases where you might want to explicitly specify a directory within your host's filesystem, or on a
NAS or SAN, to use a custom or remote volume.

This approach allows for more granular control over the volume, managing snapshots and backups, and potentially using
faster, larger, or more resilient disks.

Another advantage, especially when developing locally, is the ability to work directly on the same directory of your 
operating system with your preferred editor and see the changes applied immediately.

***

If you haven't already, clone the repository for this course:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the `docker-course` directory:

```shell
$ cd docker-course
```

And let's launch the nginx container again using the `-v` parameter to mount the volume to a specific directory:

```shell
$ docker run -d -p 8080:80 -v ./sources/volumes/nginx-www:/usr/share/nginx/html nginx
``` 

And from our browser, we open the page again: (http://localhost:8080)[http://localhost:8080], and we will see that the
page served this time is the one located in the `./sources/volumes/nginx-www` directory:

```shell
$ nano ./sources/volumes/nginx-www/index.html
```
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hello World</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>From a bind-mounted volume</p>
</body>
</html>
```

If we try to modify it:

```html
[...]
  <h1>Hello World!</h1>
[...]
```

And refresh the page in the browser, you will see that the change is immediately visible.

***

> __working with volumes__
>
> - bind
> - storage
> - development

Volumes are also a powerful tool for managing application migrations and release upgrades.

For example, in a database upgrade scenario, you can mount the old volume on the new container to handle the migration 
while preserving the data stored in the previous volume.

For this specific need, you can also use the `--volumes-from` option to mount an existing volume even if you do not know 
its name, as long as you know which container created it.

***

Let's launch a container with Redis version `7` as an example:

```shell
$ docker run -d --name redis7 redis:7
``` 

Next, we use the usual `busybox` to connect to the database via `telnet`:


```shell
$ docker run -ti --rm --link redis7 busybox telnet redis7 6379
``` 

> Using the `--link` option you can leverage a small workaround to connect two containers without having to create a
> dedicated bridge network. However, this option is now marked as deprecated, so do not rely on it in production. For 
> our simple example it works fine, but otherwise you should use the `--net tutorial` network created earlier.

```terminaloutput
Connected to redis7
```

Let's now run the following sequence of commands to create a new key named `counter` with the value `42`, save and exit.

```redis
SET counter 42
SAVE
QUIT
```

Let's proceed with the upgrade to Redis version `8` by migrating the volume.

Let's stop the previous container:

```shell
$ docker stop redis7
``` 

And let's start the new container:

```shell
$ docker run -d --name redis8 --volumes-from redis7 redis:8
``` 

Let's reconnect again using `telnet`:

```shell
$ docker run -ti --rm --link redis8 busybox telnet redis8 6379
``` 
```terminaloutput
Connected to redis8
```

And let's verify that the value of the `counter` key is still present:

```redis
GET counter
QUIT
```

Finally, to close this chapter, let's see how to delete a volume.

To find out which volumes are associated with a container, you can use the following command:

```shell
$ docker inspect --format '{{ json .Mounts }}' redis8 | jq
```
```json
[
  {
    "Type": "volume",
    "Name": "3552875a311b31e9764e79a83c73ba87b5628de966f05a7e35a822693813b3ca",
    "Source": "/var/lib/docker/volumes/3552875a311b31e9764e79a83c73ba87b5628de966f05a7e35a822693813b3ca/_data",
    "Destination": "/data",
    "Driver": "local",
    "Mode": "",
    "RW": true,
    "Propagation": ""
  }
]
```

Let's stop and remove both Redis containers:

```shell
$ docker stop redis8
$ docker rm redis7 redis8 
``` 

Finally, we can delete the volume with the following command:

```shell
$ docker volume rm 3552875a311b31e9764e79a83c73ba87b5628de966f05a7e35a822693813b3ca
``` 

In this case, unlike containers, you cannot use a shortened identifier but must specify the full one.

Another useful command is:

```shell
$ docker volume prune
``` 

This command allows you to remove all volumes that are not used by any container.

> Please be careful and always remember that you are solely responsible for your volumes: set up backups, monitor disk 
> usage, and periodically clean up unused volumes.

One last note: the `-v` option can also be used to mount individual files, not just directories.

For example, you might often see the Docker socket mounted like this:

```shell
$ docker run -ti -v /var/run/docker.sock:/var/run/docker.sock docker sh
``` 

In this case, we are creating what is known as "Docker in Docker", which allows us to control our Docker host from
inside a container. If we run the following command:

```shell
# docker ps
```

As you can see, the result is the same as if we had run the command directly on our host.

```terminaloutput
CONTAINER ID   IMAGE    [...]
bef846693b5e   docker   [...]
```

And we can even shut ourselves down:

```shell
# docker stop bef
```

;-)

***

> Resources:
> - [alpine](https://hub.docker.com/_/alpine)
> - [busybox](https://hub.docker.com/_/busybox)
> - [docker](https://hub.docker.com/_/docker)
> - [nginx](https://hub.docker.com/_/nginx)
> - [redis](https://hub.docker.com/_/redis)

[Continue](../19-local-development-workflow/IT.md) to the next topic.
