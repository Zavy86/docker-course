# Naming, labeling, and inspecting

> __naming, labeling, and inspecting__
>
> - easy reference
> - container unicity
> - key-value pairs
> - container details

In questo capitolo, affronteremo i concetti di nomenclatura, etichettatura e ispezione dei containers.

La nomenclatura di un container ci permette di identificarlo in modo univoco e di riferirci a esso in modo semplice.

Le etichette sono invece delle coppie chiavi valori che possono essere attaccate ai containers per aggiungere ulteriori
informazioni utili, molte etichette sono impostate in maniera predefinita da Docker, ma possiamo anche crearne di 
personalizzate sulla base delle nostre esigenze.

Tramite l'ispezione, possiamo avere accesso a tutti i dettagli di un container, come il suo id, l'immagine, lo stato, 
e tutta un'altra serie di informazioni utili.

***

Fino a ora, quando abbiamo creato dei containers, non abbiamo mai specificato dei nomi e ci siamo sempre riferiti a loro
tramite l'id univoco auto-generato da Docker.
Tuttavia, oltre all'id, Docker genera per i nostri container anche dei nomi casuali univoci.
La creazione di questi nomi è molto divertente, in quanto Docker combina un aggettivo con il cognome di una celebrità
del mondo dell'informatica.
Ad esempio alcuni nomi potrebbero essere: happy_curie, clever_hopper, jovial_lovelace, ecc...

Se infatti lanciamo nuovamente un container e andiamo a vedere i processi con i comandi:

```shell
$ docker run zavy86/figlet
$ docker ps -al
```

Vedremo in fondo un nome assegnato al container, nel mio caso `loving_visvesvaraya`:

```terminaloutput
CONTAINER ID   IMAGE           [...]   NAMES
a79f3e40a2a4   zavy86/figlet   [...]   loving_visvesvaraya
```

Qualora invece volessimo specificare un nome personalizzato per il container, non dovremo far altro che aggiungere
l'opzione `--name` al comando:

```shell
$ docker run --name figlet zavy86/figlet
$ docker ps -al
```
```terminaloutput
CONTAINER ID   IMAGE           [...]   NAMES
123ff4c70862   zavy86/figlet   [...]   figlet
```

Inoltre possiamo anche rinominare un container per assegnargli un nuovo nome, per farlo possiamo usare il comando:

```shell
$ docker rename figlet zavy-figlet
$ docker ps -al
```
```terminaloutput
CONTAINER ID   IMAGE           [...]   NAMES
123ff4c70862   zavy86/figlet   [...]   zavy-figlet
```

E come possiamo vedere ora il container avrà il nuovo nome.

***

Per quanto riguarda invece le etichette, possiamo aggiungere delle etichette ai nostri container con l'opzione `--label`
o `-l` al momento del `run`, ad esempio:

```shell
$ docker run -l owner=zavy zavy86/figlet
$ docker run -l owner=alice zavy86/figlet
$ docker run -l owner=bob zavy86/figlet
```
Con questi tre comandi ho avviato tre container, ognuno con un'etichetta `owner` con valore `zavy`, `alice` e `bob`.

Tramite il solito `docker ps -a` non vedremo tali etichette, ma possono tornarci utili per effettuare dei filtri, ad
esempio aggiungendo l'opzione `--filter` al comando:

```shell
$ docker ps -a --filter label=owner
```

Ci mostrerà tutti i container che hanno un etichetta `owner` con qualsiasi valore:

```terminaloutput
CONTAINER ID   IMAGE           [...]
a0baf847157d   zavy86/figlet   [...]
54edf617e445   zavy86/figlet   [...]
96c6c9a63f3e   zavy86/figlet   [...]
```

Se invece volessimo filtrare anche il valore dell'etichetta, dovremo aggiungere un ulteriore uguale col valore:

```shell
$ docker ps -a --filter label=owner=zavy
```

In questo modo, vedremo filtrato solamente il container la cui etichetta `owner` ha valore `zavy`:

```terminaloutput
CONTAINER ID   IMAGE           [...]
96c6c9a63f3e   zavy86/figlet   [...]
```

Queste etichette vedrete che ci torneranno molto utili in futuro, in quanto molti strumenti di monitoraggio, proxy e
altri servizi possono utilizzare queste etichette per filtrare i container ed effetuare operazioni distinte su di essi. 

***

Se volessimo infine avere accesso a tutte le informazioni relative al container, possiamo usare il comando:

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

Tutte queste informazioni potrebbero addirittura spiazzarci, per rendedere il tutto più leggibile possiamo sfruttare una
comoda utility da riga di comando chiamata `jq` che ci permette di interagire con i dati in formato JSON:

```shell
$ docker inspect zavy-figlet | jq
```

Mettendo infatti in pipe l'output del comando `inspect` con `jq` otterremo un oggetto formattato e colorato, ma possiamo
anche fare di meglio, se volessimo ad esempio ottenere solo il nome dell'immagine, potremo specificare il percorso
dell'elemento che ci interessa visualizzare:

```shell
$ docker inspect zavy-figlet | jq '.[0].Config.Image'
```
```terminaloutput
"zavy86/figlet"
```

Oltre a usare `jq`, possiamo anche usare l'opzione `--format` del comando `inspect` per ottenere informazioni specifiche
sulla base del medesimo path:

```shell
$ docker inspect --format '{{ json .Config.Image }}' zavy-figlet
```
```terminaloutput
"zavy86/figlet"
```

Il risultato è lo stesso, scegliete voi quello che più vi aggrada o col quale siete più soliti lavorare...

***

[Prosegui](../14-troubleshooting/IT.md) al prossimo capitolo.
