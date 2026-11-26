# Troubleshooting stacks

> __collect evidence before changing things__
>
> - identify the target
> - change one thing at a time
> - inspect configuration and state

When an application stops responding, it's not always immediately clear where the problem lies. The container might
have stopped, a dependent service might not be ready, or due to an update, an application might be listening on a
different port than expected. From the outside, the result looks the same in each case, but each situation requires
a different intervention.

The temptation is to restart everything or delete some resources to start from a clean slate. But restarting can
temporarily hide the symptom without helping us understand its cause, while a clean-up might erase data we would
need to reconstruct what happened.

If the problem recurs, we risk ending up right back where we started.

To get out of it, we need a method that guides us from the symptom to the cause. We could start by checking the
configuration and the state of the services, read the logs, and compare what we observe with the expected behavior.
These details help us form a hypothesis and choose a targeted modification.

Every change we come up with should be tested one at a time, repeating the verification each time to see if the fix
had the intended effect or not.

In this chapter, we'll see how to investigate the cause of a problem.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/troubleshooting
```

And let's verify the stack configuration:

```shell
$ docker compose config
```
```terminaloutput
name: troubleshooting
services:
  client:
    command:
      - sh
      - -c
      - |
        while true; do
          wget -T 2 -q -O - http://web:8081 || echo "Request failed"
          sleep 5
        done
    image: busybox
    init: true
    networks:
      default: null
  web:
    command:
      - sh
      - -ec
      - |
        mkdir -p /www
        echo "Service available" > /www/index.html
        exec httpd -f -p 8080 -h /www
    image: busybox
    networks:
      default: null
networks:
  default:
    name: troubleshooting_default
```

Start the stack if it's not already running (obviously, in a production context, it will already be running):

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 3/3
 ✔ Network troubleshooting_default    Created                                                                       0.0s
 ✔ Container troubleshooting-web-1    Started                                                                       0.1s
 ✔ Container troubleshooting-client-1 Started                                                                       0.1s
```

And we find out the details of the stack with:

```shell
$ docker compose ls
```
```terminaloutput
NAME                STATUS              CONFIG FILES
troubleshooting     running(2)          /Users/Zavy/Repositories/docker/sources/compose/troubleshooting/compose.yaml
```

And the detail of the containers with:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME                       IMAGE     COMMAND                  SERVICE   CREATED              STATUS
troubleshooting-client-1   busybox   "sh -c 'while true; …"   client    About a minute ago   Up About a minute   
troubleshooting-web-1      busybox   "sh -ec 'mkdir -p /w…"   web       About a minute ago   Up About a minute  
```

Let's also pay attention to any additional parameters used when starting the stack. Any `--env-file`, `-f`, or `-p`
flags should be kept identical. For this reason, I usually prepare Makefiles to ensure I'm diagnosing the exact
model distributed.

So let's go and view the client logs to better understand what's happening:

```shell
$ docker compose logs --tail 9 --timestamps client
```
```terminaloutput
client-1  | 2026-11-14T09:24:36.956208800Z wget: can't connect to remote host (172.19.0.2): Connection refused
client-1  | 2026-11-14T09:24:36.956370300Z Request failed
client-1  | 2026-11-14T09:24:41.962772844Z wget: can't connect to remote host (172.19.0.2): Connection refused
client-1  | 2026-11-14T09:24:41.963008885Z Request failed
client-1  | 2026-11-14T09:24:46.971715013Z wget: can't connect to remote host (172.19.0.2): Connection refused
client-1  | 2026-11-14T09:24:46.971930971Z Request failed
client-1  | 2026-11-14T09:24:51.976441793Z wget: can't connect to remote host (172.19.0.2): Connection refused
client-1  | 2026-11-14T09:24:51.977356126Z Request failed
client-1  | 2026-11-14T09:24:56.986025003Z wget: can't connect to remote host (172.19.0.2): Connection refused
client-1  | 2026-11-14T09:24:56.986172795Z Request failed
```

Even though we've seen in previous checks that the model is valid and the containers can be `running`, the requests
are still failing.

Since we haven't yet seen evidence of a Docker issue, let's try simulating the client's behavior:

```shell
$ docker compose exec client nslookup web
```
```terminaloutput
Server:         127.0.0.11
Address:        127.0.0.11:53
Non-authoritative answer:
Name:    web
Address: 172.19.0.2
```

How can we see if hostname resolution is working correctly, so let's try to download the page:

```shell
$ docker compose exec client wget -T 2 -O - http://web:8080
```
```terminaloutput
Connecting to web:8080 (172.19.0.2:8080)
100% |****************************************************|    18  0:00:00 ETA
writing to stdout

Service available
```

We're getting the expected result with this second command too, so what's happening then?

Let's go back to check the `compose.yaml` file:

```shell
$ nano compose.yaml
```

If we look closely, the server is correctly exposing the service on port `8080`, but our client is trying to connect
to port `8081`. So, we need to go ahead and correct the client command, and then recreate the stack.

```shell
$ docker compose up -d client
```
```terminaloutput
[+] up 1/1
 ✔ Container troubleshooting-client-1 Started                                                                       0.1s
```

Let's check the logs again:

```shell
$ docker compose logs --tail 9 --timestamps client
```
```terminaloutput
client-1  | 2026-11-14T09:37:25.304351044Z Service available
client-1  | 2026-11-14T09:37:30.311207838Z Service available
client-1  | 2026-11-14T09:37:35.318069382Z Service available
client-1  | 2026-11-14T09:37:40.323190843Z Service available
client-1  | 2026-11-14T09:37:45.331062970Z Service available
client-1  | 2026-11-14T09:37:50.334784958Z Service available
client-1  | 2026-11-14T09:37:55.341112377Z Service available
client-1  | 2026-11-14T09:38:00.344881880Z Service available
client-1  | 2026-11-14T09:38:05.353587841Z Service available
```

And now we can see that everything is working correctly again.

We then destroy the stack with the usual command:

```shell
$ docker compose down
```
```terminaloutput
[+] down 3/3
 ✔ Container troubleshooting-client-1 Removed                                                                       0.1s
 ✔ Container troubleshooting-web-1    Removed                                                                       3.1s
 ✔ Network troubleshooting_default    Removed                                                                       0.1s
```

In this example, we identified a precise difference, applied and verified the fix by acting only on the client,
without deleting networks, images, or volumes.

***

> __investigate container startup failures__
>
> - read Compose error messages
> - check images and required resources
> - inspect exit codes and application logs

The example of the wrong port shows how useful it is to understand where the stack breaks down. We can apply the
same reasoning to other issues, choosing our checks based on what we observe, rather than making changes without a
specific hypothesis.

If the container isn't even created, we start by looking at the error message returned by Compose. We might find out
that the image isn't available, that we don't have the authorization to pull it from the registry, or that an
external network or a host path is missing. An image built for an incompatible architecture can also prevent the
process from starting. So, a valid YAML file doesn't guarantee that the service will start on our specific host.

When the container is created but the process exits, we can start with the command `ps -a` to see the stopped
containers as well and then read the logs of the involved service. Gathering the container's state, the exit code,
and the application's messages helps us piece together what happened. A single piece of data can be ambiguous; for
example, an error code `137` by itself doesn't prove that memory was actually exhausted.

***

> __check health and service communication__
>
> - inspect failing healthchecks
> - verify name resolution and connections
> - interpret HTTP responses

We might also find a service marked as `unhealthy` while its process is still active. In this case, it's the health
check that's failing, so we read the output of its attempts and try to run the same check manually to verify its
existence. This helps us understand if the application isn't really ready or if the health check itself is
misconfigured. If the application needs more time to be ready, we might add a pause.

If the issue is about communication between services, we need to distinguish between resolving the name and
establishing the connection. When the name isn't resolving, make sure the services share the intended network and
that the name or alias used is correct. If the name resolves but the connection is refused, then check the port and
the address on which the process is listening.

Remember that `localhost`, inside a container, refers to the container itself and not a service on the host.

We receive an HTTP response, which takes us to the next step in the diagnosis. If we get an error like `401`, `403`,
or `404`, we've reached an HTTP server, even if it might be a proxy or a different service than expected. So, we can
check the credentials, the requested path, the hostname, and the app or proxy configuration using the response we
received to guide our investigation.

***

> __use debug tools and inspect mounts__
>
> - use temporary diagnostic tools
> - verify mount sources and destinations
> - check ownership and permissions

During these checks, we might also notice that the image doesn't contain a shell, `curl`, or tools to verify DNS.
This is a common situation with minimal images. To proceed, we could then use a temporary diagnostic service,
connected to the relevant network, choosing a reliable image and assigning it only the necessary privileges. This
way, we'll have the useful tools without having to modify the container we're examining.

Or if we really want to modify the container by installing the necessary tools, it would be good practice to remove
the updated container once we're done and restart the stack with the officially distributed container.

If we notice an error due to a missing or non-writable file, we should check what the container has actually mounted
internally. Verify the source of the mount, the destination, whether it's read-only, and the UID/GID. A volume
mounted on a directory can also hide the image's default files.

We don't escalate a permission issue into an unrestricted access to the entire filesystem. We correct the expected
path and owner, after we've verified which data we're modifying and where they reside.

***

> __a full disk needs an inventory__
>
> - distinguish data, images, logs and cache
> - project cleanup is not daemon cleanup
> - preserve recovery material

When disk space runs out, a stack might stop working even if its configuration hasn't changed. The temptation might
be to delete images, containers, or volumes right away to free up space, but without knowing what's consuming it,
you risk deleting useful data and leaving the root cause of the problem unresolved.

To get started, we begin with an inventory, distinguishing the space occupied by images, containers, volumes, logs,
and build cache. We also check the host filesystem and the paths used by bind mounts, because the space used by
Docker resources doesn't necessarily tell the whole story.

Once you've identified what's taking up space, we need to figure out what we can actually get rid of. An unused
volume from an active container might still hold application data, while a previous private image could be useful
for rolling back to a working version. Even the build cache could be used by other projects running on the same
host. So, the fact that a resource isn't in use at the moment doesn't mean it's safe to sacrifice.

Before proceeding with a cleanup, we should first identify which resources will be involved and ensure we have the
necessary backups to recover any data we want to preserve. General cleanup operations can affect multiple projects
managed by the same daemon, regardless of the directory we're in. We always prefer a targeted intervention, then
check the recovered space and the application's behavior to verify that the issue has actually been resolved.

A good diagnosis produces a verifiable cause and a targeted fix.

***

> Resources
>
> - [Inspecting Docker objects](https://docs.docker.com/reference/cli/docker/inspect/)
> - [busybox](https://hub.docker.com/_/busybox)

[Continue](../51-remote-deployment/README.md) to the next chapter.
