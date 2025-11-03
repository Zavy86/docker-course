# Service discovery with containers

> __service discovery with containers__
>
> - web server
> - data store
> - tutorial network

Immaginate di avere una semplice applicazione web che usa un data store per memorizzare i dati.

In questo caso utilizzeremo un'applicazione Node.js che espone un contatore, premendo il pulsante il contatore verrà
incrementato e il valore verrà memorizzato in un data store Redis.

Per far si che i due container si possano parlare li metteremo entrambi nella rete `tutorial` creata precedentemente.

***

Eseguiamo quindi l'applicazione partendo da [questa](../../sources/clickster) immagine:

```shell
$ docker run --net tutorial -dP zavy86/clickster
```

E vediamo su quale porta è stato esposto il servizio:

```shell
$ docker ps -l
```
```terminaloutput
CONTAINER ID   IMAGE              [...]   PORTS                     [...]
3cae1216a1c1   zavy86/clickster   [...]   0.0.0.0:50003->8080/tcp   [...]
```

Se ora puntiamo il browser su `http://localhost:50003` vedremo l'applicazione web in esecuzione, ma riceveremo subito un
errore `Unable to connect to Redis!`. Questo ovviamente perché non c'è nessun server Redis in esecuzione, e quando la
nostra applicazione tenta di risolvere il nome redis per connettersi, non trova nulla.

Procediamo quindi con l'esecuzione di un container Redis:

```shell
$ docker run --net tutorial --net-alias redis -d redis
```

Il container deve avere sia l'opzione `--net tutorial` per essere aggiunto alla rete, sia l'opzione `--net-alias redis` 
per essere raggiungibile con il nome `redis`, in questo modo non dovremo fare riferimento all'indirizzo IP.

Se ora aggiorniamo nuovamente la pagina web, se tutto è andato a buon fine, vedremo comparire al posto dell'errore un
bel pulsante con scritto `0 Clicks!`.

Se proviamo a cliccare il pulsante, vedremo il contatore incrementarsi!

Se proviamo poi a giochicchiare con i comando `stop` e `start` sul container Redis:

```shell
$ docker stop $(docker ps -lq)
$ docker start $(docker ps -lq)
```

Vedremo che l'applicazione smetterà di funzionare e poi tornerà a funzionare non appena il container Redis sarà di nuovo
in esecuzione e il conteggio resterà salvato correttamente.

Procediamo poi con lo stop e la rimozione totale del container Redis:

```shell
$ docker stop $(docker ps -lq)
$ docker rm $(docker ps -lq)
```

E proviamo a lanciare una nuova istanza di Redis, ma questa volta senza l'alias di rete ma specificando un nome:

```shell
$ docker run --net tutorial --name redis -d redis
```

Come potremo notare nel browser, anche in questo caso l'applicazione funziona correttamente, in quanto di default Docker
assegna un alias di rete pari al nome del container.

In questo caso bisogna però fare un minimo di attenzione, in quanto i nomi dei container devono essere univoci, mentre
gli alias di rete possono essere uguali tra più container anche nella stessa rete. Nel caso ci fossero due container con
lo stesso alias sulla stessa rete, Docker li risolverebbe tramite un algoritmo di round robin.

Lanciamo ad esempio altri due container con lo stesso alias:

```shell
$ docker run --net tutorial --net-alias redis -d redis
$ docker run --net tutorial --net-alias redis -d redis
```

E proviamo poi ad eseguire un lookup tramite un busybox:

```shell
$ docker run --net tutorial --rm busybox nslookup redis
```

Come possiamo vedere dall'output in questo caso Docker sta risolvendo il nome `redis` tramite tutti i container con nome
o con l'alias `redis` all'interno rete `tutorial`.

```terminaloutput
Server:         127.0.0.11
Address:        127.0.0.11:53
Non-authoritative answer:
Name:   redis
Address: 10.86.9.3
Name:   redis
Address: 10.86.9.4
Name:   redis
Address: 10.86.9.5
```

> Un informazione importante da tenere a mente è che Docker non crea gli alias nella rete `bridge` di default, quindi se
vogliamo utilizzare questa funzione dobbiamo ricordarci di creare sempre una rete apposita.

---

Inoltre per completezza vi segnalo che è anche possibile connettere e disconnettere un container da una rete "a caldo" e
non solamente in fase di esecuzione.

Se ad esempio lanciamo un altro container `busybox` in modalità interattiva:

```shell
$ docker run --name busybox -ti busybox
```

E proviamo a effettuare nuovamente il lookup tramite questo container:

```shell
# nslookup redis
```

Vedremo che il comando non andrà a buon fine:

```terminaloutput
Server:         192.168.65.7
Address:        192.168.65.7:53

Non-authoritative answer:

** server can't find redis: NXDOMAIN
```

Ma se da un'altra shell andiamo a connettere la rete `tutorial` al container `busybox`:

```shell
$ docker network connect tutorial busybox
```

E proviamo nuovamente a effettuare il lookup:

```shell
# nslookup redis
```

Vedremo che il comando questa volta andrà a buon fine:

```terminaloutput
Server:         127.0.0.11
Address:        127.0.0.11:53

Non-authoritative answer:
Name:   redis
Address: 10.86.9.3
Name:   redis
Address: 10.86.9.4
Name:   redis
Address: 10.86.9.5
```

Analogamente a `connect` possiamo sfruttare `disconnect` per scollegare un container da una rete:

```shell
$ docker network disconnect tutorial busybox
```

In ogni caso tutte queste questioni vedrete che saranno gestibile in maniera molto più comoda e semplice grazie a uno
strumento che vedremo fra qualche capitolo: Docker Compose!

***

> Resources:
> - [busybox](https://hub.docker.com/_/busybox)
> - [clickster](../../sources/clickster)
> - [redis](https://hub.docker.com/_/redis)
> - [zavy86/clickster](https://hub.docker.com/r/zavy86/clickster)

[Prosegui](../18-docker-volumes/IT.md) al prossimo capitolo.
