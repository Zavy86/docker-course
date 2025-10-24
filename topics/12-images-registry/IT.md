# Images registry

> __images registry__
>
> - tags
> - registry
> - Docker Hub
> - custom registries

Prima di parlare di registry, dobbiamo fare un breve riassunto di come funzionano i tags.

In Docker taggare un'immagine è un po' come in Git quando si tagga un commit. Un tag è un'etichetta che punta a una 
specifica ID immagine. Possiamo quindi aggiungere più tag alla stessa immagine. Questo tag sarà poi quello vedremo come
se fosse il nome dell'immagine.

Un images registry è un servizio che permette di archiviare, condividere e gestire le immagini Docker.
In pratica, è un "magazzino" online (o in locale) dove puoi salvare le immagini che hai creato, rendendole disponibili 
per il download e l'utilizzo su altri host o da altri utenti.

Il più noto e utilizzato è il **Docker** Hub, un servizio pubblico offerto da Docker in cui è possibile trovare tutte le
immagini mantenute dal team di Docker e migliaia di immagini create dalla comunità. 
E una volta creato un account potrai anche pubblicare le tue immagini!

Oltre al Docker Hub, esistono altri registry pubblici come **GitHub** Container Registry, **Google** Container Registry,
**Amazon** Elastic Container Registry, ecc...

Inoltre puoi anche decidere di ospitare il tuo registry privato, in modo da poter gestire le immagini in modo privato e 
sicuro sia in locale su un server aziendale che ovviamente su un server in cloud.

La principale differenza fra il registry ufficiale di Docker e gli altri è nella nomenclatura delle immagini.

Se ci riferiamo infatti ad esempio all'immagine `alpine`, che abbiamo visto che capitoli precedenti, in realtà il suo 
nome completo sarebbe `docker.io/library/alpine`. In questo caso è Docker stesso a completare il nome dell'immagine, 
aggiungendo il nome del registry ufficiale e il nome del repository.

Mentre se stiamo usando un registry custom, dovremo specificare il nome completo dell'immagine, incluso l'indirizzo web
del registry, l'eventuale porta e il nome del repository ad esempio `registry.tld:1234/repository/image`.

Ma vediamo nella pratica come pubblicare sul Docker Hub la nostra prima immagine.

***

Nei capitoli precedenti abbiamo effettuato la build della nostra immagine personalizzata con `figlet` e ora la vogliamo
rendere disponibile al mondo intero. Per cui procediamo con la sua pubblicazione su Docker Hub.

Per poter pubblicare sul Docker Hub dobbiamo prima di tutto creare un account.

Accediamo quindi alla pagina di [registrazione](https://app.docker.com/signup) e compiliamo il form.

Una volta confermata la mail di verifica e completata la registrazione, dobbiamo effettuare la login nella CLI.

```shell
$ docker login
```

Verremo reindirizzati al sito web di Docker dove potremo inserire le credenziali per accedere al nostro account.

```terminaloutput
Login Succeeded
```

Dopodiché per pubblicare la nostra prima immagine non dovremo per prima cosa taggarla con un nome compatibile con
il registry sul quale la vogliamo pubblicare.

Se vogliamo ad esempio utilizzare il Docker Hub, dovremo usare la sintassi `username/image`, quindi nel mio caso:

```shell
$ docker tag figlet zavy86/figlet
$ docker image ls
```
```terminaloutput
REPOSITORY      TAG        IMAGE ID       CREATED         SIZE
figlet          latest     1e07b8999b54   3 minutes ago   11.8MB
zavy86/figlet   latest     1e07b8999b54   3 minutes ago   11.8MB
```

Come possiamo vedere dall'output della lista delle immagini, ora abbiamo due immagini con lo stesso ID ma con due nomi 
diversi, ora se facciamo il run di qualunque di queste immagini, il risultato sarà identico.

Ora che abbiamo un nome compatibile, procediamo con la pubblicazione:

```shell
$ docker push zavy86/figlet
```
```terminaloutput
Using default tag: latest
The push refers to repository [docker.io/zavy86/figlet]
942375deb877: Pushed 
0b83d017db6e: Mounted from library/alpine 
latest: digest: sha256:53e7a0d0c352823b573fda0a31be3b50ca942eb5f566a0c4311b9e9363496d2a size: 738
```

Fatto! Ora chiunque può eseguire il run della nostra immagine `zavy86/figlet`.

Come possiamo vedere dal log, Docker ha effettuato il push solamente del layer comprendente le modifiche della nostra
immagine, mentre per quanto riguarda l'immagine base di `apline` ha fatto il mount del layer già presente online.

Se accediamo a Docker Hub, all'interno del nostro profilo potremo vedere la nostra immagine, il numero di download e le 
informazioni sulla build.

***

> __images registry__
>
> - docker
> - podman
> - gitlab
> - harbor
> - quay

Se volessimo invece utilizzare un registry privato, open source e self-hosted, esistono varie soluzioni che potremo
sfruttare, ad esempio il classico Docker Registry, il Podman Registry, il registry di GitLab, Harbor, Quay, ecc...

In base alle vostre esigenze e al vostro ambiente, potrebbe essere opportuno scegliere uno di questi registry.

Ma per questo tutorial vogliamo rimanere sul semplice e utilizzeremo quindi il Docker Registry classico.

***

Lanciamo quindi un container con l'immagine del registry:

```shell
$ docker run --name registry -d -p 5000:5000 registry:2
```

Fatto, a questo punto potremo taggare e pubblicare le immagini sul nostro registry privato.

Se ad esempio volessimo distribuire la nostra immagine `figlet` sul nostro registry, non dovremo far altro che taggarla
con l'url del nostro registry privato (avendo cura di specificare anche la porta):

```shell
$ docker tag figlet localhost:5000/figlet
```

Ed infine effettuare il push:

```shell
$ docker push localhost:5000/figlet
```
```terminaloutput
Using default tag: latest
The push refers to repository [localhost:5000/figlet]
dfa81dc0debc: Pushed 
0b83d017db6e: Pushed 
latest: digest: sha256:ea4493cea59b9dd95fa888665bd89f79b784175dc9b93e84659078f1362504cb size: 738
```

Questa soluzione come anticipato non è da considerarsi definitiva o da usare in produzione, dovremmo infatti creare un
ambiente sicuro, gestendo l'autenticazione, l'esposizione in HTTPS utilizzando la porta standard 443 (così da evitare di
doverla specificare ogni volta) e servire anche un'interfaccia grafica così da rendere l'esperienza di utilizzo più
gradevole.

***

[Prosegui](../13-naming-labeling-inspecting/IT.md) al prossimo capitolo.
