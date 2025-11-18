# Container internals

> __container internals__
>
> - nerd alert

This chapter is dedicated to those who love to dive deep into how things work and want to explore the technologies
behind containers.

If you have made it this far and your only goal is to use Docker, you can skip this chapter. But if you are a bit
curious, make one last effort—you will see it's worth it!

***

> __container internals__
>
> - namespaces
> - control groups
> - copy-on-write

If we carefully examine the Linux source code, we will notice that there is no specific code dedicated to containers. In
fact, containers as we know them today work thanks to a series of technologies that are not directly connected but, when
used synergistically, have allowed Docker to become what it is today.

Containers rely on three core technologies for their functionality: `namespaces` to isolate processes from the host
system, `cgroups` to limit resource usage, and `copy-on-write` filesystem management to reduce the amount of space
required for execution and data storage within containers.

There are also several other technologies that enable security management, such as `seccomp`, process management through
the `init system` that handles the lifecycle of processes and the container itself, and many others.

***

> __container internals__
>
> control groups
> - hierarchy
> - metering
> - limiting
> - freeze
> - kill

Control groups provide the ability to measure and limit resource usage.

They can be used to monitor and restrict standard computing resources, memory, and I/O processes, as well as more
specific resources such as network, system resources, the number of processes, graphics resources provided by GPUs, and 
any other device that containers might use.

Additionally, control groups allow processes to be grouped together so they can be managed as a single entity, for
example, if you want to freeze or terminate all processes in a container at once.

Their operation is based on a tree hierarchy, where each node represents a level of isolation and can have specific
limitation rules set. You can then move one or more processes into a node, and those processes will be forced to comply 
with the rules defined for that node.

***

The main interface for interacting with control groups, as with most things in UNIX systems, is through files—or more 
precisely, a file-based representation. For example, if we run the command:

```shell
$ tree /sys/fs/cgroup/ -d
```

We will obtain a tree that includes, among other things, the containers currently running:

```terminaloutput
/sys/fs/cgroup/
├── init.scope
├── [...]
├── system.slice
│   ├── boot-efi.mount
│   ├── [...]
│   ├── docker-1745e91b305ede9884509b317bf325a8b0aa8519620231a6ad545a4becddb6ac.scope
│   ├── docker-1bc0619dbf1b0b2fda424a3f52bc5f21199b5837f70494eb6869a0e7490b75da.scope
│   ├── docker-43948a0a9f66338eb1cb1e71d182c9e76a76ba5d978c046869caac279e27faf2.scope
│   ├── docker.service
│   ├── docker.socket
│   ├── [...]
└── user.slice
    └── user-1001.slice
        ├── session-1.scope
        └── user@1001.service
            ├── app.slice
            │   ├── dbus.socket
            │   └── gpg-agent-ssh.socket
            └── init.scope
```

If, for example, we want to check CPU usage, we can use the following command:

```shell
$ cat /proc/$$/cgroup
```

To trace back to the current session node:

```terminaloutput
0::/user.slice/user-1001.slice/session-1.scope
```

And then we can use the following command:

```shell
$ cat /sys/fs/cgroup/user.slice/user-1001.slice/cpu.max
```

To get the current limit:

```terminaloutput
max 100000
```

In this case, `max` means unlimited, and 100000 represents the period in microseconds.

---

Memory is also monitored and managed through files, for example, using the command:

```shell
$ cat /sys/fs/cgroup/user.slice/user-1001.slice/memory.max
```

We can check if any limits have been set for our user:

```terminaloutput
max
```

In this case, no limit is set, and using the file:

```shell
$ cat /sys/fs/cgroup/memory.stat
```

We can verify memory usage by files, kernel processes, sockets, and much more:

```terminaloutput
anon 1750036480
file 7802949632
kernel 1063206912
kernel_stack 12779520
pagetables 49807360
sec_pagetables 0
percpu 13969248
sock 57344
vmalloc 995328
shmem 21913600
zswap 0
zswapped 0
file_mapped 979922944
file_dirty 327680
[...]
```

And so on for other resources as well.

***

> __container internals__
>
> namespaces
> - limit
> - isolation
> - separation

`Namespaces` are a resource isolation system that limits visibility within a sort of impenetrable boundary. In modern 
kernels, several types of namespaces are available, such as process, network, mount points, and many others.

Once a namespace is created, it must be assigned to one or more processes. When the last process in the namespace exits,
the system automatically removes the namespace and all resources associated with it.

***

`Namespaces` are also materialized in the system as files, and we can view them with the following command:

```shell
$ ls -l /proc/self/ns
```
```terminaloutput
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 cgroup -> 'cgroup:[4026531835]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 ipc -> 'ipc:[4026531839]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 mnt -> 'mnt:[4026531841]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 net -> 'net:[4026531840]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 pid -> 'pid:[4026531836]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 pid_for_children -> 'pid:[4026531836]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 time -> 'time:[4026531834]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 time_for_children -> 'time:[4026531834]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 user -> 'user:[4026531837]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 uts -> 'uts:[4026531838]'
```

If we want to create a simple `uts` namespace to demonstrate the level of separation, we can run the following command:

```shell
$ sudo unshare --uts
```

At this point, we notice that we are now `root` and no longer the `ubuntu` user:

Now, if we run the command:

```shell
# hostname
```

We will see the name of our machine:

```terminaloutput
docker
```

Let's now try to change it:

```shell
# hostname zavy-namespace
```

And let's run the command again:

```shell
# hostname
```

As we can see, we will get the name we just set:

```terminaloutput
zavy-namespace
```

But if we now open a new terminal on our server and run the command:

```shell
$ hostname
```

Here we will see that the change was not applied; in fact, we see again:

```terminaloutput
docker
```

As we can see, changes made inside a namespace are not visible outside it.

***

> __container internals__
>
> copy-on-write
> - filesystem
> - process memory
> - snapshots

The last point I want to cover, which is also one of my favorites, allows us to concretely understand the power of
containers and discover how they can be started and managed so efficiently.

The `copy-on-write` filesystem is a mechanism that enables data sharing between multiple systems.

When we start a container, we can see and interact with all the files inside the filesystem as if they were real files,
but in reality, they are just links (or references) pointing to the original data on the host filesystem.

This situation remains until we modify a file; only at that moment is the file actually copied into the container's 
filesystem, and the changes are applied there.

This results in significant savings in space and computing resources, as a copy of a file is created only when its
content differs from that on the host and in all other containers sharing the same file.

Copy-on-write in UNIX systems is everywhere, not just in filesystems but also in memory. For example, when we perform a 
`fork` of a process, the child process shares memory with the parent process until one of them modifies a memory area.
At that point, a copy is made and modified. The same process is also used in disk snapshots and many other cases...

***

To demonstrate the efficiency of containers, here is a simple example: let's launch several containers from the same
image and see how they behave:

```shell
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
```

First of all, as we may have noticed, all the containers were started in a few milliseconds, but the most surprising
thing is that if we run the command:

```shell
$ docker ps --size
```

We will see that the space occupied by all these containers is `0B (virtual 4.17MB)`, meaning zero bytes. The value 
shown in parentheses, the virtual size of the container, represents only the four megabytes, which is the size of the
image itself.

```terminaloutput
CONTAINER ID   IMAGE          [...]   NAMES                 SIZE
e13ecdd28d09   zavy86/clock   [...]   goofy_turing          0B (virtual 4.17MB)
c1cc638ac9a5   zavy86/clock   [...]   practical_feynman     0B (virtual 4.17MB)
cb201213dce7   zavy86/clock   [...]   charming_poitras      0B (virtual 4.17MB)
5551615713b3   zavy86/clock   [...]   unruffled_agnesi      0B (virtual 4.17MB)
004b54ebd3ef   zavy86/clock   [...]   kind_burnell          0B (virtual 4.17MB)
f98cb899aa54   zavy86/clock   [...]   angry_kilby           0B (virtual 4.17MB)
2a4b068277cb   zavy86/clock   [...]   intelligent_haslett   0B (virtual 4.17MB)
faa676649677   zavy86/clock   [...]   hungry_jang           0B (virtual 4.17MB)
32876e33691d   zavy86/clock   [...]   kind_joliot           0B (virtual 4.17MB)
```

This means that all nine containers are sharing the same filesystem with the image, so the files inside each container 
are simply links to the files present in the image itself.

If, from another terminal, we launch an additional container in interactive mode:

```shell
$ docker run -ti zavy86/clock sh
```

And let's create a new file inside it:

```shell
$ echo "Hello World!" > test.txt
```

And let's run the command again:

```shell
$ docker ps --size
```
```terminaloutput
CONTAINER ID   IMAGE          [...]   NAMES                 SIZE
ac3d3ea22d5d   zavy86/clock   [...]   elated_hamilton       58B (virtual 4.17MB)
e13ecdd28d09   zavy86/clock   [...]   goofy_turing          0B (virtual 4.17MB)
c1cc638ac9a5   zavy86/clock   [...]   practical_feynman     0B (virtual 4.17MB)
cb201213dce7   zavy86/clock   [...]   charming_poitras      0B (virtual 4.17MB)
5551615713b3   zavy86/clock   [...]   unruffled_agnesi      0B (virtual 4.17MB)
004b54ebd3ef   zavy86/clock   [...]   kind_burnell          0B (virtual 4.17MB)
f98cb899aa54   zavy86/clock   [...]   angry_kilby           0B (virtual 4.17MB)
2a4b068277cb   zavy86/clock   [...]   intelligent_haslett   0B (virtual 4.17MB)
faa676649677   zavy86/clock   [...]   hungry_jang           0B (virtual 4.17MB)
32876e33691d   zavy86/clock   [...]   kind_joliot           0B (virtual 4.17MB)
```

We will see that the size of this last container is 58 bytes, which corresponds only to the weight of the `test.txt` 
file we just created, and this size obviously has no impact on any of the other containers.

If we then run the following command:

```shell
$ docker diff ac3
```

We will notice exactly the differences made compared to the original image:

```terminaloutput
C /root
A /root/.ash_history
A /test.txt
```

The addition of the `test.txt` file and the modification of the `/root` directory, where the `.ash_history` file was 
added, which contains the history of the last executed command to allow recalling it using the up arrow key...

***

> __container internals__
>
> open container initiative
> - open governance
> - industry standards
> - formats and runtimes

I will not go into detail about all the other components, as by now I believe I may have lost most readers. However, if
you are among those who wish to further explore how containers work—perhaps because you want to contribute to their
development—I recommend visiting the [Open Container Initiative](https://opencontainers.org/).

This is a governance structure established with the specific goal of creating open industry standards for container 
formats and runtimes. Founded in 2015 by Docker and other industry leaders, it ensures that container technologies are 
portable and interoperable across different vendors and platforms by standardizing their fundamental components.

***

> Resources:
> - [zavy86/clock](https://hub.docker.com/r/zavy86/clock)

[Continue](../../contribute/README.md) to the next topic.
