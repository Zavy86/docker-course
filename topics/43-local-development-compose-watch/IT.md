# Local development with Compose Watch

> __local development__
>
> - edit files on the host
> - update the running service
> - rebuild only when needed

Durante lo sviluppo il ciclo di lavoro è spesso lo stesso, modifichiamo un file sul nostro computer, lo salviamo e 
verifichiamo il risultato nell'applicazione. Se il servizio viene eseguito in un container, però, i file copiati 
nell'immagine durante la build non cambiano automaticamente quando modifichiamo quelli sul computer. Ricostruire 
l'immagine e ricreare il servizio dopo ogni piccola modifica può rallentare di molto il nostro il lavoro.

Nel [capitolo precedente](../42-persistent-data-volumes-filesystem-permissions/IT.md) abbiamo visto come un bind mount
renda accessibili al container i file di una directory dell'host.

Compose **Watch** offre un'altra possibilità super interessante, osserva i percorsi che indichiamo nel file Compose e, 
quando rileva una modifica, esegue l'azione scelta per il servizio.

Possiamo semplicemente sincronizzare i sorgenti nel container, sincronizzare i files e riavviare il container, oppure
ricostruire l'immagine e ricreare il servizio quando cambia qualcosa che riguarda la build.

In questo modo possiamo scegliere l'azione più adatta in base al tipo di modifica, senza dover per forza ricostruire 
tutto ogni volta.

Un unico appunto da considerare è che la sincronizzazione aggiorna i file nel container, ma questo non garantisce che
l'applicazione li rilegga, questo comportamento dipende dal processo in esecuzione. Inoltre, i file sincronizzati vivono
nel container, non modificano l'immagine iniziale, che dovrà eventualmente essere ricostruita per includerli.

In questo capitolo proveremo queste azioni e vedremo come gestire una sessione Watch.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose/watch
```

E analizziamo la struttura di questo stack:

```shell
$ tree
```
```terminaloutput
compose-watch/
├── compose.yaml
├── Dockerfile
├── httpd.conf
└── site/
    └── index.html
```

Nel file `site/index.html` possiamo notare una semplice pagina web:

```html
<!doctype html>
<html lang="en">
  <meta charset="utf-8">
  <title>Compose Watch</title>
  <h1>First version</h1>
</html>
```

Il file `httpd.conf` al momento contiene solamente un commento, ci servirà poi dopo per la prova di riavvio:

```conf
# Demo server configuration
```

Il `Dockerfile` copia i file e avvia un semplice web server sulla porta interna 8080:

```dockerfile
FROM busybox
COPY site/ /site/
COPY httpd.conf /etc/httpd.conf
CMD [ "httpd", "-f", "-p", "8080", "-h", "/site", "-c", "/etc/httpd.conf" ]
```

Ovviamente questa semplice immagine serve solo per questa dimostrazione locale, non è una configurazione completa per
pubblicare un sito in produzione.

Mentre il cuore di tutto sta ovviamente nel file `compose.yaml`:

```yaml
services:
  web:
    build: .
    ports:
      - "8080:8080"
    develop:
      watch:
        - action: sync
          path: ./site
          target: /site
          ignore:
            - drafts/
```

Il servizio `web` viene costruito dal nostro Dockerfile, la regola sotto `develop.watch` osserva la directory `site`
sull'host e sincronizza ogni modifica all'interno della directory `/site` del container, senza ricostruire l'immagine.

In questa mappa, `path` rappresenta il percorso relativo alla directory del progetto, mentre `target` è il percorso nel
container in maniera assoluta. L'opzione facoltativa `ignore` è sempre relativa al percorso osservato, quindi `drafts/`
indica in questo esempio `site/drafts/`.

***

Lanciamo quindi lo stack e vediamo cosa succede:

```shell
$ docker compose up --build --watch
```
```terminaloutput
[+] Building 0.3s (10/10) FINISHED                                                                  
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 542B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 178B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/busybox:latest                                                   0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [1/3] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => => resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => => extracting sha256:55d2dadd4bbc7132e31b89f47d8f7cc517cac013563328b707c933d42c4a2c07                           0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 249B                                                                                   0.0s 
 => [2/3] COPY site/ /site/                                                                                         0.0s 
 => [3/3] COPY httpd.conf /etc/httpd.conf                                                                           0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s
 => => exporting manifest sha256:206ccf8c6e599f4f7b0071dbd522b41ca17328d08e9a4e8975826f3df6de                       0.0s 
 => => exporting config sha256:47a8cea4a867d0df8b087bcfdae8380f314bf205c01975569d80431219bb43                       0.0s
 => => exporting attestation manifest sha256:b783793db3d74de5570d900d6ed24cccddffa1e1c4c93970                       0.0s 
 => => exporting manifest list sha256:da6a5c9df66fba82c6b18bf28ce6009440c14df5b0dbfb593696a02                       0.0s 
 => => naming to docker.io/library/watch-web:latest                                                                 0.0s 
 => => unpacking to docker.io/library/watch-web:latest                                                              0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] up 3/3
 ✔ Image watch-web       Built                                                                                      1.5s
 ✔ Network watch_default Created                                                                                    0.0s
 ✔ Container watch-web-1 Created                                                                                    0.0s
        ⦿ Watch enabled
Attaching to web-1
```

Dopo aver costruito l'immagine, creato le rete e avviato il container, Compose abilita il `watch` e si attacca ai logs.

Se apriamo il nostro browser su  [http://localhost:8080](http://localhost:8080) vedremo infatti la pagina web esposta.

In un altro terminale, andiamo poi a modificarne il sorgente:

```shell
$ nano site/index.html
```
```html
<!doctype html>
<html lang="en">
  <meta charset="utf-8">
  <title>Compose Watch</title>
  <h1>Second version</h1>
</html>
```

E noteremo immediatamente che Compose ha sincronizzato le modifiche:

```terminaloutput
[...]
        ⦿ Syncing service "web" after 1 changes were detected
```

Se ricarichiamo la pagina nel browser, il testo cambia senza che sia stato necessario ricostruire l'immagine o riavviare
il container del web server.

***

> __sync is not hot reload__
>
> - files and application state are different
> - use the application's development mode
> - keep dependencies inside the image

Con un'applicazione reale, aggiornare il file non significa che il processo lo rilegga automaticamente.

Alcuni framework possono offrire l'opzione di hot reload, oppure può essere necessario un riavvio o una ricompilazione.

Watch porta i file nel container, il comportamento successivo dipende dall'applicazione.

Un semplice bind mount rende accessibile una directory dell'host, Watch invece sincronizza modifiche verso il filesystem
del container in tempo reale. Ma non consideriamolo un sistema di sincronizzazione bidirezionale o uno strumento per
recuperare dati prodotti dal servizio.

Non montiamo contemporaneamente un bind mount sullo stesso percorso che vogliamo sincronizzare.

Scegliamo il meccanismo più chiaro per quella parte del progetto.

Per una futura applicazione `Node` per esempio, potremmo sincronizzare i sorgenti, escludere la directory `node_modules`
e ricostruire l'immagine quando cambiamo il lockfile delle dipendenze.

***

Proseguiamo ora con una seconda modalità.

Fermiamo la sessione con `Ctrl+C` e aggiungiamo questa seconda regola alla lista `watch`:

```yaml
[...]
- action: sync+restart
  path: ./httpd.conf
  target: /etc/httpd.conf
```

E riavviamo nuova mente lo stack:

```shell
$ docker compose up --build --watch
```
```terminaloutput
[+] Building 0.2s (10/10) FINISHED                                                                  
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 542B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 178B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/busybox:latest                                                   0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 215B                                                                                   0.0s 
 => [1/3] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => => resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => CACHED [2/3] COPY site/ /site/                                                                                  0.0s 
 => CACHED [3/3] COPY httpd.conf /etc/httpd.conf                                                                    0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => exporting manifest sha256:206ccf8c6e599f4f7b0071dbd522b41ca17328d08e9a4e8975826f3df6de                       0.0s 
 => => exporting config sha256:47a8cea4a867d0df8b087bcfdae8380f314bf205c01975569d80431219bb43                       0.0s 
 => => exporting attestation manifest sha256:1a5ae4dc934983e533be9ca8c04c8cd27d2a1df7eeb62457                       0.0s 
 => => exporting manifest list sha256:4fdf7acaf1da263ed737026495d4445b3f8892442693669f0439c56                       0.0s 
 => => naming to docker.io/library/watch-web:latest                                                                 0.0s 
 => => unpacking to docker.io/library/watch-web:latest                                                              0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] up 2/2
 ✔ Image watch-web       Built                                                                                      0.2s
 ✔ Container watch-web-1 Recreated                                                                                  0.0s
        ⦿ Watch enabled
Attaching to web-1
```

In un altro terminale, modifichiamo il commento in `httpd.conf`:

```shell
$ nano httpd.conf
```
```conf
# Demo server configuration updated
```

E verificando nel primo terminale:

```
Container watch-web-1 Restarting
        ⦿ service(s) ["web"] restarted
web-1 exited with code 137 (restarting)
```

Noteremo che il container del server è stato correttamente riavviato.

***

Fermiamo nuovamente la sessione con `Ctrl+C` e aggiungiamo una terza regola:

```yaml
[...]
- action: rebuild
  path: ./Dockerfile
```

E riavviamo nuova mente lo stack:

```shell
$ docker compose up --build --watch
```
```terminaloutput
[+] Building 0.2s (10/10) FINISHED                                                                  
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 542B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 178B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/busybox:latest                                                   0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 215B                                                                                   0.0s 
 => [1/3] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => => resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => CACHED [2/3] COPY site/ /site/                                                                                  0.0s 
 => CACHED [3/3] COPY httpd.conf /etc/httpd.conf                                                                    0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => exporting manifest sha256:206ccf8c6e599f4f7b0071dbd522b41ca17328d08e9a4e8975826f3df6de                       0.0s 
 => => exporting config sha256:47a8cea4a867d0df8b087bcfdae8380f314bf205c01975569d80431219bb43                       0.0s 
 => => exporting attestation manifest sha256:1a5ae4dc934983e533be9ca8c04c8cd27d2a1df7eeb62457                       0.0s 
 => => exporting manifest list sha256:4fdf7acaf1da263ed737026495d4445b3f8892442693669f0439c56                       0.0s 
 => => naming to docker.io/library/watch-web:latest                                                                 0.0s 
 => => unpacking to docker.io/library/watch-web:latest                                                              0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] up 2/2
 ✔ Image watch-web       Built                                                                                      0.2s
 ✔ Container watch-web-1 Recreated                                                                                  0.0s
        ⦿ Watch enabled
Attaching to web-1
```

In un altro terminale, andiamo poi a modificare il file `Dockerfile` aggiungendo ad esempio una variabile d'ambiente:

```shell
$ nano Dockerfile
```
```dockerfile
ENV DEMO_BUILD=test
```

Una volta salvato il file vedremo partire una nuova build, seguita dalla ricreazione del servizio:

```terminaloutput
        ⦿ Rebuilding service(s) ["web"] after changes were detected...
Image watch-web Building 
        ⦿ #1 [internal] load local bake definitions
        ⦿ #1 reading from stdin 542B done
        ⦿ #1 DONE 0.0s
        ⦿ 
        ⦿ #2 [internal] load build definition from Dockerfile
        ⦿ #2 transferring dockerfile: 198B done
        ⦿ #2 DONE 0.0s
        ⦿ 
        ⦿ #3 [internal] load metadata for docker.io/library/busybox:latest
        ⦿ #3 DONE 0.0s
        ⦿ 
        ⦿ #4 [internal] load .dockerignore
        ⦿ #4 transferring context: 2B done
        ⦿ #4 DONE 0.0s
        ⦿ 
        ⦿ #5 [internal] load build context
        ⦿ #5 transferring context: 89B done
        ⦿ #5 DONE 0.0s
        ⦿ 
        ⦿ #6 [1/3] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d9896389ca60a1a59d3463db586e5fa4
        ⦿ #6 resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d9896389ca60a1a59d3463db586e5fa4 done
        ⦿ #6 DONE 0.0s
        ⦿ 
        ⦿ #7 [2/3] COPY site/ /site/
        ⦿ #7 CACHED
        ⦿ 
        ⦿ #8 [3/3] COPY httpd.conf /etc/httpd.conf
        ⦿ #8 CACHED
        ⦿ 
        ⦿ #9 exporting to image
        ⦿ #9 exporting layers done
        ⦿ #9 exporting manifest sha256:21c85548d7fd9c2f9047628de650bc9896f2eca2412b8c16b88caac2e00c4477 done
        ⦿ #9 exporting config sha256:5055582daddc622d976eeb17c4bf076b1d39fa751620680026538b12a1a4b807 done
        ⦿ #9 exporting attestation manifest sha256:f8b1375e70e1dfc8202e233f9cf9a4c39b8737319982ecef892742b60c2fe644 done
        ⦿ #9 exporting manifest list sha256:99b63e30f22acd6fd68560efbd68bc9bab9906041569638a3039cac95b128592 done
        ⦿ #9 naming to docker.io/library/watch-web:latest done
        ⦿ #9 unpacking to docker.io/library/watch-web:latest done
        ⦿ #9 DONE 0.0s
        ⦿ 
        ⦿ #10 resolving provenance for metadata file
        ⦿ #10 DONE 0.0s
Image watch-web Built 
        ⦿ service(s) ["web"] successfully built
Container watch-web-1 Recreate 
web-1 has been recreated                                                                            
web-1 exited with code 137                                                                          
Container watch-web-1 Recreated
```

Ovviamente questa volta cambierà anche l'ID del container e quando tornerà disponibile potremo verificare la variabile:

```shell
$ docker compose exec web printenv DEMO_BUILD
```
```terminaloutput
test
```

Notiamo che `rebuild` usa la configurazione di build del servizio e sfrutta la cache quando disponibile.

***

Un dettaglio in più, se preferiamo separare i log applicativi dai messaggi di Watch, possiamo fermare la sessione con il
solito `CTRL+C` e rilanciarla con questi due comandi separati, prima la build:

```shell
$ docker compose up -d --build
```
```terminaloutput
[+] Building 0.2s (10/10) FINISHED                                                                  
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 542B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 198B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/busybox:latest                                                   0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [1/3] FROM docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => => resolve docker.io/library/busybox:latest@sha256:a46257e06c82ad85242d0d38077d0a52d98963                       0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 89B                                                                                    0.0s 
 => CACHED [2/3] COPY site/ /site/                                                                                  0.0s 
 => CACHED [3/3] COPY httpd.conf /etc/httpd.conf                                                                    0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => exporting manifest sha256:21c85548d7fd9c2f9047628de650bc9896f2eca2412b8c16b88caac2e00c                       0.0s 
 => => exporting config sha256:5055582daddc622d976eeb17c4bf076b1d39fa751620680026538b12a1a4b8                       0.0s 
 => => exporting attestation manifest sha256:4ec67415a53ae42f8cb3f8e49da4e929b929c164de88e257                       0.0s 
 => => exporting manifest list sha256:50c8f3835aafa54b7e36f0d903aa1d20673458829b5e0d9e6ec0c22                       0.0s 
 => => naming to docker.io/library/watch-web:latest                                                                 0.0s 
 => => unpacking to docker.io/library/watch-web:latest                                                              0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] up 2/2                     
 ✔ Image watch-web       Built                                                                                      0.2s
 ✔ Container watch-web-1 Running                                                                                    0.0s
```

E poi il watch:

```shell
$ docker compose watch --no-up
```
```terminaloutput
Watch enabled
```

In questo modo modificando nuovamente il commento in `httpd.conf`:

```shell
$ nano httpd.conf
```
```conf
# Demo server configuration
```

Nel primo terminale vedremo semplicemente:

```terminaloutput
Container watch-web-1 Restarting 
service(s) ["web"] restarted
```

E non vedremo più il log del container stesso.

L'opzione `--no-up` osserva servizi già avviati, interrompendo questo comando con `Ctrl+C` fermerà solamente il Watch,
non i servizi avviati in background precedentemente.

```shell
$ docker ps
```
```terminaloutput
CONTAINER ID   IMAGE          COMMAND                  CREATED         STATUS         PORTS                    NAMES
00c4d7568c9c   99b63e30f22a   "httpd -f -p 8080 -h…"   9 minutes ago   Up 2 minutes   0.0.0.0:8080->8080/tcp   watch-web-1
```

Quindi come sempre, fermiamo tutto lo stack con il comando:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container watch-web-1 Removed                                                                                    3.1s
 ✔ Network watch_default Removed                                                                                    0.1s
```

***

> Resources
>
> - [Compose Watch](https://docs.docker.com/compose/how-tos/file-watch/)
