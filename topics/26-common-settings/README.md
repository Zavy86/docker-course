# Common docker settings

> __common docker settings__
>
> - storage
> - networking
> - security
> - system

I intentionally kept this chapter for last, so as not to overwhelm those approaching this tool for the first time, even
though I believe it is actually one of the first things to do when starting to use Docker.

Customizing Docker's configuration from the beginning will help you avoid issues that are challenging to detect and
resolve, especially for beginners. Now that you have understood whether Docker suits your needs and have experimented
with your test environment, let's proceed with configuring your actual local development environment.

In this chapter, we will see how to configure storage, networking, and some other useful parameters.

***

First of all, to modify Docker's settings, you need to edit the file:

```shell
$ nano /etc/docker/daemon.json
```

Or, if you are running Docker in rootless mode, you will need to edit the file:

```shell
$ nano ~/.config/docker/daemon.json
```

Alternatively, if you are using Docker Desktop on Windows or macOS, refer to the settings section.

Within this file, you can specify the settings you want to override from the default values. For further details, refer 
to the [official documentation](https://docs.docker.com/engine/daemon/), as this section will only cover a few examples.

---

A critical aspect is volume management. Always remember that you are solely responsible for the data in your volumes.
There are no automatic backup systems, and if not properly managed, they could fill up your machine's storage.

Additionally, in cases where you have a NAS or even just multiple partitions on your machine's disk, you might want to
decide precisely where Docker's data should be stored. The first step is to specify:

```json
{
  "storage-driver": "overlay2",
  "data-root": "/mnt/nas/zavy86/docker"
}
```

The `overlay2` driver is much more performant compared to those used previously, and on modern Linux systems it should 
already be set as the default. However, explicitly specifying it is always a good practice.

---

Another key aspect is networking configuration. Especially in corporate environments with complex networks, it is easy
to encounter IP address conflicts between Docker networks and those managed by network administrators.

The first parameter to consider is `bip`, which allows you to specify the IP address of Docker's default bridge, known
as `docker0`. This is the network where all containers are distributed unless otherwise specified using the `--network` 
option.

```json
{
  "bip": "10.86.0.1/16"
}
```

In this case, I chose the `10.86.0.0/16` network because it is a private network that is not used elsewhere. Generally,
the higher the numbers, the less likely they are to be in use. However, a discussion with your network administrator 
over coffee should be more than enough to agree on this!

---

Similarly, we will modify the `default-address-pools` parameter, which allows you to specify the IP addresses that will 
be assigned to custom bridge networks created manually or via Docker Compose.

```json
{
  "default-address-pools": [
    {
      "base": "10.91.0.0/16",
      "size": 24
    }
  ]
}
```

In this case as well, I used the `/16` mask, which provides over 65,000 IP addresses, then divided into `/24` subnets,
meaning 256 addresses for each individual bridge network that will be created. For a local development environment, I 
believe these parameters are more than sufficient.

---

Manual configuration of DNS servers may also be useful, i.e., the IP addresses of the servers that containers will use 
to resolve domain names.

```json
{
  "dns": [
    "172.16.1.254", 
    "8.8.8.8", 
    "1.1.1.1"
  ]
}
```

Similarly, if you have a corporate DNS, remember to include it so you can take advantage of custom domain names and then 
specify any additional external DNS servers as needed.

---

For development environments, you might want to enable local registries using the HTTP protocol. By default, Docker does
not allow the use of registries that are not served over HTTPS, but as mentioned in a previous chapter, you may want to
use a basic local registry. If you need to access these registries from other clients, you also will need to explicitly
enable them using the `--insecure-registry` option.

```json
{
  "insecure-registries": [
    "registry.domain.local:5000",
    "172.16.32.64:5000",
    "localhost:5000"
  ]
}
```

---

Let's move on to log configurations. Just like with volumes, we must pay close attention here to avoid ending up with a
server filled with (often) useless text files.

```json
{
  "data-root": "/mnt/nas/zavy86/docker",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "9m",
    "max-file": "3"
  }
}
```

In this case, I have used fairly standard values: the `json-file` driver allows logs to be saved as text files, with 
rotation occurring when each file reaches 9 megabytes, and a maximum of 3 historical log files per container.

> Note the `data-root` parameter, which is the same as the one configured for volumes. Docker does not allow you to
> specify separate directories for each of its data types; instead, it uses a single directory. If you want to change 
> them individually, you will need to use symbolic links.

---

Another important parameter is related to live restore. If enabled, it allows you to restart the Docker daemon without
restarting all containers. This is very useful in production but often causes issues in development environments, where
you may want to restart everything.

```json
{
  "live-restore": false
}
```

In this way, when we restart the Docker service, in addition to restarting the daemon, we will also force the stop and
restart of all containers currently running.

---

Finally, another thing we might want to do is to massively change the key combination that allows us to detach from
containers running in interactive mode. In this case, we need to modify the following parameter:

```json
{
  "detach-keys": "ctrl-p,q"
}
```

The ones I have listed are obviously the standard values, so this parameter is not really necessary, but in some cases,
it might be useful to change them to avoid conflicts with other key combinations.

---

As I mentioned, these are the settings I have most frequently modified in my Docker installations. While they are very
useful, they are not the only settings that can be changed. As stated at the beginning, always refer to the official 
documentation for a comprehensive overview.

Once you have finished making all the necessary changes, remember to restart Docker:

```shell
$ sudo systemctl restart docker
```

***

[Continue](../27-container-internals/README.md) to the next topic.
