# Understanding Docker Compose

> __understanding Docker Compose__
>
> - application stack
> - declarative configuration
> - repeatability

In earlier chapters we learned to build images, start containers, connect them to a network and store data in
volumes. When an application has several parts, we also need to remember how to put them together.

Now imagine moving a web application along with its database. Which images would we use? Where would we keep the
data? How could we reproduce the same setup on the new machine?

**Docker Compose** lets us record those decisions in a file and manage the components of our application together.
We call that collection of components a **stack**.

We first used Docker Compose in [chapter 20](../20-compose-development-stack/README.md) to start a local development
environment. At the time we only touched on how it worked.

Now we'll take a closer look at how Compose works. We'll get into the syntax over the next few chapters.

***

> __reconciling configuration and resources__
>
> - desired configuration
> - existing resources
> - create and update

When we use `docker run`, we pass all the instructions for starting a container _inline_ on the command line.

With Compose, we write down the result we want in a file. For instance, we might want a web server that we can reach
on a particular port.

That's what **declarative configuration** means. We describe what we need and Compose asks the Engine to create the
necessary resources.

Those resources are the containers, networks and volumes we've already worked with.

Saving the file alone doesn't start or change anything. Something has to compare the configuration we've written
with the resources already on the machine and apply it.

That's Compose's job. It creates what's missing, updates what has changed and keeps the resources that already
match.

By default Compose doesn't watch the file and apply each edit as we make it. We ask it to apply the configuration
when we're ready.

***

> __from a Compose file to containers__
>
> - file
> - services
> - images
> - containers

We'll call our file `compose.yaml`. It's a plain text file written in YAML, a format that lets us organize settings
so they're easy to read.

Compose also recognizes other default names, including `docker-compose.yaml` and the variants with the shorter
`.yml` extension. We can choose a different name altogether, in which case we'll need to pass it to `docker compose`
with the `-f` option each time.

Let's look at a small example.

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

We don't need all the rules yet. We're asking for a service called `web`, based on the `nginx` image, with port `80`
in the container reachable on port `8080` on the host.

As we've seen, **Nginx** is a ready-to-use web server. The image includes everything it needs to display a welcome
page.

***

> __resources in a Compose project__
>
> - services
> - networks
> - volumes
> - configs
> - secrets

Alongside the services, we can describe the other resources they need. Let's look at the main sections.

**Networks** (`networks`) let containers communicate. We can get started without defining one ourselves. Compose
creates a default network for each project and connects its services to it automatically.

**Volumes** (`volumes`) keep data independently of the container. For example, we can replace a database container
and keep the data in its volume, as we saw in the [chapter on volumes](../18-understanding-volumes/README.md).

**Configs** (`configs`) provide settings that can change without having to build a new image. For example, we can
give our web server a file with the settings for the site we want to serve.

**Secrets** (`secrets`) hold sensitive information. In our database example, we could supply the administrator's
password as a secret without writing the password itself in the Compose file.

We don't need every section in every file. We'll add resources as we need them and assign them to the services that
use them.

***

> __components of an application stack__
>
> - frontend and backend
> - database and cache
> - workers and broker
> - object storage

What kinds of components can we put together? Let's take a site where users upload photos.

The **frontend** provides the interface users see in their browser. The **backend** exposes the _APIs_ that receive
requests and do the work, such as saving an uploaded photo to a _volume_ and writing its metadata to a **database**.
That's where we might keep users, titles and descriptions.

If people often ask for the same information, we could add a **cache** to keep previously computed results for a
while.

To generate thumbnails without making users wait, we could give the job to a **worker** that runs in the background.
A **broker** could sit between the two. The backend sends it a message describing the job and the worker picks up
the message and processes it.

We could also keep the photos in **object storage** instead of a local volume. The application would then upload and
retrieve files through the storage service's API.

These roles are common in **cloud-native** applications, and we can use them locally on a single host as well.

Docker Compose helps us start those services and organize their networks, addresses and configuration.

***

> __the Compose Specification and compatibility__
>
> - compose specification
> - feature compatibility

The [**Compose Specification**](https://docs.docker.com/reference/compose-file/) defines what goes in the file.
Docker Compose reads the file and applies those rules. We'll run it with the `docker compose` command.

Older examples may use `docker-compose`, with a hyphen. It used to be a separate program. Today we invoke it
directly through the `docker` command.

Some older files also start with a version field, such as `version: "3"`. That field is obsolete. We can leave it
out of new files, and including it doesn't enable any additional features.

***

Let's try our example.

First, let's check that Docker Compose is available.

```shell
$ docker compose version
```

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/syntax
```

Let's look at the `compose.yaml` file.

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

With Docker running, we can check the configuration from this directory.

```shell
$ docker compose config -q
```

The `-q` option stands for _quiet_. If there are no errors, the command prints nothing.

This checks the configuration syntax. We'll still need to run the application to see whether it works.

Let's start the service in the background.

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network compose_default Created                                                                                  0.0s
 ✔ Container compose-web-1 Started                                                                                  0.2s
```

Compose pulls the image if it's missing, creates the project network and starts the web server container. These
resources belong to a **project** whose name normally comes from the directory containing the Compose file.

If we open [http://localhost:8080](http://localhost:8080) in a browser, we'll see the Nginx welcome page.

We can check the status of the project's services with the following command.

```shell
$ docker compose ps
```
```terminaloutput
NAME            IMAGE   COMMAND                  SERVICE   CREATED          STATUS          PORTS
compose-web-1   nginx   "/docker-entrypoint.…"   web       18 seconds ago   Up 18 seconds   0.0.0.0:8080->80/tcp
```

The output shows the `web` service, its image, the container's status and the published port.

If we'd like to see the individual containers that Docker Engine manages, we can use this command.

```shell
$ docker ps
```
```terminaloutput
CONTAINER ID   IMAGE   COMMAND                  CREATED          STATUS          PORTS                  NAMES
16de104b1794   nginx   "/docker-entrypoint.…"   27 seconds ago   Up 27 seconds   0.0.0.0:8080->80/tcp   compose-web-1
```

The same container shows up here because Compose manages containers, networks and volumes through Docker Engine.

If we run `up` again from the same directory without changing anything, Compose keeps the existing container
running. We don't get another web server each time we run the command.

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-web-1 Running
```

When we're done, we can stop and remove the example.

```shell
$ docker compose down
```

In this case Compose removes the container and the project network. Our `compose.yaml` stays where it is and the
image remains available on the host for later use.

By default, `down` **preserves volumes**, so we can use their data again when we need it.

***

> Resources:
>
> - [Docker Compose](https://docs.docker.com/compose/)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../29-compose-file-syntax/README.md) to the next chapter.
