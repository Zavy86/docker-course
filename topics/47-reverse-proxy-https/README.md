# Reverse proxy and HTTPS

> __one controlled entry point__
>
> - route requests to services
> - publish proxy ports only
> - keep internal services internal

When we need to expose multiple web services on our Docker host, publishing a different port for each one means we
have to remember addresses and ports, manage multiple access points, and deal with security for each service.

As applications grow, this configuration becomes much harder to maintain and can also expose services that shouldn't
be directly reachable.

A reverse proxy is a tool that lets us use a single entry point to receive client requests and forward them to the
correct service based on the request. It can also centrally manage the HTTPS protocol for all exposed addresses,
while the services remain reachable on the Compose internal network without the need to publish a different host
port for each one.

In this chapter, we'll see how to use Caddy to reduce the number of entry points, starting with a local HTTP setup
and then adding SSL certificates for HTTPS only after verifying the request paths.

***

If we haven't already done so, let's clone the course repository.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Let's move into the example directory.

```shell
$ cd docker-course/sources/compose/proxy
```

And let's take a look at its content:

```shell
$ ls
```
```terminaloutput
Caddyfile
compose.yaml
```

In this directory, we find a `Caddyfile`:

```caddyfile
http://localhost {
    reverse_proxy web:80
}
http://127.0.0.1 {
    reverse_proxy info:8080
}
```

Through the domain name we connect to, it allows us to choose a different service to point to.

For this first test, we'll use two local addresses that are already available on your computer. If you're running
these tests on a remote machine, replace `127.0.0.1` with the machine's IP address and `localhost` with the domain
name it's associated with.

And an `compose.yaml` file:

```yaml
volumes:
  caddy-data:
  caddy-config:

services:
  proxy:
    image: caddy:2
    ports:
      - "80:80"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
  web:
    image: nginx
  info:
    image: busybox
    command:
      - sh
      - -ec
      - |
        mkdir -p /www
        echo "Information service" > /www/index.html
        exec httpd -f -p 8080 -h /www
```

As you can see, this stack defines three services. A `proxy`, which is the only one publishing a port to the host, a
classic `nginx` that by default publishes port `80` locally, and a `busybox` with a simple HTTP server that
publishes port `8080` locally.

Regarding volumes, Caddy uses them to save any certificates, CA keys generated during startup, and the internal
states of the proxy. These volumes are useful for avoiding recreating these data every time we update the proxy
container.

Without any further delay, let's launch the stack and see what happens:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 14/14
 ✔ Image caddy:2             Pulled                                                                                 3.5s
 ✔ Network proxy_default     Created                                                                                0.0s
 ✔ Volume proxy_caddy-config Created                                                                                0.0s
 ✔ Volume proxy_caddy-data   Created                                                                                0.0s
 ✔ Container proxy-web-1     Started                                                                                0.1s
 ✔ Container proxy-proxy-1   Started                                                                                0.2s
 ✔ Container proxy-info-1    Started                                                                                0.2s
```

Once the stack is up, let's take a look at the proxy logs:

```shell
$ docker compose logs proxy
```
```terminaloutput
proxy-1  | {"level":"info","ts":1794476942.8513513,"msg":"maxprocs: Leaving GOMAXPROCS=16: CPU quota undefined"}
proxy-1  | {"level":"info","ts":1794476942.851366,"msg":"GOMEMLIMIT is updated","GOMEMLIMIT":15070471372,"previous":9223372036854775807}
proxy-1  | {"level":"info","ts":1794476942.8513682,"msg":"using config from file","file":"/etc/caddy/Caddyfile"}
proxy-1  | {"level":"info","ts":1794476942.8513691,"msg":"adapted config to JSON","adapter":"caddyfile"}
proxy-1  | {"level":"warn","ts":1794476942.85137,"msg":"Caddyfile input is not formatted; run 'caddy fmt --overwrite' to fix inconsistencies","adapter":"caddyfile","file":"/etc/caddy/Caddyfile","line":2}
proxy-1  | {"level":"info","ts":1794476942.8532138,"logger":"admin","msg":"admin endpoint started","address":"localhost:2019","enforce_origin":false,"origins":["//localhost:2019","//[::1]:2019","//127.0.0.1:2019"]}
proxy-1  | {"level":"warn","ts":1794476942.8532941,"logger":"http.auto_https","msg":"server is listening only on the HTTP port, so no automatic HTTPS will be applied to this server","server_name":"srv0","http_port":80}
proxy-1  | {"level":"info","ts":1794476942.853399,"logger":"tls.cache.maintenance","msg":"started background certificate maintenance","cache":"0x5be6aec82400"}
proxy-1  | {"level":"warn","ts":1794476942.8535001,"logger":"http","msg":"HTTP/2 skipped because it requires TLS","network":"tcp","addr":":80"}
proxy-1  | {"level":"warn","ts":1794476942.8535078,"logger":"http","msg":"HTTP/3 skipped because it requires TLS","network":"tcp","addr":":80"}
proxy-1  | {"level":"info","ts":1794476942.853509,"logger":"http.log","msg":"server running","name":"srv0","protocols":["h1","h2","h3"]}
proxy-1  | {"level":"info","ts":1794476942.853575,"msg":"autosaved config (load with --resume flag)","file":"/config/caddy/autosave.json"}
proxy-1  | {"level":"info","ts":1794476942.8535798,"msg":"serving initial configuration"}
proxy-1  | {"level":"info","ts":1794476942.8544176,"logger":"tls","msg":"cleaning storage unit","storage":"FileStorage:/data/caddy"}
proxy-1  | {"level":"info","ts":1794476942.8560448,"logger":"tls","msg":"finished cleaning storage units"}
```

Now opening our browser to `http://localhost`, we'll find the Nginx welcome page. Opening `http://127.0.0.1`
instead, we'll see the `Information service` message.

We can also check it from the terminal using the `curl` command:

```shell
$ curl --fail http://localhost
$ curl --fail http://127.0.0.1
```

As you can see, the reverse proxy listens on the same port, but it chooses the destination based on the hostname.

Always remember to use the service name and its _internal port_, not the published port on the host.

If we were to get a `502` error, it could be a connectivity issue. Let's check that the service name and port are
correct, and make sure the containers have started correctly by looking at their logs.

We haven't set an order of startup. For a few moments, the proxy might start before the servers, so the check will
need to be done when everything is ready. A proxy must also handle subsequent unavailability, not just a correct
initial sequence.

***

Then we add a third block at the bottom of the `Caddyfile`:

```caddyfile
[...]
https://localhost:443 {
    tls internal
    reverse_proxy web:80
}
```

And we also enable this second port in the `compose.yml` file:

```yaml
[...]
proxy:
  image: caddy:2
  ports:
    - "80:80"
    - "443:443"
[...]
```

Once saved, force the recreation of the proxy with:

```shell
$ docker compose up -d --force-recreate proxy
```
```terminaloutput
[+] up 1/1
 ✔ Container proxy-proxy-1 Started                                                                                  0.2s
```

And let's check its logs again:

```shell
$ docker compose logs proxy
```
```terminaloutput
[...]
proxy-1  | {"level":"warn","ts":1794477560.1605313,"logger":"pki.ca.local","msg":"installing root certificate (you might be prompted for password)","path":"storage:pki/authorities/local/root.crt"}
proxy-1  | {"level":"info","ts":1794477560.1606698,"msg":"warning: \"certutil\" is not available, install \"certutil\" with \"apt install libnss3-tools\" or \"yum install nss-tools\" and try again"}
proxy-1  | {"level":"info","ts":1794477560.1606746,"msg":"define JAVA_HOME environment variable to use the Java trust"}
proxy-1  | {"level":"info","ts":1794477560.1686199,"msg":"certificate installed properly in linux trusts"}
[../]
```

And as we can see, unlike before, Caddy has generated a certificate through its own local authority.

The browser won't automatically trust this authority because the container doesn't install the CA certificate among
the trusted ones on your computer. So it will report an error, the connection is encrypted, but the browser can't
verify the server's identity through an authority it recognizes.

Opening `https://localhost`, we'll see this warning. If we choose to proceed for just local testing, we'll see the
Nginx page bypassing the certificate check.

For a test via `curl`, we add the options `-k` and `-v` to see more details:

```shell
$ curl -k -v --fail https://localhost
```
```terminaloutput
* Host localhost:443 was resolved.
* IPv6: ::1
* IPv4: 127.0.0.1
*   Trying [::1]:443...
* Connected to localhost (::1) port 443
* ALPN: curl offers h2,http/1.1
* (304) (OUT), TLS handshake, Client hello (1):
* (304) (IN), TLS handshake, Server hello (2):
* (304) (IN), TLS handshake, Unknown (8):
* (304) (IN), TLS handshake, Certificate (11):
* (304) (IN), TLS handshake, CERT verify (15):
* (304) (IN), TLS handshake, Finished (20):
* (304) (OUT), TLS handshake, Finished (20):
* SSL connection using TLSv1.3 / AEAD-CHACHA20-POLY1305-SHA256 / [blank] / UNDEF
* ALPN: server accepted h2
* Server certificate:
*  subject: [NONE]
*  start date: Nov 12 10:09:58 2026 GMT
*  expire date: Nov 12 22:09:58 2026 GMT
*  issuer: CN=Caddy Local Authority - ECC Intermediate
*  SSL certificate verify result: unable to get local issuer certificate (20), continuing anyway.
* using HTTP/2
* [HTTP/2] [1] OPENED stream for https://localhost/
* [HTTP/2] [1] [:method: GET]
* [HTTP/2] [1] [:scheme: https]
* [HTTP/2] [1] [:authority: localhost]
* [HTTP/2] [1] [:path: /]
* [HTTP/2] [1] [user-agent: curl/8.7.1]
* [HTTP/2] [1] [accept: */*]
> GET / HTTP/2
> Host: localhost
> User-Agent: curl/8.7.1
> Accept: */*
> 
* Request completely sent off
< HTTP/2 200 
< accept-ranges: bytes
< alt-svc: h3=":443"; ma=2592000
< content-type: text/html
< date: Thu, 12 Nov 2026 10:12:38 GMT
< etag: "6ad8cb33-380"
< last-modified: Wed, 21 Oct 2026 14:24:51 GMT
< server: nginx/1.31.8
< via: 1.1 Caddy
< content-length: 896
< 
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, nginx is successfully installed and working.
Further configuration is required for the web server, reverse proxy, 
API gateway, load balancer, content cache, or other features.</p>

<p>For online documentation and support please refer to
<a href="https://nginx.org/">nginx.org</a>.<br/>
To engage with the community please visit
<a href="https://community.nginx.org/">community.nginx.org</a>.<br/>
For enterprise grade support, professional services, additional 
security features and capabilities please refer to
<a href="https://f5.com/nginx">f5.com/nginx</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
* Connection #0 to host localhost left intact
```

And as you can see, we're correctly getting the Nginx page with the self-signed certificate.

Let's stop the entire stack and remove the volumes with the command:

```shell
$ docker compose down -v
```
```terminaloutput
[+] down 6/6
 ✔ Container proxy-info-1    Removed                                                                                3.1s
 ✔ Container proxy-proxy-1   Removed                                                                                0.2s
 ✔ Container proxy-web-1     Removed                                                                                0.2s
 ✔ Volume proxy_caddy-data   Removed                                                                                0.0s
 ✔ Network proxy_default     Removed                                                                                0.1s
 ✔ Volume proxy_caddy-config Removed                                                                                0.0s
```

***

> __public names require real infrastructure__
>
> - DNS and reachability
> - HTTPS is not authentication
> - certificate issuance and renewal

If we have a custom domain, we can use it instead of `localhost`. However, to reach the proxy, we first need to
configure the DNS for the domain to point to the IP address of the machine where Docker is running.

Caddy can automatically request and renew a public certificate for the domain. In the standard HTTP/TLS flow,
besides correctly configured DNS, the proxy must be able to access the internet and receive connections on the
public ports 80 and 443. So, we need to ensure these ports are reachable through the firewall, and if there's a
router or NAT involved, we need to adjust the published ports in Compose to match the server configuration.

If we want to use a public certificate for a service that remains private, we can consider a DNS challenge. Caddy
verifies the domain through the DNS provider using an integration and its credentials. This path doesn't expose the
service publicly, but it still requires a valid domain. A made-up name in the local network won't suffice to get a
public certificate.

When we check reachability, remember to also consider any potential IPv4, IPv6 records, and CGNAT, and try accessing
it from the device that will actually use the service. Docker's DNS, however, allows containers to find names like
`web`, but it doesn't configure name resolution in the browser or on other network devices.

Finally, HTTPS secures the connection and allows the client to verify the server's identity, but it doesn't
determine who can use the application. To control access, we need to separately evaluate login, authorization, any
potential VPN, and proxy protections. Even administrative dashboards, proxy APIs, and Docker sockets require special
attention and shouldn't be published unless strictly necessary.

***

> __connect only the required networks__
>
> - private data network
> - proxy-facing application network
> - original scheme and client information

In the small example we just saw, all services share the project network. In an application with a database, we
connect the proxy and the application to an ingress network, while the application and the database are on a second
network.

The database doesn't publish any ports, and the proxy shouldn't be part of the data network.

We can also have a shared proxy for multiple projects using a separate external network.

Once you've declared a network, associate it with the proxy as shown in the
[chapter on networks](../41-compose-networking/README.md).

When we use HTTPS instead of HTTP, we also need to make sure the application is aware of this so it doesn't generate
HTTP addresses, incorrect redirects, or inappropriate cookies. Caddy typically handles forwarded headers, including
`X-Forwarded-For` and `X-Forwarded-Proto`, but the application must be configured to take these into account.

If we want to make everything more secure, we configure the application to trust only the intended proxy. If there's
another proxy in front of Caddy, like a CDN, we also configure it to trust only the sources we know and accept,
without blindly accepting headers from any client.

Caddy also supports _WebSockets_, which let a client and an application keep a connection open and exchange messages
in both directions. They're useful, for example, for updating a chat without continually reloading the page. If our
application uses WebSockets, let's check that the connection works through the proxy and stays open as long as we
need it. Let's also check for timeouts and see what happens during an update. If the connection drops, the client
should be able to reconnect.

With a reverse proxy, we can provide a common access point for our services, handling the HTTPS connections and
leaving those services on the internal network that don't need to be exposed directly.

***

> Resources
>
> - [Caddy with Docker Compose](https://caddyserver.com/docs/running#docker-compose)
> - [busybox](https://hub.docker.com/_/busybox)
> - [caddy](https://hub.docker.com/_/caddy)
> - [nginx](https://hub.docker.com/_/nginx)

[Continue](../48-service-logs/README.md) to the next chapter.
