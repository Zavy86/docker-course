# Running one-off jobs

> __running one-off jobs__
>
> - check the result
> - run a command and finish
> - reuse the service configuration

If we needed to run an occasional operation in our stack, it wouldn't make sense to keep a container running just
for that. We'd need a container just for the duration of that task. Once it's done, we'd want to know if the
operation succeeded or if it was interrupted before reaching the expected result.

To run a job like this with Compose, we can reuse the configuration of a service. We start a dedicated container
that can access the resources already set up for the service. When the container finishes, we can check if the job
was successful.

In the [previous chapter](../39-service-readiness/README.md), we saw how to wait for a service to be ready to
respond. We'd face a similar problem if a service needed the result of a preliminary operation. If we started the
service while that work was still in progress, it could find an incomplete state and fail during startup.

So we can express this dependency in the stack configuration. During startup, Compose waits for the preliminary
operation to complete successfully before starting the dependent service. If the job fails, the dependent service
will stay stopped, and we can check what went wrong.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/jobs
```

Let's look at the `compose.yaml` file.

```yaml
services:
  tools:
    image: alpine
    profiles: [ tools ]
    command: [ "echo", "Operation completed" ]
```

By specifying a profile, we can keep the tool out of the normal stack startup (which we haven't defined yet in this
example), but we can still call it directly, as we saw in the previous chapters.

So let's proceed with the command:

```shell
$ docker compose run --rm tools
```
```terminaloutput
[+] run 1/1
 ✔ Network jobs_default Created                                                                                     0.0s
Container jobs-tools-run-0881815f0f18 Creating 
Container jobs-tools-run-0881815f0f18 Created 
Operation completed
```

And we'll see, as expected, the message `Operation completed`.

***

As you've seen in the first part of this course, we can also specify an alternative command at container startup for
one of our stack services by listing it after the service name:

```shell
$ docker compose run --rm tools uname -m
```
```terminaloutput
Container jobs-tools-run-61b8ae226bbd Creating 
Container jobs-tools-run-61b8ae226bbd Created 
aarch64
```

This time, we'll get the container architecture as output, in my case `aarch64`.

The command after `tools` replaces `COMMAND`, but it doesn't automatically override any existing `ENTRYPOINT` from
the image.

Something to keep in mind is that the `run` command reuses networks, variables, and mounts from the service. Each
container is new, but any attached volume can contain real data. The service ports are not published, unless you
specify it with `--service-ports` or through an explicit mapping via `-p`.

Typically, `run` starts any necessary dependencies too. If they're already ready or if they don't need to be started
for the command we're running, we can add `--no-deps` to avoid starting them.

...

To see the difference with `exec`, we start a container from the service and keep it waiting.

We'll replace the line `command` in the file with this:

```shell
$ nano compose.yaml
```
```yaml
command: [ "sleep", "infinity" ]
```

We'll start the service container again:

```shell
$ docker compose up -d tools
```
```terminaloutput
[+] up 1/1
 ✔ Container jobs-tools-1 Started                                                                                   0.1s
```

And we run the `uname` command via the `exec` option:

```shell
$ docker compose exec tools uname -m
```
```terminaloutput
aarch64
```

After getting the container architecture again, we launch the same command via `run`:

```shell
$ docker compose run --rm tools uname -m
```
```terminaloutput
Container jobs-tools-run-507bfaca8848 Creating 
Container jobs-tools-run-507bfaca8848 Created 
aarch64
```

Finally, we check which containers are still running using `ps`:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME           IMAGE     COMMAND            SERVICE   CREATED              STATUS              
jobs-tools-1   alpine    "sleep infinity"   tools     About a minute ago   Up About a minute   
```

We'll only stop the container with the `sleep infinity`!

This is because `exec` runs the command in the already running container, while `run` creates a new one, uses it,
and then deletes it, leaving only the first one running.

This can easily give us an idea that if we wanted to enter the shell of an existing service, we could use:

```shell
$ docker compose exec tools sh
```

Once inside the shell, we can for example run the command:

```shell
# hostname
```
```terminaloutput
7eadfd60a880
```

And we'll output the name of the container itself.

Let's be careful that a command run with `exec` doesn't become a permanent modification of the image.

If we run it again:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME           IMAGE     COMMAND            SERVICE   CREATED              STATUS              
jobs-tools-1   alpine    "sleep infinity"   tools     9 minutes ago        9 minutes ago 
```

We'll see that the container is still running with the command `sleep infinity`.

Let's stop everything as usual with the command:

```shell
$ docker compose --profile "*" down
```
```terminaloutput
[+] down 2/2
 ✔ Container jobs-tools-1 Removed                                                                                   3.1s
 ✔ Network jobs_default   Removed                                                                                   0.1s
```

***

> __complete a job before startup__
>
> - initialize once per execution
> - wait for successful completion
> - stop on failure

Some services need a preliminary task to be completed before they can start up correctly.

This could be about creating a file, initializing shared data, or running a migration. In all these cases, simply
starting the containers at the same time isn't enough; you need to express a dependency on the successful completion
of the job.

The difference from a regular background service is crucial—this job shouldn't run indefinitely; it needs to
complete successfully. Its final state becomes part of the stack startup sequence.

If it concludes with a code `0`, the other services can continue. If it fails to start instead, the other services
should stop so that the application doesn't work on incomplete data or an inconsistent state.

***

Let's move into the directory `sources/compose/initialization` and take a look at the `compose.yaml` file:

```yaml
volumes:
  demo-data:

services:
  prepare:
    image: alpine
    restart: "no"
    volumes:
      - demo-data:/data
    command:
      - sh
      - -ec
      - |
        if [ -f /data/message.txt ]; then
          echo "File already exists"
          exit 1
        else
          echo "Data ready" > /data/message.txt
          echo "Preparation completed"
        fi
  app:
    image: alpine
    depends_on:
      prepare:
        condition: service_completed_successfully
    volumes:
      - demo-data:/data:ro
    command: [ "sh", "-ec", "cat /data/message.txt; exec sleep infinity" ]
```

In this stack, we can see the declaration of a volume, which is then used by the `prepare` service. This service
checks for the existence of a file; if the file doesn't exist, it creates it and exits with an informative message.

The same volume is then also used by the `app` service, which reads the file and stays running in wait.

The volume makes the file accessible to both containers, with the difference being that `app` mounts it as
read-only.

The condition `service_completed_successfully` requires that the `prepare` service completes successfully before the
`app` service starts.

So let's launch this stack and see what happens:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 4/4
 ✔ Network initialization_default     Created                                                                       0.0s
 ✔ Volume initialization_demo-data    Created                                                                       0.0s
 ✔ Container initialization-prepare-1 Exited                                                                        0.6s
 ✔ Container initialization-app-1     Started                                                                       0.7s
```

As you can see, the `prepare` container starts first, and once it's done, the `app` container starts.

If we check the active processes:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME                       IMAGE     COMMAND                  SERVICE   CREATED          STATUS                     
initialization-app-1       alpine    "sh -ec 'cat /data/m…"   app       27 seconds ago   Up 27 seconds               
initialization-prepare-1   alpine    "sh -ec 'if [ ! -f /…"   prepare   26 seconds ago   Exited (0) 26 seconds ago  
```

We'll see that the `prepare` container was started and exited successfully (exit code `0`), while the second
container `app` was started and remained running as expected.

If we check the logs:

```shell
$ docker compose logs
```
```terminaloutput
prepare-1  | Preparation completed
app-1      | Data ready
```

We'll see the message `Preparation completed` and `Data ready` from the two containers.

***

To observe the error case, let's first run `docker compose down` (without the `-v` to keep the volume) and then
proceed with restarting the stack.

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 3/3
 ✔ Network initialization_default     Created                                                                       0.0s
 ✘ Container initialization-prepare-1 Error service "prepare" didn't complete successfully: exit 1                  0.6s
 ✔ Container initialization-app-1     Created                                                                       0.0s
service "prepare" didn't complete successfully: exit 1
```

As you can see, in this case the file in the volume was already present, so our setup script failed, exiting with
code `1`. Compose noticed this and, even though `app` was created, it wasn't started.

If we check the processes:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME                       IMAGE     COMMAND                  SERVICE   CREATED          STATUS                      
initialization-app-1       alpine    "sh -ec 'cat /data/m…"   app       19 seconds ago   Created                     
initialization-prepare-1   alpine    "sh -ec 'if [ -f /da…"   prepare   18 seconds ago   Exited (1) 18 seconds ago 
```

We'll see that the `initialization-app-1 ` container is still in the `created` state.

Remember that this constraint only applies during the `up` operation of Compose, so it won't shut down an already
running application if we subsequently launch a failing job.

Moreover, it's not even a guarantee of one-off execution for the entire life of the project.

Let's stop the stack again, this time with:

```shell
$ docker compose down -v
```
```terminaloutput
[+] down 3/3
 ✔ Container initialization-app-1     Removed                                                                       0.0s
 ✔ Container initialization-prepare-1 Removed                                                                       0.0s
 ✔ Network initialization_default     Removed                                                                       0.1s
 ✔ Volume initialization_demo-data    Removed                                                                       0.0s
```

***

> __database migrations__
>
> - use the application's migration tool
> - coordinate concurrent executions
> - plan data compatibility

A real migration changes the database structure, its data, or both.

Typically, the migration job uses the same image as the application and runs the command expected by the framework,
like the ORM command to apply the project's migrations.

The correct sequence becomes:

1. The database is up and running and ready;
2. The migration runs and succeeds;
3. The application starts up.

In Compose, we can express this sequence with dependencies between services.

The migration job can wait for the database to be ready using `service_healthy`, while the application can wait for
the job to complete successfully using `service_completed_successfully`.

It's important, however, not to confuse the two things. The database healthcheck just indicates that the database is
responding, not that the schema is already up to date.

The example in this chapter creates a simple demo file, so it's not a real migration. Checking for the file's
existence prevents overwriting it in subsequent runs, but it doesn't protect against concurrent executions, like two
processes trying to write at the same time.

For real migrations, we need to use tools designed specifically for this purpose. These tools keep track of the
versions that have already been applied and, when necessary, use coordination mechanisms like locks or dedicated
tables.

We also need to make sure we don't run the same migration on every application replica in case of redundancy. The
migration should be executed in a controlled manner, just once, before the replicas start working.

The same principle applies to data imports and administrative commands as well—they need to handle duplicates,
interrupted executions, and possible repetitions. An operation is considered **idempotent** when it can be executed
multiple times without producing any additional unwanted effects.

Docker can run a command inside a container, but it doesn't automatically make it secure or idempotent.

This responsibility stays in the command, script, or tool we're using.

***

> Resources
>
> - [One-off commands with Compose](https://docs.docker.com/reference/cli/docker/compose/run/)
> - [alpine](https://hub.docker.com/_/alpine)

[Continue](../41-compose-networking/README.md) to the next chapter.
