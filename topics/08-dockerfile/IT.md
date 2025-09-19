# Building Images with a Dockerfile

> __building images with a Dockerfile__
>
> - Dockerfile
> - builder
> - caching
> - history

Come vi accennavo alla fine del capitolo precedente, la creazione delle immagini in modalità interattiva può bene per
andare bene per fini educativi ma non è certo il modo migliore per creare le immagini in Docker.

Noi programmatori, per nostra natura, siamo pigri e cerchiamo sempre di automatizzare il più possibile ogni processo
ripetitivo. E gli sviluppatori di Docker, consci di questo, ci hanno messo a disposizione uno strumento molto potente
chiamato `Dockerfile` che ci permette di creare immagini in modo completamente automatizzato.

Immaginate un Dockerfile come una ricetta per la creazione di un'immagine. Un semplice file di testo con una serie di 
istruzioni che spiegheranno a Docker l'immagine dovrà essere costruita.

Queste istruzioni verranno poi date in pasto a un tool chiamato `builder` che si occuperà di eseguirle per trasformare
il file di testo in una vera e propria immagine Docker.

Inoltre Docker dispone anche di un sofisticato sistema di `caching` che permette di velocizzare enormemente il processo 
di costruzione delle immagini, evitando di dover eseguire nuovamente le istruzioni che non sono cambiate.

Infine per aiutarci a capire come è composta un'immagine, Docker ci mette anche a disposizione il comando `history` che 
ci permette di vedere la lista delle istruzioni che hanno contribuito alla creazione di un'immagine.

***

Ma non perdiamoci in chiacchiere e vediamo subito come funziona il tutto.

Partiamo con il creare una directory di lavoro e spostiamoci al suo interno:

```shell
$ mkdir figlet && cd $_
```

E procediamo con la creazione del nostro primo Dockerfile con il vostro editor preferito, se siete degli esperti di
Linux sicuramente sarete dei maghi di `vim` ma se siete alle prime armi vi consiglio di usare:

```shell
$ nano Dockerfile
```

Nano è un editor permette di creare e modificare file di testo in modo semplice e intuitivo.
Come potete vedere in fondo è presente una barra con i comandi più comuni che potete usare.
Per quello che ci riguarda ci basterà sapere che per salvare il file dovremo premere `CTRL + O` e per uscire dall'editor
dovremo premere `CTRL + X`.

Inseriamo quindi all'interno del nostro Dockerfile il seguente contenuto:

```dockerfile
FROM alpine
RUN apk add figlet
```

Se ripensiamo a quello che abbiamo fatto nel capitolo precedente, con questo Dockerfile abbiamo l'obiettivo di fare
esattamente le stesse.

La prima riga `FROM alpine` indica a Docker che la nostra immagine dovrà essere basata sull'immagine ufficiale Alpine.
E la seconda riga `RUN apk add figlet` indica a Docker che durante la fase di costruzione dell'immagine dovrà `eseguire`
il comando `apk add figlet` per installare il pacchetto Figlet, proprio come avevamo fatto manualmente.

Tenete conto che il comando `RUN` può essere usato per eseguire qualsiasi comando, non solo quelli per l'installazione 
di pacchetti, l'importante è che il comando sia eseguito in modalità non interattiva, quindi senza la necessità di
richiedere input da parte dell'utente, quindi se necessario specifichiamo sempre i vari flag come `-y` o `-f` per far
si che vengano accettati o forzati in caso di necessità.

Ok quindi come dicevamo salviamo e usciamo dall'editor, possiamo fare entrambe le cose con il comando `CTRL + X` seguito
dalla `Y` ed `ENTER` per confermare il salvataggio e proseguiamo con la costruzione della nostra immagine.

Per farlo utilizzeremo il builder di Docker lanciando il comando:

```shell
$ docker build .
```

Il punto `.` alla fine del comando indica a Docker il contesto di build. Avremo modo di approfondire questo argomento 
più avanti, per ora ci basta sapere che il contesto di build rappresenta la directory in cui si trova il Dockerfile e
tutti i file necessari per la costruzione dell'immagine.

```terminaloutput
[+] Building 0.6s (6/6) FINISHED                                                                                                                          docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 69B                                                                                                                                       0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s 
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/2] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => [2/2] RUN apk add figlet                                                                                                                                              0.6s 
 => exporting to image                                                                                                                                                    0.0s
 => => exporting layers                                                                                                                                                   0.0s
 => => writing image sha256:d5e7ae0b40c2cd1ea64a8c2b888c7652bf7a6a7ace92c2f898290c55b87b6856                                                                              0.0s

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/mbrrdkr2eyikj07v64dh88voj

What's next: View a summary of image vulnerabilities and recommendations → docker scout quickview
```

L'output che vedete potrebbe essere leggermente diverso in base alla versione di Docker che state usando, in particolare
se la build viene eseguita con il `builder classico` o con il nuovo `buildkit`, ma in ogni caso il concetto è lo stesso.

Una volta terminato il comando, possiamo notare che sono avvenute diverse cose:

1. Docker ha caricato il Dockerfile e ha letto le istruzioni in esso contenute.
2. Vengono scaricati i metadati dell'immagine di base, in questo caso `alpine`.
3. E qualora presente viene caricato il file `.dockerignore` per escludere eventuali file dal contesto di build.
4. Dopodiché viene copiato il contesto di build, in questo caso avevamo solamente il Dockerfile.
5. E poi viene eseguita la prima istruzione vera e proprio ovvero viene scaricata l'immagine di base `alpine`.
6. Subito dopo viene eseguita la seconda istruzione ovvero il comando per installare il pacchetto Figlet.
7. Infine viene esportata l'immagine appena creata, i suoi layer aggiuntivi e gli viene assegnato un ID univoco.

Per come funziona intrinsecamente il nuovo builder di Docker alcune istruzioni potrebbero essere eseguite in parallelo
per velocizzare il processo di build ma in ogni caso l'ordine delle istruzioni viene sempre rispettato per garantire un
risultato finale sempre identico.

Procediamo come sempre a testarla lanciando un container in modalità interattiva:

```shell
$ docker run -it d5e
$ figlet "Hello Builder!"
```

E come ci aspettavamo, tutto funziona alla perfezione:

```terminaloutput
 _   _      _ _         ____        _ _     _           _ 
| | | | ___| | | ___   | __ ) _   _(_) | __| | ___ _ __| |
| |_| |/ _ \ | |/ _ \  |  _ \| | | | | |/ _` |/ _ \ '__| |
|  _  |  __/ | | (_) | | |_) | |_| | | | (_| |  __/ |  |_|
|_| |_|\___|_|_|\___/  |____/ \__,_|_|_|\__,_|\___|_|  (_)
```

A questo punto, come abbiamo fatto in precedenza, possiamo taggare la nostra immagine per darle un nome più amichevole.
Anche in questo caso abbiamo due modi per farlo, direttamente durante la fase di build aggiungendo l'opzione `-t` prima
del `.` contesto, oppure nuovamente il comando `tag` seguito dall'ID dell'immagine appena creata.

```shell
$ docker build -t figlet .
$ docker tag d5e figlet
```

Se eseguiamo nuovamente il comando `build` noteremo che l'esecuzione sarà quasi istantanea.

```terminaloutput
[+] Building 0.0s (6/6) FINISHED                                                                                                                          docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 69B                                                                                                                                       0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s 
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => CACHED [1/2] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => CACHED [2/2] RUN apk add figlet                                                                                                                                       0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:d5e7ae0b40c2cd1ea64a8c2b888c7652bf7a6a7ace92c2f898290c55b87b6856                                                                              0.0s 
 => => naming to docker.io/library/figlet                                                                                                                          0.0s 
                                                                                                                                                                               
View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/mgek5qujoq53k3x5geh7t68sw

What's next: View a summary of image vulnerabilities and recommendations → docker scout quickview 
```

Questo avviene perché il builder di Docker utilizza un sistema di Caching molto performante che permette di evitare di
eseguire nuovamente le istruzioni che non sono cambiate rispetto alla build precedente.

In pratica prima di eseguire ogni istruzione, il builder verifica se quella istruzione è già stata eseguita in una
build precedente e se il contesto di build non è cambiato, in tal caso risale all'ID del layer creato in precedenza
e lo riutilizza, evitando così di dover eseguire nuovamente l'istruzione.

Facciamo però attenzione che questo sistema verifica esattamente che il comando sia scritto nello stesso identico modo,
quindi anche una piccola modifica come l'aggiunta di uno spazio in più o la rimozione di una lettera farà si che
l'istruzione venga eseguita nuovamente invalidando la cache.

Qualora volessimo forzare il builder a non utilizzare la cache, possiamo aggiungere l'opzione `--no-cache` al comando:

```shell
$ docker build -t figlet --no-cache .
```

E vedremo che in questo caso tutte le istruzioni verranno eseguite nuovamente.

```terminaloutput
[+] Building 0.6s (6/6) FINISHED                                                                                                                          docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 69B                                                                                                                                       0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s 
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/2] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => [2/2] RUN apk add figlet                                                                                                                                       0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:d5e7ae0b40c2cd1ea64a8c2b888c7652bf7a6a7ace92c2f898290c55b87b6856                                                                              0.0s 
 => => naming to docker.io/library/figlet                                                                                                                          0.0s 
                                                                                                                                                                               
View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/mgek5qujoq53k3x5geh7t68sw

What's next: View a summary of image vulnerabilities and recommendations → docker scout quickview 
```

Se vogliamo poi vedere in maniera puntuale quasi sono i layer che compongono la nostra immagine, possiamo visualizzare
la storia della nostra immagine con il comando:

```shell
$ docker history figlet
```

Che ci mostrerà una lista con tutti i comandi che hanno contribuito alla creazione dell'immagine, l'ID del layer, la sua
dimensione, la data di creazione e un eventuale commento.

```terminaloutput
IMAGE          CREATED         CREATED BY                                      SIZE      COMMENT
75a72894db5f   5 minutes ago   RUN /bin/sh -c apk add figlet # buildkit        3.32MB    buildkit.dockerfile.v0
<missing>      2 months ago    CMD ["/bin/sh"]                                 0B        buildkit.dockerfile.v0
<missing>      2 months ago    ADD alpine-minirootfs-3.22.1-aarch64.tar.gz …   8.51MB    buildkit.dockerfile.v0
```

In questo caso, partendo dal basso, possiamo notare che il primo layer è quello dell'immagine di base `alpine`, seguito
poi dal comando che lancia la shell `/bin/sh` (questa parte la vedremo meglio in seguito) e infine il comando `RUN`
associato alla nostra istruzione per l'installazione di Figlet.

Le prime due righe, a differenza dell'ultima, hanno l'ID impostato a `<missing>`, questo succede perché fanno parte
dell'immagine di base e non sono state create dal nostro builder.

Inoltre se vedete il nostro comando è stato leggermente modificato aggiungendogli davanti `/bin/sh -c`, perchè?

***

> __building images with a Dockerfile__
>
> - fork
> - execve

Per capirlo dobbiamo fare un piccolo deep dive su come funzionano i sistemi UNIX.
Per eseguire un nuovo programma il sistema operativo ci mette a disposizione due chiamate di sistema `fork()` e
`execve()`. Il primo si occupa di creare un nuovo processo figlio, mentre il secondo si occupa di caricare un nuovo
programma all'interno di un processo esistente.

Il comando `execve(program, [ list, of, arguments ])` prende come argomenti il percorso del programma da eseguire e una
lista di argomenti da passargli.

Quando noi eseguiamo un comando da terminale, in realtà il terminale stesso crea un nuovo processo figlio con `fork`
e poi usa `execve` per caricare il programma specificato all'interno di quel processo figlio. Se ad esempio digitiamo
`ls -l ~`, il terminale si occuperà prima di tutto del parsing del comando (ovvero suddividerlo in comandi e argomenti)
e se necessario si occuperà di espandere eventuali variabili o caratteri speciali come `~` per la home dell'utente.
Successivamente creerà un nuovo processo con `fork` ed eseguirà `execve("/bin/ls", [ "ls" , "-l", "/home/ubuntu" ])`.

Tutte queste operazioni, che vengono eseguite dalla shell, sono trasparenti per l'utente che vede solamente il comando
che ha digitato. Docker avrebbe potuto costruirsi un poprio parser per i comandi, ma avrebbe dovuto come si suol dire
reinventare la ruota, per cui ha deciso di affidarsi alla shell per eseguire il parsing delegandogli il tutto.

L'opzione `-c` di `sh` indica alla shell di trattare il comando seguente come una stringa così ne effettuerà il parsing.

***

Alternativamente, se volessimo evitare che il comando debba essere parsato dalla shell, potremmo usare una modalità
alternativa per specificare gli argomenti del comando `RUN` usando la sintassi JSON:

```shell
$ nano Dockerfile
```

Modifichiamo quindi il nostro Dockerfile in questo modo:

```dockerfile
FROM alpine
RUN [ "apk", "add", "figlet" ]
```

Usciamo dall'editor salvando e procediamo nuovamente con la build:

```shell
$ docker build -t figlet .
```

Come possiamo vedere, l'output è praticamente identico a prima, a eccezione del comando RUN che abbiamo modificato:

```terminaloutput
[+] Building 0.5s (6/6) FINISHED                                                                                                                          docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 69B                                                                                                                                       0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s 
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/2] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => [2/2] RUN [ "apk", "add", "figlet" ]                                                                                                                                     0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:d5e7ae0b40c2cd1ea64a8c2b888c7652bf7a6a7ace92c2f898290c55b87b6856                                                                              0.0s 
 => => naming to docker.io/library/figlet                                                                                                                          0.0s 
                                                                                                                                                                               
View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/mgek5qujoq53k3x5geh7t68sw

What's next: View a summary of image vulnerabilities and recommendations → docker scout quickview 
```

Se andiamo a vedere la storia della nostra immagine:

```shell
$ docker history figlet
```

Noteremo che il comando `RUN` questa volta è esattamente quello che abbiamo specificato nel Dockerfile, senza alcuna 
modifica, e la sua dimensione risultate è la stessa di prima:

```terminaloutput
IMAGE          CREATED         CREATED BY                                      SIZE      COMMENT
75a72894db5f   2 minutes ago   RUN apk add figlet # buildkit                   3.32MB    buildkit.dockerfile.v0
<missing>      2 months ago    CMD ["/bin/sh"]                                 0B        buildkit.dockerfile.v0
<missing>      2 months ago    ADD alpine-minirootfs-3.22.1-aarch64.tar.gz …   8.51MB    buildkit.dockerfile.v0
```

***

> __building images with a Dockerfile__
>
> - shell syntax
>   - easy to write
>   - more flexible
>   - extra process
>   - require sh
> - exec syntax
>   - harder to write
>   - no extra process
>   - sh not required

Quindi ricapitolando, quand'è che dovremo preferire una sintassi rispetto all'altra?

In breve, la sintassi `shell` è più facile da scrivere e più flessibile in quanto ci permette di utilizzare alias e 
variabili d'ambiente, tuttavia richiede un processo in più e la presenza della shell all'interno dell'immagine per poter
effettuare il parsing del comando.

La sintassi `exec` invece è un po' più difficile da scrivere, in quanto dobbiamo specificare ogni argomento come un
elemento di un array, ma non richiede un processo in più e non necessita della shell all'interno, oltre al fatto che non
eseguendo alcun parsing, possiamo essere certi che il comando verrà eseguito esattamente come lo abbiamo scritto.

***

> Resources:
> - [figlet](../../sources/figlet) (shell syntax version)
> - [figlet-exec](../../sources/figlet-exec) (exec syntax version)

[Prosegui](../09-entrypoint-cmd/IT.md) al prossimo argomento.
