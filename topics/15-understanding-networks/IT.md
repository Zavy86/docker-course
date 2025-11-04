# Understanding Docker networks

> __understanding docker networks__
>
> - run network services
> - connect to that service
> - container ip addresses

In questo capitolo vedremo una prima breve introduzione ai servizi di rete Docker.

In particolare scopriremo come eseguire un servizio di rete all'interno di un container, come esporre il servizio su una
porta del nostro host Docker e come connetterci a tale servizio.

Infine vedremo alcuni modi utili per scoprire gli indirizzi IP assegnati ai containers e come comunicano fra loro.

***

Per scoprire le basi dei servizi di rete Docker abbiamo bisogno di un'applicazione piccola e semplice da configurare.
O meglio ancora un'applicazione che non richieda nessun tipo di configurazione. Andiamo quindi a utilizzare l'immagine
ufficiale di Nginx, un semplicissimo web server che resta in ascolto sulla porta 80 servendoci una semplice pagina HTML.

Lanciamolo!

```shell
$ docker run -d -P nginx
```

Il comando è sempre lo stesso che abbiamo visto fin'ora ma questa volta abbiamo semplicemente aggiunto una nuova opzione
`-P` (maiuscola).

Questa opzione indica a Docker di pubblicare tutte le porte che il container dichiara di voler esporre.

Andiamo quindi a scoprire cosa sta accadendo:

```shell
$ docker ps -l
```

Come possiamo vedere dall'output di questo comando, nella sezione ports ora vediamo un indicazione particolare:

```terminaloutput
CONTAINER ID   IMAGE     [...]   PORTS                   [...]
91a00c1d561c   nginx     [...]   0.0.0.0:50001->80/tcp   [...]
```

Il primo quartetto di zeri rappresenta l'indirizzo IP del host Docker (in questo caso `0.0.0.0`), è poi seguito da un
numero causale di porta (nel mio caso `50001`), e infine una freccia che indica a quale numero di porta del container fa
riferimento (in questo caso `80`).

Un risultato analogo lo possiamo ottenere anche con il comando:

```shell
$ docker port 91a
```

Ma in questo caso l'output sarà invertito, a sinistra avremo la porta del container e a destra la porta del nostro host:

```terminaloutput
80/tcp -> 0.0.0.0:50001
```

In parole povere significa che collegandoci alla porta `50001` dell'host Docker (tramite localhost o tramite l'indirizzo
IP privato o pubblico del server) potremo accedere al web server nginx esposto sulla porta `80` del container.

La riprova la possiamo avere puntando il nostro browser all'indirizzo [http://localhost:50001](http://localhost:55001).

Avendo ovviamente l'accortezza di sostituire `50001` con il numero casuale generato nel vostro caso.

Oppure se preferiamo rimanere nel terminale possiamo utilizzare il comando:

```shell
$ curl localhost:50001
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
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>
<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>
<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

Ma come ha fatto Docker a capire che doveva esporre la porta `80` del container?

Se andiamo a visualizzare i dettagli dell'immagine Nginx:

```shell
$ docker inspect nginx | jq
```

Noteremo verso il fondo una sezione chiamata `ExposedPorts` all'interno della quale vedremo indicata la porta `80/tcp`:

```terminaloutput
[...]
      "ExposedPorts": {
        "80/tcp": {}
      },
[...]
```

Questa porta è stata definita all'interno dell'immagine tramite l'istruzione `EXPOSE 80`.

Cosa che possiamo facilmente verificare andando a vedere la storia dell'immagine:

```shell
$ docker history nginx
```
```terminaloutput
IMAGE          CREATED       CREATED BY                                      SIZE      COMMENT
114aa6a9f203   2 years ago   /bin/sh -c #(nop)  CMD ["nginx" "-g" "daemon…   0B        
<missing>      2 years ago   /bin/sh -c #(nop)  STOPSIGNAL SIGQUIT           0B        
<missing>      2 years ago   /bin/sh -c #(nop)  EXPOSE 80                    0B        
<missing>      2 years ago   /bin/sh -c #(nop)  ENTRYPOINT ["/docker-entr…   0B        
<missing>      2 years ago   /bin/sh -c #(nop)  COPY file:e57eef017a414ca7…  4.62kB    
<missing>      2 years ago   /bin/sh -c #(nop)  COPY file:abbcbf84dc17ee44…  1.27kB    
<missing>      2 years ago   /bin/sh -c #(nop)  COPY file:5c18272734349488…  2.12kB    
<missing>      2 years ago   /bin/sh -c #(nop)  COPY file:7b307b62e82255f0…  1.62kB    
<missing>      2 years ago   /bin/sh -c set -x     && addgroup --system -…   60.3MB    
<missing>      2 years ago   /bin/sh -c #(nop)  ENV PKG_RELEASE=1~bullseye   0B        
<missing>      2 years ago   /bin/sh -c #(nop)  ENV NJS_VERSION=0.7.9        0B        
<missing>      2 years ago   /bin/sh -c #(nop)  ENV NGINX_VERSION=1.23.3     0B        
<missing>      2 years ago   /bin/sh -c #(nop)  LABEL maintainer=NGINX Do…   0B        
<missing>      2 years ago   /bin/sh -c #(nop)  CMD ["bash"]                 0B        
<missing>      2 years ago   /bin/sh -c #(nop)  ADD file:9dc5c6fb6431df801…  74.3MB
```

Ma per quale motivo ci siamo quindi dovuti connettere alla porta `50001` invece che semplicemente alla porta `80`?

Se avete un minimo di conoscenza di rete saprete che ogni porta può essere esposta solamente una volta per ogni host.
Essendo che sul nostro host potremmo eseguire diversi container, qualora non venga specificato diversamente Docker 
assegna un numero di porta casuale per ogni porta esposta dal container.

Se proviamo infatti a lanciare un secondo container Nginx con la stessa opzione `-P` (maiuscola) e andiamo a vedere i 
dettagli dell'ultimo container eseguito:

```shell
$ docker run -d -P nginx
$ docker ps -l
```

Vedremo che anche questo punta alla porta `80` del container ma questa volta associata a un'altra porta casuale:

```terminaloutput
CONTAINER ID   IMAGE     [...]   PORTS                   [...]
91a00c1d561c   nginx     [...]   0.0.0.0:50002->80/tcp   [...]
```

Se volessimo invece specificare manualmente il numero di porta da utilizzare, anziche utilizzare l'opzione `-P` dovremo 
usare l'opzione `-p` (minuscola) e specificare il numero di porta da utilizzare:

```shell
$ docker run -d -p 80:80 nginx
$ docker run -d -p 8000:80 nginx
$ docker run -d -p 8080:80 -p 8888:80 nginx
$ docker ps
```

Con questi tre comandi abbiamo lanciato tre container di Nginx, ognuno con la propria porta esposta:

```terminaloutput
CONTAINER ID   IMAGE     [...]   PORTS                                        [...]
d4078cdfe1cb   nginx     [...]   0.0.0.0:8080->80/tcp, 0.0.0.0:8888->80/tcp   [...]
895506e71e00   nginx     [...]   0.0.0.0:8000->80/tcp                         [...]
7d6bea3f17b5   nginx     [...]   0.0.0.0:80->80/tcp                           [...]
```

Ora qualunque di queste porte proveremo ad aprire nel browser o a richiamare tramite curl otterremo sempre la pagina
di default di Nginx, servita dal relativo container:

```shell
$ curl localhost:8080
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
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>
<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>
<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

***

Per risalire invece all'indirizzo IP assegnato al container possiamo utilizzare il comando:

```shell
$ docker inspect --format '{{ json .NetworkSettings.IPAddress }}' 91a
```

Ottenendo per l'appunto in output l'indirizzo assegnato al container:

```terminaloutput
172.17.0.2
```

Se siamo su un sistema Linux possiamo anche pingare direttamente l'indirizzo IP del container:

```shell
$ ping 172.17.0.2
```

Mentre se siamo su MacOS o Windows con Docker Desktop non potremo accedere direttamente a questo indirizzo IP per via
delle tecniche interne di routing di Docker, potremo però verificare che il container sia raggiungibile effettuando il 
ping da un altro container:

```shell
$ docker run busybox ping 172.17.0.2
```
```terminaloutput
PING 172.17.0.2 (172.17.0.2): 56 data bytes
64 bytes from 172.17.0.2: seq=0 ttl=64 time=0.182 ms
```

E come possiamo vedere la risposta è pressoché immediata a confermarci che tutto sta funzionando come previsto.

***

> Resources:
> - [busybox](https://hub.docker.com/_/busybox)
> - [nginx](https://hub.docker.com/_/nginx)

[Prosegui](../16-network-drivers/IT.md) al prossimo capitolo.
