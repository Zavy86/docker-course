# Compose for development stack

> __compose for development stack__
>
> - stack definition
> - multiple containers
> - networking management
> - environment variables

Nel capitolo precedente abbiamo visto come sfruttare i container nel proprio ambiente di sviluppo locale per mitigare
alcuni dei principali problemi dei più classici workflow di sviluppo, come la gestione delle dipendenze e la coerenza
tra ambienti di sviluppo dei vari collaboratori. 

Tuttavia l'approccio descritto non è esente da difetti, senza ricorrere a script esterni infatti, risulta piuttosto
complicato gestire la compilazione e il lancio di svariati container, gestirne le connessioni di rete fra loro o anche
solo replicare eventuali parametri di lancio e variabili di ambiente.

La soluzione a questi "problemi" è offerta da **Docker Compose**, uno strumento che permette di definire e gestire 
applicazioni e configurazioni tramite un unica configurazione per tutto lo stack.

Vediamolo quindi in azione su uno stack di sviluppo locale per un'applicazione **Node.js** con database **Postgres**.

***


Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

E spostiamoci nella directory:

```shell
$ cd docker-course/source/subscriptions
```

In cui è presente il nostro progetto di web application Node/Postgres chiamato **subscriptions** comprensivo del file di
configurazione di Docker Compose.

Diamo un occhiata in giro:

```shell
$ tree
```

Possiamo vedere all'interno della directory il file `package.json` che contiene tutte le informazioni sulla nostra web
application, il file `server.js` che contiene il codice del nostro server Node, il `Dockerfile` che definisce l'immagine
del container dell'applicazione e infine il file `docker-compose.yml` che definisce tutto lo stack di sviluppo locale.

Il `Dockerfile` è molto simile a quello visto nel capitolo precedente, soffermiamoci quindi sul file
[`docker-compose.yml`](../../sources/subscriptions/docker-compose.yml):

```shell
$ cat docker-compose.yml
```

Come possiamo vedere il file è strutturato in più sezioni. La sezione `services` definisce i vari servizi che compongono
il nostro stack, il servizio `db` che rappresenta il database Postgres e il servizio `app` che rappresenta la nostra 
applicazione Node.

Come possiamo notare i due servizi sono definiti in maniera diversa, per esempio il `db` utilizza un'immagine ufficiale 
di Postgres, mentre il servizio `app` utilizza l'istruzione `build` alla quale viene passato il contesto di build `.`, 
proprio come facevamo quando eseguivamo il comando `docker build` manualmente.

Entrambi i servizi dispongono di una sezione dedicata alle variabili di ambiente `environment`, che permette di definire
le configurazioni necessarie al corretto funzionamento dei servizi stessi.

Il servizio `app` dispone inoltre di una sezione `volumes` che mappa la directory corrente `.` dentro alla directory del
container `/app`, permettendo così di avere il codice sorgente dell'applicazione sempre aggiornato nel container in modo
che `nodemon` possa rilevare le modifiche in temo reale e riavviare il server automaticamente, di una sezione `ports`
che mappa la porta 3000 del container alla porta 3000 del nostro host e di una sezione `depends_on` che specifica che il
servizio `app` dipende dal servizio `db`, in modo che Docker Compose avvii prima il database e poi l'applicazione.

Procediamo quindi con l'avvio dello stack, per farlo dovremo semplicemente lancire il comando:

```shell
$ docker compose up
```
```terminaloutput
[+] Running 11/11
 ✔ db Pulled                                                                                                                                                                   8.4s 
   ✔ 6b59a28fa201 Already exists                                                                                                                                               0.0s 
   ✔ e268d9926fd7 Pull complete                                                                                                                                                0.6s 
   ✔ fa72dc705f57 Pull complete                                                                                                                                                0.7s 
   ✔ b0ad42f9114e Pull complete                                                                                                                                                0.7s 
   ✔ b8766da0c426 Pull complete                                                                                                                                                6.2s 
   ✔ 9f71dc4be8f8 Pull complete                                                                                                                                                6.2s 
   ✔ d9708c695497 Pull complete                                                                                                                                                6.2s 
   ✔ 94800f566750 Pull complete                                                                                                                                                6.2s 
   ✔ aa4fc12bd3e6 Pull complete                                                                                                                                                6.2s 
   ✔ e0cd6769e23c Pull complete                                                                                                                                                6.3s 
[+] Building 1.3s (10/10) FINISHED                                                                                                                                                  
 => [internal] load local bake definitions                                                                                                                                     0.0s
 => => reading from stdin 559B                                                                                                                                                 0.0s
 => [internal] load build definition from Dockerfile                                                                                                                           0.0s 
 => => transferring dockerfile: 342B                                                                                                                                           0.0s 
 => [internal] load metadata for docker.io/library/node:24-alpine                                                                                                              1.0s 
 => [auth] library/node:pull token for registry-1.docker.io                                                                                                                    0.0s
 => [internal] load .dockerignore                                                                                                                                              0.0s
 => => transferring context: 2B                                                                                                                                                0.0s 
 => [1/3] FROM docker.io/library/node:24-alpine@sha256:775ba24d35a13e74dedce1d2af4ad510337b68d8e22be89e0ce2ccc299329083                                                        0.0s 
 => CACHED [2/3] WORKDIR /app                                                                                                                                                  0.0s 
 => CACHED [3/3] RUN [ "npm", "install", "-g", "nodemon" ]                                                                                                                     0.0s 
 => exporting to image                                                                                                                                                         0.0s 
 => => exporting layers                                                                                                                                                        0.0s 
 => => writing image sha256:550e48e80e11e826e848d89b4862b5f9ea061118c29ea51cebaac2396fb63527                                                                                   0.0s 
 => => naming to docker.io/library/subscriptions-app                                                                                                                           0.0s 
 => resolving provenance for metadata file                                                                                                                                     0.0s 
[+] Running 4/4                                                                                                                                                                     
 ✔ subscriptions-app              Built                                                                                                                                        0.0s 
 ✔ Network subscriptions_default  Created                                                                                                                                      0.0s 
 ✔ Container subscriptions-db-1   Created                                                                                                                                      0.2s 
 ✔ Container subscriptions-app-1  Created                                                                                                                                      0.1s 
Attaching to app-1, db-1
db-1  | The files belonging to this database system will be owned by user "postgres".
db-1  | This user must also own the server process.
db-1  | 
db-1  | The database cluster will be initialized with locale "en_US.utf8".
db-1  | The default database encoding has accordingly been set to "UTF8".
db-1  | The default text search configuration will be set to "english".
db-1  | 
db-1  | Data page checksums are enabled.
db-1  | 
db-1  | fixing permissions on existing directory /var/lib/postgresql/18/docker ... ok
db-1  | creating subdirectories ... ok
db-1  | selecting dynamic shared memory implementation ... posix
db-1  | selecting default "max_connections" ... 100
db-1  | selecting default "shared_buffers" ... 128MB
db-1  | selecting default time zone ... UTC
db-1  | creating configuration files ... ok
db-1   | running bootstrap script ... ok
db-1   | sh: locale: not found
db-1   | 2025-10-24 15:01:59.303 UTC [38] WARNING:  no usable system locales were found
db-1   | performing post-bootstrap initialization ... ok
db-1   | initdb: warning: enabling "trust" authentication for local connections
db-1   | initdb: hint: You can change this by editing pg_hba.conf or using the option -A, or --auth-local and --auth-host, the next time you run initdb.
db-1   | syncing data to disk ... ok
db-1   | 
db-1   | 
db-1   | Success. You can now start the database server using:
db-1   | 
db-1   |     pg_ctl -D /var/lib/postgresql/18/docker -l logfile start
db-1   | 
db-1   | waiting for server to start....2025-10-24 15:01:59.640 UTC [44] LOG:  starting PostgreSQL 18.0 on aarch64-unknown-linux-musl, compiled by gcc (Alpine 14.2.0) 14.2.0, 64-bit
db-1   | 2025-10-24 15:01:59.641 UTC [44] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
db-1   | 2025-10-24 15:01:59.646 UTC [50] LOG:  database system was shut down at 2025-10-24 15:01:59 UTC
db-1   | 2025-10-24 15:01:59.650 UTC [44] LOG:  database system is ready to accept connections
db-1   |  done
db-1   | server started
db-1   | CREATE DATABASE
db-1   | 
db-1   | 
db-1   | /usr/local/bin/docker-entrypoint.sh: ignoring /docker-entrypoint-initdb.d/*
db-1   | 
db-1   | waiting for server to shut down....2025-10-24 15:01:59.796 UTC [44] LOG:  received fast shutdown request
db-1   | 2025-10-24 15:01:59.798 UTC [44] LOG:  aborting any active transactions
db-1   | 2025-10-24 15:01:59.800 UTC [44] LOG:  background worker "logical replication launcher" (PID 53) exited with exit code 1
db-1   | 2025-10-24 15:01:59.800 UTC [48] LOG:  shutting down
db-1   | 2025-10-24 15:01:59.801 UTC [48] LOG:  checkpoint starting: shutdown immediate
db-1   | 2025-10-24 15:01:59.827 UTC [48] LOG:  checkpoint complete: wrote 943 buffers (5.8%), wrote 3 SLRU buffers; 0 WAL file(s) added, 0 removed, 0 recycled; write=0.011 s, sync=0.014 s, total=0.027 s; sync files=303, longest=0.005 s, average=0.001 s; distance=4352 kB, estimate=4352 kB; lsn=0/1B9F350, redo lsn=0/1B9F350
db-1   | 2025-10-24 15:01:59.832 UTC [44] LOG:  database system is shut down
db-1   |  done
db-1   | server stopped
db-1   | 
db-1   | PostgreSQL init process complete; ready for start up.
db-1   | 
db-1   | 2025-10-24 15:01:59.913 UTC [1] LOG:  starting PostgreSQL 18.0 on aarch64-unknown-linux-musl, compiled by gcc (Alpine 14.2.0) 14.2.0, 64-bit
db-1   | 2025-10-24 15:01:59.914 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
db-1   | 2025-10-24 15:01:59.914 UTC [1] LOG:  listening on IPv6 address "::", port 5432
db-1   | 2025-10-24 15:01:59.916 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
db-1   | 2025-10-24 15:01:59.920 UTC [66] LOG:  database system was shut down at 2025-10-24 15:01:59 UTC
db-1   | 2025-10-24 15:01:59.922 UTC [1] LOG:  database system is ready to accept connections
app-1  | Subscriptions - Development Container
app-1  | Installing or updating dependencies...
app-1  | 
app-1  | up to date, audited 133 packages in 1s
app-1  | 
app-1  | 19 packages are looking for funding
app-1  |   run `npm fund` for details
app-1  | 
app-1  | 2 moderate severity vulnerabilities
app-1  | 
app-1  | To address all issues (including breaking changes), run:
app-1  |   npm audit fix --force
app-1  | 
app-1  | Run `npm audit` for details.
app-1  | Starting development server with nodemon...
app-1  | 
app-1  | > subscriptions@1.0.0 dev
app-1  | > nodemon server.js
app-1  | 
app-1  | [nodemon] 3.1.10
app-1  | [nodemon] to restart at any time, enter `rs`
app-1  | [nodemon] watching path(s): *.*
app-1  | [nodemon] watching extensions: js,mjs,cjs,json
app-1  | [nodemon] starting `node server.js`
app-1  | Server running on http://localhost:3000
```

Come possiamo notare dal lunghissimo log, Docker Compose si è occupato di scaricare l'immagine di Postgres dal registry, 
ha provveduto a compilare l'immagine della nostra applicazione Node dal contesto di build, ha creato una rete dedicata
per questo stack e infine ha avviato entrambi i container.

Non avendo poi specificato il parametro `-d` per l'esecuzione in background, Docker Compose ha anche collegato i log di
entrambi i container alla nostra console, permettendoci così di monitorarne l'esecuzione in tempo reale, infatti come 
vedete qui in alto abbiamo i log dell'avvio del database e qui sotto abbiamo i log di avvio della nostra applicazione. 

Come avevamo visto nel capitolo precedente infatti il container dell'applicazione ha effettuato l'installazione delle 
dipendenze con tramite `npm` e ha avviato il server tramite `nodemon` sulla porta 3000.

Ora se apriamo il browser all'indirizzo [http://localhost:3000/](http://localhost:3000/) potremo vedere in funzione la
nostra applicazione.

Come possiamo vedere è una semplicissima applicazione di gestione delle sottoscrizioni.

---

Ora se volessimo smettere di lavorare sul progetto, per fermare lo stack di sviluppo locale, ci basterebbe premere 
`CTRL+C` nella console in cui siamo collegati, in questo modo Docker Compose invierebbe un segnale di terminazione a
entrambi i container e li fermerebbe in modo ordinato.

In alternativa potremmo aprire una nuova console, spostarci nella directory del progetto e lanciare il comando:

```shell
$ docker compose stop
```

Per riavviare lo stack in un secondo momento invece, potremmo utilizzare il comando:

```shell
$ docker compose start
```

Se volessimo rimuovere completamente lo stack, compresi i container, la rete e i volumi, potremmo utilizzare il comando:  

```shell
$ docker compose down
```

In questo modo però, a differenza di usare stop e start, perderemo anche tutti i dati salvati all'interno del volume del
container del database Postgres. Per poter riavviare lo stack in futuro, dovremmo nuovamente lanciare il comando:

```shell
$ docker compose up -d
```

Che si occuperò per l'appunto di ricreare tutto lo stack da zero ed eseguirlo in background.

***

> __compose for development stack__
>
> - stack definition
> - multiple containers
> - networking management
> - environment variables

Anche in questo caso ovviamente potremo procedere con la modifica del codice sorgente della nostra applicazione, o la
modifica che ne so della versione di Postgres per testare l'aggiornamento ad una nuova release o quant'altro essendo
sicuri che una volta che avremo effettuato il commit, ogni membro del team sarà in grado di replicare lo stesso ambiente
di sviluppo locale semplicemente lanciando un singolo comando.

Immagino che abbiate già intuito quanto saranno veloci le procedure di onboarding per i nuovi membri del vostro team!

In questo corso non mi sono soffermato su tutti i dettagli di Docker Compose, ma mi sono limitato a mostrarvi un modo
semplice per utilizzarlo in un contesto di sviluppo locale. Ho comunque intenzione di espandere in futuro questo corso
con una sezione dedicata esclusivamente a Docker Compose e ai sistemi di orchestrazione, come Docker Swarm e Kubernetes 
ma per ora se volete approfondire vi rimando alla guida ufficiale di [Docker Compose](https://docs.docker.com/compose/).

***

[Prosegui](../21-advanced-syntax/IT.md) al prossimo capitolo.
