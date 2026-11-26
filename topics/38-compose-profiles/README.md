# Compose profiles

> __selecting optional services__
>
> - one configuration, optional components
> - keep the core services enabled
> - activate tools when needed

When a Compose configuration grows, not all services are equally important at every moment.

Some components are part of the main stack and need to be started almost always, for example, the application, the
database, or a reverse proxy.

Others are useful only in specific situations, like debugging tools, maintenance containers, inspection panels, or
temporary commands.

With **profiles**, we can keep all the configurations in the same Compose file, but decide exactly which services to
activate only when they're needed.

This way, we can avoid commenting and uncommenting configuration blocks, keeping the stack organized and easier to
manage.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/profiles
```

Let's look at the `compose.yaml` file.

```yaml
services:
  web:
    image: nginx
  debug:
    image: alpine
    profiles: [ debug ]
    depends_on:
      - web
    command: [ "sleep", "infinity" ]
  info:
    image: alpine
    profiles: [ debug ]
    command: [ "uname", "-m" ]
```

We can see that the `web` service doesn't have any profile assigned, so it's part of the normal startup.

While the `debug` and `info` services belong to the `debug` profile.

The service name and the profile name match for one of the services, but they are two separate things. A profile is
just a simple label that you can use to group multiple services together. You don't need to have a service with the
same name.

The `debug` service, with the `sleep` command running, stays up so we can run commands inside it.

While the `info` service prints the architecture seen from the container and exits.

Now let's check the available profiles with the command:

```shell
$ docker compose config --profiles
```
```terminaloutput
debug
```

While with the command:

```shell
$ docker compose config --services
```
```terminaloutput
web
```

We can see which services are included in the current configuration. If we don't specify any profile, we only find
`web`.

Let's launch the main stack with the command:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network compose-profiles_default Created                                                                         0.0s
 ✔ Container compose-profiles-web-1 Started                                                                         0.1s
```

As we can see from the log in this case, only the Nginx container was loaded.

***

Now let's activate the debug profile.

First, let's verify the configuration again by passing the additional parameter:

```shell
$ docker compose --profile debug config --services
```
```terminaloutput
web
debug
info
```

In this case, as we can see, we'll activate all three services present in our Compose file.

Start the stack with this profile selected:

```shell
$ docker compose --profile debug up -d
```
```terminaloutput
[+] up 3/3
 ✔ Container compose-profiles-web-1   Started                                                                       0.2s
 ✔ Container compose-profiles-info-1  Started                                                                       0.3s
 ✔ Container compose-profiles-debug-1 Started                                                                       0.2s
```

Let's run a `ps` to check the active containers:

```shell
$ docker compose --profile debug ps -a
```
```terminaloutput
NAME                       IMAGE     COMMAND                  SERVICE   [...]
compose-profiles-debug-1   alpine    "sleep infinity"         debug     [...]
compose-profiles-info-1    alpine    "uname -m"               info      [...]
compose-profiles-web-1     nginx     "/docker-entrypoint.…"   web       [...]
```

And let's check the log for the service `info`:

```shell
$ docker compose --profile debug logs info
```
```terminaloutput
info-1 | aarch64
```

It only includes the printing of the architecture on which the container itself runs.

And then we use the debug container to try downloading the default Nginx landing page:

```shell
$ docker compose exec debug wget -q -O - http://web
```
```terminaloutput
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, nginx is successfully installed and working.
Further configuration is required for the web server, reverse proxy, 
API gateway, load balancer, content cache, or other features.</p>
<p>For online documentation and support please refer to
<a href="https://nginx.org/">nginx.org</a>.<br/>
To engage with the community please visit
<a href="https://community.nginx.org/">community.nginx.org</a>.<br/>
For enterprise grade support, professional services, additional 
security features and capabilities please refer to
<a href="https://f5.com/nginx">f5.com/nginx</a>.</p>
<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

If everything goes well, we'll receive the HTML of the page.

***

In more complex cases, we might need to select multiple profiles simultaneously. In those cases, we can simply
repeat the `--profile` flag multiple times, for example, `--profile debug --profile tools`. Alternatively, we can
set the environment variable `COMPOSE_PROFILES=debug,tools` directly in the console or in a `.env` file.

A service can also belong to several profiles. We list them in the array in the Compose file. The service starts
when **at least one** of those profiles is active, so we don't have to enable both.

Now let's stop the stack with:

```shell
$ docker compose --profile "*" down
```
```terminaloutput
[+] down 4/4
 ✔ Container compose-profiles-info-1  Removed                                                                       0.0s
 ✔ Container compose-profiles-debug-1 Removed                                                                       3.1s
 ✔ Container compose-profiles-web-1   Removed                                                                       0.1s
 ✔ Network compose-profiles_default   Removed                                                                       0.1s
```

With the asterisk, we can stop all defined profiles at once.

And we start only the `debug` service with the command:

```shell
$ docker compose up -d debug
```
```terminaloutput
[+] up 3/3
 ✔ Network compose-profiles_default   Created                                                                       0.0s
 ✔ Container compose-profiles-web-1   Started                                                                       0.1s
 ✔ Container compose-profiles-debug-1 Started                                                                       0.1s
```

As you can see, in this case, the `debug` container and the `web` container have both been started because of their
configuration:

```shell
$ cat compose.yaml
```
```yaml
services:
  [...]
  debug:
    image: alpine
    profiles: [ debug ]
    depends_on:
      - web
    command: [ "sleep", "infinity" ]
  [...]
```

We had specified the dependency, and Compose honored it!

Let's stop everything with:

```shell
$ docker compose --profile "*" down
```
```terminaloutput
[+] down 3/3
 ✔ Container compose-profiles-debug-1 Removed                                                                       2.9s
 ✔ Container compose-profiles-web-1   Removed                                                                       0.1s
 ✔ Network compose-profiles_default   Removed                                                                       0.1s
```

***

> __profiles and dependencies__
>
> - keep required services available
> - validate each combination
> - avoid hidden dependencies

In our example, the direction of the dependency is intentional. The optional `debug` tool requires `web`, not the
other way around. An essential service shouldn't depend on a tool that is typically disabled.

When a dependency involves services assigned to different profiles, activating a profile doesn't automatically
activate the others. Compose only selects the services included in the requested combination, so the configuration
can become invalid if a dependency remains excluded.

In these cases, we need to explicitly define the correct combination, enable the profile that contains the
dependency, or assign related services to a common profile, or leave the service without a profile if it needs to be
always available.

***

> __profiles and project lifecycle__
>
> - select services, not settings
> - keep project identity explicit
> - stop tools explicitly

Profiles act on the selection of services to include and not on the main sections of the configuration like
networks, volumes, configs, and secrets. A profile doesn't change the image, port, or variables of a service; it
only decides whether to include the service or not in the selection.

This means we shouldn't treat them as separate environments. A profile named `debug`, `tools`, or `admin` enables
additional services, but it doesn't automatically transform the stack into a different configuration.

If we need to change settings for a service, like an image, a published port, a mounted volume, or an environment
variable, the best tool remains an override file or an explicit service configuration.

The identity of the project remains the same, with the same project name, Compose continues to work with the same
containers, the same networks, and the same volumes. Activating or deactivating a profile doesn't create a separate
boundary, doesn't isolate data, and doesn't add special protections.

Finally, remember that restarting the stack without specifying a profile doesn't automatically shut down the
optional containers that are already running. Profiles control which services are selected by the current command,
they're not an automatic cleanup system.

If we've started temporary tools, we need to stop them explicitly when we don't need them anymore.

***

> Resources:
>
> - [Using profiles with Compose](https://docs.docker.com/compose/how-tos/profiles/)
> - [alpine](https://hub.docker.com/_/alpine)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../39-service-readiness/README.md) to the next chapter.
