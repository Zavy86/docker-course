# Resource limits

> __resource budgets__
>
> - leave room for the host
> - protect the other services
> - verify the effective settings

Let's imagine you have multiple services running on the same host, sharing CPU and memory resources. If one of these
services starts consuming too many resources, for example during a spike in requests or because of an error, it
could slow down the other containers and even the host's operating system.

To contain this issue, we can set limits for individual containers, ensuring there's enough space for other services
and the host. These limits should be accompanied by monitoring the overall host machine usage.

Obviously, there isn't a one-size-fits-all value for all applications, so we'll start with a small example to
understand how to apply and control limits, and then it's up to you to scale them individually based on your actual
stack.

In this chapter, we'll also look at other settings that influence how processes run and containers stop,
distinguishing them from CPU and memory limits.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/resources
```

Let's look at the `compose.yaml` file.

```yaml
services:
  app:
    image: busybox
    command: [ "sleep", "infinity" ]
    init: true
    cpus: 0.5
    mem_limit: 64m
    pids_limit: 64
```

In this example, using the usual BusyBox, we'll start a container that will stay idle and consume minimal resources
because it doesn't perform any active work. The options set, however, define the limits it must respect even when we
run other processes inside it.

As we saw in a previous chapter, `init` adds a small process that forwards signals and collects terminated child
processes.

The `cpus` option sets a cap equivalent to half the CPU time, not half the cores, and doesn't guarantee a dedicated
CPU. When the process exhausts its budget, it gets throttled until the next CPU period, continuing to compete with
other host loads.

With `mem_limit`, we set a memory limit of 64 MiB for the entire container. This limit is shared among the processes
inside and can't be assigned separately to each one. It's important to note that the memory usage by a service can
change over time, for example during startup, when many requests come in simultaneously, or during maintenance
activities.

We limit the container tasks to 64, including the processes and threads counted by the Linux kernel with
`pids_limit`. This helps contain an uncontrolled process creation.

***

> __choose limits based on usage__
>
> - measure usage under load
> - understand the effects of low limits
> - limits do not reserve resources

To choose appropriate limits for CPU and memory, you can't just look at the service when it's idle. We measure both
resource usage during the most demanding activities and leave some buffer to account for variations, considering the
available resources on the host.

If the memory limit is too low, the consequences can be more severe than a CPU limit that's too restrictive. While
CPU usage is throttled until the next period, memory exhaustion can cause the kernel to kill a process. And if the
main process is killed, the container stops. Similarly, a process limit that's too low can cause issues, preventing
the application from starting the necessary processes or threads. A restart policy might get it going again, but it
doesn't address the problem and can lead to a cycle of errors.

Consider that a limit is not a reservation of free resources. Just because ten services can use 1 GB each, it
doesn't mean the machine automatically has 10 GB available for them.

***

So let's proceed with starting the stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network resources_default Created                                                                                0.0s
 ✔ Container resources-app-1 Started                                                                                0.1s
```

And let's check the actual settings with the command:

```shell
$ docker inspect --format '{{ json .HostConfig }}' $(docker compose ps -q app) | jq '{ NanoCpus, Memory, PidsLimit }'
```
```json
{
  "NanoCpus": 500000000,
  "Memory": 67108864,
  "PidsLimit": 64
}
```

For this configuration, we expect `500000000` of CPU, `67108864` bytes of memory, and `64` for the process limit.
The first value uses millionths of CPU, not a clock frequency.

To check the runtime statistics instead, we use the command:

```shell
$ docker stats --no-stream $(docker compose ps -q app)
```
```terminaloutput
CONTAINER ID   NAME              CPU %     MEM USAGE / LIMIT   MEM %     NET I/O         BLOCK I/O    PIDS
55227ccbc7e0   resources-app-1   0.00%     5.555MiB / 64MiB    8.68%     1.75kB / 126B   3.8MB / 0B   2
```

This is the current usage, which in our example is obviously very low. The CPU percentage can also exceed 100% for
containers that use more CPU, so it should be read in conjunction with the available number of CPUs and the
configured limits.

Memory usage can vary depending on the tool used. For example, on Linux, `docker stats` subtracts a portion of the
cache that the system can reclaim, while other tools might include it. To compare measurements over time, we use the
same tool and account for this difference.

***

We can also add a limit to the number of files that each process can keep open simultaneously:

```yaml
[...]
ulimits:
  nofile:
    soft: 1024
    hard: 2048
```

The soft limit is the one usually applied to the process, while the hard limit represents the maximum within which
the soft limit can be increased, depending on the available permissions. Sockets and connections also consume
descriptors; they're not just about the files open on the disk.

To enable the new limits, we restart the service with the command:

```shell
$ docker compose up -d app
```
```terminaloutput
[+] up 1/1
 ✔ Container resources-app-1 Started                                                                                0.2s
```

And let's verify the limits with the command:

```shell
$ docker compose exec app sh -c 'ulimit -Sn; ulimit -Hn'
```
```terminaloutput
1024
2048
```

To check instead the file descriptors opened by the main process of our container, we use the command:

```shell
docker compose exec app ls -l /proc/1/fd
```
```terminaloutput
total 0
lrwx------    1 root     root            64 Nov  8 10:32 0 -> /dev/null
l-wx------    1 root     root            64 Nov  8 10:32 1 -> pipe:[5315]
l-wx------    1 root     root            64 Nov  8 10:32 2 -> pipe:[5316]
```

The three descriptors 0, 1, and 2 represent the open file descriptors by the process and do not occupy disk blocks
like regular files. The total `0` indicates the disk space allocated to the listed entries, expressed in blocks.

Be careful, because the `Too many open files` error can indicate either an insufficient limit, or a loss of file
descriptors by the application. Raising this value without finding the cause will only delay the problem.

***

> __shared memory and shutdown__
>
> - size shared memory
> - allow graceful shutdown
> - do not confuse different limits

Beyond the memory used by individual processes, an application can also use shared memory. This allows multiple
processes to access the same area and exchange data without having to copy it every time from one process to
another. On Linux, applications can use a temporary space in memory for this purpose, which counts towards the
container's memory consumption.

For example, a headless browser can use it to share data between its processes, while some databases can use it to
coordinate their activities. Still, it depends on how the application is designed and configured, as not all
programs need it in the same way.

Typically, each container has its own shared memory space, isolated from other containers. The maximum size of this
space is distinct from the overall memory limit, and increasing it doesn't automatically increase the memory
available to the container. If this space fills up, however, an application might encounter errors even if the
container still has other classical memory available.

***

To set the maximum size of this shared memory, we can use:

```yaml
shm_size: 16m
stop_grace_period: 20s
```

The `shm_size` option allows the container to use up to 16 MiB of shared memory space, and the actual memory used
contributes to the overall consumption. If the space is too small, operations that require it may fail. The test
value is small, so let's choose it consistently based on the needs and measurements of the application.

The `stop_grace_period` option is about shutting down the entire container. After sending the stop signal to the
main process, Docker waits in this case up to 20 seconds before forcibly stopping it if it's still active. It's a
total wait time, not a separate time assigned to each child process.

To enable the new limits, we restart the service with the command:

```shell
$ docker compose up -d app
```
```terminaloutput
[+] up 1/1
 ✔ Container resources-app-1 Started                                                                                0.2s
```

Then we check the space with the command:

```shell
$ docker compose exec app df -h /dev/shm
```
```terminaloutput
Filesystem                Size      Used Available Use% Mounted on
shm                      16.0M         0     16.0M   0% /dev/shm
```

We wrap it all up with the usual command:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container resources-app-1 Removed                                                                                0.1s
 ✔ Network resources_default Removed                                                                                0.1s
```

One last consideration is that on Docker Desktop, whether you're on Windows or MacOS, Linux containers share
resources from the VM, not the host machine. Even a computer with a lot of RAM might have allocated a budget to
Docker that's below its maximum. So, we always check these values before setting any limits.

And we keep in mind that even with the native Docker Engine on Linux, it's still necessary to leave enough space for
the operating system and for the host's basic processes.

***

> Resources
>
> - [Container resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)
> - [busybox](https://hub.docker.com/_/busybox)

[Continue](../45-scaling-services/README.md) to the next chapter.
