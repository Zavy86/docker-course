# Compose file syntax

> __Compose file syntax__
>
> - YAML
> - indentation
> - keys and values

In the [previous chapter](../28-understanding-docker-compose/README.md), we saw what Docker Compose can do. We
started a small web server with just five lines of configuration.

Now let's see how to read those lines and change them without having to guess.

Docker Compose configuration files use **YAML**. We don't have to write functions or algorithms as we would in a
programming language. We organize our settings in a structure that Compose can read to work out what to do.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the directory from the previous example.

```shell
$ cd docker-course/sources/compose/syntax
```

Let's look at `compose.yaml` again.

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

The first thing we'll notice is that some lines start farther to the right than others. Those leading spaces (use
spaces, not tabs) are called **indentation**. They make the file easier to read and tell us which elements belong
together and where they sit in the hierarchy.

Under `services` we find `web`, and under `web` we find `image` and `ports`. That tells us that the image and ports
are settings for the `web` service alone.

***

> __mappings and indentation__
>
> - indentation
> - mappings
> - nested values
> - unique keys

In our examples we'll use **two spaces per level**. Most editors let us configure the Tab key to insert the number
of spaces we prefer. Two, three or four spaces will work as long as we're consistent.

A **map** is a collection of key-value pairs. Take the third line, `image: nginx`. The key is `image` and its value
is `nginx`. We separate them with a colon followed by a space.

The value can itself be a group of settings. Look at `web:` on the second line. We left the rest of the line empty
and added the properties on the following lines, indented one level further.

***

The value of `services` is also a map. If we wanted two services, we'd write them at the same level.

```yaml
services:
  web:
    image: nginx
  cache:
    image: redis
```

Here we picked the names `web` and `cache`. Compose defines the keys `services` and `image`, so we have to spell
them exactly as shown, including the case.

Both services can have an `image` key because each has its own map. We can't repeat a key within the same map. To
add a service, we put it one level below `services`, alongside the others. We don't add a second `services` section
at the bottom of the file.

```yaml
services:
  web:
    image: nginx
  cache:
    image: redis
  db:
    image: postgres
```

We only made that change to see the structure. Let's undo it, as we only need the `web` service for today's
examples.

***

> __lists and nested mappings__
>
> - lists
> - one item per line
> - mappings inside lists

Under `ports`, the next line starts with a dash. Where `image` had a key-value pair, the dash here introduces an
item in a **list**.

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

When a setting takes several items of the same kind, we can put each on a separate line, starting with a dash and a
space. For example, this snippet would publish two host ports that both forward to the same container port.

```yaml
...
ports:
  - "8080:80"
  - "8081:80"
...
```

This snippet is an alternative to the original `ports` section and still belongs inside the `web` service. As our
files get longer, we'll use snippets like this to focus on the relevant lines without having to show the entire file
each time.

When a setting expects a list, we have to write it as a list even if it only contains one item, as in our original
file.

***

List items can be more than simple values. A list can also contain a map.

Compose, for example, lets us write the port mapping more explicitly.

```yaml
services:
  web:
    image: nginx
    ports:
      - target: 80
        published: 8080
```

Here the dash introduces a list item with two properties. The container port is `target` and the host port is
`published`. The two keys line up because they belong to the same item.

We don't need to learn all the port options yet. For now we just need to recognize that a list can contain simple
values or items with several properties.

Compose determines whether a setting accepts a map, a list or both. YAML gives us the syntax for writing them. To
find out which forms a particular setting accepts, we can look it up in the official Docker Compose documentation.

***

> __scalar values__
>
> - strings
> - quoted values
> - numbers and booleans

So far we've looked mainly at structure. The types of the values also matter.

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

Here `nginx` is a string. We can write simple strings without spaces or special characters like this. For something
more complex, such as the port mapping `8080:80`, we enclose the string in quotes.

Other value types include booleans (written as `true` or `false`) and the special value `null`, which means there is
no value and is distinct from an empty string. An application might also accept other types, such as decimal or
floating-point numbers.

```yaml
...
environment:
  DEMO_ERROR: null
  DEMO_VALUE: "18.9"
  DEMO_ENABLED: "true"
...
```

Take the environment variables we've seen in earlier chapters. In Compose we can pass them to a container in a map
called `environment`.

***

> __comments and quoting__
>
> - comments
> - special characters
> - single and double quotes

As in other languages, we can add comments to a _YAML_ file. We introduce them with `#`. Compose ignores them, but
they help us and anyone reading the configuration later understand why we chose a particular setting.

```yaml
image: nginx # latest will be used
```

If the hash character or another special character is part of the text we want to pass in, we enclose the value in
quotes.

```yaml
environment:
  DEMO_LOG: "# Status: Ready"
```

Without quotes, YAML might interpret those characters as part of its structure or as the start of a comment.

We can use single or double quotes. One distinction worth remembering is that double quotes interpret escape
sequences. For example, `\n` becomes a newline.

```yaml
environment:
  DEMO_ONE_LINE: 'first row\nfirst row'
  DEMO_TWO_LINES: "first row\nsecond row"
```

In the first case the value contains the literal characters `\` and `n`.

***

> __multiline strings__
>
> - multiline strings
> - literal style
> - folded style

For longer text, we don't have to put everything on one line or add lots of `\n` sequences.

We can use `|` and write the text on the following lines, indented one level further.

```yaml
...
environment:
  DEMO_MESSAGE: |
    First message row.
    Second message row.
...
```

This preserves the line breaks. The value is a single multiline string.

With `>` we can spread a long sentence across several lines and have YAML read it as one paragraph.

```yaml
environment:
  DEMO_MESSAGE: >
    This long message is
    written on two lines.

    This is a new paragraph.
```

The line break between those two lines becomes a space. Blank lines let us start a new paragraph.

Both forms normally keep a newline at the end of the text. To remove it, we can add a dash after the symbol, giving
us `|-` or `>-`.

```yaml
...
environment:
  DEMO_MESSAGE: >-
    A single paragraph line
    without a final line break.
...
```

***

Let's return to our example file and validate it again.

```shell
$ docker compose config
```

If the command prints the configuration it read and exits without errors, validation passed. We can add `-q` if we
only want to check the file without printing it.

Now let's deliberately introduce an error. Remove the dash before `target` to get this **intentionally invalid**
structure.

```yaml
services:
  web:
    image: nginx
    ports:
      target: 80
      published: 8080
```

Let's run the check again.

```shell
$ docker compose config
```
```terminaloutput
validating compose.yaml: services.web.ports must be a array
```

The error tells us that `ports` expects a list. Removing the dash turned it into a map.

If we leave out `-q`, we can also see how Compose interprets the configuration.

```shell
$ docker compose config
```
```terminaloutput
name: compose
services:
  web:
    image: nginx
    networks:
      default: null
    ports:
      - mode: ingress
        target: 80
        published: 8080
        protocol: tcp
networks:
  default:
    name: compose_default
```

The output can be longer than our file because Compose expands shorthand and makes some settings explicit. The file
on disk stays as we wrote it. What we see is how Compose interpreted it.

That's useful even when validation passes, since we can check that Compose picked up the values we intended.

A valid configuration still doesn't guarantee that the application will run. An image might not exist, or a port
might already be in use. We'll discover those problems when we try to start the stack.

***

> __reading YAML step by step__
>
> - don't panic
> - take it easy 

If all this seems complicated at first glance, don't worry. It's simpler than it looks.

We don't have to learn all of _YAML_ at once to use Docker Compose.

With maps, lists, values and a little attention to indentation, we already have the tools to understand the files
we'll write in the next chapters.

***

> Resources:
>
> - [YAML](https://yaml.org/)
> - [nginx](https://hub.docker.com/_/nginx)
> - [postgres](https://hub.docker.com/_/postgres)
> - [redis](https://hub.docker.com/_/redis)

[Continue](../30-stack-lifecycle/README.md) to the next chapter.
