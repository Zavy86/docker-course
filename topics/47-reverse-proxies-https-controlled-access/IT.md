# Reverse proxies, HTTPS, and controlled access

> __one controlled entry point__
>
> - route requests to services
> - publish proxy ports only
> - keep internal services internal

Quando abbiamo la necessita di esporre più servizi web sul nostro host Docker, pubblicare una porta diversa per ogniuno
di essi significa dover ricordare indirizzi e porte, gestire più punti di accesso e occuparci della sicurezza delle
connessioni per ogni servizio.

Con il crescere delle applicazioni, questa configurazione diventa molto difficile da mantenere e può anche portarci al
rischio di esporre dei servizi che non dovevano essere raggiungibili direttamente.

Un reverse proxy è uno strumento che ci permette di usare un punto di ingresso comune dal quale ricevere le richieste
dei client e inoltrarle al servizio corretto in base alla richiesta. Può inoltre gestire in maniera centralizzata il 
protocollo HTTPS per tutti gli indirizzi esposti, mentre i servizi rimangono raggiungibili sulla rete interna di
Compose senza la necessità di pubblicare ciascuno una diversa porta dell'host.

In questo capitolo vedremo come usare Caddy per ridurre i punti di ingresso, partendo in locale in HTTP aggiungendo poi
i certificati per l'HTTPS solo dopo aver verificato il percorso delle richieste.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose/proxy
```

E vediamone il contenuto:

```shell
$ ls
```
```terminaloutput
Caddyfile
compose.yaml
```

In questa directory, troviamo un `Caddyfile`:

```caddyfile
http://localhost {
    reverse_proxy web:80
}
http://127.0.0.1 {
    reverse_proxy info:8080
}
```

Che tramite il nome di dominio al quale ci connetteremo, ci permette di scegliere un diverso servizio al quale puntare.

Per questa prima prova usiamo due indirizzi locali già disponibili sul vostro computer. Se state effettuando queste
prove su una macchina remota, sostituite `127.0.0.1` con l'indirizzo IP della macchina e `localhost` con il nome del 
dominio al quale è stata associata.

E un file `compose.yaml`:

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

Come possiamo vedere, in questo stack sono definiti tre servizi. Un `proxy` che come possiamo vedere è l'unico che
pubblica una porta sull'host, un classico `nginx` che di default pubblica localmente la porta `80` e una `busybox` con
un semplice server HTTP che pubblica localmente la porta `8080`.

Per quanto riguarda i volumi, servono a Caddy per salvarsi eventuali certificati, chiavi delle CA generate durante
l'avvio e gli stati interni del proxy. Questi volumi ci tornano utili per evitare di ricreare questi dati ogni volta che
aggiorniamo il container del proxy.

Senza ulteriore indugi, lanciamo quindi lo stack e vediamo cosa succede:

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

Una volta partito lo stack, diamo un occhiata ai logs del proxy:

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

Aprendo ora il nostro browser su `http://localhost` troveremo la pagina di benvenuto di Nginx, aprendo invece l'altro
indirizzo `http://127.0.0.1` troveremo il messaggio dell'`Information service`. 

Possiamo controllare anche da terminale, con il comando `curl`:

```shell
$ curl --fail http://localhost
$ curl --fail http://127.0.0.1
```

Come possiamo vedere, il proxy ascolta sulla stessa porta ma sceglie la destinazione in base all'hostname.

Ricordiamoci sempre di usare il nome del servizio e la sua _porta interna_, non quella pubblicata sull'host.

Se dovessimo ottenere un errore `502` potrebbe essere un problema di raggiungibilità, controlliamo che il nome del
servizio e che la porta siano corretti e assicuriamoci che i container siano stato avviati correttamente guardando i
relativi logs.

Non abbiamo imposto un ordine di avvio. Per pochi istanti il proxy potrebbe partire prima dei server,
quindi la verifica va fatta quando sono pronti. Un proxy deve saper gestire anche indisponibilità
successive, non soltanto una sequenza iniziale corretta.

***

Aggiungiamo poi in fondo al `Caddyfile` un terzo blocco:

```caddyfile
[...]
https://localhost:443 {
    tls internal
    reverse_proxy web:80
}
```

E abilitiamo anche questa seconda porta nel file `compose.yml`:

```yaml
[...]
proxy:
  image: caddy:2
  ports:
    - "80:80"
    - "443:443"
[...]
```

Una volta salvato il tuto riforziamo la creazione del proxy con:

```shell
$ docker compose up -d --force-recreate proxy
```
```terminaloutput
[+] up 1/1
 ✔ Container proxy-proxy-1 Started                                                                                  0.2s
```

E verifichiamo nuovamente i suoi logs:

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

E come possiamo notare, a differenza di prima, Caddy ci ha generato un certificato tramite la propria autorità locale.

Il browser non si fiderà automaticamente di questa autorità, perché il container non installa la propria fiducia sul
vostro computer, quindi il browser ci segnalerà counque un errore, ma nonostante questo, staremo comunque operando
tramite una connessione sicura.

Apriamo quindi il browser all'indirizzo `https://localhost`, accettiamo l'errore SSL e otterremo la pagina di Nginx.

Per una prova tramite `curl` aggiungiamo le opzioni `-k` e `-v` per vedere maggiori dettagli:

```shell
$ curl -k --fail https://localhost
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

E come possiamo vedere, stiamo ottenendo correttamente la pagina di Nginx con anche il certificato self-signed.

Stoppiamo poi tutto lo stack ed eliminiamo i volumi con il comando:

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

Se possediamo un dominio personalizzato possiamo usarlo al posto di `localhost`. Per raggiungere il proxy però, dobbiamo
prima configurare il DNS del dominio affinché punti all’indirizzo IP della macchina su cui gira Docker.

Caddy può richiedere e rinnovare automaticamente un certificato pubblico per il dominio. Nel normale percorso HTTP/TLS,
oltre a un DNS configurato correttamente, il proxy deve poter accedere a Internet e ricevere connessioni sulle porte
pubbliche 80 e 443. Dobbiamo quindi verificare che queste porte siano raggiungibili attraverso il firewall e se presenti
il router o il NAT e adattare le porte pubblicate in Compose alla configurazione del server.

Se vogliamo usare un certificato pubblico per un servizio che rimane privato, possiamo valutare una challenge DNS. Caddy
verifica il dominio tramite il provider DNS, usando un’integrazione e le relative credenziali. Questo percorso non rende
pubblico il servizio, ma richiede comunque un dominio valido, un nome inventato nella rete locale non basta per ottenere
un certificato pubblico.

Quando controlliamo la raggiungibilità, ricordiamoci anche degli eventuali record IPv4, IPv6 e del CGNAT, e proviamo ad
accedere dal dispositivo che userà davvero il servizio. Il DNS di Docker, infatti, permette ai container di trovare nomi
come `web`, ma non configura la risoluzione dei nomi nel browser o sugli altri dispositivi della rete.

Infine, HTTPS protegge la connessione e permette al client di verificare l’identità del server, ma non stabilisce chi
può usare l’applicazione. Per controllare gli accessi dobbiamo valutare separatamente login, autorizzazioni, eventuale
VPN e protezioni del proxy. Anche le dashboard amministrative, le API del proxy e il socket Docker richiedono una 
particolare attenzione e non vanno pubblicati se non strettamente necessario.

***

> __connect only the required networks__
>
> - private data network
> - proxy-facing application network
> - original scheme and client information

Nel piccolo esempio appena visto,tutti i servizi condividono la rete del progetto. In un'applicazione con database,
colleghiamo proxy e applicazione a una rete di ingresso mentre applicazione e database a una seconda rete.

Il database non pubblica porte e il proxy non deve appartenere alla rete dei dati.

Possiamo anche avere un proxy condiviso fra più progetti usando una rete esterna predisposta separatamente.

Una volta dichiarata una rete, associamola al proxy come visto nel
[capitolo dedicato alle reti](../41-networking-service-discovery-isolation/IT.md).

Se utilizziamo HTTPS invece che HTTP dobbiamo anche fare in modo che l'applicazione lo sappia, in modo da evitare che
generi indirizzi HTTP, redirect errati o cookie non appropriati. Caddy gestisce normalmente gli header inoltrati,
fra cui `X-Forwarded-For` e `X-Forwarded-Proto` ma l'applicazione deve essere predisposta per teneri in considerazione.

Se vogliamo rendere il tutto più sicuro, configuriamo l'applicazione perché si fidi soltanto del proxy previsto. Se
davanti a Caddy c'è un altro proxy, come una CDN, configuriamo anche lì le sorgenti fidate senza accettare alla cieca 
gli header inviati da qualunque client.

Caddy supporta anche i _WebSocket_, che permettono a client e applicazione di mantenere aperta una connessione e 
scambiarsi messaggi in entrambe le direzioni. Sono utili, per esempio, per aggiornare una chat senza dover ricaricare
continuamente la pagina. Se la nostra applicazione usa WebSocket, verifichiamo che la connessione funzioni anche
passando dal proxy e che rimanga aperta per il tempo necessario. Controlliamo inoltre gli eventuali timeout e proviamo
cosa succede durante un aggiornamento, se la connessione si interrompe, il client dovrebbe riuscire a riconnettersi.

Con un reverse proxy possiamo quindi offrire un punto di accesso comune ai nostri servizi, gestendo le connessioni HTTPS
e lasciando sulla rete interna quei servizi che non hanno bisogno di essere esposti direttamente.

***

> Resources
>
> - [Caddy with Docker Compose](https://caddyserver.com/docs/running#docker-compose)
