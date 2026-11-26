# Persistent data

> __persistent data__
>
> - containers can be replaced
> - data needs its own lifecycle
> - persistence is not a backup

When we update an image or change the configuration of a service, Compose can replace its container. As we saw in
the first part of this course, any files written to the writable layer of the container disappear with it. To
preserve data, we need to choose a storage with an independent lifecycle.

We've already met volumes and bind mounts in previous sections. In this chapter, we'll see how to use them with
Compose, how to check if a process can access the files, and when to choose a temporary space over a persistent one.

Finally, we'll also see why keeping data doesn't mean you have a backup.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/storage
```

Let's look at the `compose.yaml` file.

```yaml
volumes:
  app-data:
  
services:
  app:
    image: alpine
    command: [ "sleep", "infinity" ]
    volumes:
      - app-data:/data
```

The main declaration defines a named volume, then the mount inside the `app` service connects it to the `/data` path
in the container.

Once the stack is up and running:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 3/3
 ✔ Network storage_default Created                                                                                  0.0s
 ✔ Volume storage_app-data Created                                                                                  0.0s
 ✔ Container storage-app-1 Started                                                                                  0.1s
```

We'll see that the actual volume name will include the project name, so two distinct projects won't risk using the
same volume.

Let's try writing two demonstrative files, one inside a volume and one outside of a volume:

```shell
$ docker compose exec app sh -c 'echo persistent > /data/message.txt'
$ docker compose exec app sh -c 'echo temporary > /tmp/message.txt'
```

And let's force the recreation of the containers in the stack:

```shell
$ docker compose up -d --force-recreate app
```
```terminaloutput
[+] up 1/1
 ✔ Container storage-app-1 Started                                                                                  3.2s
```

At this point, let's try to read the two files created previously:

```shell
$ docker compose exec app cat /data/message.txt
```
```terminaloutput
persistent
```

As expected, the first file is still available inside the volume mounted on the container.

```shell
$ docker compose exec app cat /tmp/message.txt
```
```terminaloutput
cat: can't open '/tmp/message.txt': No such file or directory
```

While the file we wrote in the `/tmp` directory, which belonged to the container's filesystem, isn't available once
the container is destroyed and recreated.

***

Let's try taking down and recreating the entire stack from scratch:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container storage-app-1 Removed                                                                                  3.1s
 ✔ Network storage_default Removed                                                                                  0.1s
```

As we can see from the log, the container and the connected network have been removed, but not the volume.

If we start the stack again, though:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network storage_default Created                                                                                  0.0s
 ✔ Container storage-app-1 Started                                                                                  0.1s
```

We'll see that only these last two will be recreated, and if we try the file check again:

```shell
$ docker compose exec app cat /data/message.txt
```
```terminaloutput
persistent
```

We'll note that the content is still available as before. In fact, we're using the same project and the same volume
declaration from earlier, so Compose is reassigning us the exact same volume we had access to.

If we wanted to see the name of the storage volume connected to the container, we could use these commands:

```shell
$ docker inspect --format '{{json .Mounts}}' "$(docker compose ps -q app)" | jq
```
```json
[
  {
    "Type": "volume",
    "Name": "storage_app-data",
    "Source": "/var/lib/docker/volumes/storage_app-data/_data",
    "Destination": "/data",
    "Driver": "local",
    "Mode": "rw",
    "RW": true,
    "Propagation": ""
  }
]
```

Alternatively, you can launch the two commands separately, with the second one, as seen in the first part of the
course, serving to get the container ID, which will then be passed as a parameter to the first command.

In any case, the result will be a JSON fragment containing the volume name, its disk mount point, the destination
directory inside the container, the driver, and the access mode.

***

> __choose the right mount__
>
> - named volumes for managed data
> - bind mounts for host files
> - tmpfs for temporary data


In Docker, and in particular with Compose, there are several types of mounts we can use, and the choice depends
mostly on how long the data needs to persist and who needs to access those files.

Compose allows us to link storage to a path inside the container, but different types of mounts don't all have the
same lifecycle.

A **named volume** is managed internally by Docker and continues to exist even when the container is recreated. It's
a good choice for application data, like database data, that need to be preserved without requiring direct access to
a chosen host directory.

A **bind mount** connects a file or directory from the host to a path inside the container. It's useful when you
want to work on the same files from both the host and the container, for example with source code, configurations,
or input files. Changes are visible from both sides, unless there are any restrictions in place.

Finally, a **tmpfs** mount provides temporary space for data that doesn't need to be saved, like work files created
during container execution. Unlike the first two, its contents don't survive the container stopping.

***

Create an `input` directory next to the Compose file:

```shell
$ mkdir input
```

Inside, with our preferred code editor, we create the file:

```shell
$ nano input/message.txt
```
```text
host file
```

Then we add a second entry to the list of volumes for the service:

```yaml
[...]
- type: bind
  source: ./input
  target: /input
  read_only: true
  bind:
    create_host_path: false
```

Setting `create_host_path` to `false` prevents Compose from creating the host directory automatically if the
`./input` directory doesn't exist, causing the command to fail instead. This is useful for catching path errors
early, rather than ending up with an accidentally created empty directory.

We restart the stack again with the command:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container storage-app-1 Started                                                                                  3.2s
```

And let's try to read the file present in the mounted directory:

```shell
$ docker compose exec app cat /input/message.txt
```
```terminaloutput
host file
```

In this case, as expected, we'll be able to read the file, but since we've mounted the volume in read-only mode, any
write attempts will fail:

```shell
$ docker compose exec app sh -c 'echo test > /input/other.txt'
```
```terminaloutput
sh: can't create /input/other.txt: Read-only file system
```

Even with the read-only mount, the file can still be modified by the host. The `read_only` option restricts this
access from the container, but it doesn't freeze the source itself.

Relative paths like `./input` follow the rules of the Compose project and the multiple file scenarios we've already
discussed.

***

Not all files need to be persisted. An application might create temporary files during request processing or
maintain work data that can be reconstructed on the next startup. For these cases, we can use a `tmpfs` mount, which
is managed in memory by the Linux system instead of as a volume or host directory.

Its content remains available during the container's runtime, but it's lost when the container stops. So it's only
suitable for data that the application can delete or recreate.

To try it out, add to the service, at the same level as the `image`, this snippet:

```yaml
[...]
tmpfs:
  - /scratch:size=16m
[...]
```

Let's proceed with the usual stack restart using:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container storage-app-1 Started                                                                                  3.2s
```

And let's verify that the file system is actually in the container with the command:

```shell
$ docker compose exec app df -h /scratch
```
```terminaloutput
Filesystem                Size      Used   Available   Use%   Mounted on
tmpfs                    16.0M         0       16.0M     0%   /scratch  
```

We can see that Linux creates a limited temporary space of 16 MiB, which is useful for small work files. Often,
these data end up in the host's swap space, but don't take that as an absolute guarantee.

Let's try writing to a file:

```shell
$ docker compose exec app sh -c 'echo temporary > /scratch/test.txt'
```

And after restarting the service container:

```shell
$ docker compose restart app
```
```terminaloutput
[+] restart 0/1
 ⠙ Container storage-app-1 Restarting                                                                               3.1s
```

We'll note that the file won't be present anymore:

```shell
$ docker compose exec app cat /scratch/test.txt
```
```terminaloutput
cat: can't open '/scratch/test.txt': No such file or directory
```

***

One last consideration regarding **anonymous volumes**, which are those volumes specified in Docker images or in the
Compose file to which we haven't assigned an explicit name.

We can ask for one by specifying just the destination inside the container, for example, by adding this entry to the
service's `volumes` list:

```yaml
[...]
- /cache
```

Once the stack is restarted:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container storage-app-1 Started                                                                                  3.2s
```

Docker creates the volume and assigns it an automatically generated identifier.

To show only the mount with destination `/cache`, we can filter the output:

```shell
$ docker inspect --format '{{range .Mounts}}{{if eq .Destination "/cache"}}{{json .}}{{end}}{{end}}' "$(docker compose ps -q app)" | jq
```
```json
{
  "Type": "volume",
  "Name": "954da4f03d74e2b378f422e8f1a4d0249bfd563c80cd1b0e6d56b542bbb96b68",
  "Source": "/var/lib/docker/volumes/954da4f03d74e2b378f422e8f1a4d0249bfd563c80cd1b0e6d56b542bbb96b68/_data",
  "Destination": "/cache",
  "Driver": "local",
  "Mode": "z",
  "RW": true,
  "Propagation": ""
}
```

Unlike a `tmpfs`, the data from an anonymous volume won't be deleted just by stopping the container.

If Compose recreates an existing container with `up`, it typically reuses its anonymous volumes. If we don't want
this behavior, we need to specify the `--renew-anon-volumes` option to create new ones.

With `down`, the containers are removed and the anonymous volumes stay on disk, but a subsequent `up` won't reattach
them automatically because, without a stable name in the Compose configuration, it can't do that.

***

> __initial content__
>
> - a mount hides the underlying directory
> - empty volumes may receive image files
> - application initialization has its own rules

When we mount a volume onto a directory already present in the container, the files that were in the image get
hidden by the mount. With a **bind mount**, you'll see the files from the host directory, even if it's empty. The
files that were in the image will still be available if we disable the mount.

With an **empty volume** instead, Docker behaves differently. If it finds files in the image destination, it
normally copies them inside the volume. We can disable this initial copy with the option `volume.nocopy`.

If the **volume already contains data**, Docker preserves it without overwriting it, and this data takes precedence
over what was initially present in the image.

In any case, this copy happens only at the beginning, during the stack startup, not as a continuous synchronization.
Updating the image doesn't automatically update the files that are already inside the volume.

The same principle applies to databases. Many images run initialization scripts only when the data directory is
empty. Changing a variable in Compose might not alter the data of an already initialized database. Before making any
changes, we should always check the image's intended procedure without deleting the volume and its data recklessly
to avoid issues.

***

A writable mount (not in `readonly` mode) can still return `Permission denied` if we try to access its content,
because in this case both the user of the process and the file permissions come into play.

Through the command:

```shell
$ docker compose exec app id
```
```terminaloutput
uid=0(root) gid=0(root) groups=0(root),0(root),1(bin),2(daemon),3(sys),4(adm),6(disk),10(wheel),11(floppy),20(dialout),26(tape),27(video)
```

We'll remove the user that the container is run as, its primary group, and any additional groups.

These identifiers help determine which files the process can read or modify.

```shell
$ docker compose exec app ls -ldn /data /data/message.txt
```
```terminaloutput
drwxr-xr-x   2   0   0   4096   Nov 5   08:16   /data
-rw-r--r--   1   0   0     11   Nov 5   08:16   /data/message.txt
```

The `ls -n` command shows numeric UID and GID, on Linux these identifiers, not the matching usernames, determine
ownership and access. The test Alpine image starts as root, but many application images use non-privileged users.

When an access fails, remember to compare the process's actual user with the owner, group, and file and directory
permissions. This way, we can identify the issue before changing the permissions.

Finally, to destroy the stack including all linked volumes, we use the command:

```shell
$ docker compose down -v
```
```terminaloutput
[+] down 3/3
 ✔ Container storage-app-1 Removed                                                                                  3.1s
 ✔ Volume storage_app-data Removed                                                                                  0.0s
 ✔ Network storage_default Removed                                                                                  0.1s
```

***

> __external volumes and storage location__
>
> - local is still local
> - external means separately managed
> - shared storage needs application support

Just like with networks, volumes can also be managed outside of the project.

The volume must already exist; Compose searches for it by name and does not remove it with `down`, even if you add
`-v`.

**Being external to the project doesn't mean it's remote or replicated**. A regular local volume lives on the Docker
host, inside the VM in the case of Linux containers on a desktop. It doesn't protect against a failure of that
machine.

The network driver and storage can offer different behaviors, but not all filesystems are suitable for any database.
Let's check application support, locking, write synchronization, and performance.

The performance of bind mounts can vary between Linux, macOS, and Windows. For many small files, dependencies, or
database data, we measure the behavior and choose an appropriate storage without assigning guarantees that depend on
the underlying filesystem.

Persistence allows us to replace containers, and backups let us recover data if something goes wrong, but we'll
cover snapshots and restoration in a dedicated chapter.

***

> Resources
>
> - [Volumes in Compose](https://docs.docker.com/reference/compose-file/volumes/)
> - [alpine](https://hub.docker.com/_/alpine)

[Continue](../43-compose-watch/README.md) to the next chapter.
