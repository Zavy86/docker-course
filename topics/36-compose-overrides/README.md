# Compose overrides

> __multiple Compose files and environments__
>
> - a shared base
> - small differences
> - one resulting configuration

If we were to use the same stack in different environments, we'd likely need to adapt part of the configuration
depending on where we're deploying it. We could start by making a copy of our existing configuration for each
environment and then tweak what's necessary. At first, this would be a simple way to get what we need, especially if
the differences are minimal.

The problem would arise if we needed to change something that applies to all environments. In that case, we'd have
to make the same modification in every copy, taking into account the specific settings we've added meanwhile. If we
forget to update one, the stack in that environment would continue to use the old configuration, and over time, it
would become harder to understand which changes we introduced intentionally.

With Compose, we can gather everything that all environments have in common in a base file and use override files to
describe only the differences. When something changes that affects all environments, we just need to update the
shared file. This way, every environment starts from the same, up-to-date base.

When we choose the environment in which to start the stack, Compose reads the base and any override files we
indicate, and combines them into a single configuration that Compose will use to start the stack.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/overrides
```

Let's look at the `compose.yaml` file.

```yaml
services:
  web:
    image: nginx
    environment:
      MESSAGE: "Common configuration"
      COLOR: "blue"
```

The two environment variables will help us observe the result of the merge. They are just for demonstration and
don't change Nginx's behavior. Also, as you can see in the base configuration, we haven't published any ports.

Now let's look at the file `compose.override.yaml`:

```yaml
services:
  web:
    ports:
      - "8080:80"
    environment:
      MESSAGE: "Development environment"
```

When we don't specify any files, Compose normally reads `compose.yaml` and, if present, `compose.override.yaml`.

Let's look at the result of the configuration without starting anything with the command:

```shell
$ docker compose config
```
```terminaloutput
services:
  web:
    environment:
      COLOR: blue
      MESSAGE: Development environment
    image: nginx
    networks:
      default: null
    ports:
      - mode: ingress
        target: 80
        published: "8080"
        protocol: tcp
networks:
  default:
    name: compose-overrides_default
```

As we see, the service uses the `nginx` image, receives port `8080`, and has `MESSAGE` set to
`Development environment`, while `COLOR` remains set to `blue` because it wasn't overridden; it just wasn't removed
because it wasn't specified in the override file.

Let's pay attention to the fact that the service name must always be the same, in this case `web`. If we had named
it `web-dev`, we would have added a new service without modifying the original one.

***

Now, as we can see, the directory also contains the file `compose.test.yaml`:

```yaml
services:
  web:
    ports:
      - "8081:80"
    environment:
      MESSAGE: "Test environment"
```

To use it, this time we'll choose the files explicitly, using the `-f` option multiple times:

```shell
$ docker compose -f compose.yaml -f compose.test.yaml config
```
```terminaloutput
services:
  web:
    environment:
      COLOR: blue
      MESSAGE: Test environment
    image: nginx
    networks:
      default: null
    ports:
      - mode: ingress
        target: 80
        published: "8081"
        protocol: tcp
networks:
  default:
    name: compose-overrides_default
```

Compose starts by taking the base configuration and applies the changes present in the test file.

If the files were in different directories, relative paths inside them, such as bind mount paths or build contexts,
would still be resolved relative to the first file passed with `-f`. They don't become relative to each override's
directory, so let's always check the paths in the model returned by `config`.

We'll find port `8081`, not the development port, and the custom message for the test environment.

We can pass more than two files too, and we always pay attention to the order in which we pass them.

For the values that get overridden, the later file always takes precedence, but for other fields, as we'll see in
more detail soon, the entries can combine without issues.

Compose overrides can be incomplete on their own, for example, in our two cases, we haven't even specified an image.
So it needs to be validated alongside the base stack, not as if it were an independent stack.

The command:

```shell
docker compose -f compose.test.yaml config
```
```terminaloutput
service "web" has neither an image nor a build context specified: invalid compose project
```

It would rightfully return an error.

***

If we want to test development and testing configurations simultaneously on the same host, we can do this by using
different project names.

We can start the development stack with:

```shell
$ docker compose -p dev up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network dev_default Created                                                                                      0.1s
 ✔ Container dev-web-1 Started                                                                                      0.2s
```

And for testing, use:

```shell
$ docker compose -p test -f compose.yaml -f compose.test.yaml up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network test_default Created                                                                                     0.1s
 ✔ Container test-web-1 Started                                                                                     0.2s
```

Opening then in the browser the ports `8080` and `8081`, we'll see that both will display the Nginx welcome page.

To see the difference in the variables:

```shell
$ docker compose -p dev exec web printenv MESSAGE
```
```terminaloutput
Development environment
```
```shell
$ docker compose -p test -f compose.yaml -f compose.test.yaml exec web printenv MESSAGE
```
```terminaloutput
Test environment
```

Let's remove both stacks with:

```shell
$ docker compose -p dev down
$ docker compose -p test -f compose.yaml -f compose.test.yaml down
```

***

> __how Compose merges files__
>
> - scalars are replaced
> - mappings are merged
> - lists need attention

When it comes to overrides, there are three behaviors you need to recognize and keep in mind.

A single value, like `image` or `restart`, is overridden by the one in the subsequent file.

The maps, like our `environment`, preserve unchanged keys and update repeated ones.

Lists, on the other hand, can accumulate elements: we don't assume that the last list overrides the previous ones.

Let's look at it with our usual example.

***

If we start the stack including all the files:

```shell
$ docker compose -f compose.yaml -f compose.override.yaml -f compose.test.yaml up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network compose-overrides_default Created                                                                        0.1s
 ✔ Container compose-overrides-web-1 Started                                                                        0.2s
```

Let's do a check:

```shell
$ docker compose ps
```
```terminaloutput
NAME                      IMAGE     COMMAND                  SERVICE   [...]   PORTS
compose-overrides-web-1   nginx     "/docker-entrypoint.…"   web       [...]   0.0.0.0:8080->80/tcp, 0.0.0.0:8081->80/tcp
```

We'll see that the service will be exposed on **both ports**, `8080` and `8081`!

While the variable `MESSAGE` is different:

```shell
$ docker compose -f compose.yaml -f compose.override.yaml -f compose.test.yaml exec web printenv MESSAGE
```
```terminaloutput
Test environment
```

It will have the value of the test.

To remove the stack, let's run the command with the same files:

```shell
$ docker compose -f compose.yaml -f compose.override.yaml -f compose.test.yaml down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-overrides-web-1 Removed                                                                        0.3s
 ✔ Network compose-overrides_default Removed                                                                        0.1s
```

For `volumes`, `configs` and `secrets` mounts, Compose uses the destination path inside the container. An entry with
the same target merges with the earlier entry, while a different target adds a mount.

There's an important exception to the list rule: `command` and `entrypoint` are always replaced, never concatenated.

The same goes for the `test` within the `healthcheck` map, which we'll dive into in the dedicated chapter.

***

If we wanted to replace all the ports already defined, going against the default behavior, we would specify the
`!override` option in the file, as shown in `compose.replace.yaml`:

```yaml
services:
  web:
    ports: !override
      - "8082:80"
```

Align it with the files already concatenated:

```shell
$ docker compose -f compose.yaml -f compose.override.yaml -f compose.test.yaml -f compose.replace.yaml config
```
```terminaloutput
name: compose-overrides
services:
  web:
    environment:
      COLOR: blue
      MESSAGE: Test environment
    image: nginx
    networks:
      default: null
    ports:
      - mode: ingress
        target: 80
        published: "8082"
        protocol: tcp
networks:
  default:
    name: compose-overrides_default
```

As we can see in this case, only port `8082` will be present, and not the other two.

To completely remove a value, we can instead use the `!reset` option, as shown in the `compose.reset.yaml` file:

```yaml
services:
  web:
    ports: !reset []
```

As we'll see when we run the configuration interpretation:

```shell
$ docker compose -f compose.yaml -f compose.override.yaml -f compose.reset.yaml config
```
```terminaloutput
name: compose-overrides
services:
  web:
    environment:
      COLOR: blue
      MESSAGE: Development environment
    image: nginx
    networks:
      default: null
networks:
  default:
    name: compose-overrides_default
```

In the result, there won't be any published ports. Be careful, an empty `ports: []` list without the `!reset` tag
doesn't delete the previous ports!

***

> Resources:
>
> - [Merge Compose files](https://docs.docker.com/reference/compose-file/merge/)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../37-reusing-configuration/README.md) to the next chapter.
