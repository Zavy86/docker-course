# Reduce images size

> __reduce images size__
>
> - hello executable
> - hello.c source code
> - gcc compiler with libs
> - alpine base image

Nel capitolo precedente l'immagine che abbiamo creato conteneva al suo interno: il programma compilato `hello`, il suo
codice sorgente `hello.c`, il compilatore `gcc`, la libreria di supporto `libc-dev` e ovviamente tutto quanto già
presente nell'immagine base `alpine`.

Come potrete aver visto questa immagine risultava pesare **oltre 170 megabyte**.

Ma se ci pensate, per l'esecuzione del nostro container, le uniche cose fondamentali che ci servono sono il primo e
l'ultimo, ovvero il programma compilato l'immagine base.

E visto che come ci siamo detti più volte l'ottimizzazione è una delle cose fondamentali nel nostro mestiere, pubblicare
un'immagine così grossa con al suo interno un sacco di componenti superflue non è proprio il massimo.

***

> __reduce images size__
>```
> alpine
> └ install gcc and libc-dev
>   └ copying hello.c
>     └ compiling hello
>       └ removing hello.c
>         └ uninstall gcc and libc-dev
>           └ (read-write layer)
>```

La prima cosa che ci viene in mente probabilmente sarebbe quella di aggiungere semplicemente un altro step al nostro
Dockerfile, nel quale andremo a rimuovere il file sorgente, e un altro step per rimuovere il compilatore tramite apk.

Tuttavia se facessimo in questo modo non otterremo l'effetto desiderato, anzi l'immagine paradossalmente finirebbe per
pesare ancora di più.

Questo perché non faremmo altro che aggiungere ulteriori layer e ogni layer conterrebbe i suoi metadati e i suoi files.

***

> __reduce images size__
>
> - collapsing layers
> - build binaries outside
> - squashing final image
> - multi-stage build

Ci sono invece varie tecniche che ci permettono di ridurre la dimensione della nostra immagine finale, vediamole insieme.

***

> __reduce images size__
>
> collapsing layers
>
> pro:
> - works on all versions
> - no extra tools required
>
> cons:
> - low readability
> - slow to build
> - no cache

La prima tecnica consiste nel fare in modo che tutti gli step vengano eseguiti all'interno di un singolo layer, ovvero
in un unica azione `RUN`, in questo modo installeremo, compieremmo, compileremmo, rimuoveremmo e disinstalleremmo tutto
il necessario in un unico passaggio lasciando al termine del nostro comando solamente il programma compilato.

Questa tecnica è sicuramente efficace, tuttavia ci ritroveremmo con un sorgente di questo tipo: 

```dockerfile
FROM alpine
COPY hello.c /
RUN apk add gcc libc-dev && gcc /hello.c -o /hello && apk remove gcc libc-dev && rm /hello.c
CMD /hello
```

O magari di questo tipo:

```dockerfile
FROM alpine
COPY hello.c /
RUN apk add gcc libc-dev \
  && gcc /hello.c -o /hello \
  && apk remove gcc libc-dev \
  && rm /hello.c
CMD /hello
```

In ogni caso sempre poco leggibile e difficilmente mantenibile.

In questo caso stiamo eseguendo poche banali operazioni ma immaginate un Dockerfile più complesso e intricato...

Potrebbe poi succedere che rimangano in giro file non necessari, come file di logs o semplici file temporanei.

Inoltre in questo modo non sfrutteremmo la cache sui singoli layer non modificati rendendo il processo di build meno
performante e più lento.

***

> __reduce images size__
>
> build binaries outside
>
> pro:
> - tiny images
>
> cons:
> - extra tools required
> - dependency hell
> - portability breaks

Con questa seconda tecnica, ovvero con la build dell'applicazione all'esterno del Dockerfile, sicuramente andremo a 
risparmiare spazio generando delle immagini super leggere composte da pochissime istruzioni:

```dockerfile
FROM alpine
COPY hello /
CMD /hello
```

Tuttavia i contro sono molteplici e difficilmente ignorabili.

Ogni macchina sulla quale vorremo andare a effettuare la build dovra necessariamente disporre di un compilatore, delle
librerie e quant'altro, rendendoci nuovamente dipendenti da un ambiente di sviluppo specifico, tornando quindi al
possibile problema del "works on my machine".

Inoltre qualora l'applicazione venga compilata su un architettura ad esempio `x86` l'immagine non sarebbe compatibile
poi ad esempio per l'esecuzione su macchine `arm` rendendo di fatto il tutto meno portabile. 

***

> __reduce images size__
>
> squashing final image
>
> pro:
> - single layer
>
> cons:
> - manual removal
> - take a lot of time
> - no cache

La tecnica dello squashing ci permette di ottenere un'immagine composta da un singolo layer e per farlo ci è sufficiente
aggiungere l'opzione `--squash` al comando `docker build`.

Potrebbe sembrare una soluzione ottimale, tuttavia anche questa soluzione presenta alcune criticità.

In primis dobbiamo comunque ricordarci di disinstallare manualmente tutti i componenti non necessari e di rimuovere 
tutti i files e come vedevamo prima molte volte potrebbero esserci files sparsi ovunque difficilmente tracciabili...

Inoltre anche in questo caso perderemmo la possibilità di sfruttare il sistema di caching di Docker.

E l'operazione di squashing, sopratutto per immagini grosse, potrebbe richiedere un sacco di tempo per essere eseguita.

***

> __reduce images size__
>
> multi-stage build
>
> pro:
> - small image
> - clean image
> - more secure
> - cacheable
>
> cons:
> - limited support

Infine, la tecnica del multi-stage build è sicuramente la più moderna ed elegante tra quelle che abbiamo visto finora.

L'unico contro che mi viene in mente è che nelle vecchie versioni di Docker non è supportata, tuttavia al giorno d'oggi
difficilmente vi troverete a lavorare con sistemi così vecchi. E se vi dovesse capitare: aggiornateli! ;)

Per quanto riguarda i pro, questa tecnica ci permette di ottenere un'immagine leggera, pulita e sicura in quanto, come
vedremo a breve, limiteremo i componenti finali allo stretto necessario evitando il proliferare di files, applicativi e
sorgenti riducendo di fatto anche la superficie di attacco sfruttando eventuali vulnerabilità.

***

Per vedere nella pratica come funziona il multi-stage build, creiamo una nuova cartella di lavoro:

```shell
$ mkdir hello-multi-stage && cd $_
```

Copiamoci il file sorgente creato precedentemente:

```shell
$ cp ../hello/hello.c ./
```

E andiamo a creare il nostro Dockerfile multi-stage:

```shell
$ nano Dockerfile
```

Come avevamo visto nei capitoli precedenti, la prima istruzione di un Dockerfile deve necessariamente essere `FROM`,
in questo caso `FROM alpine`, tuttavia questa istruzione può essere anche ripetuta più volte all'interno dello stesso
Dockerfile.

```dockerfile
FROM alpine
RUN apk add gcc libc-dev
COPY hello.c /
RUN gcc /hello.c -o /hello
```

Ogni volta che il builder incontrerà un'istruzione `FROM`, saprà che dovrà iniziare a creare un nuovo stage di build.

Ogni stage può essere etichettato tramite l'istruzione `AS`, in modo poi da poterci fare riferimento nelle istruzioni
seguenti, se non assegniamo nessun nome potremo comunque riferirci allo stage tramite un numero incrementale da 0.

Nel nostro caso, il primo stage si è occupato dell'installazione e della compilazione del programma, quindi nel secondo
stage non ci resta che copiarci il file eseguibile e aggiungere il comando di esecuzione.

```dockerfile
FROM alpine AS compiler
RUN apk add gcc libc-dev
COPY hello.c /
RUN gcc /hello.c -o /hello

FROM alpine
COPY --from=compiler /hello /
CMD /hello
```

Come possiamo vedere questo codice è sicuramente molto più leggibile e facile da gestire.

E nel momento in cui andremo a effettuare la build ed effettueremo il tag dell'immagine, Docker creerà il primo stage,
copiera il file nel secondo stage (una nuova immagine pulita in cui c'è solamente l'immagine base di alpine) e una volta
terminato il tutto la prima immagine verrà scartata (restando comunque a disposizione per sfruttarne la cache) e il 
risultato sarà solamente la seconda immagine super leggera.

```shell
$ docker build -t hello-multi-stage .
```
```terminaloutput
[+] Building 0.2s (10/10) FINISHED                                                                                                                        docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 184B                                                                                                                                      0.0s 
 => WARN: JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 8)                                           0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [internal] load build context                                                                                                                                         0.0s 
 => => transferring context: 106B                                                                                                                                         0.0s 
 => CACHED [compiler 1/4] FROM docker.io/library/alpine:latest                                                                                                            0.0s 
 => CACHED [compiler 2/4] RUN apk add gcc libc-dev                                                                                                                        0.0s 
 => CACHED [compiler 3/4] COPY hello.c /                                                                                                                                  0.0s 
 => CACHED [compiler 4/4] RUN gcc /hello.c -o /hello                                                                                                                      0.0s 
 => [stage-1 2/2] COPY --from=compiler /hello /                                                                                                                           0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:5311a310b00979ff846df48ce5d6b25ed4ac8483c86e610b15f6987cbac04706                                                                              0.0s 
 => => naming to docker.io/library/hello-multi-stage                                                                                                                      0.0s 
                                                                                                                                                                               
 1 warning found (use docker --debug to expand):
 - JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 8)                                                       

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/p9ufnu6v9yuel9arwi1xu86y7

What's next: View a summary of image vulnerabilities and recommendations → docker scout quickview 
```

Se proviamo infatti a lanciare il comando:

```shell
$ docker image ls
```

Vedremo che le due immagini hanno dimensioni notevolmente diverse:

```terminaloutput
REPOSITORY          TAG        IMAGE ID       CREATED         SIZE
hello-multi-stage    latest    5311a310b009   2 minutes ago   8.58MB
hello                latest    0d0307813688   1 days ago      174MB
```

E se proviamo a lanciare il nostro container vedremo che tutto continua a funzionare come di consueto:

```shell
$ docker run hello-multi-stage
```
```terminaloutput
Hello World!
```

Per completezza vi dico anche che è possibile sfruttare gli alias degli stage per far si che il builder vada a esportare
un'immagine di quel livello, per esempio potremo voler creare:

```shell
$ docker build --target compiler -t hello-compiler .
```
```terminaloutput
[+] Building 0.0s (9/9) FINISHED                                                                                                                          docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 184B                                                                                                                                      0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s 
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [compiler 1/4] FROM docker.io/library/alpine:latest                                                                                                                   0.0s 
 => [internal] load build context                                                                                                                                         0.0s 
 => => transferring context: 28B                                                                                                                                          0.0s 
 => CACHED [compiler 2/4] RUN apk add gcc libc-dev                                                                                                                        0.0s 
 => CACHED [compiler 3/4] COPY hello.c /                                                                                                                                  0.0s 
 => CACHED [compiler 4/4] RUN gcc /hello.c -o /hello                                                                                                                      0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:a793d46ba2fbbb750cc3c3a57c5c2e5c6f35d73b532c7550394e8622f4835239                                                                              0.0s 
 => => naming to docker.io/library/hello-compiler                                                                                                                         0.0s 
                                                                                                                                                                               
View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/itxnm7yfbjf1zq1y7u3lr2i3i

What's next: View a summary of image vulnerabilities and recommendations → docker scout quickview 
```

In questo caso l'immagine generata sarà quella di compilazione del programma, alla quale potremmo poi accedere per 
effettuare eventuali debug o tests:

```shell
$ docker run -it hello-compiler sh
```
```shell
# ls -l
```
```terminaloutput
drwxr-xr-x     2 root   root    4096   Jul 15   10:42   bin
drwxr-xr-x     5 root   root     360   Sep 20   08:09   dev
drwxr-xr-x     1 root   root    4096   Sep 20   08:09   etc
-rwxr-xr-x     1 root   root   72888   Sep 17   15:03   hello
-rw-r--r--     1 root   root      72   Sep 17   15:03   hello.c
drwxr-xr-x     2 root   root    4096   Jul 15   10:42   home
drwxr-xr-x     1 root   root    4096   Jul 15   10:42   lib
drwxr-xr-x     5 root   root    4096   Jul 15   10:42   media
drwxr-xr-x     2 root   root    4096   Jul 15   10:42   mnt
drwxr-xr-x     2 root   root    4096   Jul 15   10:42   opt
dr-xr-xr-x   215 root   root       0   Sep 20   08:09   proc
drwx------     1 root   root    4096   Sep 20   08:09   root
drwxr-xr-x     3 root   root    4096   Jul 15   10:42   run
drwxr-xr-x     2 root   root    4096   Jul 15   10:42   sbin
drwxr-xr-x     2 root   root    4096   Jul 15   10:42   srv
dr-xr-xr-x    11 root   root       0   Sep 20   08:09   sys
drwxrwxrwt     1 root   root    4096   Sep 17   15:03   tmp
drwxr-xr-x     1 root   root    4096   Sep 17   15:00   usr
drwxr-xr-x     1 root   root    4096   Jul 15   10:42   var
```

Un altro utilizzo potrebbe essere quello di creare un singolo Dockerfile che possa generare diverse immagini, magari 
per diverse versioni del nostro programma. In tal caso potremmo far compilare più versioni nello stage di `compiler` e 
poi creare vari stage in cui copiare solamente i file relativi a quella versione e poi effettuare più build puntando al 
target desiderato, così da sfruttare al meglio la cache ed evitare di replicare lo stesso codice in più Dockerfile.

***

> Resources:
> - [hello-multi-stage](../../sources/hello-multi-stage)

[Prosegui](../12-images-registry/IT.md) al prossimo capitolo.
