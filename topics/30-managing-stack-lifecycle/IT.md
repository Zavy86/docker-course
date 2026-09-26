# Managing the stack lifecycle

> __managing the stack lifecycle__
>
> - create and start
> - stop and restart
> - recreate and remove

In questo capitolo vedremo come gestire il ciclo di vita di uno stack Docker Compose.

Creare un container, fermarlo, riavviarlo e ricrearlo possono sembrare operazioni simili, ma hanno conseguenze diverse.

Vediamole una alla volta, ripartendo dal nostro piccolo server web.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose
```

E analizziamo nuovamente il file `compose.yaml`:

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

Per prima cosa procediamo poi con l'avviamento del progetto:

```shell
$ docker compose up
```
```terminaloutput
[+] up 2/2
 ✔ Network compose_default Created                                                                                  0.0s
 ✔ Container compose-web-1 Created                                                                                  0.0s
Attaching to web-1
web-1  | /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
web-1  | /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
web-1  | 10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
web-1  | 10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
web-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
web-1  | 2026/09/24 09:29:18 [notice] 1#1: using the "epoll" event method
web-1  | 2026/09/24 09:29:18 [notice] 1#1: nginx/1.23.3
web-1  | 2026/09/24 09:29:18 [notice] 1#1: built by gcc 10.2.1 20210110 (Debian 10.2.1-6) 
web-1  | 2026/09/24 09:29:18 [notice] 1#1: OS: Linux 6.12.76-linuxkit
web-1  | 2026/09/24 09:29:18 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1048576:1048576
web-1  | 2026/09/24 09:29:18 [notice] 1#1: start worker processes
```

Compose preparerà le risorse necessarie e avvierà Nginx. Questa volta, non avendo aggiunto l'opzione `-d`, il terminale
resterà collegato ai log.

Aprendo [http://localhost:8080](http://localhost:8080) potremmo come al solito visitare il sito esposto dal web server.

Se premiamo `Ctrl+C` nel terminale, Compose fermerà il servizio, ma non eliminerà il container.

```terminaloutput
Container compose-web-1 Killing 
Container compose-web-1 Killed 
Container compose-web-1 Stopped 
```
```shell
$ docker compose ps -a
```
```terminaloutput
NAME            IMAGE   COMMAND                  SERVICE   CREATED          STATUS                       PORTS
compose-web-1   nginx   "/docker-entrypoint.…"   web       54 seconds ago   Exited (137) 9 seconds ago   
```

Il parametro `-a`, come nel classico `docker ps` mostra anche i container stoppati.

Per lasciarlo in esecuzione in background usiamo invece la solita opzione `-d`:

```shell
$ docker compose up -d
```

Come possiamo vedere Il terminale torna subito disponibile e con `ps` possiamo controllare lo stato del servizio:

```shell
$ docker compose ps
```
```terminaloutput
NAME            IMAGE   COMMAND                  SERVICE   CREATED         STATUS         PORTS
compose-web-1   nginx   "/docker-entrypoint.…"   web       2 minutes ago   Up 9 seconds   0.0.0.0:8080->80/tcp
```

Possiamo comunque collegarci e visualizzare i log quando ci servono con il comando:

```shell
$ docker compose logs -f web
```

Se da qui premiamo `Ctrl+C` interromperemo solamente la lettura dei log, **non fermeremo Nginx** come prima.

Come già accennato in un capitolo precedente, ripetere `up` non significa aggiungere altri servers, se la configurazione
e le immagini non cambiano, Compose mantiene i container esistenti.

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-web-1 Running                                                                                  0.1s
```

Avviare un container tuttavia, non garantisce che l'applicazione sia già pronta a rispondere, torneremo poi su questa
distinzione nel capitolo dedicato alle dipendenze e agli healthcheck, per ora ci limiteremo a controllare i logs a mano.

***

Se volessimo fare una pausa e spegnere questo stack senza eliminarlo dovremo usare il comando:

```shell
$ docker compose stop
```
```terminaloutput
[+] stop 1/1
 ✔ Container compose-web-1 Stopped                                                                                  0.1s
```
```shell
$ docker compose ps -a
```
```terminaloutput
NAME            IMAGE   COMMAND                  SERVICE   CREATED         STATUS                      PORTS
compose-web-1   nginx   "/docker-entrypoint.…"   web       9 minutes ago   Exited (0) 18 seconds ago
```

Il processo è terminato, ma il container esiste ancora. Per farlo ripartire ci basterà utilizzare il comando:

```shell
$ docker compose start
```
```terminaloutput
[+] start 1/1
 ✔ Container compose-web-1 Started                                                                                  0.1s
```

Questa istruzione avvia container già creati senza creare eventuali container mancanti e senza applicare eventuali nuove
modifiche apportate al file `compose.yaml`.

***

Se volessimo separare la prima creazione dall'avvio, potremmo usare `create` (al posto di `up`) seguito poi `start`.

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-web-1 Removed                                                                                  0.2s
 ✔ Network compose_default Removed                                                                                  0.1s
```
```shell
$ docker compose create
```
```terminaloutput
[+] create 2/2
 ✔ Network compose_default Created                                                                                  0.0s
 ✔ Container compose-web-1 Created                                                                                  0.0s
```
```shell
$ docker compose start
```
```terminaloutput
[+] start 1/1
 ✔ Container compose-web-1 Started                                                                                  0.1s
```

Ma nella pratica, `up -d` ci permette di fare entrambe le cose con un comando.

***

Per fermare e riavviare lo stesso container in una sola operazione possiamo usare invece l'istruzione:

```shell
$ docker compose restart web
```
```terminaloutput
[+] restart 0/1
 ✔ Container compose-web-1 Restarting                                                                               0.3s
```

Nel nostro caso `web` è il nome del servizio che abbiamo scelto noi nel file, non il nome completo del container.

Possiamo indicarlo anche a `stop`, `start` e `up` per scegliere il servizio su cui intervenire.

Senza un nome, questi comandi operano su tutti i servizi del progetto, con `up web` invece ad esempio possiamo avviare
anche le eventuali dipendenze di `web`. Nel nostro esempio c'è un solo servizio, ma quando ne avremo diversi potremo
riavviare il server web senza dover per forza riavviare anche il database e vedremo anche come gestire le dipendenze.

***

Proviamo ora a cambiare la porta nel file sostituendo `"8080:80"` con `"8081:80"` e riavviamo il servizio:

```shell
$ docker compose restart web
```
```terminaloutput
[+] restart 0/1
 ✔ Container compose-web-1 Restarting                                                                               0.1s
```

Noteremo che la porta resta quella vecchia, non è un errore, abbiamo solo chiesto di riavviare lo stesso container, che
conserva le impostazioni con cui era stato creato, per far applicare la modifica dovremo ricrearlo:

```shell
$ docker compose up -d web
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-web-1 Started                                                                                  0.1s
```

Con questo comando (che come abbiamo visto prima equivale a `create` + `start`) Compose rileva che la configurazione del
servizio è cambiata e _ricrea_ il container. Ferma e rimuove quello precedente, poi ne crea un altro nuovo applicando la
nuova configurazione.

Se ora volessimo rivedere la pagina di Nginx dovremo navigare verso [http://localhost:8081](http://localhost:8081).

Un altro modo per sostituire un singolo container, magari perché vogliamo resettarne il filesystem o per qualsiasi altro
motivo, ci basterà utilizzare l'opzione `--force-recreate` per forzare la ricreazione anche senza modifiche al file.

Con `ps -q` possiamo anche ottenere l'ID del container in esecuzione:

```shell
$ docker compose ps -q web
```
```terminaloutput
f5f554bb14e3c4e92b2ef1f075f482ff23c9a0b946ed378774734fdda745d8d6
```

Procediamo quindi con applicare la ricreazione forzata:

```shell
$ docker compose up -d --force-recreate web
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-web-1 Started                                                                                  0.1s
```

E ricontrolliamo l'ID del container:

```shell
$ docker compose ps -q web
```
```terminaloutput
e0e7f70400d3f1ea957eef151586c1bec66c8773f431ef99a920756509e116a2
```

***

> __managing the stack lifecycle__
>
> - graceful shutdown
> - stop signal
> - grace period

Quando fermiamo un container, Docker non dovrebbe semplicemente "togliere la corrente" al processo per spegnerlo.

Come visto nella prima parte di questo corso, gli invia un segnale per chiedergli di terminare, lasciandogli il tempo di
chiudere connessioni e salvare ciò che serve. È quello che chiamiamo _arresto corretto_ (graceful shutdown).

Il segnale normalmente è `SIGTERM`, ma l'immagine può definirne uno diverso: per esempio l'immagine ufficiale di Nginx 
usa `SIGQUIT`. In queste occasioni possiamo modificare lo `stop_signal` qualora appunto l'applicazione lo richieda.

L'attesa ovviamente non è infinita, per i container Linux il tempo predefinito è di dieci secondi. Se il processo non 
termina entro quel limite, Docker passa automaticamente il segnale `SIGKILL`, che lo interrompe forzatamente. Se invece
volessimo concedere più tempo, possiamo personalizzare `stop_grace_perdiod`, per un massimo di trenta secondi.

Concedere più tempo tuttavia non risolve il problema per un'applicazione che ignora un determinato segnale. Il processo 
principale del container deve gestirlo correttamente, e un eventuale script di avvio deve inoltrarlo ai suoi figli.

***

> __managing the stack lifecycle__
>
> - no
> - on-failure
> - always
> - unless-stopped

Finora siamo stati noi a decidere manualmente quando riavviare il servizio, tuttavia quando un applicazione è messa in
produzione, potrebbe interrompersi a causa di un crash, un bug o altri problemi.

In questi casi, se vogliamo che il container torni in esecuzione senza intervento umano, possiamo affidare a Compose una
_politica di riavvio_.

Le scelte principali sono quattro:

- `no`: nessun riavvio automatico, il comportamento predefinito.
- `on-failure`: riavvia se il processo termina con un codice diverso da zero.
- `always`: riavvia il container quando il processo termina, anche senza errori.
- `unless-stopped`: si comporta in modo simile ad `always`, ma conserva la nostra decisione di tenerlo fermo anche dopo
  un riavvio di Docker o dell'intero host.

Una doverosa precisazione, queste regole reagiscono alla _terminazione del processo_, non si applicano nelle situazioni
in cui invece il processo è attivo ma bloccato per qualche altro motivo.

***

Andiamo ora a modificare il file `compose.yaml` aggiungendo la direttiva `restart: unless-stopped` al servizio `web`:

```yaml
services:
  web:
    image: nginx
    ports:
      - "8081:80"
    restart: unless-stopped
```

Applicare la modifica con il solito comando:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-web-1 Started                                                                                  0.1s
```

E proviamo a arrestare manualmente il servizio web:

```shell
$ docker compose stop web
```
```terminaloutput
[+] stop 1/1
 ✔ Container compose-web-1 Stopped                                                                                  0.1s
```

Se proviamo a fare un `ps -a` vedremo che il container rimane spento come ci aspettiamo:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME            IMAGE   COMMAND                  SERVICE   CREATED         STATUS                          PORTS
compose-web-1   nginx   "/docker-entrypoint.…"   web       2 minutes ago   Exited (0) About a minute ago
```

Docker rispetta la richiesta esplicita che gli abbiamo fatto.

Aggiungiamo ora un nuovo servizio:

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
    restart: unless-stopped
  echo:
    image: alpine
    command: [ "sh", "-c", "echo Started; sleep 15; exit 1" ]
    restart: no
```

Il comando che vedete serve semplicemente all'immagine base `Alpine` per stampare il messaggio _Started_ e aspettare 
quindici secondi per poi terminare con un errore, rappresentato da `exit 1`.

Eseguiamo nuovamente:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Container compose-web-1 Started                                                                                  0.1s
 ✔ Container compose-echo-1 Started                                                                                 0.1s
```

E colleghiamoci ai logs del servizio `echo` per osservare il comportamento:

```shell
$ docker compose logs -f echo
```
```terminaloutput
echo-1  | Started
echo-1 exited with code 1
```

Dopo la terminazione possiamo controllare con il comando:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME             IMAGE    COMMAND                    SERVICE   CREATED          STATUS                     PORTS
compose-echo-1   alpine   "sh -c 'echo Started; …"   echo      36 seconds ago   Exited (1) 9 seconds ago
compose-web-1    nginx    "/docker-entrypoint.…"     web       36 seconds ago   Up About a minute          0.0.0.0:8080->80/tcp
```

Senza riavvio automatico, il container resta fermo con codice di uscita `1`.

Sostituiamo ora `restart: no` con `restart: on-failure`, riapplichiamo e seguiamo nuovamente i logs:

```shell
$ docker compose up -d
$ docker compose logs -f echo
```
```terminaloutput
echo-1  | Started
echo-1 exited with code 1
echo-1  | Started
echo-1 exited with code 1
echo-1  | Started
echo-1 exited with code 1
...
```

Il messaggio `Started` si ripeterà e dopo ogni errore il container verrà riavviato all'infinito.

Se modifichiamo ora il codice di uscita in `exit 0`, il container terminerà senza errori e non verrà più riavviato.

```shell
$ docker compose up -d
$ docker compose logs -f echo
```
```terminaloutput
echo-1  | Started
echo-1 exited with code 0
```

Se modifichiamo invece il valore di `restart` in `always` vedremo che verra riavviato nuovamente all'infinito.

```shell
$ docker compose up -d
$ docker compose logs -f echo
```
```terminaloutput
echo-1  | Started
echo-1 exited with code 0
echo-1  | Started
echo-1 exited with code 0
echo-1  | Started
echo-1 exited with code 0
...
```

***

> __managing the stack lifecycle__
>
> - remove containers
> - keep persistent data
> - clean up intentionally

Per rimuovere soltanto il container di un servizio dobbiamo prima fermarlo:

```shell
$ docker compose stop web
```
```terminaloutput
[+] stop 1/1
 ✔ Container compose-web-1 Stopped                                                                                  0.1s
```

E poi usare il comando remove, Compose ci chiederà conferma e rispondiamo con `y`:

```shell
$ docker compose rm web
```
```terminaloutput
? Going to remove compose-web-1 (y/N) y
[+] remove 1/1
 ✔ Container compose-web-1 Removed                                                                                  0.1s
```

La definizione di `web` resta comunque sempre presente nel file e possiamo quindi ricrearlo semplicemente con:

```shell
$ docker compose up -d web
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-web-1 Started                                                                                  0.1s
```

***

Una volta terminate tutte le nostre prove eseguiamo:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-echo-1 Removed                                                                                 0.4s
 ✔ Container compose-web-1 Removed                                                                                  0.2s
 ✔ Network compose_default Removed                                                                                  0.1s
```

Questo comando ferma e rimuove tutti i container e le reti gestite dal progetto. Non cancella il file Compose né, per
impostazione predefinita, le immagini o i volumi. Le reti e i volumi dichiarati _esterni_ restano fuori dalla pulizia.

Questo non significa che tutti i dati siano al sicuro, i file presenti soltanto nel filesystem di un container vengono 
persi quando quel container viene rimosso.

I volumi nominati invece restano disponibili e possono essere riutilizzati dal progetto, anche quelli anonimi rimangono
normalmente sul disco, ma un successivo `up` non li ricollega automaticamente ai nuovi container e i file dei bind mount
restano nel percorso dell'host. Riprenderemo poi meglio questi casi nel capitolo dedicato alla persistenza dei dati.

Se volessimo invece rimuovere anche tutti volumi collegati ai container, con i dati che contengono, dovremo aggiungere
l'opzione `-v` al comando `down`

***

> Resources:
>
> - [Restart policies](https://docs.docker.com/engine/containers/start-containers-automatically/)
