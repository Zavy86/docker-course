# Naming, labeling, and inspecting

> __naming, labeling, and inspecting__
>
> - easy reference
> - container unicity
> - key-value pairs
> - container details

In this chapter, we will cover the concepts of naming, labeling, and inspecting containers.

Naming a container allows us to uniquely identify it and refer to it easily.

Labels, on the other hand, are key-value pairs that can be attached to containers to add additional useful information. 
Many labels are predefined by Docker, but we can also create custom ones based on our needs.

Through inspection, we can access all the details of a container, such as its ID, image, state, and a wide range of 
other useful information.

***

Until now, when we created containers, we never specified names and always referred to them using the unique 
auto-generated ID provided by Docker.

However, in addition to the ID, Docker also generates unique random names for our containers.

The creation of these names is quite amusing, as Docker combines an adjective with the surname of a famous figure in the 
world of computing.

For example, some names could be: happy_curie, clever_hopper, jovial_lovelace, etc.

> Except for `booring_wozniak`, because [Steve Wozniak is not boring](https://github.com/moby/moby/blob/c90254c7464cac5c56e7ab9e6b1857c119d5d263/pkg/namesgenerator/names-generator.go#L844)! ;-)

If we launch a container again and check the processes using the commands:

```shell
$ docker run zavy86/figlet
$ docker ps -al
```

At the end, we will see a name assigned to the container, in my case `loving_visvesvaraya`:

```terminaloutput
CONTAINER ID   IMAGE           [...]   NAMES
a79f3e40a2a4   zavy86/figlet   [...]   loving_visvesvaraya
```

If, on the other hand, we want to specify a custom name for the container, we just need to add the `--name` option to 
the command:

```shell
$ docker run --name figlet zavy86/figlet
$ docker ps -al
```
```terminaloutput
CONTAINER ID   IMAGE           [...]   NAMES
123ff4c70862   zavy86/figlet   [...]   figlet
```

Additionally, we can rename a container to assign it a new name using the following command:

```shell
$ docker rename figlet zavy-figlet
$ docker ps -al
```
```terminaloutput
CONTAINER ID   IMAGE           [...]   NAMES
123ff4c70862   zavy86/figlet   [...]   zavy-figlet
```

And as we can see, the container now has a new name.

***

As for labels, we can add labels to our containers using the `--label` or `-l` option at `run` time, for example:

```shell
$ docker run -l owner=zavy zavy86/figlet
$ docker run -l owner=alice zavy86/figlet
$ docker run -l owner=bob zavy86/figlet
```

With these three commands, I started three containers, each with an `owner` label set to `zavy`, `alice`, and `bob`.

Using the usual `docker ps -a` command, we will not see these labels, but they can be useful for filtering, for example,
by adding the `--filter` option to the command:

```shell
$ docker ps -a --filter label=owner
```

It will show us all containers that have an `owner` label with any value:

```terminaloutput
CONTAINER ID   IMAGE           [...]
a0baf847157d   zavy86/figlet   [...]
54edf617e445   zavy86/figlet   [...]
96c6c9a63f3e   zavy86/figlet   [...]
```

If, on the other hand, we want to filter by the label value as well, we need to add another equal sign with the value:

```shell
$ docker ps -a --filter label=owner=zavy
```

In this way, we will see only the container whose `owner` label has the value `zavy`:

```terminaloutput
CONTAINER ID   IMAGE           [...]
96c6c9a63f3e   zavy86/figlet   [...]
```

These labels will prove to be very useful in the future, as many monitoring tools, proxies, and other services can use 
these labels to filter containers and perform distinct operations on them.

***

Finally, if we want to access all the information related to a container, we can use the command:

```shell
$ docker inspect zavy-figlet
```
```terminaloutput
[
    {
        "Id": "123ff4c708625c2ba7870e08795a23807e155aa4ace0114cb5a619ab6c11915b",
        "Created": "2025-09-23T14:38:45.6698245Z",
        "Path": "figlet",
        "Args": [
            "-f",
            "script"
        ],
        "State": {
            "Status": "exited",
            "Running": false,
            "Paused": false,
            "Restarting": false,
            "OOMKilled": false,
            "Dead": false,
            "Pid": 0,
            "ExitCode": 0,
            "Error": "",
            "StartedAt": "2025-09-23T14:38:45.721877667Z",
            "FinishedAt": "2025-09-23T14:38:45.836967792Z"
        },
        "Image": "sha256:1e07b8999b54f162bc5bbd2d4664793c3639c393c42d3f230677efa82aeccab2",
        "ResolvConfPath": "/var/lib/docker/containers/123ff4c708625c2ba7870e08795a23807e155aa4ace0114cb5a619ab6c11915b/resolv.conf",
        "HostnamePath": "/var/lib/docker/containers/123ff4c708625c2ba7870e08795a23807e155aa4ace0114cb5a619ab6c11915b/hostname",
        "HostsPath": "/var/lib/docker/containers/123ff4c708625c2ba7870e08795a23807e155aa4ace0114cb5a619ab6c11915b/hosts",
        "LogPath": "/var/lib/docker/containers/123ff4c708625c2ba7870e08795a23807e155aa4ace0114cb5a619ab6c11915b/123ff4c708625c2ba7870e08795a23807e155aa4ace0114cb5a619ab6c11915b-json.log",
        "Name": "/zavy-figlet",
        "RestartCount": 0,
        "Driver": "overlay2",
        "Platform": "linux",
        "MountLabel": "",
        "ProcessLabel": "",
        "AppArmorProfile": "",
        "ExecIDs": null,
        "HostConfig": {
            "Binds": null,
            "ContainerIDFile": "",
            "LogConfig": {
                "Type": "json-file",
                "Config": {}
            },
            "NetworkMode": "bridge",
            "PortBindings": {},
            "RestartPolicy": {
                "Name": "no",
                "MaximumRetryCount": 0
            },
            "AutoRemove": false,
            "VolumeDriver": "",
            "VolumesFrom": null,
            "ConsoleSize": [
                11,
                175
            ],
            "CapAdd": null,
            "CapDrop": null,
            "CgroupnsMode": "private",
            "Dns": [],
            "DnsOptions": [],
            "DnsSearch": [],
            "ExtraHosts": null,
            "GroupAdd": null,
            "IpcMode": "private",
            "Cgroup": "",
            "Links": null,
            "OomScoreAdj": 0,
            "PidMode": "",
            "Privileged": false,
            "PublishAllPorts": false,
            "ReadonlyRootfs": false,
            "SecurityOpt": null,
            "UTSMode": "",
            "UsernsMode": "",
            "ShmSize": 67108864,
            "Runtime": "runc",
            "Isolation": "",
            "CpuShares": 0,
            "Memory": 0,
            "NanoCpus": 0,
            "CgroupParent": "",
            "BlkioWeight": 0,
            "BlkioWeightDevice": [],
            "BlkioDeviceReadBps": [],
            "BlkioDeviceWriteBps": [],
            "BlkioDeviceReadIOps": [],
            "BlkioDeviceWriteIOps": [],
            "CpuPeriod": 0,
            "CpuQuota": 0,
            "CpuRealtimePeriod": 0,
            "CpuRealtimeRuntime": 0,
            "CpusetCpus": "",
            "CpusetMems": "",
            "Devices": [],
            "DeviceCgroupRules": null,
            "DeviceRequests": null,
            "MemoryReservation": 0,
            "MemorySwap": 0,
            "MemorySwappiness": null,
            "OomKillDisable": null,
            "PidsLimit": null,
            "Ulimits": [],
            "CpuCount": 0,
            "CpuPercent": 0,
            "IOMaximumIOps": 0,
            "IOMaximumBandwidth": 0,
            "MaskedPaths": [
                "/proc/asound",
                "/proc/acpi",
                "/proc/interrupts",
                "/proc/kcore",
                "/proc/keys",
                "/proc/latency_stats",
                "/proc/timer_list",
                "/proc/timer_stats",
                "/proc/sched_debug",
                "/proc/scsi",
                "/sys/firmware",
                "/sys/devices/virtual/powercap"
            ],
            "ReadonlyPaths": [
                "/proc/bus",
                "/proc/fs",
                "/proc/irq",
                "/proc/sys",
                "/proc/sysrq-trigger"
            ]
        },
        "GraphDriver": {
            "Data": {
                "ID": "123ff4c708625c2ba7870e08795a23807e155aa4ace0114cb5a619ab6c11915b",
                "LowerDir": "/var/lib/docker/overlay2/5d56abb8b519190febb43819495ea3d9bf8db912927db225173603122b6537ad-init/diff:/var/lib/docker/overlay2/oambhph1bxtanhogkr208jimt/diff:/var/lib/docker/overlay2/11dfb7cb290f39accc4c46b8a8b6746616f9985cf71b8014c2a3c45c9c9a3e8e/diff",
                "MergedDir": "/var/lib/docker/overlay2/5d56abb8b519190febb43819495ea3d9bf8db912927db225173603122b6537ad/merged",
                "UpperDir": "/var/lib/docker/overlay2/5d56abb8b519190febb43819495ea3d9bf8db912927db225173603122b6537ad/diff",
                "WorkDir": "/var/lib/docker/overlay2/5d56abb8b519190febb43819495ea3d9bf8db912927db225173603122b6537ad/work"
            },
            "Name": "overlay2"
        },
        "Mounts": [],
        "Config": {
            "Hostname": "123ff4c70862",
            "Domainname": "",
            "User": "",
            "AttachStdin": false,
            "AttachStdout": true,
            "AttachStderr": true,
            "Tty": false,
            "OpenStdin": false,
            "StdinOnce": false,
            "Env": [
                "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
            ],
            "Cmd": null,
            "Image": "zavy86/figlet",
            "Volumes": null,
            "WorkingDir": "/",
            "Entrypoint": [
                "figlet",
                "-f",
                "script"
            ],
            "OnBuild": null,
            "Labels": {}
        },
        "NetworkSettings": {
            "Bridge": "",
            "SandboxID": "",
            "SandboxKey": "",
            "Ports": {},
            "HairpinMode": false,
            "LinkLocalIPv6Address": "",
            "LinkLocalIPv6PrefixLen": 0,
            "SecondaryIPAddresses": null,
            "SecondaryIPv6Addresses": null,
            "EndpointID": "",
            "Gateway": "",
            "GlobalIPv6Address": "",
            "GlobalIPv6PrefixLen": 0,
            "IPAddress": "",
            "IPPrefixLen": 0,
            "IPv6Gateway": "",
            "MacAddress": "",
            "Networks": {
                "bridge": {
                    "IPAMConfig": null,
                    "Links": null,
                    "Aliases": null,
                    "MacAddress": "",
                    "DriverOpts": null,
                    "GwPriority": 0,
                    "NetworkID": "44f02dbf9396a8f852ee84f83d74cdd2aaf6f2bc1be2b5382b386125c0999ad5",
                    "EndpointID": "",
                    "Gateway": "",
                    "IPAddress": "",
                    "IPPrefixLen": 0,
                    "IPv6Gateway": "",
                    "GlobalIPv6Address": "",
                    "GlobalIPv6PrefixLen": 0,
                    "DNSNames": null
                }
            }
        }
    }
]
```

All this information might even be overwhelming, so to make everything more readable we can use a handy command-line 
utility called `jq` that allows us to interact with data in JSON format:

```shell
$ docker inspect zavy-figlet | jq
```

By piping the output of the `inspect` command to `jq`, we get a formatted and colorized JSON object. However, we can do
even better: if we want to extract only the image name, we can specify the path of the element we want to display:

```shell
$ docker inspect zavy-figlet | jq '.[0].Config.Image'
```
```terminaloutput
"zavy86/figlet"
```

In addition to using `jq`, we can also use the `--format` option of the `inspect` command to retrieve specific 
information based on the same path:

```shell
$ docker inspect --format '{{ json .Config.Image }}' zavy-figlet
```
```terminaloutput
"zavy86/figlet"
```

The result is the same, choose the one you prefer or are more accustomed to working with...

***

> Resources:
> - [zavy86/figlet](https://hub.docker.com/r/zavy86/figlet)

[Continue](../14-troubleshooting/IT.md) to the next topic.
