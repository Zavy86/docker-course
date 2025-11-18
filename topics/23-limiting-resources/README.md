# Limiting resources

> __limiting resources__
>
> - memory
> - compute
> - storage
> - network

So far, we have used containers as convenient standalone distribution units. But what happens when a container tries to
use more resources than are available? What happens if multiple containers try to use the same resource?

Can we limit the resources available to a container? Spoiler: yes!

Containers, as we have already seen, are more similar to special processes than to virtual machines.

A container running on a host is, in effect, a process running on that host.

So, what we should ask ourselves is: what happens to a Linux process that tries to use too much memory?

In the best-case scenario, `swap` memory is used if available; otherwise, the process is terminated.

If a container uses too much memory, the same will happen: `swap` memory will be used as long as it is available, and
then the container will be terminated.

***

> __limiting resources__
>
> - --memory
> - --memory-swap
> - --cpus
> - --cpu-shares

The Linux kernel provides effective mechanisms to limit the resources of a container.

Memory usage limitation is managed by the `cgroup` subsystem, which allows you to restrict memory for a single process
or a group of processes. Docker leverages this mechanism to limit the memory used by a container.

Docker offers several options to set resource limits. For memory, the two most commonly used options are `--memory` and
`--memory-swap`. The former limits only the "real" memory, while the latter restricts the total combined usage of both 
`ram` and `swap` memory by the container.

Limits can be specified in bytes or in more readable units such as `k`, `m`, and `g` for `kilobytes`, `megabytes`, and
`gigabytes` respectively, which will be explained in detail shortly.

The most used options for limiting compute resources are `--cpus` and `--cpu-shares`. The first one sets a maximum 
percentage of CPU usage, while the second one sets a priority for the container's processes. These options can be used
together or separately.

By default, all containers have a priority set to `1024`, which is used by the kernel scheduler to allocate resources.
As long as the CPUs are not fully used, this number has no effect. Once the CPUs are fully loaded, each container will 
receive CPU cycles only in proportion to its priority.

In simple terms, setting `--cpu-shares 2048` will ensure that this container receives twice as many CPU cycles as other 
containers or processes with the default value.

The CPU percentage limit ensures that a container does not use more than a specified percentage of CPU. The value is 
expressed in base 1, and if multiple cores are available, this value can exceed 100%.

Finally, storage usage limitations strictly depend on the storage driver in use, and some don't support limiting at all.
This means that a single container could potentially use all available storage. Therefore, pay close attention to your
container logs and volumes.

***

Now, let's look at some examples of resource limitation.

Let's run a Python container limiting its memory to 100 megabytes:

```shell
$ docker run -ti --rm --memory 100m python
```

In this way, as soon as we exceed 100 megabytes of memory, the container will start using `swap` memory and will become 
noticeably slow.

```python
i = 0
mb = 'X'
while True:
  i += 1
  print(f'{i}')
  mb += 'X' * 1024 * 1024
```

If instead we launch it with both options:

```shell
$ docker run -ti --rm --memory 100m --memory-swap 150m python
```

As before, our container will start using `swap` memory once it exceeds 100 megabytes of memory, but after consuming 50 
megabytes of `swap`, it will be terminated.

```python
i = 0
mb = 'X'
while True:
  i += 1
  print(f'{i}')
  mb += 'X' * 1024 * 1024
```

If we want to limit its CPU usage to 50%:

```shell
$ docker run -ti --rm --cpus="0.5" python
```

If we have multiple cores available, we can even exceed 100%:

```shell
$ docker run -ti --rm --cpus="2" python
```

In this case, we are using 200% of the CPU, meaning two entire cores.

As for storage, as mentioned earlier, it depends on the storage driver in use, and not all of them support limiting.

In any case, to check the storage space used by each container, we can use the following command:

```shell
$ docker ps -as
```

This will show us an additional column with the size in use:

```terminaloutput
CONTAINER ID   IMAGE   [...]   SIZE
eb7db448ce04   crash   [...]   98B (virtual 13.1MB)
918f911fb7ea   figlet  [...]   0B (virtual 11.8MB)
9967fb8e8425   clock   [...]   0B (virtual 4.17MB)
27b93514ef24   hello   [...]   0B (virtual 174MB)
```

The `SIZE` value indicates the amount of storage used by the container's top writable layer. In parentheses, the 
`virtual` value shows the total size, including the base image from which the container was started.

If you want to inspect the changes made by a single container in detail, you can use the `docker diff` command as
previously discussed in [chapter 7](../07-interactive-images/IT.md).

***

> Resources:
> - [python](https://hub.docker.com/_/python)

[Prosegui](../24-logging-monitoring/IT.md) al prossimo capitolo.
