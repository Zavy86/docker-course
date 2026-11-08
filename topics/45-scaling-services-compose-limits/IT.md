# Scaling services and understanding Compose limits

> __scale a service__
>
> - one definition, multiple containers
> - each replica consumes resources
> - one host is still one host

Quando il carico di lavoro aumenta, una sola istanza di un servizio può non riuscire a gestirlo. Compose ci permette di 
avviare più repliche dalla stessa definizione, ma dobbiamo valutare come distribuire le richieste, gestire lo stato e
condividere le risorse disponibili.

Nel [capitolo precedente](../44-resource-limits-runtime-configuration/IT.md) abbiamo assegnato dei limiti a un servizio.
Con più repliche quei limiti valgono per ciascun container, quindi dobbiamo considerare anche il consumo complessivo.

Ma come sempre vediamo nella pratica come sfruttare questa funzionalità direttamente con mano al terminale.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose/scaling
```

E analizziamo il file `compose.yaml`:

```yaml
services:
  client:
      image: busybox
      command: [ "sleep", "infinity" ]
  server:
    image: busybox
    command:
      - sh
      - -ec
      - |
        mkdir -p /www
        hostname > /www/index.html
        echo "Starting HTTP server on $(hostname)"
        exec httpd -f -p 8080 -h /www

```

In questo semplice esempio avvieremo un client, al quale poi potremmo collegarci per effettuare le nostre prove, e un
server web che mostrerà semplicemente sulla porta interna 8080 il proprio hostname, così da permetterci poi in modo
semplice di riconoscere quale container ha risposto, senza sviluppare un'applicazione vera e propria.

Lanciamo quindi lo stack con il solito:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 3/3
 ✔ Network scaling_default    Created                                                                               0.0s
 ✔ Container scaling-server-1 Started                                                                               0.1s
 ✔ Container scaling-client-1 Started                                                                               0.1s
```

Se volessimo scalare manualmente il nostro server potremmo farlo tramite l'opzione scale direttamente nel comando up:

```shell
$ docker compose up -d --scale server=3
```
```terminaloutput
[+] up 4/4
 ✔ Container scaling-server-1 Started                                                                               3.4s
 ✔ Container scaling-server-3 Started                                                                               3.3s
 ✔ Container scaling-server-2 Started                                                                               3.3s
 ✔ Container scaling-client-1 Started                                                                               3.2s
```

Come possiamo vedere dal log o con il comando:

```shell
$ docker compose ps
```
```terminaloutput
NAME               IMAGE     COMMAND                  SERVICE   CREATED          STATUS          
scaling-client-1   busybox   "sleep infinity"         client    45 seconds ago   Up 44 seconds   
scaling-server-1   busybox   "sh -ec 'mkdir -p /w…"   server    45 seconds ago   Up 43 seconds   
scaling-server-2   busybox   "sh -ec 'mkdir -p /w…"   server    45 seconds ago   Up 42 seconds   
scaling-server-3   busybox   "sh -ec 'mkdir -p /w…"   server    45 seconds ago   Up 41 seconds
```

Otteniamo tre container per `server` e uno per `client`. Le tre istanze del server condividono la stessa immagine e la
stessa configurazione del servizio, ma hanno processi, rete e filesystem scrivibile propri.

Se volessimo a questo punto eseguire un comando su una replica specifica dovremmo farlo specificandone l'indice:

```shell
$ docker compose exec --index 1 server hostname
```
```terminaloutput
91e0911b4c12
```

```shell
$ docker compose exec --index 2 server hostname
```
```terminaloutput
edce81ee79d7
```

I due comandi mostrano gli hostname delle rispettive repliche.

Se invece non specifichiamo l'indice ma solamente il nome del servizio:

```shell
$ docker compose logs server
```
```terminaloutput
server-3 | Starting HTTP server on 73155d675b5c
server-2 | Starting HTTP server on c1396943faa3
server-1 | Starting HTTP server on d96346db532a
```

Vedremo i log di ogni replica con un prefisso che ne indica l'istanza, così che possiamo distinguere le repliche.

***

Per ridurre il numero delle istanze possiamo utilizzare sempre lo stesso comando:

```shell
$ docker compose up -d --scale server=1
```
```terminaloutput
[+] up 4/4
 ✔ Container scaling-server-1 Running                                                                               0.0s
 ✔ Container scaling-client-1 Running                                                                               0.0s
 ✔ Container scaling-server-2 Removed                                                                               3.1s
 ✔ Container scaling-server-3 Removed                                                                               3.1s
```

E in automatico Compose di occuperà di ridurre il numero delle repliche partendo da quelle con indice più alto.

***

Per mantenere il numero desiderato anche nella configurazione, possiamo impostare `scale` direttamente nel servizio:

```yaml
[...]
server:
  image: busybox
  scale: 3
[...]
```

A questo punto se avviamo nuovamente lo stack, senza specificarne il numero di repliche:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 4/4
 ✔ Container scaling-server-1 Running                                                                               0.0s
 ✔ Container scaling-client-1 Running                                                                               0.0s
 ✔ Container scaling-server-3 Started                                                                               0.1s
 ✔ Container scaling-server-2 Started                                                                               0.1s
```

Otterreo nuovamente le nostre tre repliche del server.

***

A questo punto, sfruttiamo il client per effettuare un paio di prove:

```shell
$ docker compose exec client nslookup server
```
```terminaloutput
Server:  127.0.0.11
Address: 127.0.0.11:53

Non-authoritative answer:
Name:    server
Address: 172.18.0.4
Name:    server
Address: 172.18.0.3
Name:    server
Address: 172.18.0.5
```

Tramite il lookup possiamo vedere che il DNS risolve il nome del servizio con tre indirizzi IP e non più solo uno.

Se proviamo poi a scaricare la pagina web sempre tramite il client:

```shell
$ docker compose exec client wget -q -O - http://server:8080
```
```terminaloutput
835b0a608735
```

Ogni richiesta restituirà l'hostname di uno dei tre server, ripetendola potremmo incontrare repliche diverse:

```shell
$ docker compose exec client wget -q -O - http://server:8080
```
```terminaloutput
d96346db532a
```

Ma non dobbiamo aspettarci una rotazione regolare o una distribuzione uniforme:

```shell
$ docker compose exec client wget -q -O - http://server:8080
```
```terminaloutput
93d595a28bd5
```

Il comportamento dipende anche dal client, dalla cache DNS e dalle connessioni riutilizzate.

Il DNS non decide come distribuire ogni richiesta HTTP e non fornisce da solo un controllo delle repliche sane.

Per un punto di ingresso unico serve un proxy o un bilanciatore configurato per riconoscere le istanze, aggiornarsi 
quando cambiano e gestire quelle non disponibili.

Ma questo tema lo affronteremo più avanti in un capitolo dedicato al reverse proxy.

***

Per fare queste prove ho volutamente inserito un client piuttosto che collegare la porta del server con quella dell'host
per un motivo ben preciso, non è possibile assegnare la stessa porta TCP all'host e ogni replica.

Le tre repliche possono ascoltare tutte sulla porta interna `8080`, perché ciascuna ha il proprio spazio di rete ma non
possono invece occupare contemporaneamente lo stesso indirizzo e la stessa porta TCP dell'host.

Una pubblicazione fissa come:

```yaml
server:
  image: busybox
  scale: 3
  ports:
    - "8080:8080"
```

Entrerebbe quindi in conflitto appena Composera provasse ad avviare la seconda replica:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/4
 ✔ Container scaling-client-1 Running                                                                               0.0s
 ✔ Container scaling-server-1 Started                                                                               3.3s
 ⠸ Container scaling-server-2 Starting                                                                              3.2s
 ⠸ Container scaling-server-3 Starting                                                                              3.4s
Error response from daemon: failed to set up container networking: driver failed programming external connectivity on 
endpoint scaling-server-3 (c450b901078b7e36e254390cbc9e3353849b9ef5b36d00caad5ed26169a5cbf2): Bind for 0.0.0.0:8080 
failed: port is already allocated
```

Per osservare l'accesso dall'host senza generare questo conflitto, esponiamo la porta del servizio senza specificare una
porta fissa sull'host:

```yaml
server:
  image: busybox
  scale: 3
  ports:
    - ":8080"
```

In questo modo, sarà l'engine di Docker a scegliere una porta disponibile per ogni container:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 4/4
 ✔ Container scaling-client-1 Running                                                                               0.0s
 ✔ Container scaling-server-1 Started                                                                               3.3s
 ✔ Container scaling-server-3 Started                                                                               3.2s
 ✔ Container scaling-server-2 Started                                                                               3.3s
```

Con il solito:

```shell
$ docker compose ps
```
```terminaloutput
NAME               IMAGE     COMMAND                  SERVICE   CREATED          STATUS          PORTS
scaling-client-1   busybox   "sleep infinity"         client    27 minutes ago   Up 27 minutes   
scaling-server-1   busybox   "sh -ec 'mkdir -p /w…"   server    45 seconds ago   Up 45 seconds   0.0.0.0:52987->8080/tcp
scaling-server-2   busybox   "sh -ec 'mkdir -p /w…"   server    45 seconds ago   Up 44 seconds   0.0.0.0:52986->8080/tcp
scaling-server-3   busybox   "sh -ec 'mkdir -p /w…"   server    45 seconds ago   Up 43 seconds   0.0.0.0:52985->8080/tcp
```

Vedremo quali porte sono state assegnate alle repliche, e aprendo il nostro browser su queste porte, otterremo in output
il nome del container al quale sono state associate.

Questa tecnica ci permette di raggiungere le singole repliche, non crea un unico endpoint bilanciato. Inoltre le porte
possono cambiare dopo una ricreazione. In uno stack con proxy, normalmente pubblicheremo soltanto le porte del proxy e
lasciamo le repliche applicative raggiungibili soltanto sulla rete Docker.

Ma come già detto, affronteremo questo specifico tema in un prossimo capitolo.

Infine, stoppiamo anche questo stack con il solito:

```shell
$ docker compose down
```
```terminaloutput
[+] down 5/5
 ✔ Container scaling-server-3 Removed                                                                               3.3s
 ✔ Container scaling-server-2 Removed                                                                               3.1s
 ✔ Container scaling-server-1 Removed                                                                               3.2s
 ✔ Container scaling-client-1 Removed                                                                               3.2s
 ✔ Network scaling_default    Removed                                                                               0.1s
```

***

> __application state__
>
> - replicas need independent work
> - shared files need some coordination
> - sessions must survive instance changes

Lo scaling funziona bene quando l'applicazione è preparata per gestire più istanze. Un server che salva la sessione 
nella memoria locale può perdere il login dell'utente quando una richiesta successiva arriva a un'altra replica.

Possiamo usare uno storage di sessione condiviso o un modello applicativo che non dipenda da quello stato locale. Ma
a proposito di storage, anche gli uploads e i files da conservare devono avere una collocazione che non scompaia
rimuovendo una replica.

Ma dobbiamo fare anche attenzione al fatto che se colleghiamo un volume nominato al servizio, le repliche monteranno lo 
stesso identico volume e lo stesso vale per un bind mount con la medesima sorgente. In questo caso dovremmo fare molta
attenzione ai lock e alla concorrenza, per evitare che le repliche si pestino i piedi fra loro.

Più processi che scrivono negli stessi file richiedono infatti coordinamento applicativo. Non proviamo quindi a ottenere
tre database affidabili aumentando `--scale` e condividendo la stessa directory dati. Replica e failover di un database
richiedono una configurazione specifica e non così banale come si potrebbe pensare.

Nei pattern a eventi, non basta che la coda distribuisca i lavori fra i vari worker, deve anche gestirne le conferme,
tentativi e possibili duplicati. Un worker interrotto non deve far perdere un'attività né ripetere senza controllo
più volte un'operazione con effetti esterni.

Migrazioni, importazioni globali e operazioni periodiche non vanno avviate automaticamente in ogni replica. In queste
occasioni dovremmo sfruttare job separati, come già visto nel [capitolo 40](../40-running-one-off-tasks-database-migrations/IT.md).

***

> __Compose on a single host__
>
> - more replicas are not high availability
> - no automatic cross-host failover
> - plan capacity and recovery

Inoltre se l'host si spegne, tutte le repliche avviate sul suo Docker Engine si fermano contemporaneamente. Anche un
volume locale condiviso dipende dallo storage della stessa macchina. Per continuare a offrire il servizio durante un
guasto dell'host servono quindi una strategia di recupero e un'infrastruttura distribuita su più macchine.

Aumentare il numero di repliche con Compose, da solo, non garantisce la cosiddetta alta disponibilità.

Compose non sposta automaticamente i container su un altro host, non aggiunge repliche in risposta al traffico e non 
ricrea continuamente quelle eliminate per mantenere il numero configurato. Una politica di riavvio può far ripartire un
container esistente, mentre il numero di repliche viene applicato quando eseguiamo i comandi Compose appropriati.

Per failover e scalabilità automatici fra host occorre una soluzione di orchestrazione specifica.

Aumentare le repliche può anche esaurire le risorse disponibili e peggiorare le prestazioni. Tre repliche limitate
ciascuna a 256 MiB possono richiedere fino a 768 MiB complessivi, oltre alle risorse degli altri servizi.

Prima di aumentare il numero, valutiamo la capacità dell'host e gli eventuali colli di bottiglia, come disco o database.

Infine, avere più repliche non rende automaticamente un aggiornamento dello stack privo di interruzioni. Per mitigare
questo problema, servono un ingresso controllato, verifiche di readiness, compatibilità fra versioni e una strategia
applicativa per arrestare e sostituire le istanze una alla volta.

Compose rimane utile per descrivere e gestire uno stack su un singolo host, per un sistema di produzione, pianifichiamo
però capacità, backup e recupero del servizio a priori e adottiamo la soluzione di orchestrazione più adatta in base 
alle esigenze del progetto.

***

> Resources
>
> - [Starting and scaling services](https://docs.docker.com/reference/cli/docker/compose/up/)
