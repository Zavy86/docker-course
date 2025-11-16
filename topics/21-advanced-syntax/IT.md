# Advanced dockerfile syntax

> __advanced dockerfile syntax__
>
> - order
> - layers
> - cache
> - from
> - stages
> - metadata
> - comments

Nei capitoli precedenti abbiamo visto dei semplici Dockerfiles così da comprendere come Docker compila le immagini, ora 
vedremo invece tutte le principali istruzioni che possono essere utilizzate, dalle più semplici alle più avanzate, per 
poter creare immagini più complesse e adatte alle nostre esigenze.

Partiamo con un veloce riepilogo:

Tutte le istruzioni sono da intendersi come eseguite nell'**ordine** in cui sono state scritte, nonostante il fatto che 
possano essere cacheate e/o eseguite in parallelo l'ordine esecutivo verrà comunque sempre rispettato.

Ogni istruzione genererà un nuovo **layer** della nostra immagine Docker, quindi è buona norma cercare di minimizzare il
numero di istruzioni per ridurre il numero di layer generati.

Docker manterrà in **cache** ogni layer generato per le successive compilazioni, tuttavia qualora la cache di un layer
sia invalidata, molto probabilmente lo saranno anche quelle dei layer successivi.

Ogni immagine deve iniziare e contenere almeno un'istruzione **from**, che indica l'immagine di base da cui partire per 
costruire la nostra immagine. Possiamo utilizzarla più volte all'interno dello stesso Dockerfile per creare immagini a 
più **stages**, utili per ridurre la dimensione finale.

Alcune istruzioni, come `CMD` ed `ENTRYPOINT` servono per impostare dei **metadata**, l'esecuzione consecutiva di questi
comandi modificherà sempre lo stesso attributo, di conseguenza solamente l'ultima istruzione avrà effetto nell'immagine
finale rendendo le precedenti inutili.

Infine, possiamo precedere qualsiasi istruzione o testo con un `#` per aggiungere dei **commenti** al nostro Dockerfile.

***

Partiamo quindi con la creazione di un nuovo Dockerfile partendo dall'immagine di Ubuntu:

```dockerfile
# Simple Dockerfile example
FROM ubuntu
```

***

> __advanced dockerfile syntax__
>
> run
> - execute commands
> - filesystem changes
> - install packages

L'istruzione `RUN` serve per eseguire comandi durante la compilazione dell'immagine, e può essere espressa in due modi:
come semplice testo o sotto forma di oggetto JSON.

Questa istruzioni può essere utilizzata per eseguire un qualsiasi comando, per effettuare modifiche al file system o per
installare pacchetti, librerie o qualunque altro tipo di file.

Non può essere invece utilizzato per registrare lo stato di un processo o per eseguire un servizio in quanto non viene 
eseguito all'avvio del container ma viene processato solamente durante la compilazione dell'immagine.

***

Con la forma testuale, lo shell wrapping eseguirà il comando specificato all'interno di una shell, tramite l'istruzione
`/bin/sh -c`, garantendo anche l'espansione automatica delle variabili di ambiente e permettendoci di sfruttare una vera
e propria shell.

```dockerfile
RUN apt-get update
```

Tuttavia qualora volessimo deliberatamente evitare l'interpretazione del comando tramite una shell, o nelle immagini più 
leggere dove addirittura non disponiamo di una shell, possiamo utilizzare la forma JSON.

```dockerfile
RUN [ "apt-get", "update" ]
```

Come dicevamo precedentemente ogni istruzione genera un nuovo layer all'interno della nostra immagine, per cui qualora
dovessimo eseguire più comandi è buona norma concatenarli in un unica istruzione:

```dockerfile
RUN apt-get update  && apt-get install -y nginx && apt-get clean
```

Oppure nella sua forma più leggibile multi riga utilizzando il backslash:

```dockerfile
RUN apt-get update \
 && apt-get install -y nginx \
 && apt-get clean
```

***

> __advanced dockerfile syntax__
>
> expose
> - declaration
> - private ports
> - public ports

L'istruzione `EXPOSE` permette a Docker di sapere quali porte debbano essere esposte una volta avviato il container.

Di default tutte le porte sono comunque sempre private, dichiararle tramite questa istruzione non è sufficiente per far
si che la porta sia accessibile dall'esterno, per farlo dovremo utilizzare il parametro `-P` all'avvio del container per
aprire tutte le porte definite nell'immagine su porte casuali del nostro host o i parametri `-p` seguiti dal numero di
porta di destinazione e dal numero di porta di origine qualora volessimo avere un controllo completo sui numeri.

Ricordatevi in ogni caso che anche qualora una porta non fosse stata definita tramite questa istruzione, potrete sempre
aprirla manualmente tramite il comando `-p` specificandola.

***

Possiamo dichiarare una porta in questo modo:

```dockerfile
EXPOSE 80
```

Oppure anche più di una nella stessa istruzione:

```dockerfile
EXPOSE 80 443
```

E se vogliamo possiamo anche specificare un singolo protocollo:

```dockerfile
EXPOSE 80/tcp 443/tcp 53/udp
```

***

> __advanced dockerfile syntax__
>
> copy
> - files and directories
> - build context
> - ownership
> - permissions

L'istruzione `COPY` permette di aggiungere files o directories dal contesto di build all'interno dell'immagine Docker.

Questo comando dipende strettamente dal contesto di build, ovvero quel percorso indicato come parametro alla fine del
comando `docker build`.

Prestiamo sempre molta attenzione ai proprietari e ai permessi dei file e delle directory che vogliamo copiare, per 
evitare di incorrere in problemi di accesso ai files una volta avviato il container.

Per quanto riguarda la cache, nel caso di copia di file e directory, Docker non considererà solamente le modifiche nel
Dockerfile, ma controllerà anche se i files sono stati modificati rispetto all'esecuzione precedente.

***

È sempre buona norma utilizzare il `.` per riferirsi alla directory corrente del contesto di build, ad esempio in questo
modo stiamo indicando a Docker che vogliamo copiare tutti i file e le directory presenti nel contesto di build verso la
directory `/src` all'interno dell'immagine:

```dockerfile
COPY . /src
```

I percorsi assoluti vengono considerati ancorati al contesto di build, quindi questa riga è equivalente alla precedente:

```dockerfile
COPY / /src
```

Nonostante questo la prima risulta più leggibile e meno fuorviante.

I tentativi di utilizzare `..` per uscire dal contesto di build verranno rilevati e bloccati da Docker e la compilazione
fallirà, questo proprio per evitare la formula _"it works on my machine!"_, un'immagine deve poter essere compilata allo
stesso modo su qualunque host.

Qualora volessimo modificare il proprietario di un file o di una directory durante la copia, possiamo utilizzare:

```dockerfile
COPY --chown=nginx:nginx . /src
```

In questo modo tutti i files e le directories verranno assegnati all'utente `nginx` e al gruppo `nginx`.

***

> __advanced dockerfile syntax__
>
> add
> - unpack archives
> - remote files

L'istruzione `ADD` è molto simile a `COPY`, ma con alcune funzionalità aggiuntive, può essere utilizzata per copiare e
decomprimere archivi compressi, o per aggiungere file remoti scaricabili tramite protocollo `HTTP/S`.

Tuttavia le due cose non sono cumulabili, ovvero se provassimo a scaricare un archivio compresso remoto esso non verrà
automaticamente decompresso, spero vivamente che questo comportamento venga cambiato in futuro.

Per quanto riguarda la cache, per i files locali `COPY` funziona esattamente come `ADD`, mentre per quanto riguarda i 
files remoti verranno sempre prima scaricati in modo da poter verificare se sono stati modificati.

***

Se volessimo copiare e decomprimere in automatico un archivio contenente per esempio la release di un'applicazione
potremmo utilizzare l'istruzione:

```dockerfile
ADD ./release.tar.gz /app 
```

In questo modo ci troveremmo all'interno della directory `/app` tutto il contenuto dell'archivio `release.tar.gz`.

O qualora volessimo prelevare direttamente un file remoto potremmo utilizzare ad esempio:

```dockerfile
ADD http://fileserver/scripts/stats.sh /scripts
```

In questo modo preleveremo lo script `stats.sh` dal file server e lo salveremo nella directory `/scripts`.

Attenzione che in questo caso, qualora il server remoto non sia accessibile la compilazione dell'immagine fallirà.

***

> __advanced dockerfile syntax__
>
> volume
> - persistent data
> - bypass copy-on-write
> - writable on read-only

L'istruzione `VOLUME` permette di indicare a Docker di trattare una specifica directory come un volume.

L'accesso al file system nei volumi bypassa il livello di `copy-on-write`, offrendo prestazioni native per le operazioni
eseguite in tali directories.

Quando avvieremo un container basato su un'immagine che contiene questa istruzione, Docker creerà automaticamente un 
volume per ogni directory indicata con un nome univoco a meno che non ne venga specificato uno manualmente.

I volumi possono anche essere associati a directory locali all'interno dell'host per potervi accedere più facilmente.

Avviando un container in modalità `read-only`, il file system verrà reso di sola lettura, ma i volumi potranno comunque
essere trattati in lettura e scrittura se necessario.

***

Per specificare di trattare una directory come un volume possiamo utilizzare l'istruzione:

```dockerfile
VOLUME /usr/share/nginx/html
```

In questo modo all'avvio del container Docker creerà un volume con un nome univoco e lo assocerà alla directory `/data`.

***

> __advanced dockerfile syntax__
>
> workdir
> - working directory
> - multiple assignments
> - affect followings

L'istruzione `WORKDIR` permette di modificare la directory di lavoro all'interno del container.

Tutti i comandi come `RUN`, `CMD`, `ENTRYPOINT`, ecc definiti dopo questa istruzione all'interno del Dockerfile verranno
eseguiti dalla directory specificata e qualora ci collegassimo in modalità interattiva alla `shell` del container ci
troveremmo dentro a essa.

***

Per definire la working directory possiamo utilizzare l'istruzione:

```dockerfile
WORKDIR /usr/share/nginx/html
```

Ovviamente questo comando può essere specificato più volte all'interno dello stesso Dockerfile per cambiare la directory
di lavoro ogni volta che lo desideriamo, l'ultima istruzione verrà considerata come la directory di lavoro finale nella
quale ci troveremo collegandoci alla shell del container.

***

> __advanced dockerfile syntax__
>
> env
> - environment variables
> - multiple assignments
> - overwritable

L'istruzione `ENV` permette di definire le variabili di ambiente che devono essere impostate in ogni contenitore avviato
dall'immagine. Queste variabili possono poi eventualmente anche essere sovrascritte in fase di avvio del container.

Qualora in fase di avvio si specifichi una variabile di ambiente non definita, essa verrà creata automaticamente.

***

Per definire una variabile di ambiente possiamo utilizzare l'istruzione:

```dockerfile
ENV NGINX_PORT=80
```

In questo modo abbiamo definito la variabile di ambiente `NGINX_PORT` assegnandole il valore `80`, e nel caso volessimo
variarla in fase di avvio del container potremo sovrascriverla con l'opzione `-e` seguita dal nome della variabile di 
ambiente e il suo nuovo valore:

```shell
$ docker run -e NGINX_PORT=8080 webserver
```

***

> __advanced dockerfile syntax__
>
> user
> - change user
> - back to root

L'istruzione `USER` può essere sfruttata per impostare il nome dell'utente (o il suo UID) da utilizzare durante la fase
di compilazione dell'immagine e di esecuzione del container. Può essere utilizzata più volte, anche per tornare a root
senza dover specificare nessuna password.

***

Per effettuare il cambio di utente possiamo utilizzare l'istruzione:

```dockerfile
USER nginx
```

In questo modo non saremo più root ma è come se avessimo eseguito il comando `su nginx` per interpretare quell'utente.

***

> __advanced dockerfile syntax__
>
> cmd
> - default command
> - overwritable

L'istruzione `CMD` è un metadata rappresentante il comando predefinito eseguito quando il container verrà avviato e 
proprio come il comando `RUN`, anche questo è definibile in due modi: come testo o come oggetto JSON.

Questo ci consente di evitare di dover specificare alcun comando dopo `docker run`, poiché il container eseguirà 
automaticamente il comando predefinito. Qualora in fase di avvio andassimo a specificare un comando manuale, questo
andrà a sovrascrivere il comando definito con questa istruzione.

***

Un esempio potrebbe essere quello di definire un comando che esegua il webserver nginx:

```dockerfile
CMD [ "nginx", "-g", "daemon off;" ]
```

In questo modo, una volta avviato, il container eseguirà automaticamente il webserver nginx con i parametri specificati.

***

> __advanced dockerfile syntax__
>
> entrypoint
> - default entry point
> - overwritable

L'istruzione `ENTRYPOINT` è molto simile all'istruzione `CMD`, con la differenza che gli argomenti forniti sulla riga di
comando in fase di avvio del container (o quelli specificati in `CMD`) vengono accodati all'`ENTRYPOINT`.

Anch'essa è definibile nei due modi testuale e JSON ed è sovrascrivibile tramite l'opzione `--entrypoint`.

***

Riprendendo l'esempio precedente, potremo suddividere il comando in due parti:

```dockerfile
ENTRYPOINT [ "nginx" ]
CMD [ "-g", "daemon off;" ]
```

In questo modo le due istruzioni lavoreranno in maniera sinergica, la prima per avviare il comando e la seconda per la
specifica dei parametri, cosicché qualora lo ritenessimo necessario in fase di avvio potremmo specificare manualmente
altri parametri e sovrascriverli, ad esempio potremmo passare `-t` per testare la configurazione del webserver.

***

> __advanced dockerfile syntax__
>
> - arg
> - label
> - shell
> - stopsignal
> - healthcheck
> - onbuild

Infine vi cito brevemente anche alcuni altri comandi per i quali vi rimando ovviamente alla
[guida ufficiale](https://docs.docker.com/reference/dockerfile/)
qualora li vogliate approfondire ulteriormente.

Uno dei più utili è forse `ARG` che ci permette semplicemente di definire delle variabili a build-time (facoltative od
obbligatorie) che potremmo riempire passandole al comando `docker build` con l'opzione `--build-arg`.

Possiamo poi sfruttare l'istruzione `LABEL` per aggiunge metadati arbitrari all'immagine, come il nome del maintainer,
l'URL del progetto, la licenza o qualsiasi altro dato che riteniamo utile.

Tramite `SHELL` possiamo impostare il programma predefinito da utilizzare per l'interpretazione dei comandi testuali che
scriviamo con `RUN`, `CMD`, ecc...

Grazie a `STOPSIGNAL` potremo andare a impostare quale segnale ascoltare per arrestare il container docker, di default
come abbiamo visto è impostato su `TERM` ma nulla ci vieta di sostituirlo.

Possiamo anche definire delle modalità per valutare lo stato del container tramite `HEALTHCHECK` andando a specificare
uno script o un comando da eseguire periodicamente.

Infine vi cito anche `ONBUILD` che ci consente di memorizzare le istruzioni che verranno eseguite quando questa immagine
verrà utilizzata come base per un'altra immagine, utile per esempio per l'installazione di librerie o la compilazione di
sorgenti dell'applicazione prima del loro avvio.

***

> Resources:
> - [ubuntu](https://hub.docker.com/_/ubuntu)

[Prosegui](../22-application-configuration/IT.md) al prossimo capitolo.
