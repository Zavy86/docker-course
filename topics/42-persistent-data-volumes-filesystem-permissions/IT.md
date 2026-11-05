# Persistent data, volumes, and filesystem permissions

> __persistent data__
>
> - containers can be replaced
> - data needs its own lifecycle
> - persistence is not a backup

Quando aggiorniamo un'immagine o modifichiamo la configurazione di un servizio, Compose può sostituire il suo container.
Come già visto nella prima parte di questo corso i file scritti nello strato scrivibile del container scompaiono insieme
a lui, per conservare i dati dobbiamo scegliere uno storage con un ciclo di vita indipendente.

Abbiamo già incontrato volumi e bind mount, in questo capitolo vedremo come usarli con Compose, come verificare che un 
processo possa accedere ai file e quando scegliere uno spazio temporaneo piuttosto che uno permanente.

Infine vedremo anche perché conservare i dati non significa averne una copia di backup.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose/storage
```

E analizziamo il file `compose.yaml`:

```yaml
volumes:
  app-data:
  
services:
  app:
    image: alpine
    command: [ "sleep", "infinity" ]
    volumes:
      - app-data:/data
```

La dichiarazione principale definisce un volume nominato, dopodiché il mount all'interno del servizio `app` lo collega
al percorso `/data` del container.

Una volta avviato lo stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 3/3
 ✔ Network storage_default Created                                                                                  0.0s
 ✔ Volume storage_app-data Created                                                                                  0.0s
 ✔ Container storage-app-1 Started                                                                                  0.1s
```

Vedremo che il nome effettivo del volume includerà anche il nome progetto, così due progetti distinti non rischieranno 
di useranno lo stesso volume.

Proviamo ora a scrivere due file dimostrativi, uno sul volume e uno fuori dal volume:

```shell
$ docker compose exec app sh -c 'echo persistent > /data/message.txt'
$ docker compose exec app sh -c 'echo temporary > /tmp/message.txt'
```

E andiamo a forzare la ricreazione dei container dello stack:

```shell
$ docker compose up -d --force-recreate app
```
```terminaloutput
[+] up 1/1
 ✔ Container storage-app-1 Started                                                                                  3.2s
```

A questo punto, proviamo a leggere i due file creati precedentemente:

```shell
$ docker compose exec app cat /data/message.txt
```
```terminaloutput
persistent
```

Come prevedibile, il primo file è ancora disponibile all'interno del volume montato sul container.

```shell
$ docker compose exec app cat /tmp/message.txt
```
```terminaloutput
cat: can't open '/tmp/message.txt': No such file or directory
```

Mentre il file che avevamo scritto nella directory `/tmp`, che apparteneva al filesystem del container, una volta che è
stato distrutto e ricreato, il file non è più disponibile. 

***

Proviamo ora anche a smontare e ricreare lo stack completamente:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container storage-app-1 Removed                                                                                  3.1s
✔ Network storage_default Removed                                                                                   0.1s
```

Come possiamo notare dal log, sono stati eliminato il container e la rete collegata, ma non il volume.

Se andiamo ad avviare nuovamente lo stack infatti:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network storage_default Created                                                                                  0.0s
 ✔ Container storage-app-1 Started                                                                                  0.1s
```

Vedremo che verranno ricreati solamente questi ultimi due e se proviamo nuovamente a effettuare il check del file:

```shell
$ docker compose exec app cat /data/message.txt
```
```terminaloutput
persistent
```

Noteremo che il contenuto resta ancora disponibile come prima. Stiamo infatti usando lo stesso progetto e la stessa
dichiarazione del volume precedente, quindi Compose ci riassegno lo stesso identico volume che avevamo a disposizione.

Se volessimo vedere il nome del volume di storage collegato al container, potremmo usare queste istruzioni:

```shell
$ docker inspect --format '{{json .Mounts}}' "$(docker compose ps -q app)"
```
```json
[
  {
    "Type": "volume",
    "Name": "storage_app-data",
    "Source": "/var/lib/docker/volumes/storage_app-data/_data",
    "Destination": "/data",
    "Driver": "local",
    "Mode": "rw",
    "RW": true,
    "Propagation": ""
  }
]
```

Oppure potete lanciare i due comandi separati, il secondo come già visto nella prima parte del corso serve a ottenere 
l'ID del container, che verrà poi passato come parametro al primo comando.

In ogni caso il risultato sarà un frammento di codice JSON con al suo interno il nome del volume, il suo persorso sul
disco, la directory di destinazione all'interno del container, il driver e la modalità di accesso.

***

> __choose the right mount__
>
> - named volumes for managed data
> - bind mounts for host files
> - tmpfs for temporary data


In Docker e in particolare tramite Compose, esistono diversi tipologie di mount che possiamo utilizzare, e la scelta 
dipende più che altro da quanto a lungo devono durare i dati e da chi deve poter accedere a tali files.

Compose ci permette di collegare lo storage a un percorso all'interno del container, ma i diversi tipi di mount non
hanno tutti lo stesso ciclo di vita.

Un **named volume** è gestito internamente da Docker e continua a esistere anche quando il container viene ricreato.
È una buona scelta per dati applicativi, come quelli di un database, che devono essere conservati senza richiedere
l'accesso diretto a una directory scelta sull'host.

Un **bind mount** collega invece un file o una directory dell'host a un percorso del container.
È utile quando vogliamo lavorare sugli stessi file sia dall'host sia dal container, per esempio con codice sorgente, 
configurazioni o file di input. Le modifiche sono visibili da entrambi i lati, salvo eventuali restrizioni impostate.

Un mount **tmpfs** offre infine uno spazio temporaneo per i dati che non devono essere conservati, come i file di lavoro
creati durante l'esecuzione. A differenza dei primi due, il suo contenuto non sopravvive all'arresto del container.

***

Creiamo una directory `input` accanto al file Compose:

```shell
$ mkdir input
```

Al suo interno, con il nostro editor preferito, creiamo il file:

```shell
$ nano input/message.txt
```
```text
host file
```

Aggiungiamo poi una seconda voce alla lista dei volumi del servizio:

```yaml
[...]
- type: bind
  source: ./input
  target: /input
  read_only: true
  bind:
    create_host_path: false
```

L'opzione `create_host_path` impostata a `false` impedisce a Compose di creare automaticamente la directory sull'host se
la directory `./input` non esiste, in quel caso il comando fallisce. È utile per individuare errori nel percorso, invece
di ritrovarsi con una directory vuota creata per sbaglio.

Riavviamo nuovamente lo stack con il comando:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container storage-app-1 Started                                                                                  3.2s
```

E proviamo a leggere il file presente nella directory montata:

```shell
$ docker compose exec app cat /input/message.txt
```
```terminaloutput
host file
```

In questo caso, come previsto, saremo in grado di leggere il file, ma avendo montato il volume in modalità sola lettura, 
i tentativi di scrittura dovranno fallire:

```shell
$ docker compose exec app sh -c 'echo test > /input/other.txt'
```
```terminaloutput
sh: can't create /input/other.txt: Read-only file system
```

Nonostante il mount in sola lettura, il file resta comunque modificabile dall'host, `read_only` limita questo accesso
dal container, non congela la sorgente stessa.

I percorsi relativi copme `./input` seguono le regole del progetto Compose e dei file multipli già viste.

***

Non tutti i file hanno bisogno di essere conservati. Un'applicazione può creare file temporanei durante l'elaborazione
di una richiesta o mantenere dati di lavoro che possono essere ricostruiti al successivo avvio. Per questi casi possiamo
usare un mount `tmpfs`, gestito in memoria dal sistema Linux invece che come un volume o una directory dell'host.

Il suo contenuto resta disponibile durante l'esecuzione del container, ma viene perso quando il container si arresta. È
quindi adatto soltanto per quei dati che l'applicazione può eliminare o ricreare.

Per provarlo, aggiungiamo al servizio, allo stesso livello della `image`, questo frammento:

```yaml
tmpfs:
  - /scratch:size=16m
```

Procediamo poi con il solito riavvio dello stack con:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container storage-app-1 Started                                                                                  3.2s
```

E verifichiamo che il file system si trovi effettivamente nel container con il comando:

```shell
$ docker compose exec app df -h /scratch
```
```terminaloutput
Filesystem                Size      Used   Available   Use%   Mounted on
tmpfs                    16.0M         0       16.0M     0%   /scratch  
```

Come possiamo notare Linux crea uno spazio temporaneo con limite di 16 MiB, in questo caso utile per piccoli file di
lavoro, spesso questi dati finiscono nello spazio di swap dell'host ma non prendetelo come una garanzia assoluta.

Proviamo a sriverci dentro un file:

```shell
$ docker compose exec app sh -c 'echo temporary > /scratch/test.txt'
```

E dopo aver riavviato il container del servizio:

```shell
$ docker compose restart app
```
```terminaloutput
[+] restart 0/1
 ⠙ Container storage-app-1 Restarting                                                                               3.1s
```

Noteremo che il file non sarà più presente:

```shell
$ docker compose exec app cat /scratch/test.txt
```
```terminaloutput
cat: can't open '/scratch/test.txt': No such file or directory
```

***

Un ultima considerazione va fatta sugli **anonymous volumes**, ovvero quei volumi indicati nelle immagini Docker o nel 
file compose a cui non abbiamo assegnato un nome esplicito.

Possiamo ad esempio chiederne uno indicando anche solo la destinazione nel container, per esempio aggiungendo questa
voce alla lista `volumes` del servizio:

```yaml
[...]
- /cache
```

Una volta riavviato lo stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container storage-app-1 Started                                                                                  3.2s
```

Docker crea il volume e gli assegna un identificativo generato automaticamente. 

Per mostrare soltanto il mount con destinazione `/cache` possiamo filtrare l'output:

```shell
$ docker inspect --format '{{range .Mounts}}{{if eq .Destination "/cache"}}{{json .}}{{end}}{{end}}' "$(docker compose ps -q app)"
```
```json
{
  "Type": "volume",
  "Name": "954da4f03d74e2b378f422e8f1a4d0249bfd563c80cd1b0e6d56b542bbb96b68",
  "Source": "/var/lib/docker/volumes/954da4f03d74e2b378f422e8f1a4d0249bfd563c80cd1b0e6d56b542bbb96b68/_data",
  "Destination": "/cache",
  "Driver": "local",
  "Mode": "z",
  "RW": true,
  "Propagation": ""
}
```

Diversamente da un `tmpfs`, i dati di un volume anonimo non vengono eliminati semplicemente arrestando il container.

Se Compose ricrea un container esistente con `up`, normalmente riutilizza i suoi volumi anonimi. Qualora non volessimo
questo comportamento doveremo specificare l'opzione `--renew-anon-volumes` per crearne di nuovi.

Con `down`, invece, i container vengono rimossi e i volumi anonimi rimangono sul disco, ma un successivo `up` non li
ricollega automaticamente, perché non avendo un nome stabile nella configurazione Compose non è in grado di farlo.

***

> __initial content__
>
> - a mount hides the underlying directory
> - empty volumes may receive image files
> - application initialization has its own rules

Quando montiamo un volume su una directory già presente nel container, i file esistenti nell'immagine restano nascosti
dal mount. Nel caso di un **bind mount** vedremo i file della directory sull'host, anche se questa è vuota. I file che 
erano presenti nell'immagine rimangono comunque disponibili qualora disattivassimo la mount.

Con un **volume vuoto** invece, Docker si comporta diversamente. Se trova dei file nella destinazione dell'immagine, 
normalmente li copia all'interno del volume. Possiamo disabilitare questa copia iniziale con l'opzione `volume.nocopy`.

Se invece il **volume contiene già dei dati**, Docker li conserva senza sovrascriverli e hanno la precedenza sui dati
che erano presenti inizialmente nell'immagine.

In ogni caso queta copia avviene solo all'inizio, durante l'avvio dello stack, non è una sincronizzazione continua.
Aggiornare l'immagine non aggiorna quindi automaticamente i file che si trovano già all'interno del volume.

Lo stesso principio è importante per i database. Molte immagini eseguono gli script di inizializzazione solo quando la 
directory dei dati è vuota. Cambiare una variabile in Compose potrebbe quindi non modificare i dati di un database già
inizializzato. Prima di intervenire verifichiamo sempre la procedura prevista dall'immagine, senza cancellare il volume
e i suoi dati alla leggera per evitare problemi.

***

Un mount scrivibile (non in `readonly` per capirci) può comunque restituire `Permission denied` se proviamo ad accedere
al suo contenuto, perché in questo caso contano anche l'utente del processo e i permessi dei files.

```shell
$ docker compose exec app id
```
```terminaloutput
uid=0(root) gid=0(root) groups=0(root),0(root),1(bin),2(daemon),3(sys),4(adm),6(disk),10(wheel),11(floppy),20(dialout),26(tape),27(video)
```

Questo comando ci mostra l’utente `root`, il suo gruppo principale ed eventuali gruppi aggiuntivi. Questi identificativi
contribuiscono a determinare quali file il processo può leggere o modificare.

```shell
$ docker compose exec app ls -ldn /data /data/message.txt
```
```terminaloutput
drwxr-xr-x   2   0   0   4096   Nov 5   08:16   /data
-rw-r--r--   1   0   0     11   Nov 5   08:16   /data/message.txt
```

Il comando `ls -n` mostra UID e GID numerici, su Linux sono questi identificativi, non la coincidenza dei nomi  utente,
a determinare proprietà e accesso. L'immagine Alpine della prova parte come root, ma molte immagini applicative usano
utenti non privilegiati.

Quando un accesso fallisce, ricordiamoci di confrontare l'utente effettivo del processo con il proprietario, il gruppo e
i permessi dei file e delle directory. In questo modo possiamo individuare il problema prima di modificare i permessi.

Infine, per distruggere lo stack comprensivo di tutti i volumi collegati utilizziamo il comando:

```shell
$ docker compose down -v
```
```terminaloutput
[+] down 3/3
 ✔ Container storage-app-1 Removed                                                                                  3.1s
 ✔ Volume storage_app-data Removed                                                                                  0.0s
 ✔ Network storage_default Removed                                                                                  0.1s
```

***

> __external volumes and storage location__
>
> - local is still local
> - external means separately managed
> - shared storage needs application support

Come per le reti, anche i volumi possono essere gestito fuori dal progetto.

Il volume deve già esistere, Compose lo cerca con il nome esatto e non lo elimina con `down`, neppure aggiungendo `-v`.

**Esterno al progetto non significa remoto o replicato**. Un normale volume locale vive sull'host Docker, dentro la VM
nel caso dei container Linux su Desktop. Non protegge da un guasto di quella macchina.

Driver e storage di rete possono offrire comportamenti diversi, ma non tutti i filesystem sono adatti a qualsiasi 
database. Verifichiamo supporto applicativo, locking, sincronizzazione delle scritture e prestazioni. 

Anche le prestazioni dei bind mount possono cambiare fra Linux, macOS e Windows. Per molti file piccoli, dipendenze o 
dati di database, misuriamo il comportamento e scegliamo uno storage adatto, senza attribuire a Compose garanzie che 
dipendono dal filesystem sottostante.

La persistenza ci permette di sostituire i container, il backup ci permette di recuperare i dati quando qualcosa va
storto, ma tratteremo le copie e il ripristino in un capitolo dedicato.

***

> Resources
>
> - [Volumes in Compose](https://docs.docker.com/reference/compose-file/volumes/)
