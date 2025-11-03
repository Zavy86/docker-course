# Getting inside a container

> __getting inside a container__
>
> - logging into
> - install or update
> - change configurations
> - view logs and metrics
> - analyze the disk

Spesso quando abbiamo a che fare con dei server, potremmo aver bisogno di accedere alla console, per modificare qualche
configurazione, per installare o aggiornare dei pacchetti, per visualizzare gli eventi o analizzare le metriche.

In un mondo ideale tutte queste operazioni possono essere svolte tramite sistemi esterni, con tool come Chef, Ansible,
Puppet, Salt o similari per quanto riguarda le configurazioni e con piattaforme centralizzare per la raccolta di eventi
e metriche come Datalog, Fluent, Prometheus, ecc...

Nel mondo reale, purtroppo, spesso e volentieri ci ritroveremo invece a collegarci tramite SSH o quando proprio le cose
smettono di funzionare, avviamo il tutto tramite un sistema di ripristino o magari colleghiamo il disco a un'altra vm
per riuscire per lo meno a recuperarne i dati.

***

> __getting inside a container__
>
> - images
> - volumes
> - environments
> - console

Con Docker molte di queste cose possono, e dovrebbero, essere eseguite senza accedere a un terminale.

L'installazione dei pacchetti dovrebbe avvenire a livello di immagine.

Le configurazioni dovrebbero essere salvate nei volumi o passate tramite variabili d'ambiente.

Gli eventi dovrebbero essere scritti in console così che possano essere automaticamente collezionati da Docker.

E le informazioni sui processi e le metriche possono essere visualizzate direttamente tramite l'host.

Ma a volte potrebbe essere necessario uscire dagli schemi prefissati...

***

Lasciamo un attimo da parte gli eventi e i volumi e diamo un occhiata alle informazioni sui processi.

Se state eseguendo Docker su Linux (vi rimando al [secondo capitolo](../02-training-environment/IT.md) per maggiori 
informazioni) i processi di Docker sono strettamente interconnessi con quelli del sistema operativo e possono essere 
visualizzati con il comando `ps` standard Linux.

Lanciamo un container in background:

```shell
$ docker run -d zavy86/clock
```
```terminaloutput
f4a54b52f0cf3d687d4ea00c1e5d798609ee4fb17fd3ab740db12279543218f3
```

E se ora eseguiamo il comando:

```shell
$ ps faux
```

Vedremo in fondo un processo che guarda caso ha lo stesso id del nostro container:

```terminaloutput
[...] /usr/bin/containerd-shim-runc-v2 -namespace moby -id f4a54b52f0cf3d687d4ea00c1e5d798609ee4fb17fd3ab740db12279543218f3 -addres
[...]  \_ /bin/sh -c while date; do sleep 1; done;
[...]      \_ sleep 1
```

Il che significa che a livello di sistema, un processo containerizzato non è poi così diverso da un qualunque altro 
processo.

Per cui potremo usare tutti i comandi standard come `lfos`, `strace`, `gdb`, ecc per analizzarlo.

***

Se per qualunque motivo abbiamo la necessità di collegarci al terminale di un container, potremmo certamente collegarci
in SSH (qualora avessimo predisposto un server ssh), ma non è soluzione migliore.

Come avevamo visto precedentemente possiamo usare il comando:

```shell
$ docker exec -ti f4a sh
```

Questo comando si occuperà di creare un nuovo processo `sh` all'interno del container e di collegarci al suo terminale.

Ma questo può essere fatto solamente se il container è in esecuzione, come possiamo procedere qualora il container sia
stato arrestato o qualora fosse crashato?

Un container arrestato, esiste solamente nell'hard disk, non è nient'altro che lo strato di file-system creato a partire
dall'immagine e dalle modifiche apportate durante la sua esecuzione, immaginatevelo come se fosse una Chiavetta USB.

Non possiamo certo collegarci in SSH a una Chiavetta USB, dovremmo invece inserire tale chiavetta in un'altra macchina 
per poter accedere ai files al suo interno.

Vediamo come poter fare questa operazione con un container Docker.

Se proviamo ad eseguire [questa](../../sources/crash) immagine:

```shell
$ docker run zavy86/crash
```

Noteremo che il container crasha immediatamente senza darci nessun output.

Proseguiamo a scoprire l'id del container con il solito comando:

```shell
$ docker ps -aql
```
```terminaloutput
ec2e3030bac2
```

E a questo punto proviamo a vedere se ci sono differenze rispetto all'immagine:

```shell
$ docker diff ec2
```
```terminaloutput
C /var
C /var/log
C /var/log/nginx
A /var/log/nginx/error.log
```

Come possiamo vedere ci sono alcuni files interessanti che possiamo andare a visionare.

Sfruttiamo quindi il comando `cp` per copiarci il file `error.log` nella directory corrente:

```shell
$ docker cp ec2:/var/log/nginx/error.log .
```

E visualizziamone il contenuto:

```shell
$ cat error.log
```
```terminaloutput
[emerg] 1#1: unknown directive "invalid_directive" in /etc/nginx/nginx.conf:1
```

Come possiamo vedere, pare che ci sia un errore nel file di configurazione di Nginx, per la precisione una direttiva
non valida.

A questo punto potremmo provare a riavviare il container con il comando `docker start` ma molto probabilmente otterremo
lo stesso identico errore e purtroppo non possiamo sfruttare questo comando per specificare di lanciare nuovi processi.

Tuttavia possiamo creare una nuova immagine a partire dal container arrestato:

```shell
$ docker commit ec2 debug
```

E lanciare un nuovo container a partire da questa immagine, specificando un nuovo entrypoint:

```shell
$ docker run -ti --entrypoint sh debug
```

In questo modo possiamo effettuare qualsiasi operazione all'interno del container e vedere i risultati.

```shell
$ cat /var/log/nginx/error.log
```
```terminaloutput
[emerg] 1#1: unknown directive "invalid_directive" in /etc/nginx/nginx.conf:1
```

***

Un altra cosa super utile potrebbe essere quella di effettuare un dump dell'intero file system del container.

Grazie al comando:

```shell
$ docker export ec2 | tar tv
```

Potremo ottenere una lista dettagliata di tutto il contenuto del container:

```terminaloutput
-rwxr-xr-x  0 0      0           0 Sep 24 09:50 .dockerenv
drwxr-xr-x  0 0      0           0 Jul 15 12:42 bin/
lrwxrwxrwx  0 0      0           0 Jul 15 12:42 bin/arch -> /bin/busybox
lrwxrwxrwx  0 0      0           0 Jul 15 12:42 bin/ash -> /bin/busybox
lrwxrwxrwx  0 0      0           0 Jul 15 12:42 bin/base64 -> /bin/busybox
lrwxrwxrwx  0 0      0           0 Jul 15 12:42 bin/bbconfig -> /bin/busybox
[...]
```

Il comando `export` genera un file tar contenente tutti i file del container, questo file può essere poi scaricato e
decompresso, nel nostro caso, avendo utilizzato le opzioni `tv` abbiamo semplicemente ottenuto la lista verbosa e nessun
file è stato scaricato così da non occupare spazio su disco.

***

> Resources:
> - [crash](../../sources/crash)
> - [zavy86/clock](https://hub.docker.com/r/zavy86/clock)
> - [zavy86/crash](https://hub.docker.com/r/zavy86/crash)

[Prosegui](../15-docker-networks/IT.md) al prossimo capitolo.
