# Service logs

> __read what services report__
>
> - standard output and standard error
> - service names and timestamps
> - bounded log retention

When a service behaves unexpectedly, without logs it's hard to understand what happened.

Logs, usually visible through standard output and standard error, help us reconstruct the behavior of applications.
It's therefore important to collect them and limit their growth over time to keep them readable.

A log message tells an event that happened at a specific moment, like the start of a service or an error during a
request. When multiple containers work together, reading these messages with the service name and the time helps
connect what happened in different components.

At the same time, the logs continue to take up more and more space as the services run. Setting up rotation means
limiting how many are kept locally, deciding when to delete the older messages in favor of the newer ones.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/logs
```

Let's look at the `compose.yaml` file.

```yaml
services:
  app:
    image: busybox
    init: true
    command:
      - sh
      - -c
      - |
        while true; do
          echo "level=info event=heartbeat"
          echo "level=warn event=demo_warning" >&2
          sleep 5
        done
```

This simple command emits a message to standard output and one to standard error every five seconds. In this
example, we're not writing the logs to a file; instead, we'll make sure Docker collects them directly from both
streams.

Let's launch the stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network logs_default Created                                                                                     0.0s
 ✔ Container logs-app-1 Started                                                                                     0.1s
```

And let's analyze the logs:

```shell
$ docker compose logs -f --timestamps app
```
```terminaloutput
app-1  | 2026-11-14T10:53:23.429826875Z level=warn event=demo_warning
app-1  | 2026-11-14T10:53:23.429866042Z level=info event=heartbeat
app-1  | 2026-11-14T10:53:28.430855877Z level=warn event=demo_warning
app-1  | 2026-11-14T10:53:28.430856127Z level=info event=heartbeat
app-1  | 2026-11-14T10:53:33.433732880Z level=warn event=demo_warning
app-1  | 2026-11-14T10:53:33.433786130Z level=info event=heartbeat
```

We then stop reading with `Ctrl+C`, without stopping the container.

Beyond seeing the logs in real-time, we can also export a portion for a more detailed diagnosis:

```shell
$ docker compose logs --no-color --timestamps --since 9m app > logs.txt
```

This way, Docker will extract the logs from the last 9 minutes of the `app` service and save them in a file on our
host.

***

> __write logs where Docker can collect them__
>
> - stderr for diagnostics
> - stdout for regular events
> - structured fields when useful

If an application writes its logs only to files, Docker won't be able to read them automatically. Where possible,
configure the application to write to standard streams, or set up a specific log collection.

Not all messages on standard error indicate a failure, and not all those on standard output indicate success. The
meaning depends on the application, not the chosen stream.

For real-world apps, structured messages like JSON with level, event, and request ID are handy. We avoid adding full
request bodies or personal data when just a few essential fields are needed. Also, watch out for tokens, passwords,
and connection strings that should never end up in logs.

During a diagnosis, we can temporarily increase the log detail level to observe the service's behavior more closely.
This choice produces more messages and may expose sensitive information, so we should activate it only for the
necessary time and revert to the usual level at the end.

***

A service that keeps writing can easily fill up the disk.

So let's add this fragment to our `app`:

```yaml
[...]
logging:
  driver: local
  options:
    max-size: "9m"
    max-file: "3"
```

With this setup, Docker uses the `local` driver to store logs on the host's disk with rotation and compression.

We can choose the maximum log file size and the number of files, in this example, three files each 9 MB. When
rotating, the driver will remove the oldest files, ensuring we always have the most recent records available.

Restart the stack:

```shell
$ docker compose up -d
$ 
```
```terminaloutput
[+] up 1/1
 ✔ Container logs-app-1 Started                                                                                     0.2s
```

And let's verify the options applied:

```shell
$ docker inspect $(docker compose ps -q app) --format '{{json .HostConfig.LogConfig}}' | jq
```
```json
{
  "Type": "local",
  "Config": {
    "max-file": "3",
    "max-size": "9m"
  }
}
```

The log sizes apply to each container, so if a service has multiple replicas, each one will have its own three log
files.

Once the tests are done, stop the stack with:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container logs-app-1 Removed                                                                                     0.1s
 ✔ Network logs_default Removed                                                                                     0.1s
```

***

> __plan collection and failure behavior__
>
> - local logs follow container lifecycle
> - central collection needs its own retention
> - buffering can lose messages

Service logs are handy for quickly checking on a service, but they don't make for a historical archive. Log rotation
progressively removes older messages, and when we remove a container, we can lose access to its local logs. If we
need them for a diagnosis, let's collect them before the container is removed.

When we need to keep messages for longer or look for events from multiple stacks, we can use a centralized log
collection system. This destination will also require space and rules—deciding how long to retain the data, who can
access it, and how to protect it. The ability to read the messages again with the `logs` command depends on the
chosen driver and any local cache, so make sure to check it when we change the configuration.

We also need to consider what happens if the log destination slows down or becomes unreachable. If log writing isn't
asynchronous, the writer can be slowed down; with asynchronous writing, passing through a buffer of limited size, if
logs accumulate and fill it up, they could be lost. The choice depends on how important it is to preserve every
message and how much the service can tolerate any slowdowns.

***

> Resources
>
> - [Docker logging drivers](https://docs.docker.com/engine/logging/configure/)
> - [busybox](https://hub.docker.com/_/busybox)

[Continue](../49-metrics-alerts/README.md) to the next chapter.
