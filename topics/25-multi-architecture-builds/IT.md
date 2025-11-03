# Multi-architecture builds

> __multi-arch builds__
>
> - legacy
> - buildkit
> - multi-arch

Nell'ormai lontano 2017 Docker ha annunciato un nuovo builder chiamato `buildkit`, reso poi disponibile a partire dalla 
versione 18.09 e impostato come default in Docker Desktop nel 2021.

Questo nuovo builder ha introdotto tutta una serie di miglioramenti, fra cui un notevole miglioramento delle performance
e il supporto alla costruzione di immagini multi piattaforma. Garantendo al tempo stesso una compatibilità completa con 
qualunque Dockerfile esistente.

Il miglioramento delle performance è stato possibile grazie all'introduzione di un nuovo meccanismo di caching, che 
consente di evitare di ricompilare le immagini che non sono state modificate e l'esecuzione parallela.

Il builder classico eseguiva tutte le operazioni in maniera lineare, copiava l'intero contesto di build, eseguiva i vari
comandi `RUN` ed effettuava il commit per ogni operazione descritta all'interno del Dockerfile.

Il nuovo builder invece, effettua la copia dei soli file modificati rispetto al precedente contesto di build, elabora un
grafo delle dipendenze tra i vari comandi `RUN` che trova all'interno del Dockerfile, verifica se esistono già eventuali
layer nella cache, ricompila solamente quelli che risultano invalidati e dove possibile li esegue in parallelo.

***

Come dicevamo se stiamo usando Docker Desktop ci ritroveremo già a disposizione e abilitato il nuovo builder.
Se invece siamo, come in questo caso, su un host Linux, dovremo prima di tutto abilitarlo con questi due comandi:

```shell
$ docker buildx create --use
$ docker buildx inspect --bootstrap
```

Ora possiamo procedere con la costruzione delle immagini multi piattaforma.

---

Solitamente le build multi piattaforma vengono eseguite in un contesto di deploy verso un registro, perché non avrebbe
molto senso eseguirla su una macchina che per sua natura ha una singola architettura.

Andiamo quindi a vedere come effettuare in un singolo comando una build multi piattaforma, taggandola ed effettuando il 
push verso il registro Docker Hub.

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

E spostiamoci nella directory:

```shell
$ cd docker-course/source/clock
```

Ed effettuiamo la build multi piattaforma con il comando:

```shell
$ docker buildx build --platform linux/amd64,linux/arm64 --tag zavy86/clock --push .
```

Avendo cura di sostituire `zavy86` con il vostro username.

```terminaloutput
[+] Building 7.6s (9/9) FINISHED                                                                                                             docker-container:serene_blackburn
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 109B                                                                                                                                      0.0s 
 => [linux/arm64 internal] load metadata for docker.io/library/busybox:1                                                                                                  0.3s 
 => [linux/amd64 internal] load metadata for docker.io/library/busybox:1                                                                                                  0.3s
 => [internal] load .dockerignore                                                                                                                                         0.0s
 => => transferring context: 2B                                                                                                                                           0.0s 
 => CACHED [linux/arm64 1/1] FROM docker.io/library/busybox:1@sha256:d82f458899c9696cb26a7c02d5568f81c8c8223f8661bb2a7988b269c8b9051e                                     0.0s 
 => => resolve docker.io/library/busybox:1@sha256:d82f458899c9696cb26a7c02d5568f81c8c8223f8661bb2a7988b269c8b9051e                                                        0.0s 
 => CACHED [linux/amd64 1/1] FROM docker.io/library/busybox:1@sha256:d82f458899c9696cb26a7c02d5568f81c8c8223f8661bb2a7988b269c8b9051e                                     0.0s 
 => => resolve docker.io/library/busybox:1@sha256:d82f458899c9696cb26a7c02d5568f81c8c8223f8661bb2a7988b269c8b9051e                                                        0.0s 
 => exporting to image                                                                                                                                                    7.2s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => exporting manifest sha256:a910fac5a49b339df63b77e5158cc7f79ba6f504d09f060f958853c4077cae98                                                                         0.0s 
 => => exporting config sha256:44f02f010b3da74ebff1a90b59ebb86037849279997b7020f4726e7a4ca4005b                                                                           0.0s 
 => => exporting attestation manifest sha256:0715c78aef922bbf2779457ad36f2100a607a18ff9abda5e1715762bd86293e1                                                             0.0s 
 => => exporting manifest sha256:46d2691567eb72d64b0c6b2849b3da995dd50096470abe8a1b867e02a79c1472                                                                         0.0s 
 => => exporting config sha256:f58187802becae2e6b21ee8ae48980e84797d6dcbe9d5794edc2929213935f78                                                                           0.0s 
 => => exporting attestation manifest sha256:7d625c35a7a1dd4855726198d2b33c9a0912bb951cb4536c15f1943c2d298134                                                             0.0s 
 => => exporting manifest list sha256:2b57d212aa537fa532872099f686dce49fc8852627f5858e74d5c4c4e0b31271                                                                    0.0s 
 => => pushing layers                                                                                                                                                     2.8s 
 => => pushing manifest for docker.io/zavy86/clock:latest@sha256:2b57d212aa537fa532872099f686dce49fc8852627f5858e74d5c4c4e0b31271                                         4.3s 
 => [auth] zavy86/clock:pull,push token for registry-1.docker.io                                                                                                          0.0s 
 => [auth] library/busybox:pull zavy86/clock:pull,push token for registry-1.docker.io                                                                                     0.0s
```

E andiamo poi ad accertarci che il tutto sia stato eseguito correttamente eseguendo il comando:

```shell
$ docker manifest inspect zavy86/clock
```

Dove potremo notare nella sezione `manifests` che sono state create diverse immagini, una per ogni piattaforma:

```terminaloutput
{
   "schemaVersion": 2,
   "mediaType": "application/vnd.oci.image.index.v1+json",
   "manifests": [
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 480,
         "digest": "sha256:a910fac5a49b339df63b77e5158cc7f79ba6f504d09f060f958853c4077cae98",
         "platform": {
            "architecture": "amd64",
            "os": "linux"
         }
      },
      {
         "mediaType": "application/vnd.oci.image.manifest.v1+json",
         "size": 480,
         "digest": "sha256:46d2691567eb72d64b0c6b2849b3da995dd50096470abe8a1b867e02a79c1472",
         "platform": {
            "architecture": "arm64",
            "os": "linux"
         }
      },
      [...]
   ]
}
```

La stessa cosa la possiamo vedere anche all'interno del [Docker Hub](https://hub.docker.com/r/zavy86/clock/tags) andando
nella sezione `Tags` dell'immagine che vogliamo visualizzare.

---

A differenza di quanto avviene quanto usiamo il comando `docker build` per costruire immagini singole, il comando 
`docker buildx build` non ci rende immediatamente disponibile l'immagine sul nostro host. Questo perché come dicevamo
il nostro host ha una singola architettura e per eseguire un'immagine è necessario che questa sia esattamente la stessa
dell'architettura del nostro host. Per cui la prassi comune è effettuare il push dell'immagine multi piattaforma sul 
registro e poi effettuare il pull della versione dell'immagine relativa alla nostra architettura.

Qualora si ometta l'opzione `--push` non solo l'immagine non verrà inviata al registro ma non verrà nemmeno salvata nel
nostro computer, resterà disponibile solamente all'interno della cache. Se volessimo forzare il salvataggio in locale
dell'immagine, ai fini di puro debug, dovremo sostituire l'opzione `--push` con l'opzione `--output` in questo modo:

```shell
$ docker buildx build --platform linux/amd64,linux/arm64 --tag zavy86/clock --output type=oci,dest=clock.oci .
```

A questo punto ci ritroveremo nella cartella corrente un nuovo file `clock.oci` che rappresenta appunto l'immagine multi 
piattaforma che potremo poi inviare manualmente a un registro, ma che non sarà comunque eseguibile sul nostro host per i 
motivi descritti precedentemente.

***

> __multi-arch builds__
>
> - qemu
> - native
> - dependencies

Un aspetto fondamentale da tenere in considerazione nelle build multi piattaforma è che quando la piattaforma di 
destinazione non coincide con quella della macchina host, Docker utilizzerà `Quick Emulator` per emulare l'architettura 
target. Questo significa che, ad esempio, su un computer x86_64 è possibile costruire immagini per ARM64, tuttavia la
compilazione e l'esecuzione dei passaggi nel Dockerfile saranno emulate tramite software.

L'emulazione permette una straordinaria flessibilità ma introduce inevitabilmente un overhead in termini di performance:
le build multi piattaforma che sfruttano `QEMU` risultano quindi sensibilmente più lente rispetto a quelle native.

Inoltre, sebbene `QEMU` sia molto maturo, l'emulazione di alcune istruzioni particolarmente specifiche o avanzate 
potrebbe non essere perfetta, portando a comportamenti leggermente diversi rispetto all'hardware reale.

Un ulteriore aspetto critico riguarda le dipendenze native, ossia tutti quei pacchetti o librerie che vengono compilati
e installati all'interno dell'immagine. Alcune potrebbero presentare differenze di comportamento, di prestazioni, o 
addirittura errori di compilazione tra architetture diverse, specialmente quando si usano pacchetti binari precompilati
o librerie che fanno uso di ottimizzazioni specifiche per una certa CPU.

Per questo motivo, è buona pratica testare sempre le immagini risultanti su ogni architettura che si intende supportare,
magari sfruttando ambienti di test automatizzati o dispositivi reali, così da individuare tempestivamente eventuali
incompatibilità o regressioni che l'emulazione con `QEMU` potrebbe non far emergere in fase di build.

***

> Resources:
> - [clock](../../sources/clock)
> - [zavy86/clock](https://hub.docker.com/r/zavy86/clock)

[Prosegui](../26-common-settings/IT.md) al prossimo capitolo.
