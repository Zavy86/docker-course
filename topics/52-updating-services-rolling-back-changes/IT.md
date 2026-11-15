# Updating services and rolling back changes

> __prepare before replacing a service__
>
> - identify the current release
> - verify the new release
> - keep a recovery path

Se dopo un aggiornamento gli utenti non riuscissero più ad accedere alla nostra applicazione, la priorità sarebbe quella
di ripristinare il servizio il prima possibile. Tuttavia tornare alla versione precedente, nonostante possa sembrare la
strada più rapida, potrebbe non essere sempre la soluzione migliore e soprattutto, senza aver conservato l'immagine e la
configurazione precedente potrebbe essere difficile da ripristinare.

Per gestire una situazione di questo tipo, dobbiamo _prepararci prima_ di applicare l'aggiornamento, conservando sempre
la versione in uso insieme alla sua configurazione e stabilendo quali controlli fare dopo la sostituzione. In questo
modo, qualora la nuova versione non dovesse funzionare come previsto, avremmo già a disposizione ciò che serve per poter
tornare a quella precedente.

Questa operazione prende il nome di rollback e, come vedremo, richiede qualche attenzione in più rispetto alla semplice
ricostruzione dello stack.

Oltre alla versione dell'applicazione, dobbiamo però considerare anche ciò che potrebbe essere cambiato nei dati. Se
durante l'aggiornamento fosse stato modificato un database, per esempio tramite una migrazione, rimettere in esecuzione
la vecchia immagine potrebbe non essere sufficiente, perché l'applicazione potrebbe non riuscire più a leggere i dati
nel nuovo formato.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose/update
```

```shell
$ cd docker-course/sources/compose/monitoring
```

E vediamo quali file contiene:

```shell
$ ls
```
```terminaloutput
compose.yaml
Dockerfile
index.html
```

Nel file HTML troviamo:

```html
<h1>version one</h1>
```

Un semplice header che ci permetterà di riconoscre quale versione sarà in esecuzione.

Un Dockerfile contente:

```dockerfile
FROM busybox
COPY index.html /www/index.html
CMD [ "httpd", "-f", "-p", "8080", "-h", "/www" ]
```

Un'immagine personalizzata che viene costruira a partire dall'immagine base di `busybox`, prosegue con la copia del file
`index.html` e conclude con il comando `CMD` che avvia il server HTTP.

Come sappiamo con `COPY` la pagina viene inclusa direttamente nell'immagine e rimane quindi legata alla versione che
stiamo costruendo. Di conseguenza, anche se dovessimo modificare il file sul computer, il container già in esecuzione
continuerebbe a mostrare il contenuto precedente.

Infine nel file `compose.yaml`:

```yaml
services:
  web:
    image: compose-update-demo:v1
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "wget", "-q", "-O", "/dev/null", "http://localhost:8080"]
      interval: 2s
      timeout: 2s
      retries: 5
```

Dove troviamo definito il nome dell'immagine, con la versione che vorremmo andare a eseguire, la porta aperta sull'host
e un healthcheck che provi a raggiungere il server HTTP dall'interno del container, così da avere un primo controllo sul
suo effettivo funzionamento.

Procediamo quindi con la costruzione dell'immagine:

```shell
$ docker build -t compose-update-demo:v1 .
```
```terminaloutput
[+] Building 0.1s (7/7) FINISHED                                                                    docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                0.0s
 => => transferring dockerfile: 132B                                                                                0.0s
 => [internal] load metadata for docker.io/library/busybox:latest                                                   0.0s
 => [internal] load .dockerignore                                                                                   0.0s
 => => transferring context: 2B                                                                                     0.0s
 => [internal] load build context                                                                                   0.0s
 => => transferring context: 58B                                                                                    0.0s
 => CACHED [1/2] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a5                       0.0s
 => => resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s
 => [2/2] COPY index.html /www/index.html                                                                           0.0s
 => exporting to image                                                                                              0.0s
 => => exporting layers                                                                                             0.0s
 => => exporting manifest sha256:06c4219876b44693dad45db7bb431e3c82eb68c0626a4e72b51eb29f4220                       0.0s
 => => exporting config sha256:863888ec288a66fcb0e08b743bd888c02a9d1fccf42c060689d288d3a92c8c                       0.0s
 => => exporting attestation manifest sha256:36fb2f5ae6cd41b1746a380304bbc4b60287ece7f2be3e8a                       0.0s
 => => exporting manifest list sha256:d1cf35333ec49f8da3f0449d9a36c831e1e51935dd2f51191373e63                       0.0s
 => => naming to docker.io/library/compose-update-demo:v1                                                           0.0s
 => => unpacking to docker.io/library/compose-update-demo:v1                                                        0.0s
```

E l'avvio del servizio:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network updates_default Created                                                                                  0.0s
 ✔ Container updates-web-1 Started                                                                                  0.1s
```

Una volta completato l'avvio, inviamo una richiesta HTTP per controllare la pagina:

```shell
$ curl --fail http://localhost:8080
```
```terminaloutput
<h1>version one</h1>
```

E come ci aspettavamo otterremo la versione uno.

Recuperiamo poi anche l'ID dell'immagine effettivamente utilizzata dal servizio con il comando:

```shell
$ docker inspect $(docker compose ps -q web) --format '{{.Config.Image}} {{.Image}}' 
```
```terminaloutput
compose-update-demo:v1 sha256:d1cf35333ec49f8da3f0449d9a36c831e1e51935dd2f51191373e632a7533914
```

Questo passaggio è utile perché il tag, nonostante ci permetta di riconoscere una versione, rimane un riferimento che
potrebbe essere assegnato in seguito a un'immagine diversa. L'ID ci permette invece di identificare l'immagine locale
effettivamente usata dal container. Quando distribuiamo immagini tramite un registry, possiamo fissare il riferimento
utilizzando un digest e conservarlo insieme alla configurazione del rilascio, così da sapere con precisione quale
immagine dovremo recuperare.

Dobbiamo inoltre tenere presente che assegnare un tag alla nostra build non basta, da solo, a renderla riproducibile.

Nel Dockerfile dell'esempio usiamo `busybox` come base, ma anche quella immagine potrebbe cambiare nel tempo. Infatti se
volessimo poter ricostruire la stessa versione, dovremmo quindi fissare anche il riferimento della base utilizzata.

Ma nel nostro caso, in questo banale esempio, sarebbe superfluo...

***

Ora che la prima versione è in funzione, passiamo a preparare l'aggiornamento.

Modifichiamo quindi la pagina sostituendo il testo con `version two` e aggiorniamo il tag nel file `compose.yaml`.

Procediamo quindi con la build dell'immagine con il tag `v2`:

```shell
$ docker build -t compose-update-demo:v2 .
```
```terminaloutput
[+] Building 0.1s (7/7) FINISHED                                                                    docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                0.0s
 => => transferring dockerfile: 132B                                                                                0.0s
 => [internal] load metadata for docker.io/library/busybox:latest                                                   0.0s
 => [internal] load .dockerignore                                                                                   0.0s
 => => transferring context: 2B                                                                                     0.0s
 => [internal] load build context                                                                                   0.0s
 => => transferring context: 58B                                                                                    0.0s
 => CACHED [1/2] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a5                       0.0s
 => => resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s
 => [2/2] COPY index.html /www/index.html                                                                           0.0s
 => exporting to image                                                                                              0.0s
 => => exporting layers                                                                                             0.0s
 => => exporting manifest sha256:0340e4438ba7585fc95862ceaa9021d0cc820ad8a37fa35350d2c4c58e90                       0.0s
 => => exporting config sha256:3743e3944fe33ac7cc5a8e178ba7a7667553c4bf35a780ae297873da381001                       0.0s
 => => exporting attestation manifest sha256:58987a453706e533c249dd5eecd7c2952c51c7190f06c4ba                       0.0s
 => => exporting manifest list sha256:6cf673c6d986892e59a65a850496aa16ac4094a9bdd91579c6332d5                       0.0s
 => => naming to docker.io/library/compose-update-demo:v2                                                           0.0s
 => => unpacking to docker.io/library/compose-update-demo:v2                                                        0.0s
```

Nonostante la build abbia preparato la seconda immagine, e l'aggiornamento del tag all'interno della definizione dello
stack, il container già in esecuzione continua a usare la prima versione e quindi a mostrare la pagina precedente.

Possiamo verificarlo aprendo il browser alla pagina (http://localhost:8080)[http://localhost:8080], dove continueremo 
a leggere ancora `version one`.

Procediamo quindi cheiedendo a Compose di applicare la modifica al servizio:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container updates-web-1 Started                                                                                  3.2s
```

Al termine dell'aggiornamento, torniamo sul browser e verifichiamo l'esito della sostituzione.

Verifichiamo poi anche l'ID dell'immagine:

```shell
$ docker inspect $(docker compose ps -q web) --format '{{.Config.Image}} {{.Image}}' 
```
```terminaloutput
compose-update-demo:v2 sha256:6cf673c6d986892e59a65a850496aa16ac4094a9bdd91579c6332d5048fff1b6
```

Confermandoci ulteriormente che lo stack sta utilizzando la versione corretta con tag e ID aggiornati rispetto a prima.

***

Se dopo l'aggiornamento dovessimo rilevare un problema, potremmo tornare alla prima versione andando semplicemente, in
questo esempio, a modificare il valore dell'immagine nel servizio a `compose-update-demo:v1`. 

Senza dover infatti modificare il file HTMl, possiamo semplicemente dire a Docker di andare a utilizzare la precedente
versione dell'immagine. Se riavviamo lo stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container updates-web-1 Started                                                                                  3.2s
```

Vedremo nuovamente nel browse la versione precedente con la scritta `version one`.

Questo ovviamente è stato possibile perche sul nostro host era ancora presente l'immagine precedente, se non utilizziamo
un registro, dobbiamo fare molta attenzione a effettuare periodicamente anche i backup delle immagini. Non diamo per
scontato che saremo sempre in grado di ricostruirle. Ad esempio l'immagine di partenza, in futuro, potrebbe non essere 
più disponibile se utilizziamo delle immagini particolari.

Qualora il vecchio tag fosse stato assegnato a un'altra immagine, possiamo anche specificare il digest dell'immagine nel
file compose.yaml, se proviamo infatti a inserire l'ID dell'immagine (comprensivo di `sha256:`) della prima versione,
vedremo che tutto continua a funzionare correttamente:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container updates-web-1 Started                                                                                  2.7s
```

Terminati i controlli sul browser, come sempre chiudiamo con un:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container updates-web-1 Removed                                                                                  3.1s
 ✔ Network updates_default Removed                                                                                  0.1s
```

***

> __application rollback is not data rollback__
>
> - schema compatibility
> - writes made after the update
> - tested backups and recovery time

Nel nostro sito statico siamo riusciti a tornare alla prima versione senza particolari difficoltà, perché l'applicazione
non modificava nessun dato persistente. Se invece avessimo un database, dovremmo considerare anche ciò che la nuova 
versione potrebbe aver scritto o modificato durante il suo utilizzo. Per poter tornare indietro, infatti, la vecchia 
applicazione dovrebbe essere ancora in grado di leggere e usare quei dati, altrimenti il ripristino dell'immagine non 
sarebbe sufficiente.

Una migrazione che eliminasse una colonna o cambiasse il formato dei dati potrebbe quindi impedirci di usare nuovamente
la versione precedente, nonostante la sua immagine sia ancora disponibile. Per questo, prima di aggiornare, se si tratta 
di un'applicazione non creata direttamente da noi, leggiamo bene le note di rilascio e proviamo le migrazioni su una 
copia isolata, così da capire quali cambiamenti introducono. Prepariamo inoltre un backup coerente e verifichiamo di 
riuscire a ripristinarlo, perché la sola presenza di una copia non ci garantisce di poterla utilizzare quando servirà.

Quando abbiamo la possibilità di intervenire sul modo in cui l'applicazione evolve, possiamo separare l'introduzione di
cambiamenti compatibili dalle rimozioni definitive. In questo modo lasciamo un periodo durante il quale lo schema dei
dati può essere usato sia dalla vecchia sia dalla nuova versione, rendendo più semplice un eventuale rollback. Se invece
una migrazione introducesse modifiche incompatibili, dovremmo pianificare prima come recuperare, senza dare per scontato
che lo strumento utilizzato disponga di una procedura inversa sicura.

Anche il ripristino di un backup, potrebbe non essere privo di conseguenze, perché riporterebbe i dati a una situazione 
precedente e potremmo perdere le scritture effettuate nel frattempo. Prima di procedere dobbiamo quindi definire fino a
quale momento recuperarli e fermare o coordinare i processi che continuano a modificarli. Le prove di rollback sarebbe
invece sempre meglio effettuarle su una copia isolata, evitando soprattutto di collegare contemporaneamente due versioni
incompatibili allo stesso database.

Se per completare questi passaggi fosse necessario interrompere il servizio, dovremmo prevedere con gli utenti attivi
una finestra di manutenzione e organizzare l'aggiornamento di conseguenza. La presenza di un proxy e di più repliche non
risolve da sola le incompatibilità tra versioni e non ci evita di gestire le connessioni ancora aperte o le operazioni
in corso. La possibilità di mantenere disponibile il servizio, con due versioni diverse in contemporanea, dipende quindi
da come l'applicazione gestisce l'aggiornamento.

Conservare immagini e configurazioni precedenti ci permette di prepararci a un eventuale rollback. Tuttavia, prima di
tornare indietro, dobbiamo sempre anche verificare la compatibilità dei dati, perché ripristinare la vecchia immagine
potrebbe non bastare a rimettere in funzione il servizio.

***

> Resources
>
> - [Using Compose in production](https://docs.docker.com/compose/how-tos/production/)
