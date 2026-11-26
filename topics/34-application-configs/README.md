# Application configs

> __managing application configuration with configs__
>
> - same image
> - different configuration
> - files instead of variables

If we were to deploy the same application in multiple environments, we might need a different configuration for each
one. If the application reads settings from a file and we include that file in the image, we'd end up with a
different image for each configuration.

This would force us to rebuild the image every time we change a setting, even if the application hasn't changed.
Since the config and the app can change at different times, it's better to be able to update them separately.

With Compose, we can keep the configuration file separate from the image and specify which service to provide it to.
When we start the service, the application finds the file in the path where it expects to read it. This way, we can
use the same image in multiple environments and choose the most suitable configuration for each one.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/configs
```

And let's analyze the `default.conf` file:

```nginx
server {
  listen 80;
  default_type text/plain;
  location / {
    return 200 "Hello by configuration file!\n";
  }
}
```

In this case, we're not dealing with `YAML`, but with Nginx's syntax.

We're asking it to listen on port `80` and respond with a specific phrase, instead of showing the classic welcome
page. For this simple test, we don't need to know any other specific Nginx directives.

In the same directory, you'll also find the `compose.yaml` file:

```yaml
configs:
  web_config:
    file: ./default.conf

services:
  web:
    image: nginx
    ports:
      - "8080:80"
    configs:
      - source: web_config
        target: /etc/nginx/conf.d/default.conf
```

We can see the `configs` entry appear in two places, each with a different job.

At the top section, on the same level as `services`, we're declaring a configuration called `web_config` and
specifying the file to use (the path is always relative to our Compose file).

Inside the `web` section, instead in the `configs` map, we assign that configuration to the service.

With `source`, we choose which configuration to apply (not the file path), and in `target`, we set the path where
the file will be "mounted" inside the container. In this case, we've chosen one of the files that Nginx reads at
startup to load its own configuration.

This mount doesn't overwrite the existing file in the image; it simply hides it without modifying it.

If we added a second Nginx service based on the same image, it wouldn't automatically get the file from `web_config`
but would read the standard version of the file that's present in the image.

Now let's test the configuration using the `-t` parameter of Nginx:

```shell
$ docker compose run --rm web nginx -t
```
```terminaloutput
Container compose-configs-web-run-a1a9ba450963 Creating 
Container compose-configs-web-run-a1a9ba450963 Created 
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
10-listen-on-ipv6-by-default.sh: info: can not modify /etc/nginx/conf.d/default.conf (read-only file system?)
/docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

If the test passes, we'll then proceed with starting the stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-configs-web-1 Started                                                                          0.1s
```

Opening the browser to `http://localhost:8080`, instead of the initial page, we'll find our greeting.

***

Now let's update the greeting in the configuration:

```shell
$ nano default.conf
```
```nginx
server {
  listen 80;
  default_type text/plain;
  location / {
    return 200 "Hello by configuration file updated!\n";
  }
}
```

If we refresh the page in the browser, we won't see our change applied yet. This is because some applications, like
Nginx in this case, require a `reload` to apply changes to their configuration.

So let's proceed with the command:

```shell
$ docker compose up -d --force-recreate web
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-configs-web-1 Started                                                                          0.2s
```

Update the page in the browser and now we should see the new text.

In this case, the image wasn't rebuilt, but the container was replaced.

When we're done, we remove the example resources with:

```shell
$ docker compose down
```
```terminaloutput
[+] down 1/1
 ✔ Network compose-secrets_default Removed                                                                          0.1s
 ✔ Container compose-configs-web-1 Removed                                                                          0.1s
```

***

> __choosing a configuration mechanism__
>
> - environments
> - configs
> - mounts

How do we choose between the options we've seen in these chapters?

I usually go with `environments` if the application accepts a simple variable, like a log level or a single
parameter. If the app reads a structured file, `configs` makes it clear that we're providing configuration and
allows us to write a more comfortable configuration file.

Instead, if I want to share an entire source directory or other host files, I use a bind mount. This lets me share
everything and keep the files synchronized in both directions with a single command.

In our example, we could achieve a similar result with a volume:

```yaml
volumes:
  - ./default.conf:/etc/nginx/conf.d/default.conf:ro
```

***

> __configs and sensitive data__
>
> - readable files
> - implementation limits
> - configuration is not a secret

The full syntax of the mapping also includes `uid`, `gid`, and `mode`, which correspond to the owner, group, and
file permissions.

We always check the permissions of the source compared to the user reading the file in the container to resolve any
access issues.

First of all, always remember that **config does not mean secret**.

We don't put passwords in these files because they can often be committed to Git or, at the very least, the entire
container (each of its processes) is capable of reading them.

***

> Resources:
>
> - [Compose configs](https://docs.docker.com/reference/compose-file/configs/)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../35-managing-secrets/README.md) to the next chapter.
