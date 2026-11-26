# Metrics and alerts

> __observe trends and react__
>
> - metrics describe change over time
> - dashboards help investigation
> - alerts request an action

How can we notice that a service is starting to have issues before it stops responding? Reading logs isn't always
enough because slowly growing memory usage or increasingly slower requests can be hard to spot by looking at
individual events.

To spot these signals, we can pair logs with metrics and alerts. While a log tells us about a single event, a metric
allows us to collect values and compare them over time. For instance, if we look at how much memory a service uses
throughout the day, we might notice that the usage keeps increasing even when the application seems to be running
normally.

Bringing these values into a graph makes it easier to recognize unusual trends. But we can't keep staring at a
dashboard all day, and that's where alerts come in. We can define a condition to check automatically and get a
notification when we need to intervene, without having to constantly verify the graphs.

In this chapter, we'll use a service to collect metrics at regular intervals and check alarm conditions. We'll then
add another service that receives the alarms and handles notifications. We'll start with data collection and then
simulate a failure to follow the path from the problem to the alert.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/monitoring
```

And let's see which files it contains:

```shell
$ ls
```
```terminaloutput
alerts.yaml
alertmanager.yaml
compose.yaml
prometheus.yaml
```

For now, let's ignore the first two and start with the `prometheus.yaml` file, where we tell Prometheus where to
collect the metrics and how often to do it.

```yaml
global:
  scrape_interval: 10s
  evaluation_interval: 10s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: [ "localhost:9090" ]
```

Prometheus collects metrics by sending periodic HTTP requests to the services we want to monitor. Each service we
want to query is called a target, and in the `targets` list, we specify its address and port.

In this first test, we want to monitor Prometheus itself, so we specified `localhost:9090`. Prometheus will read its
own metrics using the default path `/metrics`. In this case, the request starts from the Prometheus container, so
`localhost` refers to the container itself.

We set `scrape_interval` to collect data every ten seconds, while `evaluation_interval` determines how often to
evaluate the alert rules we'll add in a bit. This lets us see what Prometheus is doing, but to monitor other
services as well, we need to configure their respective targets.

Now let's move to the `compose.yaml`, which defines the service and the volume where the collected metrics will be
stored.

```yaml
volumes:
  prometheus-data:

services:
  prometheus:
    image: prom/prometheus:v3.13.3
    command:
      - --config.file=/etc/prometheus/prometheus.yaml
      - --storage.tsdb.path=/prometheus
      - --storage.tsdb.retention.time=7d
      - --storage.tsdb.retention.size=512MB
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yaml:/etc/prometheus/prometheus.yaml:ro
      - prometheus-data:/prometheus
```

Through the command arguments, we indicate the path to the configuration file, where to save the metrics, and the
limits to use for their retention, in this case, seven days and 512 MB. We'll dive into the meaning of these limits
at the end of the chapter. Then, we expose port `9090` and mount the configuration file in read-only mode. We use
the `prometheus-data` volume to keep the data even when we recreate the container.

At this point, we can start the stack.

```shell
$ docker compose up -d
```

Once the service is up and running, open `http://localhost:9090` and navigate to the targets page in the status
menu. If the one you configured shows as `UP`, Prometheus is successfully collecting its metrics. Next, switch to
the queries view and run the command `up`. The result will initially be shown as a table, but you can also switch to
the graph view to see how the same data can be represented in different ways.

When `up` is 1, we know that the collection was successful. However, this data alone doesn't tell us if all the
functions of an application are working correctly. A service might respond to monitoring requests but still have an
issue during a payment or file upload.

Let's also try the query `process_resident_memory_bytes`, which allows us to observe the memory occupied by a
specific process. By looking at the graph, we can track its trend over time, keeping in mind that we're measuring
just that single process and not the total memory usage of the machine.

***

Now that we can collect and visualize the data, we add a rule that signals when the collection fails.

So let's look at the configuration in the `alerts.yaml` file:

```yaml
groups:
  - name: demo
    rules:
      - alert: DemoTargetDown
        expr: up{job="prometheus"} == 0
        for: 30s
        labels:
          severity: warning
        annotations:
          summary: "The demo target is down"
```

Beyond the group name and rule name, we find the expression that checks if `up` equals zero for the target
associated with the `prometheus` job. With `for: 30s`, we ask that the condition remain true for the entire duration
of thirty seconds before considering the alert active, thus avoiding that a single transient error triggers an alert
immediately.

To get Prometheus to read the rule, we're going to modify the `prometheus.yaml` file:

```yaml
rule_files:
  - /etc/prometheus/alerts.yaml

alerting:
  alertmanagers:
    - static_configs:
        - targets: [ "alertmanager:9093" ]
```

In this way, we'll specify both the rules file and the Alertmanager service address, which we'll add to the stack by
modifying the `compose.yaml` file.

```yaml
volumes:
  prometheus-data:
  alertmanager-data:

services:
  prometheus:
    image: prom/prometheus:v3.13.3
    command:
      - --config.file=/etc/prometheus/prometheus.yaml
      - --storage.tsdb.path=/prometheus
      - --storage.tsdb.retention.time=7d
      - --storage.tsdb.retention.size=512MB
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yaml:/etc/prometheus/prometheus.yaml:ro
      - ./alerts.yaml:/etc/prometheus/alerts.yaml:ro
      - prometheus-data:/prometheus

  alertmanager:
    image: prom/alertmanager:v0.34.1
    command:
      - --config.file=/etc/alertmanager/alertmanager.yaml
      - --storage.path=/alertmanager
      - --cluster.listen-address=
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yaml:/etc/alertmanager/alertmanager.yaml:ro
      - alertmanager-data:/alertmanager
```

We also declare `alertmanager-data` in the `volumes` section at the top level of the file. This volume will store
Alertmanager's state, including the rules for temporarily suspending notifications. Then, we add the mount for the
`alerts.yaml` file to the Prometheus service and configure the Alertmanager service in a very similar way to the
first one. The empty argument disables cluster listening, which we don't need in this single-instance example.

Just to clarify, Prometheus is responsible for evaluating the rules, while Alertmanager receives the alerts and
decides how to group them and who to send them to. So, let's proceed by creating the `alertmanager.yaml` file:

```yaml
receivers:
  - name: demo

route:
  receiver: demo
  group_by: [ alertname ]
  group_wait: 5s
  group_interval: 30s
  repeat_interval: 1h
```

In this setup, all alerts are directed to the recipient named `demo` and grouped by their name. The configured
expectations allow you to collect related alerts together and adjust the sending and resending of updates, so you
don't end up with a notification for every single event.

For now, the recipient `demo` doesn't have an external integration. So we'll only see the alert in Alertmanager's
interface, but we won't receive any emails or messages yet. We need to make sure the two services are communicating
correctly before we add a real notification channel.

Before applying the changes, let's check the configuration of both services with the tools provided by their
respective images, starting with Prometheus:

```shell
$ docker compose run --rm --no-deps --entrypoint promtool prometheus check config /etc/prometheus/prometheus.yaml
```
```terminaloutput
[+] run 1/1
 ✔ Container monitoring-prometheus-run-b5e808a019d4 Created                                                         0.0s
Checking /etc/prometheus/prometheus.yaml
  SUCCESS: 1 rule files found
 SUCCESS: /etc/prometheus/prometheus.yaml is valid prometheus config file syntax
Checking /etc/prometheus/alerts.yaml
  SUCCESS: 1 rules found
```

For Alertmanager:

```shell
$ docker compose run --rm --no-deps --entrypoint amtool alertmanager check-config /etc/alertmanager/alertmanager.yaml
```
```terminaloutput
[+] run 10/10
 ✔ Volume monitoring_alertmanager-data                Created                                                       0.0s
 ✔ Image prom/alertmanager:v0.34.1                    Pulled                                                        2.3s
 ✔ Container monitoring-alertmanager-run-3c3fc70c0443 Created                                                       0.0s
Checking '/etc/alertmanager/alertmanager.yaml'  SUCCESS
Found:
 - global config
 - route
 - 0 inhibit rules
 - 1 receivers
 - 0 templates
```

If everything has gone smoothly, we'll recreate the containers to load the new files:

```shell
$ docker compose up -d --force-recreate
```
```terminaloutput
[+] up 2/2
 ✔ Container monitoring-alertmanager-1 Started                                                                      0.3s
 ✔ Container monitoring-prometheus-1   Started                                                                      0.2s
```

Once the stack is up and running, let's also open `http://localhost:9093`, where you'll find the Alertmanager
interface.

If we move to the `Status` section, we can make sure everything is working correctly. The `disabled` label on the
cluster matches what we've set in the Compose file.

Let's go back to the `Alerts` section and to see the entire path of an alert, let's simulate a problem by changing
the target of collection in `prometheus.yaml` from `localhost:9090` to `localhost:9091`. With this wrong port, the
collection will fail, while Prometheus will continue to function and can therefore detect the problem and signal it.

We apply the change by forcing the recreation of the container:

```shell
$ docker compose up -d --force-recreate prometheus
```
```terminaloutput
[+] up 1/1
 ✔ Container monitoring-prometheus-1 Started                                                                        0.2s
```

And let's see what happens in the two interfaces.

In the Prometheus `Alerts` view, we can easily follow this step: when the condition is detected, the alert enters
the `pending` state, meaning it remains in wait to verify if the issue persists. If the problem continues for the
expected duration, it transitions to the `firing` state and can be sent to Alertmanager. The times we'll observe
depend on the collection and evaluation intervals that were configured beforehand.

After a few collection and evaluation cycles, we'll see `up` drop to zero and the alert transition from `pending` to
`firing`. At that point, it will also appear in Alertmanager, confirming that the alert has reached its destination.

After the test, let's restore `localhost:9090` and recreate Prometheus with the same command:

```shell
$ docker compose up -d --force-recreate prometheus
```
```terminaloutput
[+] up 1/1
 ✔ Container monitoring-prometheus-1 Started                                                                        0.2s
```

We check that the target is back to `UP` and that the alert resolves, giving Alertmanager enough time to update its
status. Be aware, after recreating Prometheus, it might take a few minutes for the alert to clear, even if metric
collection has resumed correctly.

To check which address is being probed now, look at Prometheus's target page, where `localhost:9090` should appear
with a status of `UP`. After recreating, the `up` query might still show the old zero value for `localhost:9091` for
a few minutes because the previously collected data remains in the volume. The two ports identify two different
series, so the new value of `9090` doesn't replace the one for `9091`.

Let's stop the stack with:

```shell
$ docker compose down
```
```terminaloutput
[+] down 3/3
 ✔ Container monitoring-alertmanager-1 Removed                                                                      0.1s
 ✔ Container monitoring-prometheus-1 Removed                                                                        0.1s
 ✔ Network monitoring_default Removed                                                                               0.1s
```

***

> __test the last mile__
>
> - configure a real destination
> - verify firing and resolved messages
> - protect notification credentials

So far, we've confirmed that the alert reaches Alertmanager, but to be notified even when we don't have the
interface open, we need to connect a channel we check regularly. For that, we could use any service for which
Alertmanager already has an integration. But I'll leave that choice up to you...

Once you've updated and validated the new configuration with `amtool` and recreated the `alertmanager` service,
repeat the demonstrative outage by temporarily changing the target port and follow through with the test until you
receive both the alert message and the resolution message after the issue is fixed.

The test is complete when the recipient actually receives the message. Seeing the alert in the interface only
confirms part of the process. When preparing notifications, we also aim to make them useful for the recipients, by
indicating what to check and who should intervene. Grouping and repeat intervals then help us avoid a single issue
triggering a continuous stream of alerts.

***

> __expand only where needed__
>
> - useful dashboards
> - host and application metrics
> - protected monitoring endpoints

In this example, we've only looked at Prometheus, but to extend the monitoring to a real application, we would need
to add its metrics endpoint or a suitable exporter for the system we want to monitor.

An exporter gathers information from that system and exposes it in the format that Prometheus can read. Even though
we've already defined a Docker healthcheck, we'll still need an explicit collection to have those data available
over time within Prometheus.

It's best to start with a few signals that help us understand how the service is running, like availability, the
number of errors, and request duration. Depending on our needs, we can then add memory and CPU usage, restarts, free
space, volume growth, or certificate expiration.

For storage, it can be useful to monitor free inodes, as they determine the ability to create new files.

Before writing an alert rule, we always make sure that the relevant metric is actually being collected and that it
represents what we really want to measure.

To collect metrics from a Linux host, we can use `Node Exporter`, while for checking the response of an HTTP
endpoint or its TLS certificate, we can use a dedicated probe. When an exporter requires access to the host's
filesystem or namespaces, we should evaluate the necessary privileges before adding them to the container.

If we want to combine more graphs into reusable dashboards, we can integrate Grafana as a separate service on the
monitoring network, assigning it a volume to store its state and protecting administrative access.

Let's start with a panel based on a query we've already verified in Prometheus, so we know what data to expect. Then
we can add the other necessary graphs. If we import a dashboard prepared by others, we need to check which metrics
and exporters are required, because without them, some panels will remain empty and won't give us information about
the state of our services.

For our exercise, Prometheus views and graphs are sufficient. If we want to access monitoring remotely later, we
need to protect both the interfaces and the metric endpoints with authentication and access control. The collected
data could reveal internal names, paths, and service behavior details, so they shouldn't be freely exposed on the
Internet.

***

> __monitor the monitoring system__
>
> - retention consumes disk
> - same-host monitoring shares failures
> - verify recovery and delivery

Also, the monitoring system uses resources and needs to be monitored. In the initial setup, we set seven days and
512 MB for metric storage. The first of the two limits that gets hit triggers the removal of historical data, but
this doesn't mean the volume can't exceed 512 MB.

Prometheus needs to store recent data and the write-ahead log, called WAL, and it requires space during compaction
when it reorganizes the saved data.

Let's leave some margin on the disk and also observe the growth of storage used by monitoring.

The log rotation seen in the previous chapter deals with container messages, while the metrics database is managed
by Prometheus through its own retention settings.

Let's also think about where we're running these services. If the application, Prometheus, and Alertmanager are all
running on the same host, a failure of the entire machine could bring down the system that should alert us.

To catch this situation, we need a check performed by an independent system, or an external heartbeat, which is a
periodic signal whose absence triggers an alert. And of course, this mechanism also needs to be tested by
intentionally interrupting the signal and verifying that the alert arrives.

***

> Resources
>
> - [Getting started with Prometheus](https://prometheus.io/docs/prometheus/latest/getting_started/)
> - [prom/prometheus](https://hub.docker.com/r/prom/prometheus)
> - [prom/alertmanager](https://hub.docker.com/r/prom/alertmanager)

[Continue](../50-troubleshooting-stacks/README.md) to the next chapter.
