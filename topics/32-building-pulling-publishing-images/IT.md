# Building, pulling, and publishing images with Compose

> __building, pulling, and publishing images__
>
> - pull existing images
> - build our own images
> - publish to a registry

In questo capitolo ci concentreremo sulle immagini.

Vedremo come scaricare un'immagine già pronta, come costruirne un'immagine personalizzata e infine come pubblicarla su 
un registry così da renderla accessibile anche da altre macchine.

Abbiamo già avuto modo di vedere i registry nella prima parte di questo corso, Compose non li sostituisce, ci permette
semplicemente di descrivere, accanto a ogni servizio, quale immagine utilizzare oppure come fare a costruirla.

Teniamo a mente tre verbi: **build** costruisce, **pull** scarica, **push** pubblica.

Nessuno dei tre, da solo, aggiorna un container già in esecuzione.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose-image
```

E analizziamo nuovamente il file `compose.yaml`:

```yaml
services:
  web:
    image: nginx:stable-alpine
    ports:
      - "127.0.0.1:8080:80"
```

In questo esempio per il servizio web abbiao scelto una variante rispetto alla solita immagine Nginx di sempre, questa
versione si basa su Alpine Linux, più piccola e con meno librerie, ma soprattuto non presente sul nostro host.

Per effettuare il download dell'immagine usiamo il comando:

```shell
$ docker compose pull
```
```terminaloutput
[+] pull 9/9
 ✔ Image nginx:stable-alpine Pulled                                                                                 4.5s
```

Dopodiché possiamo avviare il servizio con:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network compose-image_default Created                                                                            0.0s
 ✔ Container compose-image-web-1 Started                                                                            0.1s
```

E come abbiamo potuto notare, in questo caso il comando `up` è stato immediato in quanto avevamo già precedentemente
scaricato l'immagine con il comando `pull`.

Como al solito possiamo vedere che il servizio è attivo aprendo il nostro browser all'indirizzo:
[http://localhost:8080](http://localhost:8080).

Come sempre per eliminare lo stack utilizziamo il comando:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-image-web-1 Removed                                                                            0.0s
 ✔ Network compose-image_default Removed                                                                            0.0s
```

***

Ora per vedere come funziona il comando `build` sostituiamo la pagina di benvenuto con una nostra pagina personalizzata.

Copiamo questa directory nella directory `compose-image-build` e creiamo il file `index.html` con questo contenuto:

```shell
$ nano index.html
```
```html
<!doctype html>
<html lang="it">
  <meta charset="utf-8">
  <title>Compose build</title>
  <h1>Welcome from the image!</h1>
</html>
```

Creiamo poi anche un `Dockerfile` con questo contenuto:

```shell
$ nano Dockerfile
```
```dockerfile
FROM nginx:stable-alpine
COPY index.html /usr/share/nginx/html/index.html
```

E infine sostituiamo il contenuto di `compose.yaml` con:

```yaml
services:
  web:
    build: .
    ports:
      - "127.0.0.1:8080:80"
```

In pratica al posto di specificare il nome di un immagine preconfezionata, utilizziamo il comando `build` con il punto
che indica che il contesto di build è la directory relativa al file di Compose. Il builder cercherà qui il `Dockerfile`
e i file da copiare.

Non stiamo effettuando un mount, in questo caso stiamo proprio copianto il file `index.html` dentro all'immagine.

Ora costruiamo l'immagine personalizzata con il comando:

```shell
$ docker compose build
```
```terminaloutput
[+] Building 0.3s (9/9) FINISHED
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 562B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 111B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/nginx:stable-alpine                                              0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [1/2] FROM docker.io/library/nginx:stable-alpine                                                                0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 171B                                                                                   0.0s 
 => [2/2] COPY index.html /usr/share/nginx/html/index.html                                                          0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => writing image sha256:ef085dfbf11f4826156c76a82d0639bca913d02f2a897e45279310b32d14716e                        0.0s 
 => => naming to docker.io/library/compose-image-web                                                                0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] build 1/1
 ✔ Image compose-image-build-web Built\                                                                              0.4s
```

Senza un campo `image`, Compose assegna all'immagine costruita un nome basato su progetto e servizio.

```shell
$ docker image ls
```
```terminaloutput
...
IMAGE                                       ID             DISK USAGE   CONTENT SIZE   EXTRA
compose-image-build-web:latest              ef085dfbf11f       61.8MB             0B
...
```

Avviamo poi nuovamente lo stack con il comando:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network compose-image-build_default Created                                                                      0.0s
 ✔ Container compose-image-build-web-1 Started                                                                      0.1s
```

E riaprendo di nuovo il browser troveremo la pagina personalizzata con il nostro saluto.

***

Ora, a differenza di un volume mount, se cambiassimo il contenuto di `index.html` e ricaricassimo la pagina, non vedremo
nessuna differenza, in quanto il file è stato copiato durante la build proprio dentro all'immagine cosi come era.

Per cui, dopo aver modificato il file, per ricostruire l'immagine e riavviare lo stack in un unico passaggio usiamo:

```shell
$ docker compose up -d --build
```
```terminaloutput
[+] Building 0.2s (9/9) FINISHED
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 562B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 111B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/nginx:stable-alpine                                              0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 179B                                                                                   0.0s 
 => CACHED [1/2] FROM docker.io/library/nginx:stable-alpine                                                         0.0s 
 => [2/2] COPY index.html /usr/share/nginx/html/index.html                                                          0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => writing image sha256:92b22ee4b912c84bf16c2ae3c114c6132acd3f66e79e0242c60e1bc96e58c072                        0.0s 
 => => naming to docker.io/library/compose-image-web                                                                0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] up 2/2
 ✔ Image compose-image-build-web       Built                                                                        0.3s
 ✔ Container compose-image-build-web-1 Started                                                                      0.3s
```

Ed ecco che la pagina si aggiornerà con il nuovo contenuto.

Infine eliminiamo lo stack con il comando:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-image-build-web-1 Removed                                                                      0.0s
 ✔ Network compose-image-build_default Removed                                                                      0.0s
```

***

Se ci servisse più controllo e volessimo utilizzare parametri aggiuntivi, possiamo convertire `build` in una mappa.

Vediamo una piccola variante dello stesso esempio, copiamo questa directory nella directory `compose-image-build-args`
e modifichiamo il `Dockerfile` in questo modo:

```dockerfile
FROM nginx:stable-alpine AS runtime
ARG VERSION=dev
LABEL org.opencontainers.image.version=$VERSION
COPY index.html /usr/share/nginx/html/index.html
```

E poi, al posto del punto, scriviamo questo frammento:

```yaml
build:
  context: .
  dockerfile: Dockerfile
  target: runtime
  args:
    VERSION: "1.0"
```

In questa mappa troviamo, `context` che va a indicare il percorso del contesto di build, sempre relativo al Compose,
`dockerfile` che indica quale ricetta utilizzare, con un percorso relativo al contesto e `target` sceglie quale stage 
nominato utilizzare se presente nel Dockerfile. In questo caso ne abbiamo uno solo, `runtime`, quindi potremmo ometterlo
ma ve l'ho mostrato per completezza perché magari può tornarvi utile nei Dockerfile multi-stage.

Infine `args` fornisce valori alle istruzioni `ARG` del Dockerfile, in questo caso il valore lo andremo poi a salvare in
una label dell'immagine.

Avviamo lo stack con il comando:

```shell
$ docker compose up -d --build
```
```terminaloutput
[+] Building 0.2s (9/9) FINISHED
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 683B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 188B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/nginx:stable-alpine                                              0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 171B                                                                                   0.0s 
 => [1/2] FROM docker.io/library/nginx:stable-alpine                                                                0.0s 
 => CACHED [2/2] COPY index.html /usr/share/nginx/html/index.html                                                   0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => writing image sha256:a5fe1beb61a4070f2797d9c996ee633818af3ad69bc89b37eb571bc0ac5b85eb                        0.0s 
 => => naming to docker.io/library/compose-image-build-args-web                                                     0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] up 3/3
 ✔ Image compose-image-build-args-web       Built                                                                   0.3s
 ✔ Network compose-image-build-args_default Created                                                                 0.0s
 ✔ Container compose-image-build-args-web-1 Started                                                                 0.1s
```

Oltre alla solita pagina web, possiamo verificare che la label sia stata applicata con il comando:

```shell
$ docker image inspect compose-image-build-args-web --format '{{ index .Config.Labels "org.opencontainers.image.version" }}'
```
```terminaloutput
1.0
```

***

Quando ripetendo più volte una build, Docker può riutilizzare i passaggi rimasti uguali utilizzando la sua cache, come
possiamo osservare nel log dell'ultima build che abbiamo eseguito.

Se vogliamo verificare se è presente una versione più recente dell'immagine indicata da `FROM`, possiamo forzarla con:

```shell
$ docker compose build --pull
```

In questo caso vedremo che ci impiegherà qualche secondo in più, perché riscaricherà l'immagine base più recente prima
di eseguire la build.

Se invece vogliamo eseguire nuovamente tutti i passaggi senza riutilizzare la cache della build possiamo usare:

```shell
$ docker compose build --no-cache
```

In questo caso, come vediamo l'immagine base resta in cache, ma tutti i passaggi successivi vengono rieseguiti.

Sono scelte diverse: `--no-cache` da solo non richiede una nuova immagine base. Possiamo eventualmente combinarlo con
`--pull` quando ci servono entrambi.

E non confondiamo `docker compose pull`, che scarica l'immagine del servizio, con `docker compose build --pull`, che
durante la costruzione aggiorna le immagini di base. 

Eliminiamo anche questo stack con il comando:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-image-build-args-web-1 Removed                                                                 0.0s
 ✔ Network compose-image-build-args_default Removed                                                                 0.0s
```

***

Quanto visto finora, funziona sulla nostra macchina, ma se volessimo rendere disponibile la nostra immagine ad altre
persone, dovremmo pubblicarla su un registro.

Questo passaggio è ovviamente facoltativo e richiede un account e un repository su cui abbiamo il permesso di scrivere,
in questo esempio io utilizzerò il classico **Docker Hub** che abbiamo già visto nella prima parte di questo corso.

Copiamo questa directory nella directory `compose-image-build-push` e modifichiamo il `compose.yaml` aggiungendo prima
della sezione build:

```yaml
image: zavy86/compose-web:latest
pull_policy: build
```

Ovviamente voi sostituite `zavy86` con il vostro username del Docker Hub.

Poi con il comando:

```shell
$ docker login
```
```terminaloutput
USING WEB-BASED LOGIN
Your one-time device confirmation code is: XXXX-YYYY
Press ENTER to open your browser or submit your device code here: https://login.docker.com/activate

Waiting for authentication in the browser…
Login Succeeded
```

Effettuiamo la login, dopodiché procediamo con il ricostruire l'immagine con:

```shell
$ docker compose build web
```
```terminaloutput
[+] Building 0.2s (9/9) FINISHED
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 676B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 188B                                                                                0.0s 
 => [internal] load metadata for docker.io/library/nginx:stable-alpine                                              0.0s 
 => [internal] load .dockerignore                                                                                   0.0s 
 => => transferring context: 2B                                                                                     0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 32B                                                                                    0.0s 
 => [1/2] FROM docker.io/library/nginx:stable-alpine                                                                0.0s 
 => CACHED [2/2] COPY index.html /usr/share/nginx/html/index.html                                                   0.0s 
 => exporting to image                                                                                              0.0s 
 => => exporting layers                                                                                             0.0s 
 => => writing image sha256:7764a633ada7d6ffa8550bed0d293c2d10a5c197d7082887f27b639feed4142f                        0.0s 
 => => naming to docker.io/zavy86/compose-web:latest                                                                0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] build 1/1
 ✔ Image zavy86/compose-web:latest Built                                                                            0.2s
```

Come possiamo notare ora l'immagine ha un nome completo che include il namespace del nostro account Docker Hub e non più
il nome composto in automatico con il nome del progetto e quello del servizio.

Procediamo quindi con la pubblicazione dell'immagine con il comando:

```shell
$ docker compose push web
```
```terminaloutput
[+] push 2/10
 ✔ zavy86/compose-web:latest Pushed                                                                                 7.6s
```

A questo punto se volessimo poi riutilizzare l'immagine su un altro host o in un nuovo stack ci basterà specificare solo
il nome dell'immagine e non più la sezione `build` né la `pull_policy`:

```yaml
services:
  web:
    image: zavy86/compose-web:latest
    ports:
      - "8080:80"
```

Se infatti rilanciamo lo stack vedremo che tutto continua a funzionare correttamente:

```shell
$ docker compose up -d
```
``` terminaloutput
[+] up 2/2
 ✔ Network compose-image-build-push_default Created                                                                 0.0s
 ✔ Container compose-image-build-push-web-1 Started                                                                 0.1s
```

Ed eliminiamo lo stack con il comando:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-image-build-push-web-1 Removed                                                                 0.0s
 ✔ Network compose-image-build-push_default Removed                                                                 0.0s
```

***

Un'ultima cosa alla quale dobbiamo prestare attenzione, è che il computer su cui costruiamo l'immagine e quello su cui 
la andremo a eseguire potrebbero avere architetture diverse.

Una build locale su AMD64 non garantisce un'immagine eseguibile nativamente su un server ARM.

Se è diponibile un'immagine multi-piattaforma Docker seleziona normalmente la variante adatta all'host, oppure possiamo
specificare ad esempio `platform: linux/amd64`, per richiederne una specifica.

Se vogliamo distribuire la nostra immagine per entrambe le architetture, ripristiniamo la mappa `build` ed aggiungiamoci
l'opzione:

```yaml
platforms:
  - linux/amd64
  - linux/arm64
```

Rilanciamo quindi la build con:

```shell
$ docker compose build --builder multiarch --push web
```
```terminaloutput
[+] Building 19.0s (14/14) FINISHED                                                                                                                                     
 => [internal] load local bake definitions                                                                          0.0s
 => => reading from stdin 760B                                                                                      0.0s
 => [internal] load build definition from Dockerfile                                                                0.0s 
 => => transferring dockerfile: 188B                                                                                0.0s 
 => [linux/amd64 internal] load metadata for docker.io/library/nginx:stable-alpine                                  2.8s 
 => [linux/arm64 internal] load metadata for docker.io/library/nginx:stable-alpine                                  1.8s
 => [auth] library/nginx:pull token for registry-1.docker.io                                                        0.0s
 => [internal] load .dockerignore                                                                                   0.0s
 => => transferring context: 2B                                                                                     0.0s 
 => [internal] load build context                                                                                   0.0s 
 => => transferring context: 171B                                                                                   0.0s 
 => [linux/amd64 1/2] FROM docker.io/library/nginx:stable-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e8     4.6s 
 => => resolve docker.io/library/nginx:stable-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed4307154     0.0s 
 => => sha256:b27cf3f7c39dd0da0aa52a285f0c0cce938ac61472babfea353b1daa83586c49 20.34MB / 20.34MB                    3.4s
 => => sha256:b335b7ac3a400afa780d0d89e0b778ee19dc3e3df95bed4b274a763af2264fd7 1.40kB / 1.40kB                      0.9s 
 => => sha256:703c5424632fab32aa3327bebe6e5202ac53a93740062efb830f8188e580b9db 1.21kB / 1.21kB                      0.2s 
 => => sha256:6b4dfb2e8f8a72d7ae1380b667f50faccdc19147869b2afa09aeddfdea59ce64 403B / 403B                          0.8s 
 => => sha256:22e5a8a110ec69c6af30325ccfe8bb0bfb94e5783117808061bae5115e1e3dcb 963B / 963B                          0.5s 
 => => sha256:3d85d110b167fae23d8eb3a7060cd079682b682b04d295fc7bbdf454c9e722c8 626B / 626B                          0.1s 
 => => sha256:e3320d02d5786716dcc40d9f6267baec5d3d2c46945082958050c3ac5ea23751 1.88MB / 1.88MB                      0.6s 
 => => sha256:e2de96513ba9eb53b431787ec8a65cdde380ac4772a3e4c4b714dcfde2a102b5 3.85MB / 3.85MB                      1.3s 
 => => extracting sha256:e2de96513ba9eb53b431787ec8a65cdde380ac4772a3e4c4b714dcfde2a102b5                           0.1s 
 => => extracting sha256:e3320d02d5786716dcc40d9f6267baec5d3d2c46945082958050c3ac5ea23751                           0.1s 
 => => extracting sha256:3d85d110b167fae23d8eb3a7060cd079682b682b04d295fc7bbdf454c9e722c8                           0.0s 
 => => extracting sha256:22e5a8a110ec69c6af30325ccfe8bb0bfb94e5783117808061bae5115e1e3dcb                           0.0s 
 => => extracting sha256:6b4dfb2e8f8a72d7ae1380b667f50faccdc19147869b2afa09aeddfdea59ce64                           0.0s 
 => => extracting sha256:703c5424632fab32aa3327bebe6e5202ac53a93740062efb830f8188e580b9db                           0.0s 
 => => extracting sha256:b335b7ac3a400afa780d0d89e0b778ee19dc3e3df95bed4b274a763af2264fd7                           0.0s 
 => => extracting sha256:b27cf3f7c39dd0da0aa52a285f0c0cce938ac61472babfea353b1daa83586c49                           0.2s 
 => [linux/arm64 1/2] FROM docker.io/library/nginx:stable-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e8     3.1s 
 => => resolve docker.io/library/nginx:stable-alpine@sha256:0985e772fb9f729e6fa0980da05fca5d9c468e870eed4307154     0.0s 
 => => sha256:e5cd9cbe35d334211e0dbba7a16b55a0e0cd9575b5393fdcd5302176a0fec16d 1.40kB / 1.40kB                      0.1s 
 => => sha256:de314aae67cdc0a41219ddace8b5a494f3112e8281a485494f265cf9e67f71b6 19.87MB / 19.87MB                    1.5s 
 => => sha256:5ba2889293520adc2c5eec4ddf3c93559a5a800b893407d1f2b7cd351baf70a5 1.21kB / 1.21kB                      0.3s 
 => => sha256:28a16c1011b2ed831d1f9d44e11c5b22e165d09e4719e1b609d875fdb3c91171 402B / 402B                          0.3s 
 => => sha256:5e7de8c59e40521648a206e684d8f7a81bb88132ac05285a9c0ec0d430d40cbf 963B / 963B                          0.3s 
 => => sha256:a8783588284d97127365463f7fa1bf9afddf0ba38cfc8bb0a993643b09b7d493 1.90MB / 1.90MB                      1.5s 
 => => sha256:08c08ab5f9f755ce5a830d30a27f33a9dfdd795223e50b600fd8fe983cf759d8 626B / 626B                          0.2s 
 => => sha256:a9986cd6f37dbddae7862a6d4be71683472e7c2ea708e87db14f8a6393c00f00 4.19MB / 4.19MB                      2.2s 
 => => extracting sha256:a9986cd6f37dbddae7862a6d4be71683472e7c2ea708e87db14f8a6393c00f00                           0.1s 
 => => extracting sha256:a8783588284d97127365463f7fa1bf9afddf0ba38cfc8bb0a993643b09b7d493                           0.1s 
 => => extracting sha256:08c08ab5f9f755ce5a830d30a27f33a9dfdd795223e50b600fd8fe983cf759d8                           0.0s 
 => => extracting sha256:5e7de8c59e40521648a206e684d8f7a81bb88132ac05285a9c0ec0d430d40cbf                           0.0s 
 => => extracting sha256:28a16c1011b2ed831d1f9d44e11c5b22e165d09e4719e1b609d875fdb3c91171                           0.0s 
 => => extracting sha256:5ba2889293520adc2c5eec4ddf3c93559a5a800b893407d1f2b7cd351baf70a5                           0.0s 
 => => extracting sha256:e5cd9cbe35d334211e0dbba7a16b55a0e0cd9575b5393fdcd5302176a0fec16d                           0.0s 
 => => extracting sha256:de314aae67cdc0a41219ddace8b5a494f3112e8281a485494f265cf9e67f71b6                           0.2s 
 => [linux/arm64 2/2] COPY index.html /usr/share/nginx/html/index.html                                              0.1s 
 => [linux/amd64 2/2] COPY index.html /usr/share/nginx/html/index.html                                              0.1s 
 => exporting to image                                                                                             11.2s 
 => => exporting layers                                                                                             0.0s 
 => => exporting manifest sha256:45eddf1a6944226f6a2337aa9098bef37fdee1f45d7c1f6baf598b79cfbc60b9                   0.0s 
 => => exporting config sha256:93d0dba8bf39c8ae4bd02bbaeb6c628c8a9ee26952e21e17ab8d8ad274523972                     0.0s 
 => => exporting attestation manifest sha256:7034432082dbc6aca7ca35645ff1595ab6495008bc43b5e851472f2e38465074       0.0s 
 => => exporting manifest sha256:2f7ece5601da9d3cebb619803b1127022f162d08d50b7e40adaa08496e232fa0                   0.0s 
 => => exporting config sha256:d603bbbf4991f43b7c32f28e0705b049efeb4896c2973cf92c9a4f38242c1342                     0.0s 
 => => exporting attestation manifest sha256:2261fb7106c0273ef8ebd46879ecd8f906d4537795865ea9e4122a51f8be9152       0.0s 
 => => exporting manifest list sha256:2a86cbbe1a625c8e6248c5080ceb732bfde23df5779f62427e370d237cee01cd              0.0s 
 => => pushing layers                                                                                               6.9s 
 => => pushing manifest for docker.io/zavy86/compose-web:latest@sha256:2a86cbbe1a625c8e6248c5080ceb732bfde23df5     4.2s 
 => [auth] zavy86/compose-web:pull,push token for registry-1.docker.io                                              0.0s 
 => resolving provenance for metadata file                                                                          0.0s 
[+] build 1/1                                                                                                            
 ✔ Image zavy86/compose-web:latest Built                                                                           19.1s
```

Ovviamente come vedete in questo caso ci metterà molto più tempo, in quanto il builder deve costruire due immagini e poi
deve inviarle entrambe al Docker Hub.

Se questo passaggio dovesse darvi un errore, probabilmente non avete ancora configurato il builder con il supporto a più 
architetture, installatelo con il comando:

```shell
$ docker buildx create --name multiarch --driver docker-container --use
```

E rilanciate nuovamente il comando di build.

***

> Resources:
>
> - [Compose builds](https://docs.docker.com/reference/compose-file/build/)
