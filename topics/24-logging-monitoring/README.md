# Logging and monitoring

> __logging and monitoring__
>
> - standard output
> - standard error
> - local files
> - services

There are several ways to send logs on Unix systems. Starting from the simplest, such as directing them to standard 
output or standard error, to more complex methods like writing to local files (where we then need to handle periodic log
rotation), up to using internal or external services dedicated specifically to log collection.

All these methods are also available for Docker containers.

---

Standard output and standard error are the two main and most commonly used channels for sending logs. These channels are
managed directly by the engine, and each line written to either of them is received by Docker, which by default records 
them in its own log file.

This file can be viewed using the `docker logs` command or through the related APIs. As we will see later, this behavior
can also be customized.

---

Writing local log files may seem like a very effective method, but there are some important details to consider. First, 
to access these files, you need to either "enter" the container using the `docker exec` command or extract them with 
`docker cp`. Additionally, if the container stops and cannot be easily restarted, you may not be able to access to the
logs, requiring alternative strategies as discussed in previous chapters. Finally, if the container is deleted, also the
related logs will be lost permanently.

So, how should we handle applications that can only generate logs to files? One solution is to use a volume mounted in
the directory where the application writes its logs by default, and then run a second container that shares the same 
volume with an application like `filebeat` to collect the logs and send them to a centralized log server. Another option 
is to use a volume mapped to a local directory so you can access the logs directly from the host.

---

The use of logging services through dedicated frameworks or protocols offers several advantages. These mechanisms can be
used both inside and outside containers with minimal differences. In some cases, we can leverage container networking to 
simplify configuration: for example, our code can send log messages to a server named `log`, whose name will resolve to
different addresses depending on whether we are in a development environment, production, etc.

If instead our application (or the program running in the container) uses the syslog protocol, one option is to run a 
syslog server inside the container, which can be configured to write to local files or forward logs over the network.

***

As mentioned earlier, by default, if logs are managed through standard output and standard error, they will be directly
transmitted to the container's log file. This is because the default driver used by Docker is `json-file`, as we can 
easily verify with the following command:

```shell
$ docker info --format '{{ json .LoggingDriver}}'
```

However, through plugins, we can choose to use the method that best suits our environment.

If we decide to keep the default driver, there are some important aspects to consider. First of all, unless specified 
otherwise, the size of log files is not limited. This means that very verbose containers or containers running for a 
long time may generate increasingly large log files, eventually consuming all available disk space.

To avoid this problem, we can set a maximum size for log files and the number of log files to retain. When these limits 
are exceeded, the oldest logs will be deleted.

These settings can be managed through the `daemon.json` configuration file, as we will see in a later chapter dedicated
to [Docker settings](../26-common-settings/IT.md), or per individual container.

By using the `--log-opt` option, we can set variables such as:

```shell
$ docker run -d --log-opt max-size=9m --log-opt max-file=3 zavy86/clock
```

And to verify the settings, we can use the following command:

```shell
$ docker inspect --format '{{json .HostConfig.LogConfig}}' $(docker ps -lq) | jq
```
```json
{
  "Type": "json-file",
  "Config": {
    "max-file": "3",
    "max-size": "9m"
  }
}
```

***

> __logging and monitoring__
>
> - elk stack
>   - elasticsearch
>   - logstash
>   - kibana
> - gelf socket

Let's now look at an alternative example of log management using the `ELK` stack.

The ELK stack is a combination of three open-source projects: Elasticsearch, Logstash, and Kibana. It is mostly used to
collect, aggregate, analyze, and visualize logs and is very popular due to its open-source license.

Elasticsearch acts as a database where logs are stored, Logstash is a tool that allows us to receive logs, process them,
and forward them to various destinations, and Kibana is a web interface that enables us to visualize and search logs
through an intuitive web interface.

We will use the `GELF` protocol to send logs to Logstash, which will then forward them to Elasticsearch.

***

Let's start this ELK stack using [Docker Compose](../../sources/elk), which is included in this repository.

If we haven't cloned it yet, let's do so:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move to the directory:

```shell
$ cd docker-course/source/elk
```

And let's run the command:

```shell
$ docker compose up -d
```
```terminaloutput
[+] Running 4/4
 ✔ Network elk_default            Created
 ✔ Container elk-elasticsearch-1  Started 
 ✔ Container elk-kibana-1         Started
 ✔ Container elk-logstash-1       Started
```

As you can see from the containers that have been started, we are using the official images from Docker Hub.

```shell
$ cat docker-compose.yml
```

The configuration is very simple: for Elasticsearch, we have set the image; for Kibana, we have set an environment 
variable with the URL of the Elasticsearch server and exposed the port that we will use in the browser to access the web
interface; for Logstash, we have configured it to receive logs in `GELF` format on port `12201/udp` and forward them to
Elasticsearch.

Next, we launch our `clock` container to generate some log traffic:

```shell
$ docker run -d --log-driver=gelf --log-opt=gelf-address=udp://localhost:12201 zavy86/clock
```

Now open the Kibana web page on port `5601` of your host's IP address and create a new index pattern with the value 
`logstash-*` and set the Time-field to `@timestamp`.

Next, go to the `Discover` section at the top left, click on `Last 15 minutes` at the top right, select `Auto-refresh`,
and choose the `every 5 seconds` option.

If everything went well, you should see the logs generated by your `clock` container appear, for example:

```terminaloutput
[...]
"_source": {
    "version": "1.1",
    "host": "worker1",
    "level": 6,
    "@version": "1",
    "@timestamp": "2025-10-08T16:10:35.079Z",
    "source_host": "172.20.0.1",
    "message": "Wed Oct  8 16:10:35 UTC 2025",
    "command": "/bin/sh -c while date; do sleep 1; done;",
    "container_id": "cbe2b858479c312d6e16640ff11f7a17c389c8155b3307ddeb017557ea7176bb",
    "container_name": "exciting_noether",
    "created": "2025-10-08T16:07:10.798858261Z",
    "image_id": "sha256:44f02f010b3da74ebff1a90b59ebb86037849279997b7020f4726e7a4ca4005b",
    "image_name": "clock",
    "tag": "cbe2b858479c"
}
[...]
```

It is important to further emphasize that this is a test configuration intended solely for educational and demonstrative
purposes. The versions of the software used here are very outdated and were chosen for their lightweight nature and ease
of use. In a production environment, more up-to-date and reliable versions should be used.

***

> Resources:
> - [elk](../../sources/elk)
> - [elasticsearch](https://hub.docker.com/_/elasticsearch)
> - [kibana](https://hub.docker.com/_/kibana)
> - [logstash](https://hub.docker.com/_/logstash)
> - [zavy86/clock](https://hub.docker.com/r/zavy86/clock)

[Prosegui](../25-multi-architecture-builds/IT.md) al prossimo capitolo.
