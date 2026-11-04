# Networking, service discovery, and isolation

> __networking with compose__
>
> - service names instead of addresses
> - container ports and host ports
> - connect only what is needed

Nei capitoli precedenti abbiamo già visto che possiamo contattare un servizio usando il suo nome. Questo perché Compose
prepara una rete per ogni progetto e Docker permette ai container collegati insieme di trovarsi tramite il DNS interno.

Non dobbiamo conoscere in anticipo l'indirizzo del container, possiamo usare il nome del servizio anche quando Compose
lo sostituisce e il suo indirizzo cambia. Il nome è disponibile ai container che condividono una rete, mentre per
raggiungere un servizio dalla macchina host dobbiamo generalmente pubblicare una porta.

La porta usata fra i container è quella su cui ascolta il servizio, la porta pubblicata sull'host può essere diversa.

In questo capitolo vedremo come distinguere i due casi e come collegare ogni servizio soltanto alle reti di cui ha
bisogno, limitando così le comunicazioni possibili che è sempre una buona pratica.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose/lookup
```

E analizziamo il file `compose.yaml`:

```yaml
services:
  server:
    image: nginx
    ports:
      - "8080:80"
  client:
    image: busybox
    command: [ "sleep", "infinity" ]
```

Come possiamo vedere è un semplice stack con al suo interno due servizi, un web server (nginx) esposto sulla porta `80` 
del container e `8080` sull'host, e un client (busybox), procediamo quindi avviandolo in background:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 3/3
 ✔ Network networking_default    Created                                                                            0.0s
 ✔ Container networking-server-1 Started                                                                            0.3s
 ✔ Container networking-client-1 Started                                                                            0.2s
```

Proviamo ora a eseguire un lookup: 

```shell
$ docker compose exec client nslookup server
```
```terminaloutput
Server:  127.0.0.11
Address: 127.0.0.11:53

Non-authoritative answer:
Name:    server
Address: 10.10.5.3
```

Come possiamo vedere cercando tramite il nome del servizio abbiamo ottenuto l'indirizzo IP associato al container
(ovviamente sul vostro computer questi indirizzi potrebbero essere diversi).

Proviamo ora a richiedere la pagina tramite `wget`:

```shell
$ docker compose exec client wget -q -O - http://server:80
```
```terminaloutput
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
```

Come possiamo vedere, da dentro alla rete, i container possono comunicare tra loro usando il nome e la porta associati a
ogni servizio. Mentre se volessimo aprire la stessa pagina sul nostro browser, non potremo usare ne il nome `server` ne
la porta `80`, ma dovremmo invece puntare all'indirizzo [http://localhost:8080](http://localhost:8080).

Una volta terminate le prove stoppiamo tutto con:

```shell
$ docker compose down
```
```terminaloutput
[+] down 3/3
 ✔ Container networking_default Removed                                                                             1.8s
 ✔ Container networks-server-1  Removed                                                                             0.3s
 ✔ Container networks-client-1  Removed                                                                             3.3s
```

***

> __names and reachability__
>
> - localhost means this container
> - dns does not guarantee readiness
> - expose is not a firewall

Dentro ai container (`client` nel nostro esempio), non abbiamo usato `localhost` perché avremmo puntato a se stesso, non
al container Nginx e neppure il nostro host. Per comunicare con Nginx dobbiamo usare `server`, sulla rete condivisa.

L'applicazione destinataria deve inoltre ascoltare su un indirizzo raggiungibile del container, normalmente `0.0.0.0`,
non soltanto sul proprio loopback. Se pubblichiamo una porta di un container che ascolta esclusivamente su `127.0.0.1`
continuerà a non essere raggiungibile ne dall'interno ne dall'esterno.

Se provate a eliminare il frammento `ports` dal file e a rilanciare lo stack, la richiesta da `client` verso `server` 
continuerà a funzionare, mentre l'accesso tramite la porta host non sarà più disponibile.

Un ultimo appunto, fate attenzione all'istruzione `EXPOSE` che avevamo visto nella prima parte del corso relativa alle
immagini per descrivere le porte esposte, **non si tratta di una lista di porte consentite**, non agisce da firewall.
Sulla rete condivisa possono essere raggiunte tutte le porte sulle quali ci sia un servizio in ascolto indipendentemente
dal fatto che siano state esposte o meno nel dockerfile.

Per questo è molto importante segmentare le reti in base alle proprie necessità.

***

Spostiamoci quindi nella directory `sources/compose/networks` e analizziamo il file `compose.yaml`:

```yaml
networks:
  proxy:
  front:
    internal: true
  back:
    internal: true

services:
  app:
    image: busybox
    command: [ "sleep", "infinity" ]
    networks:
      - proxy
      - front
  frontend:
    image: busybox
    command: [ "sleep", "infinity" ]
    networks:
      - front
      - back
  backend:
    image: nginx
    networks:
      back:
        aliases:
          - data-service
```

In questo esempio i nomi descrivono i ruoli della prova, non stiamo distribuendo una vera applicazione a tre livelli.

Il server chiamato `backend` serve la solita pagina Nginx mentre gli altri due container sono nuovamente dei semplici
container ci permetteranno di fare richieste da reti diverse.

Il servizio chiamato `app` appartiene alla rete `proxy` e condivide la rete `front` con il servizio `frontend` che a sua
volta condivide la rete `back` con il `backend`, creando una sorta di catena.

Quando indichiamo esplicitamente il blocco `networks`, in qualunque punto del file Compose (non deve necessariamente
essere in cima), allo stack non viene più aggiunta automaticamente la rete predefinita.

Avviamo lo stack con:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 6/6
 ✔ Network networks_proxy        Created                                                                            0.0s
 ✔ Network networks_front        Created                                                                            0.0s
 ✔ Network networks_back         Created                                                                            0.1s
 ✔ Container networks-proxy-1    Started                                                                            0.3s
 ✔ Container networks-frontend-1 Started                                                                            0.4s
 ✔ Container networks-backend-1  Started                                                                            0.5s
```

E come possiamo infatti vedere, a differenza di prima, ora ci troviamo solamente le tre reti che abbiamo specificato.

Proviamo ora a testare un po' di connessioni partendo dal container `proxy`:

```shell
$ docker compose exec proxy nslookup backend
```
```terminaloutput
Server:         127.0.0.11
Address:        127.0.0.11:53

Non-authoritative answer:
*** Can't find backend: No answer
```

Come possiamo vedere non siamo in grado di risolvere l'indirizzo del servizio `backend`, tanto meno di ottenere la sua 
pagina web:

```shell
$ docker compose exec proxy wget -q -T 3 -O - http://backend
```
```terminaloutput
wget: bad address 'backend'
```

Mentre se facciamo la stessa prova dal container `frontend`:

```shell
$ docker compose exec frontend wget -q -T 3 -O - http://backend
```
```terminaloutput
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
```

Riusciremo a ottenere la pagina web, anche sfruttando l'alias `data-service`:

```shell
$ docker compose up -d
$ docker compose exec frontend wget -q -T 3 -O - http://data-service
```
```terminaloutput
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
```

Gli alias valgono solo sulle reti dove sono definiti, non sono nomi globali del computer, evitiamo in ogni caso di usare
alias uguali per servizi diversi se vogliamo sapere con certezza quale servizio stiamo contattando.

In questo caso questa struttura ci può tornare utile se volessimo esporre ad esempio le porta `80` e `443` del `proxy`
in modo da accedere al nostro stack tramite lui e non direttamente ai due container applicativi.

Se notiamo infatti le due reti `front` e `back` sono definite con l'opzione `internal: true`, in questo modo queste reti
vengono isolate dalla normale connettività esterna e private del consueto accesso in uscita attraverso la rete bridge.

***

Se volessimo invece gestire tramite un proxy condiviso diversi progetti possiamo usare una rete esterna, come anticipato
nel [capitolo relativo ai progetti](../31-project-names-stack-isolation/IT.md).

Semplicemente alla rete `proxy` andiamo ad aggiungere l'opzione:

```yaml
networks:
  proxy:
    external: true
```

In questo caso La rete `proxy` deve già esistere sul nostro host. Chi amministra la macchina dovrà crearla una volta con
il comando `docker network create proxy`, dopodiché gli altri progetti la dichiareranno esterna e vi collegheranno solo
i servizi che dovranno comunicare con l'esterno.

Stoppiamo tutto con il solito:

```shell
$ docker compose down
```
```terminaloutput
[+] down 5/5
 ✔ Container networks-frontend-1 Removed                                                                            3.4s
 ✔ Container networks-backend-1  Removed                                                                            0.3s
 ✔ Container networks-app-1      Removed                                                                            3.3s
 ✔ Network networks_front        Removed                                                                            0.3s
 ✔ Network networks_back         Removed                                                                            0.1s
```

E ricordiamoci che qualora una rete fosse definita come esterna non sarebbe ovviamente eliminata con il comando `down`.

***

> __host and external access__
>
> - publish intentionally
> - test from the actual client
> - distinguish client dns from docker dns

Torniamo alla porta del primo esempio, Il binding `8080:80` usa normalmente tutte le interfacce dell'host e può rendere 
il servizio raggiungibile dalla rete locale o tramite internet.

Quando predisponiamo un accesso, proviamo anche da un secondo dispositivo usando la porta e l'indirizzo locale o remoto
dell'host, non è detto che ciò che funziona in `localhost` funzioni correttamente anche dagli altri indirizzi.

E le risoluzioni DNS dei nomi dei servizi, internamente alle reti Docker sono getiti dal DNS di Docker, non vengono mai
automaticamente risolte dal browser che gira sul nostro computer. Se vogliamo un nome leggibile dai client dobbiamo
configurare un servizio DNS sulla nostra rete interna o su un DNS pubblico.

Inoltre Firewall, VPN, router e configurazione di Docker possono cambiare la raggiungibilità dei servizi soprattutto se
stiamo operando tramite delle VPS online.

***

> Resources
>
> - [Networking in Compose](https://docs.docker.com/compose/how-tos/networking/)
