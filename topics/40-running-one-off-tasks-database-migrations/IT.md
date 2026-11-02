# Running one-off tasks and database migrations

> __one-off tasks__
>
> - check the result
> - run a command and finish
> - reuse the service configuration

Non tutti i container devono restare accesi. Un server web aspetta richieste, mentre un'importazione di dati, un comando
amministrativo o una migrazione di un database devono svolgere un lavoro e poi terminare.

Nel [capitolo precedente](../39-startup-dependencies-healthchecks-readiness/IT.md) abbiamo aspettato che un servizio 
fosse pronto, questa volta vedremo come fare anche ad aspettare che un'attività sia stata completata.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose/jobs
```

E analizziamo il file `compose.yaml`:

```yaml
services:
  tools:
    image: alpine
    profiles: [ tools ]
    command: [ "echo", "Operation completed" ]
```

Specificando un profilo possiamo mantenere lo strumento fuori dall'avvio normale dello stack (che in questo esempio non
abbiamo ancora definito), ma possiamo comunque richiamarlo direttamente, come abbiamo visto nei capitoli precedenti.

Procediamo quindi con il comando:

```shell
$ docker compose run --rm tools
```
```terminaloutput
[+] run 1/1
 ✔ Network jobs_default Created                                                                                     0.0s
Container jobs-tools-run-0881815f0f18 Creating 
Container jobs-tools-run-0881815f0f18 Created 
Operation completed
```

E come possiamo vedere otterremo, come immaginato, il messaggio `Operation completed`.

***

Come gia visto nella prima parte di questo corso, anche tramite compose possiamo specificare un comando alternativo
all'avvio di un container del nostro stack specificandolo dopo al nome del servizio:

```shell
$ docker compose run --rm tools uname -m
```
```terminaloutput
Container jobs-tools-run-61b8ae226bbd Creating 
Container jobs-tools-run-61b8ae226bbd Created 
aarch64
```

Questa volta otterremo in output l'architettura del container, nel mio caso `aarch64`.

Il comando dopo `tools` sostituisce `COMMAND` ma non sostituisce automaticamente l'eventuale `ENTRYPOINT` dell'immagine.

Una cosa da tenere in considerazione, è che il comando `run` riutilizza tutta la configurazione del servizio, comprese
reti, variabili e mount. Il container è nuovo ogni volta, ma un eventuale volume collegato può contenere dati reali.

...

Per vedere la differenza con `exec`, avviamo un container del servizio mantenendolo in attesa.

Sostituiamo nel file la riga `command` con questa:

```shell
$ nano compose.yaml
```
```yaml
command: [ "sleep", "infinity" ]
```

Avviamo nuovamente il container del servizio:

```shell
$ docker compose up -d tools
```
```terminaloutput
[+] up 1/1
 ✔ Container jobs-tools-1 Started                                                                                   0.1s
```

E lanciamo il comando `uname` tramite l'opzione `exec`:

```shell
$ docker compose exec tools uname -m
```
```terminaloutput
aarch64
```

Dopo aver ottenuto nuovamente l'architettura del container, lanciamo lo stesso comando tramite `run`:

```shell
$ docker compose run --rm tools uname -m
```
```terminaloutput
Container jobs-tools-run-507bfaca8848 Creating 
Container jobs-tools-run-507bfaca8848 Created 
aarch64
```

Infine, verifichiamo tramite `ps` quali container sono ancora in esecuzione:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME           IMAGE     COMMAND            SERVICE   CREATED              STATUS              
jobs-tools-1   alpine    "sleep infinity"   tools     About a minute ago   Up About a minute   
```

Otterremo solamente il container con lo `sleep infinity`!

Questo perché `exec` esegue il comando nel container già acceso, `run` ne crea uno nuovo, lo usa e poi lo elimina,
lasciando quindi acceso solamente il primo.

Questo ci può fare facilmente intuire che se volessimo entrare nella shell di un servizio esistente possiamo usare:

```shell
$ docker compose exec tools sh
```

Una volta entrati nella shell lanciamo ad esempio il comando:

```shell
# hostname
```
```terminaloutput
7eadfd60a880
```

E otterremo in output il nome del container stesso.

Come avrete sicuramente intuito, un comando eseguito con `exec` non diventa una modifica permanente dell'immagine.

Se facciamo infatti nuovamente:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME           IMAGE     COMMAND            SERVICE   CREATED              STATUS              
jobs-tools-1   alpine    "sleep infinity"   tools     9 minutes ago        9 minutes ago 
```

Vedremo che il container è ancora in esecuzione con il comando `sleep infinity`.

Stoppiamo infine il tutto come sempre con il comando:

```shell
$ docker compose --profile "*" down
```
```terminaloutput
[+] down 2/2
 ✔ Container jobs-tools-1 Removed                                                                                   3.1s
 ✔ Network jobs_default   Removed                                                                                   0.1s
```

***

> __complete a job before startup__
>
> - initialize once per execution
> - wait for successful completion
> - stop on failure

Alcuni servizi hanno bisogno che un'attività preliminare sia conclusa prima di poter partire correttamente. 

Può trattarsi della creazione di un file, dell'inizializzazione di dati condivisi o di una migrazione, in tutti questi 
casi non basta avviare i container nello stesso momento ma serve esprimere una dipendenza dal completamento con successo 
del job.

La differenza rispetto a un normale servizio di supporto è importante, il job non deve restare in esecuzione, deve 
terminare con esito positivo. Il suo stato finale diventa parte della sequenza di avvio dello stack.

Se conclude con codice `0`, gli altri servizi possono proseguire, se fallisce l'avvio invece, gli altri servizi devono
fermarsi prima che l'applicazione lavori su dati incompleti o su uno stato non coerente.

***

Spostiamoci nella directory `sources/compose/initialization` e analizziamo il file `compose.yaml`:

```yaml
volumes:
  demo-data:

services:
  prepare:
    image: alpine
    restart: "no"
    volumes:
      - demo-data:/data
    command:
      - sh
      - -ec
      - |
        if [ -f /data/message.txt ]; then
          echo "File already exists"
          exit 1
        else
          echo "Data ready" > /data/message.txt
          echo "Preparation completed"
        fi
  app:
    image: alpine
    depends_on:
      prepare:
        condition: service_completed_successfully
    volumes:
      - demo-data:/data:ro
    command: [ "sh", "-ec", "cat /data/message.txt; exec sleep infinity" ]
```

In questo stack possiamo vedere la dichiarazione di un volume, utilizzato poi dal servizio `prepare`, che si occupa di
verificare l'esistenza di un file, altrimenti lo crea e termina con un messaggio informativo.

Lo stesso volume viene poi anche utilizzato dal servizio `app` che legge il file e rimane acceso in attesa.

Il volume rende il file accessibile a entrambi i container, con la differenza che `app` lo monta in sola lettura.

La condizione `service_completed_successfully` richiede che il servizio `prepare` termini con successo prima che il
servizio `app` venga avviato.

Proviamo quindi a lanciare questo stack e vediamo cosa succede:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 4/4
 ✔ Network initialization_default     Created                                                                       0.0s
 ✔ Volume initialization_demo-data    Created                                                                       0.0s
 ✔ Container initialization-prepare-1 Exited                                                                        0.6s
 ✔ Container initialization-app-1     Started                                                                       0.7s
```

Come possiamo vedere, viene prima avviato il container `prepare` e una volta uscito viene avviato il container `app`.

Se verifichiamo i processi attivi:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME                       IMAGE     COMMAND                  SERVICE   CREATED          STATUS                     
initialization-app-1       alpine    "sh -ec 'cat /data/m…"   app       27 seconds ago   Up 27 seconds               
initialization-prepare-1   alpine    "sh -ec 'if [ ! -f /…"   prepare   26 seconds ago   Exited (0) 26 seconds ago  
```

Vedremo che il container `prepare` è stato avviato ed è terminato con successo (codice di uscita `0`), mentre il secondo
container `app` è stato avviato ed è rimasto in esecuzione come previsto.

Se andiamo a controllare i logs:

```shell
$ docker compose logs
```
```terminaloutput
prepare-1  | Preparation completed
app-1      | Data ready
```

Vedremo infatti il messaggio `Preparation completed` e `Data ready` dai due containers.

***

Per osservare il caso di errore, eseguiamo prima `docker compose down` (senza `-v` in modo da mantenere il volume) e
procediamo poi con il riavvio dello stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 3/3
 ✔ Network initialization_default     Created                                                                       0.0s
 ✘ Container initialization-prepare-1 Error service "prepare" didn't complete successfully: exit 1                  0.6s
 ✔ Container initialization-app-1     Created                                                                       0.0s
service "prepare" didn't complete successfully: exit 1
```

Come possiamo vedere, in questo caso il file nel volume era già presente e quindi il nostro script di preparazione ha
fallito, uscendo con codice `1`, Compose se ne è accorto e nonostante `app` sia stato creato non è stato avviato.

Se verifichiamo infatti i processi:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME                       IMAGE     COMMAND                  SERVICE   CREATED          STATUS                      
initialization-app-1       alpine    "sh -ec 'cat /data/m…"   app       19 seconds ago   Created                     
initialization-prepare-1   alpine    "sh -ec 'if [ -f /da…"   prepare   18 seconds ago   Exited (1) 18 seconds ago 
```

Vedremo che lo stato del container `initialization-app-1 ` è rimasto fermo a `created`.

Ricordatevi di fare attenzione che questo vincolo vale solamenta durante l'operazione `up` di Compose, non spegne
un'applicazione già in esecuzione se lanciamo successivamente un altro job che fallisce.

Inoltre non è neppure una garanzia di esecuzione unica per tutta la vita del progetto.

Stoppiamo nuovamente lo stack con:

```shell
$ docker compose down -v
```
```terminaloutput
[+] down 3/3
 ✔ Container initialization-app-1     Removed                                                                       0.0s
 ✔ Container initialization-prepare-1 Removed                                                                       0.0s
 ✔ Network initialization_default     Removed                                                                       0.1s
 ✔ Volume initialization_demo-data    Removed                                                                       0.0s
```

***

> __database migrations__
>
> - use the application's migration tool
> - coordinate concurrent executions
> - plan data compatibility

Una migrazione reale modifica la struttura del database, i suoi dati, oppure entrambe le cose.

Di solito il job di migrazione usa la stessa immagine dell'applicazione ed esegue il comando previsto dal framework, 
ad esempio il comando dell'ORM per applicare le migrazioni del progetto.

La sequenza corretta diventa quindi:

1. il database è avviato e pronto;
2. la migrazione viene eseguita e termina con successo;
3. l'applicazione viene avviata.

In Compose possiamo esprimere questa sequenza con le dipendenze tra servizi.  

Il job di migrazione può aspettare che il database sia pronto usando `service_healthy`, mentre l'applicazione può 
aspettare che il job sia terminato correttamente usando `service_completed_successfully`.

È importante però non confondere le due cose, l'healthcheck del database indica solo che il database risponde, non che
lo schema sia già aggiornato.

L'esempio visto in questo capitolo crea un semplice file dimostrativo, quindi non è una vera migrazione. Il controllo 
sull'esistenza del file evita di sovrascriverlo nelle esecuzioni successive, ma non protegge da esecuzioni concorrenti, 
per esempio due processi che provano a scrivere nello stesso momento.

Per le migrazioni reali dobbiamo usare strumenti pensati per questo scopo. Questi strumenti tengono traccia delle 
versioni già applicate e, quando necessario, usano meccanismi di coordinamento come lock o tabelle dedicate.

Dobbiamo anche evitare di avviare la stessa migrazione ad ogni replica dell'applicazione in caso di ridondanza. La
migrazione deve essere eseguita in modo controllato, una sola volta, prima che le repliche inizino a lavorare.

Lo stesso principio vale anche per importazioni di dati e comandi amministrativi, devono gestire duplicati, esecuzioni 
interrotte e possibili ripetizioni. Un'operazione si definisce **idempotente** quando può essere eseguita più volte 
senza produrre effetti indesiderati aggiuntivi.

Compose può eseguire un comando dentro un container, ma non lo rende automaticamente sicuro o idempotente. 

Questa responsabilità rimane nel comando, nello script o nello strumento che stiamo usando.

***

> Resources
>
> - [One-off commands with Compose](https://docs.docker.com/reference/cli/docker/compose/run/)
