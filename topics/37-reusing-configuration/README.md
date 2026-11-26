# Reusing configuration

> __reusing configuration__
>
> - write shared values once
> - keep differences visible
> - choose one tool at a time

If we had to configure several services with settings in common, it would feel natural to write those settings in
the first service definition and then copy them into the others. At first, that might seem like a simple approach,
especially if there were only a few shared settings.

The issue arises when we need to change one of those settings. At that point, we'd have to find all the copies and
update them one by one. If we missed even one, over time it would become hard to distinguish which changes were
intentional and which were left in by accident.

Instead, we can define once and for all what the services have in common and reuse it wherever needed, highlighting
the specific settings of each service. How we do this depends on how much we want to reuse. Sometimes it will be
enough to share a few settings, while other times it will be more useful to start from the definition of a service
or keep an entire part of the stack in a separate file.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/reuse
```

Let's look at the `compose.yaml` file.

```yaml
x-environment: &shared
  DEMO_COLOR: "blue"
  DEMO_SIZE: "small"

services:
  first:
    image: alpine
    environment: *shared
    command: [ "printenv", "DEMO_COLOR", "DEMO_SIZE" ]
  second:
    image: alpine
    environment: *shared
    command: [ "printenv", "DEMO_COLOR", "DEMO_SIZE" ]
```

Here the `&` symbol gives a YAML value a name. This is called an **anchor**, and we can refer back to it with `*`,
as we do here with `*shared`.

I chose the name `shared`, but you can pick any name you like, as long as there are no spaces.

The `x-environment` parameter, on the other hand, is an extension field of Compose.

The prefix `x-` allows us to include a fragment without declaring a service, so no container named `x-environment`
will be created. The field itself doesn't do anything; it's the references inside `services` that use its content.

Anchor and alias belong to YAML, while the prefix `x-` belongs to Compose.

We can also define an anchor directly on a value within a service, but keeping it separate makes it clearer that
these are shared settings.

Let's check the result:

```shell
$ docker compose run --rm first
```
```terminaloutput
[+] run 1/1
 ✔ Network compose-reuse_default Created                                                                            0.0s
Image alpine Pulling 
Image alpine Pulled 
Container compose-reuse-first-run-cda52adbd57b Creating 
Container compose-reuse-first-run-cda52adbd57b Created 
blue
small
```

```shell
$ docker compose run --rm second
```
```terminaloutput
Container compose-reuse-second-run-9228d410fcef Creating 
Container compose-reuse-second-run-9228d410fcef Created 
blue
small
```

We can see that both commands print `blue` and `small` on two separate lines.

***

> __merging YAML mappings__
>
> - use a shared mapping as the starting point
> - override individual values in each service
> - replace nested values as a whole

After showing how to reuse the same block in multiple services, let's take it a step further. If one of those
services needed a different value, we could use the shared block as a starting point and only write the setting we
want to customize in the service's definition.

This is where the YAML merge comes into play. Common settings are picked up from the shared map. If we write a key
again in the service map, the value we wrote there applies to that key. All other settings continue to come from the
common base, so we can update them in just one place.

The merge works on the keys at that level. If the value of a key is itself a map and we redefine it in the service,
that entire map gets replaced.

***

If we wanted to change only the color of the second service, we could replace the `environment` block with this
snippet, keeping the rest of the file unchanged:

```yaml
  second:
    image: alpine
    environment:
      <<: *shared
      DEMO_COLOR: "red"
    command: [ "printenv", "DEMO_COLOR", "DEMO_SIZE" ]
```

Using the double chevrons `<<`, you insert the keys for the shared map, and the value explicitly written in the
service takes precedence and overrides it. In this case, `DEMO_COLOR` will become `red`, while `DEMO_SIZE` will
remain `small`.

```shell
$ docker compose run --rm second
```
```terminaloutput
Container compose-reuse-second-run-c0feb6bce6f0 Creating 
Container compose-reuse-second-run-c0feb6bce6f0 Created 
red
small
```

After verifying, we definitively remove this stack with:

```shell
$ docker compose down
```
```terminaloutput
[+] down 1/1
 ✔ Network compose-reuse_default Removed                                                                            0.1s
```

We can therefore change a value in the second service without altering those in the first thanks to the merge YAML,
which applies only to **maps** and treats lists as integer values.

Anchors are defined in the YAML document where they are declared. An anchor in one file doesn't become available in
another file passed with `-f`. Anchors are resolved before variable interpolation, so you can use variables in
shared values, but you can't use the variable interpolation syntax `${...}` to construct the anchor name.

***

> __reusing a service with extends__
>
> - reuse one service definition
> - customize the inherited values
> - declare required resources

If we were to reuse almost all the configuration of a service, we could gather the common settings into multiple
shared blocks. However, with many blocks to combine, it would become difficult to reconstruct the service's
configuration.

In this case, we can base our new service definition on an existing service, even if it's defined in a different
file. In the new service's definition, we indicate which service to start and write the modifications we need. This
way, we can gather all the common settings in the starting definition and immediately see what we've customized.

We still need to account for the resources that the service depends on. If the original definition references shared
resources, we must ensure those are declared in the stack where we're reusing the configuration.

***

To reuse the definition of a service from another file, we can use the `extends` instruction.

Let's try this **alternative** by moving from the `reuse` directory to `extends`:

```shell
$ cd ../extends
```

And analyzing the `common.yaml` file:

```yaml
services:
  base:
    image: alpine
    environment:
      DEMO_COLOR: "blue"
      DEMO_SIZE: "small"
    command: ["printenv", "DEMO_COLOR", "DEMO_SIZE"]
```

And the file `compose.yaml`:

```yaml
services:
  demo:
    extends:
      file: common.yaml
      service: base
    environment:
      DEMO_COLOR: "green"
```

In this case, Compose takes the configuration from `base` and combines it with the configuration for the `demo`
service.

Compose is bringing everything together, in the `environment` map it keeps `DEMO_SIZE` and updates the color.

```shell
$ docker compose run --rm demo
```
```terminaloutput
[+] run 1/1
 ✔ Network compose-extends_default Created                                                                          0.0s
Container compose-extends-demo-run-b6b6cd02305e Creating 
Container compose-extends-demo-run-b6b6cd02305e Created 
green
small
```

We can see that the model only contains `demo`, which prints `green` and `small`.

While the `base` service in the external file is not added automatically to the stack.

If instead we extend a service declared in the same file, that service remains part of the model and doesn't become
an abstract model.

The `extends` instruction doesn't automatically import all the necessary resources.

If the inherited service uses a network, a named volume, or a secret, we need to declare it in the model that uses
it. The same goes for any other services that are required through `depends_on`.

Let's still be very careful and try to avoid creating circular chains of extensions.

For any doubts, let's remember that we can always read the result with the command `docker compose config`.

Finally, we can remove the stack with:

```shell
$ docker compose down
```
```terminaloutput
[+] down 1/1
 ✔ Network compose-reuse_default Removed                                                                            0.1s
```

***

> __combining modules with include__
>
> - preserve local paths
> - compose complete modules
> - avoid resource name conflicts

If we were to organize a stack made up of multiple parts, we could describe all of them in the same file. However,
over time, it would become difficult to understand which services and resources belong to each part, especially if
we wanted to find them to make a change or reuse them in another project.

So we can gather the services and resources from each part into a dedicated Compose file and specify in the main
file which configurations we want to include. Each included file keeps its directory as a reference for relative
paths. This way, we can keep the configuration for a part of the stack and the files it depends on all together.

When Compose brings everything together, the services and resources converge into the same project. So we need to be
careful about the names we use in different files, to avoid conflicts when we include them in the same stack.

***

So let's move into the `include` directory and take a look at the structure:

```shell
$ cd ../include
```

```shell
$ tree
```
```terminaloutput
.include/
├── compose.yaml
└── tools/
    ├── compose.yaml
    └── demo.env
```

Let's look at the content of the various files:

```shell
$ cat compose.yaml
```
```yaml
include:
  - ./tools/compose.yaml

services:
  web:
    image: nginx
```

In the main file, we have two parts. In the first part, another Compose file is included, while in the second part,
a service called `web` is declared, based on the `nginx` image.

```shell
$ cat tools/compose.yaml
```
```yaml
services:
  inspect:
    image: alpine
    env_file: ./demo.env
    command: [ "printenv", "MESSAGE" ]
```

In the `tools` directory file, we find a second service called `inspect`, which uses the `alpine` image.

This service loads the variables from the `demo.env` file in the same directory and then runs a command that prints
the value of the `MESSAGE` variable.

```shell
$ cat tools/demo.env
```
```dotenv
MESSAGE=Tools module configuration
```

The `demo.env` file, in the end, contains the variable used by the `inspect` service.

So let's launch this stack and see what happens:

```shell
$ docker compose up
```
```terminaloutput
[+] up 13/13
 ✔ Image nginx                         Pulled                                                                       3.0s
 ✔ Network compose-include_default     Created                                                                      0.0s
 ✔ Container compose-include-web-1     Created                                                                      0.2s
 ✔ Container compose-include-inspect-1 Created                                                                      0.2s
Attaching to inspect-1, web-1
web-1  | /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
web-1  | /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
web-1  | 10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
web-1  | 10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf
web-1  | /docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
web-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
web-1  | 2026/11/01 08:58:55 [notice] 1#1: using the "epoll" event method
web-1  | 2026/11/01 08:58:55 [notice] 1#1: nginx/1.31.8
web-1  | 2026/11/01 08:58:55 [notice] 1#1: built by gcc 14.2.0 (Debian 14.2.0-19) 
web-1  | 2026/11/01 08:58:55 [notice] 1#1: OS: Linux 7.0.14-linuxkit
web-1  | 2026/11/01 08:58:55 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1048576:1048576
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker processes
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 29
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 30
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 31
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 32
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 33
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 34
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 35
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 36
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 37
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 38
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 39
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 40
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 41
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 42
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 43
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 44
inspect-1  | Tools module configuration
inspect-1 exited with code 0                                                                                  
Gracefully Stopping... press Ctrl+C again to force
Container compose-include-inspect-1 Stopping 
Container compose-include-web-1 Stopping 
Container compose-include-inspect-1 Stopped
```

At the start, we'll see the logs from the `web` container followed by the message printed by `inspect`.

As we can see, the path `./demo.env` is resolved from the `tools` directory, not from the main file directory.

Each file included keeps its own directory reference, then its definitions enter **the same project**, so we don't
get stacks with independent lifecycles.

We hit `CTRL + C` to close and stop the stack with:

```shell
$ docker compose down
```
```terminaloutput
[+] down 3/3
 ✔ Container compose-include-web-1     Removed                                                                      0.1s
 ✔ Container compose-include-inspect-1 Removed                                                                      0.0s
 ✔ Network compose-include_default     Removed                                                                      0.1s
```

***

> __choosing a reuse mechanism__
>
> - fragments: anchors and x-
> - one service: extends
> - complete modules: include
> - environment changes: overrides

At this point, we have several tools available, but they're not automatically interchangeable.

If we need to reuse a few settings in the same file, the anchors with the `x-` prefix are often the simplest choice.

If we want to start from a ready-made service definition, we can consider `extends`.

When a part of the stack makes sense as a complete module, with its own services and support files, then `include`
becomes the most suitable format.

For variations between environments or different runs, the additional Compose files passed with the `-f` option at
startup are still very useful.

The practical rule is to choose the simplest mechanism that solves the problem without making the configuration
harder to understand. Reusing isn't about hiding everything; it's about reducing duplication where it truly brings a
benefit, while keeping it clear where the values come from and what the final model will look like.

For that reason, every time we combine more files or more techniques, it's always a good idea to check the result
with the command `docker compose config`, to make sure that the outcome matches your actual needs.

***

> Resources:
>
> - [Compose file reference](https://docs.docker.com/reference/compose-file/)
> - [alpine](https://hub.docker.com/_/alpine)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../38-compose-profiles/README.md) to the next chapter.
