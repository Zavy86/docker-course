# Multi-architecture builds

> __multi-arch builds__
>
> - legacy
> - buildkit
> - multi-arch

Back in 2017, Docker announced a new builder called `buildkit`, which became available starting from version 18.09 and 
was set as the default in Docker Desktop in 2021.

This new builder introduced a range of improvements, including significant performance enhancements and support for
building multi-platform images, while maintaining full compatibility with any existing Dockerfile.

The performance boost was made possible by a new caching mechanism that avoids rebuilding unchanged images and enables 
parallel execution.

The classic builder performed all operations sequentially, copied the entire build context, executed each `RUN` command,
and committed after every operation described in the Dockerfile.

The new builder, instead, copies only the files that have changed since the previous build context, makes a dependency
graph of the `RUN` commands found in the Dockerfile, checks if any layers already exist in the cache, it rebuilds only
those that are invalidated, and executes them in parallel where possible.

***

As mentioned, if you are using Docker Desktop, the new builder is already available and enabled by default. However, if
you are on a Linux host, as in this case, you first need to enable it with these two commands:

```shell
$ docker buildx create --use
$ docker buildx inspect --bootstrap
```

Now we can proceed with building multi-platform images.

---

Multi-platform builds are usually performed in a deployment context targeting a registry, as it would not make much
sense to execute them on a machine that, by its nature, has a single architecture.

Let's see how to perform a multi-platform build in a single command, tagging and pushing it to the Docker Hub registry.

If you haven't done so already, clone the repository for this course:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move to the directory:

```shell
$ cd docker-course/source/clock
```

And now let's perform the multi-platform build with the following command:

```shell
$ docker buildx build --platform linux/amd64,linux/arm64 --tag zavy86/clock --push .
```

Make sure to replace `zavy86` with your username.

```terminaloutput
[+] Building 7.6s (9/9) FINISHED                                                                                                             docker-container:serene_blackburn
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 109B                                                                                                                                      0.0s 
 => [linux/arm64 internal] load metadata for docker.io/library/busybox:1                                                                                                  0.3s 
 => [linux/amd64 internal] load metadata for docker.io/library/busybox:1                                                                                                  0.3s
 => [internal] load .dockerignore                                                                                                                                         0.0s
 => => transferring context: 2B                                                                                                                                           0.0s 
 => CACHED [linux/arm64 1/1] FROM docker.io/library/busybox:1@sha256:d82f458899c9696cb26a7c02d5568f81c8c8223f8661bb2a7988b269c8b9051e                                     0.0s 
 => => resolve docker.io/library/busybox:1@sha256:d82f458899c9696cb26a7c02d5568f81c8c8223f8661bb2a7988b269c8b9051e                                                        0.0s 
 => CACHED [linux/amd64 1/1] FROM docker.io/library/busybox:1@sha256:d82f458899c9696cb26a7c02d5568f81c8c8223f8661bb2a7988b269c8b9051e                                     0.0s 
 => => resolve docker.io/library/busybox:1@sha256:d82f458899c9696cb26a7c02d5568f81c8c8223f8661bb2a7988b269c8b9051e                                                        0.0s 
 => exporting to image                                                                                                                                                    7.2s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => exporting manifest sha256:a910fac5a49b339df63b77e5158cc7f79ba6f504d09f060f958853c4077cae98                                                                         0.0s 
 => => exporting config sha256:44f02f010b3da74ebff1a90b59ebb86037849279997b7020f4726e7a4ca4005b                                                                           0.0s 
 => => exporting attestation manifest sha256:0715c78aef922bbf2779457ad36f2100a607a18ff9abda5e1715762bd86293e1                                                             0.0s 
 => => exporting manifest sha256:46d2691567eb72d64b0c6b2849b3da995dd50096470abe8a1b867e02a79c1472                                                                         0.0s 
 => => exporting config sha256:f58187802becae2e6b21ee8ae48980e84797d6dcbe9d5794edc2929213935f78                                                                           0.0s 
 => => exporting attestation manifest sha256:7d625c35a7a1dd4855726198d2b33c9a0912bb951cb4536c15f1943c2d298134                                                             0.0s 
 => => exporting manifest list sha256:2b57d212aa537fa532872099f686dce49fc8852627f5858e74d5c4c4e0b31271                                                                    0.0s 
 => => pushing layers                                                                                                                                                     2.8s 
 => => pushing manifest for docker.io/zavy86/clock:latest@sha256:2b57d212aa537fa532872099f686dce49fc8852627f5858e74d5c4c4e0b31271                                         4.3s 
 => [auth] zavy86/clock:pull,push token for registry-1.docker.io                                                                                                          0.0s 
 => [auth] library/busybox:pull zavy86/clock:pull,push token for registry-1.docker.io                                                                                     0.0s
```

Now let's verify that everything was executed correctly by running the following command:

```shell
$ docker manifest inspect zavy86/clock
```

Where you can see in the `manifests` section that several images have been created, one for each platform:

```terminaloutput
{
   "schemaVersion": 2,
   "mediaType": "application/vnd.oci.image.index.v1+json",
   "manifests": [
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 480,
         "digest": "sha256:a910fac5a49b339df63b77e5158cc7f79ba6f504d09f060f958853c4077cae98",
         "platform": {
            "architecture": "amd64",
            "os": "linux"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 480,
         "digest": "sha256:46d2691567eb72d64b0c6b2849b3da995dd50096470abe8a1b867e02a79c1472",
         "platform": {
            "architecture": "arm64",
            "os": "linux"
         }
      },
      [...]
   ]
}
```

You can also see the same information directly on [Docker Hub](https://hub.docker.com/r/zavy86/clock/tags) by navigating 
to the `Tags` section of the image you want to view.

---

Unlike when using the `docker build` command to build single images, the `docker buildx build` command does not make the
image immediately available on your host. This is because, as mentioned, your host has a single architecture, and to run
an image, it must match the architecture of your host. Therefore, the common practice is to push the multi-platform 
image to the registry and then pull the version of the image that matches your architecture.

If you omit the `--push` option, the image will not only not be sent to the registry, but it will also not be saved on
your computer; it will remain available only in the cache. If you want to force saving the image locally for debugging 
purposes, you should replace the `--push` option with the `--output` option as follows:

```shell
$ docker buildx build --platform linux/amd64,linux/arm64 --tag zavy86/clock --output type=oci,dest=clock.oci .
```

At this point, you will find in the current directory a new file `clock.oci`, which represents the multi-platform image. 
You can manually push this file to a registry, but it will not be executable on your host for the reasons described 
earlier.

***

> __multi-arch builds__
>
> - qemu
> - native
> - dependencies

A key aspect to consider in multi-platform builds is that when the target platform does not match the host machine, 
Docker uses `Quick Emulator` (QEMU) to emulate the target architecture. This means, for example, that on an x86 computer
you can build images for ARM, but the compilation and execution of the steps in the Dockerfile will be emulated in 
software.

Emulation provides great flexibility but inevitably introduces performance overhead: multi-platform builds that leverage 
`QEMU` are therefore noticeably slower than native builds.

Additionally, although `QEMU` is very mature, the emulation of certain particularly specific or advanced instructions 
may not be perfect, leading to slightly different behavior compared to real hardware.

Another critical aspect concerns native dependencies, that is, all packages or libraries that are compiled and installed 
within the image. Some may exhibit differences in behavior, performance, or even compilation errors across different 
architectures, especially when using precompiled binary packages or libraries that leverage CPU-specific optimizations.

For this reason, it is best practice to always test the resulting images on every architecture you intend to support, 
possibly using automated test environments or real devices, to promptly identify any incompatibilities or regressions 
that emulation with `QEMU` might not reveal during the build phase.

***

> Resources:
> - [clock](../../sources/clock)
> - [zavy86/clock](https://hub.docker.com/r/zavy86/clock)

[Continue](../26-common-settings/README.md) to the next topic.
