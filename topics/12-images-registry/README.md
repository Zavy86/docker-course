# Images registry

> __images registry__
>
> - tags
> - registry
> - Docker Hub
> - custom registries

Before talking about registries, let's briefly summarize how tags work.

In Docker, tagging an image is similar to tagging a commit in Git. A tag is a label that points to a specific image ID.
You can add multiple tags to the same image. This tag will then appear as the image name.

An image registry is a service that allows you to store, share, and manage Docker images.

In practice, it is an online (or local) "warehouse" where you can save the images you have created, making them 
available for download and use on other hosts or by other users.

The most well-known and widely used is **Docker Hub**, a public service provided by Docker where you can find all images
maintained by the Docker team and thousands of images created by the community.

Once you create an account, you can also publish your own images!

Besides Docker Hub, there are other public registries such as **GitHub** Container Registry, **Google** Container 
Registry, **Amazon** Elastic Container Registry, etc.

You can also choose to host your own private registry, allowing you to manage images privately and securely, either 
locally on a company server or in the cloud.

The main difference between Docker's official registry and others is in the image naming convention.

For example, if we refer to the `alpine` image, as seen in previous chapters, its full name would actually be 
`docker.io/library/alpine`. In this case, Docker automatically completes the image name by adding the official registry 
and repository name.

When using a custom registry, you must specify the full image name, including the registry address, optional port, and 
repository name, for example: `registry.tld:1234/repository/image`.

Now, let's see in practice how to publish our first image to Docker Hub.

***

In previous chapters, we built our custom image with `figlet` and now we want to make it available to the world. So, 
let's proceed with publishing it to Docker Hub.

To publish on Docker Hub, you first need to create an account.

Go to the [registration page](https://app.docker.com/signup) and fill out the form.

Once you have confirmed your verification email and completed the registration, you need to log in via the CLI.

```shell
$ docker login
```

You will be redirected to the Docker website where you can enter your credentials to access your account.

```terminaloutput
Login Succeeded
```

Next, to publish our first image to a registry, we must first tag it with a name compatible with the target registry.

For example, if we want to use Docker Hub, we need to use the `username/image` syntax. In my case:

```shell
$ docker tag figlet zavy86/figlet
$ docker image ls
```
```terminaloutput
REPOSITORY      TAG        IMAGE ID       CREATED         SIZE
figlet          latest     1e07b8999b54   3 minutes ago   11.8MB
zavy86/figlet   latest     1e07b8999b54   3 minutes ago   11.8MB
```

As we can see from the image list output, we now have two images with the same ID but different names. If we run either 
of these images, the result will be identical.

Now that we have a compatible name, let's proceed with publishing:

```shell
$ docker push zavy86/figlet
```
```terminaloutput
Using default tag: latest
The push refers to repository [docker.io/zavy86/figlet]
942375deb877: Pushed 
0b83d017db6e: Mounted from library/alpine 
latest: digest: sha256:53e7a0d0c352823b573fda0a31be3b50ca942eb5f566a0c4311b9e9363496d2a size: 738
```

Done! Now anyone can run our `zavy86/figlet` image.

As we can see from the log, Docker pushed only the layer containing our image changes, while for the base `alpine` image 
it mounted the already existing online layer.

If we access Docker Hub, within our profile we can see our image, the number of downloads, and build information.

***

> __images registry__
>
> - docker
> - podman
> - gitlab
> - harbor
> - quay

If instead you want to use a private, open source, and self-hosted registry, there are several solutions available, such
as the standard Docker Registry, Podman Registry, GitLab Registry, Harbor, Quay, and others.

Depending on your requirements and environment, it may be appropriate to choose one of these registries.

However, for this tutorial, we will keep things simple and use the standard Docker Registry.

***

Let's start a container with the registry image:

```shell
$ docker run --name registry -d -p 5000:5000 registry:2
```

Done, at this point we can tag and publish images to our private registry.

For example, if we want to distribute our `figlet` image on our registry, we just need to tag it with the URL of our 
private registry (making sure to also specify the port):

```shell
$ docker tag figlet localhost:5000/figlet
```

And finally, perform the push:

```shell
$ docker push localhost:5000/figlet
```
```terminaloutput
Using default tag: latest
The push refers to repository [localhost:5000/figlet]
dfa81dc0debc: Pushed 
0b83d017db6e: Pushed 
latest: digest: sha256:ea4493cea59b9dd95fa888665bd89f79b784175dc9b93e84659078f1362504cb size: 738
```

This solution, as previously mentioned, is not intended to be final or used in production. A secure environment should
be created, managing authentication, exposing the registry over HTTPS using the standard port 443 (to avoid specifying 
it every time), and providing a graphical interface to enhance the user experience.

***

> Resources:
> - [registry](https://hub.docker.com/_/registry)
> - [zavy86/figlet](https://hub.docker.com/r/zavy86/figlet)

[Continue](../13-naming-labeling-inspecting/README.md) to the next topic.
