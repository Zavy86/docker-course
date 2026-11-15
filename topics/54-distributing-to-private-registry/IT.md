# Distributing to a private registry

> __from a local build to a distributed application__
>
> - host our own registry
> - build and push with Compose
> - run the application without its sources

Se dovessimo distribuire una nostra applicazione, consegnando ogni volta il Dockerfile e tutti i suoi sorgenti potrebbe
rendere più complicato il lavoro di chi deve avviarla. Ogni macchina dovrebbe ricostruire l'immagine, avere accesso alle
dipendenze necessarie e ripetere una preparazione che abbiamo già completato sul nostro computer.

Per semplificare questo passaggio potremmo costruire l'immagine una volta e pubblicarla in un registry privato, così da
permettere alle altre installazioni di scaricare la versione che abbiamo preparato.

Nel [capitolo 32](../32-building-pulling-publishing-images/IT.md) abbiamo già usato Compose per pubblicare immagini su
Docker Hub, questa volta gestiremo anche il registry privato nel quale conservarle.

In questo ultimo capitolo della seconda parte di questo corso prepareremo quindi un piccolo ambiente completo, avviando 
il nostro registry, costruendo un'applicazione personalizzata e pubblicandone l'immagine. Infine ci sposteremo in una 
directory che contiene soltanto un file Compose e useremo l'immagine distribuita, senza avere a disposizione né il 
Dockerfile né i sorgenti per ricostruirla. Potremo svolgere tutta la prova sullo stesso computer, usando solo il nostro
Docker Engine anche per ospitare il registry.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/sources/compose/registry
```

E analizziamo poi il file `compose.yaml`:

```yaml
volumes:
  registry-data:

services:
  registry:
    image: registry:3
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - registry-data:/var/lib/registry
  app:
    build: .
    image: localhost:5000/compose-custom-app:1.0
```

Lo stack comprende due servizi. Il primo, `registry`, usa l'immagine ufficiale e conserva le immagini ricevute nella
directory `/var/lib/registry`, collegata al volume `registry-data`. Il contenuto rimarrà quindi disponibile anche quando
fermeremo e ricreeremo il container, come per gli altri dati persistenti incontrati nel corso.

Il mapping pubblica la porta `5000` sulle interfacce dell'host, quindi il registry può essere raggiunto anche da altre
macchine se la rete e il firewall lo consentono. Per la prova useremo `localhost` e non configureremo autenticazione o
HTTPS. Per un'installazione condivisa dovremmo invece predisporre TLS e il controllo degli accessi.

Il secondo servizio, `app`, descrive l'applicazione che costruiremo. `build: .` indica di usare la directory corrente
come contesto di build, mentre `image` assegna all'immagine il nome completo che useremo per pubblicarla. La parte
`localhost:5000` identifica il registry, `compose-custom-app` il repository al suo interno e `1.0` il tag.

Questo indirizzo verrà usato dagli strumenti che trasferiscono l'immagine, non dal processo Nginx nel container.

Per questo non scriviamo `registry:5000`, il nome del servizio sarebbe risolvibile sulla rete Compose ma non identifica
automaticamente un registry raggiungibile dal daemon o dal builder. Nel nostro esempio entrambi lavorano nell'ambiente
Docker locale, con un builder che rende disponibile l'immagine sul daemon.

Se volessimo pubblicare o scaricare le immagini da un altro computer, sarebbe preferibile usare un nome DNS, per
esempio `registry.example.com`, configurato per puntare all'indirizzo IP dell'host sul quale gira il registry.
Useremmo quindi un riferimento come `registry.example.com:5000/compose-custom-app:1.0`, mantenendo lo stesso indirizzo
nelle diverse installazioni. `localhost`, invece, indicherebbe ogni volta il computer che sta eseguendo l'operazione.

***

Accanto al file Compose troviamo il nostro `Dockerfile`:

```dockerfile
FROM nginx:stable-alpine
COPY index.html /usr/share/nginx/html/index.html
```

Partiamo ancora una volta da Nginx e sostituiamo la pagina iniziale con il nostro file `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Our Compose application</title>
  </head>
  <body>
    <h1>Hello from our registry!</h1>
    <p>This page is part of our custom image.</p>
  </body>
</html>
```

È una piccola applicazione statica, ma ci permetterà di riconoscere immediatamente la nostra immagine quando la
scaricheremo dal registry. La pagina viene copiata durante la build e non viene collegata al container con un bind 
mount, quindi farà parte di ciò che distribuiremo.

Il file `.dockerignore` limita inoltre il contesto ai files necessari per questa build:

```text
**
!Dockerfile
!index.html
```

Escludiamo tutti i file e lasciamo passare soltanto il Dockerfile e la pagina. In questo modo non inviamo al builder
anche la directory che useremo per consumare l'immagine o altri file che potremmo aggiungere in seguito al laboratorio.

***

Procediamo per prima cosa con l'avviare soltanto il registry:

```shell
$ docker compose up -d registry
```
```terminaloutput
[+] up 1/1
 ✔ Container registry-registry-1 Started                                                                            0.1s
```

Abbiamo selezionato il servizio esplicitamente, quindi per il momento non stiamo né costruendo né avviando `app`.

Compose creerà il volume e la rete del progetto, poi avvierà il container del registry.

Controlliamo il servizio e proviamo a contattarne l'API:

```shell
$ curl --fail http://localhost:5000/v2/
```
```terminaloutput
{}
```

Se otteniamno un piccolo oggetto JSON vuoto significa che il registry è pronto e funzionante.

***

Possiamo ora costruire l'immagine dell'applicazione:

```shell
$ docker compose build app
```
```terminaloutput
[+] Building 1.1s (9/9) FINISHED                                                                    
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 579B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s
 => => transferring dockerfile: 111B                                                                                0.0s
 => [internal] load metadata for docker.io/library/nginx:stable-alpine                                              0.6s
 => [internal] load .dockerignore                                                                                   0.0s
 => => transferring context: 67B                                                                                    0.0s
 => [internal] load build context                                                                                   0.0s
 => => transferring context: 276B                                                                                   0.0s
 => [1/2] FROM docker.io/library/nginx:stable-alpine@sha256:901e593c95dc85f5a729f576551632136                       0.0s
 => => resolve docker.io/library/nginx:stable-alpine@sha256:901e593c95dc85f5a729f576551632136                       0.0s
 => CACHED [2/2] COPY index.html /usr/share/nginx/html/index.html                                                   0.0s
 => exporting to image                                                                                              0.3s
 => => exporting layers                                                                                             0.0s
 => => exporting manifest sha256:ee1f6fe6ffe6a452d789850bf08414d262d80939758f00c79d87109d9f47                       0.0s
 => => exporting config sha256:b606baf727c10c919b4183abb1012827f789f9c52e8787fb52688285f7e482                       0.0s
 => => exporting attestation manifest sha256:d42ac86bfe4a13d1f8ecdad729a67afc1240bc2be24c4401                       0.0s
 => => exporting manifest list sha256:acfa1929da1c846455f4aa95340e941f7373701f99d10fda7ae3911                       0.0s
 => => naming to localhost:5000/compose-custom-app:1.0                                                              0.0s
 => => unpacking to localhost:5000/compose-custom-app:1.0                                                           0.2s
 => resolving provenance for metadata file                                                                          0.0s
[+] build 1/1                     
 ✔ Image localhost:5000/compose-custom-app:1.0 Built                                                                1.1s
```

Compose legge il Dockerfile, copia la pagina e assegna al risultato il nome `localhost:5000/compose-custom-app:1.0`.

La presenza dell'indirizzo del registry nel nome non significa però che l'immagine sia già stata inviata, al termine
della build il risultato è ancora sul nostro daemon locale.

Procediamo quindi con la pubblicazione:

```shell
$ docker compose push app
```
```terminaloutput
[+] push 12/12
 ✔ localhost:5000/compose-custom-app:1.0 Pushed                                                                     0.7s
```

Questa volta Compose trasferisce l'immagine al registry indicato nel campo `image`. Selezioniamo soltanto `app`, perché
vogliamo pubblicare la nostra applicazione, non l'immagine del servizio che ospita il registry.

Il registry non comprende una pagina web per navigare fra le immagini, ma possiamo interrogarne l'API per vedere i tag
del repository appena creato:

```shell
$ curl --fail http://localhost:5000/v2/compose-custom-app/tags/list
```
```terminaloutput
{"name":"compose-custom-app","tags":["1.0"]}
```

Nella risposta troveremo il nome dell'immagine e il tag pubblicato.

***

Per rendere visibile il passaggio dal registry, rimuoviamo la copia locale dell'immagine appena costruita:

```shell
$ docker image rm localhost:5000/compose-custom-app:1.0
```
```terminaloutput
Untagged: localhost:5000/compose-custom-app:1.0
Deleted: sha256:acfa1929da1c846455f4aa95340e941f7373701f99d10fda7ae39117588e26e9
```

Non abbiamo ancora avviato alcun container dell'applicazione, quindi questa immagine non è utilizzata dal nostro
esempio. Stiamo rimuovendo la copia sul daemon, mentre quella pubblicata nel volume del registry rimane disponibile.

La base Nginx e gli eventuali layer condivisi possono restare nella cache, non dobbiamo eseguire alcun prune.

Con il registry ancora in esecuzione e spostiamoci nella directory `consumer`:

```shell
$ cd consumer
```

Dove troviamo un altro file `compose.yaml`:

```yaml
services:
  app:
    image: localhost:5000/compose-custom-app:1.0
    ports:
      - "8080:80"
```

Il servizio contiene soltanto il riferimento all'immagine e la porta da pubblicare, non troviamo né `build`, né un 
Dockerfile, né una copia della pagina da montare.

Scarichiamo l'immagine con:

```shell
$ docker compose pull app
```
```terminaloutput
[+] pull 12/12
 ✔ Image localhost:5000/compose-custom-app:1.0 Pulled                                                               1.3s
```

Questa volta il daemon la recupera dal nostro registry. Non viene ricostruita e non serve leggere i sorgenti nella
directory precedente, anche se i layer già disponibili possono essere riutilizzati senza scaricarli di nuovo.

Avviamo quindi l'applicazione con:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network consumer_default Created                                                                                 0.0s
 ✔ Container consumer-app-1 Started                                                                                 0.1s
```

Apriamo [http://localhost:8080](http://localhost:8080) nel browser e ritroveremo la nostra pagina personalizzata.

È questo il risultato che volevamo ottenere, l'installazione usa la versione che abbiamo costruito e pubblicato, mentre
chi la avvia deve conoscere soltanto il riferimento all'immagine e la configurazione necessaria per eseguirla.

***

> __keep distribution and execution separate__
>
> - the registry stores images
> - running containers use local images
> - push and publish have different purposes

Dopo aver scaricato l'immagine, il container usa la copia presente sul daemon. Le richieste alla nostra pagina non
passano attraverso il registry, che servirà di nuovo quando dovremo scaricare un'immagine o una versione diversa. Per
questo ha senso gestirlo come servizio di infrastruttura con uno storage persistente e un proprio ciclo di vita.

Se ripetessimo questa installazione su un altro computer, `localhost:5000` indicherebbe quel computer e non il nostro.
Dovremmo quindi sostituirlo con l'indirizzo del registry realmente raggiungibile da quella macchina, predisponendo
anche certificati e accessi. Nel laboratorio siamo rimasti sullo stesso host proprio per concentrarci sul percorso
dell'immagine dalla build al suo utilizzo nella maniera più semplice possibile.

Facciamo infine attenzione ai nomi dei comandi, `docker compose push` pubblica le immagini dei servizi, come abbiamo
appena fatto. Facciamo comunque attenzione al fatto che la pubblicazione non trasforma comunque i dati dei volumi o i
nostri segreti in contenuto da condividere insieme all'applicazione, quello che pubblichiamo è solo l'immagine.

***

Infine, fermiamo e rimuoviamo prima il progetto che esegue l'applicazione:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container consumer-app-1 Removed                                                                                 0.1s
 ✔ Network consumer_default Removed                                                                                 0.1s
```

Poi torniamo nella directory precedente:

```shell
$ cd ..
```

E rimuoviamo anche il progetto del registry:

```shell
$ docker compose down -v
```
```terminaloutput
[+] down 2/2
 ✔ Container registry-registry-1 Removed                                                                            0.1s
 ✔ Volume registry_registry-data Removed                                                                            0.0s
 ✔ Network registry_default      Removed                                                                            0.1s
```

***

> __thank you for watching__
>
> - build your own projects
> - keep experimenting
> - see you next time

Con questo passaggio concludiamo il corso Docker. Siamo partiti dall'avvio di un container e siamo arrivati a costruire,
configurare, distribuire e mantenere applicazioni composte da più servizi. Ora possiamo consegnare un'immagine pronta
e una configurazione con cui eseguirla, sapendo anche come osservare il funzionamento dello stack, aggiornarlo e
recuperarne i dati. Il passo successivo sarà applicare queste conoscenze ai nostri progetti, scegliendo ogni volta
ciò che serve e verificando che il risultato corrisponda a quello che vogliamo ottenere.

Grazie per aver seguito questo percorso insieme a me, buon lavoro con i vostri progetti e ci vediamo al prossimo video!

Ciaooo

***

> Resources
>
> - [Distribution registry](https://distribution.github.io/distribution/about/deploying/)
