# Backup and restore

> __a backup must be restorable__
>
> - consistent data
> - independent copy
> - verified recovery

If we needed to recover data due to an application error, simply restarting the single app or the entire stack might
not be enough. The volume could still be present and the new service could start up regularly, but the data we need
might no longer be available. Without a separate copy of the data, an application that was working just fine a
moment ago could become unusable.

To prepare for a situation like this, we'd need to back up the data in a consistent state and choose where to store
the backup based on what we want to protect against. A volume keeps the data when we recreate a container. A backup
gives us a copy we can use if the original data is lost or damaged.

Creating a backup, however, doesn't guarantee that we can restore the entire service. We also need to try restoring
it and verify that the application actually works with the recovered data, so we know the process and any potential
issues before we really need to use it.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

And let's move to the directory:

```shell
$ cd docker-course/sources/compose/backups
```

Let's look at the `compose.yaml` file.

```yaml
volumes:
  app-data:
  
services:
  app:
    image: busybox
    command: [ "httpd", "-f", "-p", "8080", "-h", "/data" ]
    volumes:
      - app-data:/data
  tools:
    image: busybox
    profiles: [tools]
    volumes:
      - app-data:/data
      - type: bind
        source: ./backups
        target: /backup
```

The stack includes two services based on the `busybox` image. The first one runs the HTTP server on port `8080` and
serves the files from the `/data` directory. The `/data` directory is linked to the volume `app-data`, where we will
store the application's data. This way, the data will remain available even when we remove the container to recreate
it. To perform a backup, we need to copy these data to a separate location outside the volume.

The `tools` service will allow us to perform backup and restore operations by mounting the same volume at `/data`.
It's associated with the `tools` profile, so it won't start automatically with the default stack, but we can call it
when we need to. Additionally, a bind mount links the local directory `./backups` to `/backup` inside the container,
so the archives created will stay on the computer even after the container and volume are removed.

We'll use two different projects, `demo-production` and `demo-restore`, to keep them separate:

Let's start with the first one:

```shell
$ docker compose -p demo-production up -d
```
```terminaloutput
[+] up 3/3
 ✔ Network demo-production_default Created                                                                          0.0s
 ✔ Volume demo-production_app-data Created                                                                          0.0s
 ✔ Container demo-production-app-1 Started                                                                          0.1s
```

As planned, the network, volume, and service container will be created.

So let's proceed by creating a file inside the volume:

```shell
$ docker compose -p demo-production exec app sh -c 'echo "data to preserve" > /data/index.html'
```

And let's make sure it's served correctly by our web server.

```shell
$ docker compose -p demo-production exec app wget -q -O - http://localhost:8080
```
```terminaloutput
data to preserve
```

***

For this test, let's go with the simplest method: we'll just stop the application while we copy the volume data (in
a real system, we'd need to stop or coordinate all processes that write or read those data, including workers and
any external jobs).

```shell
$ docker compose -p demo-production stop app
```
```terminaloutput
[+] stop 1/1
 ✔ Container demo-production-app-1 Stopped                                                                          3.1s
```

Next, we'll start the tool to perform the backup:

```shell
$ docker compose -p demo-production run --rm --no-deps -T tools sh -ec 'tar -cf /backup/app-data.tar -C /data .'
```
```terminaloutput
[+] run 1/1
 ✔ Container demo-production-tools-run-9da90ff1324e Created                                                         0.0s
```

If everything went well, in the current directory under `backups`, we'll find a file called `app-data.tar`.

Let's verify that the file was created correctly by checking its contents with the command:

```shell
$ docker compose -p demo-production run --rm --no-deps -T tools tar -tf /backup/app-data.tar
```
```terminaloutput
./
./index.html
```

Finally, we restart the application:

```shell
$ docker compose -p demo-production start app
```
```terminaloutput
[+] start 1/1
 ✔ Container demo-production-app-1 Started                                                                          0.1s
```

Let's be mindful of what we're backing up and where we store these backups. In this small example, the archive
contains just one HTML file, but actual backups can include secrets and personal data. So, we should choose
restrictive permissions. If needed, we can encrypt them and pick the most appropriate storage to keep them in.

***

To test the restore procedure without touching the original volume, we'll then start the new stack:

```shell
$ docker compose -p demo-restore create app
```
```terminaloutput
[+] create 3/3
 ✔ Network demo-restore_default Created                                                                             0.0s
 ✔ Volume demo-restore_app-data Created                                                                             0.0s
 ✔ Container demo-restore-app-1 Created                                                                             0.0s
```

With this command, we ask Compose to create the container without starting it, and at the same time, the network and
volume will be created so that we can use them for the restore.

Next, we proceed with restoring the data:

```shell
$ docker compose -p demo-restore run --rm --no-deps -T tools sh -ec 'tar -xf /backup/app-data.tar -C /data'
```
```terminaloutput
[+] run 1/1
 ✔ Container demo-restore-tools-run-31a69f49fc4b Created                                                            0.0s
```

At this point, we can start the service:

```shell
$ docker compose -p demo-restore up -d app
```
```terminaloutput
[+] up 1/1
 ✔ Container demo-restore-app-1 Started                                                                             0.1s
```

Verify that the data has been restored:

```shell
$ docker compose -p demo-restore exec app cat /data/index.html
```
```terminaloutput
data to preserve
```

And let's make sure the HTTP server is capable of serving its content:

```shell
$ docker compose -p demo-restore exec app wget -q -O - http://localhost:8080
```
```terminaloutput
data to preserve
```

Now that we've made sure the restore test worked, we can proceed with the production restore.

We tear down the test stack with:

```shell
$ docker compose -p demo-restore down
```
```terminaloutput
[+] down 2/2
 ✔ Container demo-restore-app-1 Removed                                                                             3.1s
 ✔ Network demo-restore_default Removed                                                                             0.1s
```

And just like before, we start by stopping the application in the production project:

```shell
$ docker compose -p demo-production stop app
```
```terminaloutput
[+] stop 1/1
 ✔ Container demo-production-app-1 Stopped                                                                          3.1s
```

Next, we'll start the tool to perform the restore:

```shell
$ docker compose -p demo-production run --rm --no-deps -T tools sh -ec 'tar -xf /backup/app-data.tar -C /data'
```
```terminaloutput
[+] run 1/1
 ✔ Container demo-production-tools-run-9615a66ff33c Created                                                         0.0s
```

Restarting the application:

```shell
$ docker compose -p demo-production start app
```
```terminaloutput
[+] start 1/1
 ✔ Container demo-production-app-1 Started                                                                          0.1s
```

And let's make sure that the HTTP server is once again capable of serving its content:

```shell
$ docker compose -p demo-production exec app wget -q -O - http://localhost:8080
```
```terminaloutput
data to preserve
```

To wrap up, we'll also remove the production stack:

```shell
$ docker compose -p demo-production down
```
```terminaloutput
[+] down 2/2
 ✔ Container demo-production-app-1 Removed                                                                          3.1s
 ✔ Network demo-production_default Removed                                                                          0.1s
```

***

> __database backups need database rules__
>
> - use supported backup tools
> - test version compatibility
> - coordinate related data

The procedure we just went through is good for our example files, but if the data belongs to a database, we need to
be a bit more careful. If we were to copy with `tar` the directory of a running database, the files could change
during the read process, and we'd end up with data from different points in time. The archive might be created
without errors, but it would be unusable when restoring.

For PostgreSQL, MySQL, or other databases, it's best to use one of the backup tools provided by the product.

We can rely on a logical backup, like a data dump, or a physical file copy. In both cases, we follow the documented
procedure. Even if we shut down the database properly, we must still meet the required conditions for the copy and
check the version compatibility, and when necessary, the architecture.

We also need to consider any linked files related to the database data. If a record in a table refers to a document
uploaded by the user, simply restoring the record won't give us the document too. The backup must include both,
keeping them consistent with each other, otherwise the application might start normally but end up with some missing
content.

***

> __prepare for losing the host__
>
> - off-host copy
> - configuration and secrets
> - recovery point and recovery time

The `backups` directory on the same host is convenient for testing, but it doesn't protect us from potential host
issues. We always keep at least one copy outside the host, with separate access and a retention policy that doesn't
delete the last valid copy before verifying another one.

A useful reference is the
[3-2-1 Backup Rule](https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf). It recommends
keeping at least three copies of your data, including the original plus two backups, on two different types of
media, with at least one copy stored in a location separate from where the original system is located. This last
part is crucial for protecting against events that involve an entire operational site, like a fire or theft.

We also back up Compose files, configuration, image references, instructions, secrets, and any necessary keys.
Secrets and encryption keys should be protected and recoverable separately, not just left on the machine we're
trying to rebuild. Otherwise, we might end up with all the backups available but without the keys needed to restore
them.

And let's remember that only by testing a backup restore can we be sure which steps are needed and how much time it
might take to get back up and running. We shouldn't underestimate this aspect.

***

> Resources
>
> - [Back up and restore Docker volumes](https://docs.docker.com/engine/storage/volumes/#back-up-restore-or-migrate-data-volumes)
> - [busybox](https://hub.docker.com/_/busybox)

[Continue](../54-private-registry/README.md) to the next chapter.
