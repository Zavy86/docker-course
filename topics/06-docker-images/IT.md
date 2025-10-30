# Understanding Docker images

> __understanding docker images__
>
> - files
> - metadata
> - layers 

Un immagine Docker è composta da **files** e da **metadata**: i file sono ciò che costituisce il filesystem del nostro
container, mentre i metadati sono tutta una serie di informazioni a corredo dell'immagine, come una sua descrizione, il
nome dell'autore, le variabili di ambiente da impostare, i comandi da eseguire all'avvio, ecc...

Le immagini Docker sono composte da **layers**, una serie di stratificazioni impilate una sopra l'altra, in cui ognuna
delle quali può apportare modifiche ai metadati o al filesystem: tramite l'aggiunta, la modifica o la rimozione di file.

Diverse immagini possono condividere uno o più layers fra di loro in modo da ottimizzare lo spazio occupato su disco, i 
tempi di trasferimento tramite rete e il consumo di memoria.

***

> __understanding docker images__
>```
> alpine
> └ node.js
>   └ dependencies
>     └ code and assets
>       └ configurations
>         └ (read-write layer)
>```

Questo potrebbe essere un esempio di immagine Docker che contiene un'applicazione Node, si potrebbe ad esempio partire
dall'immagine base di Alpine, che contiene solamente una versione lite di Linux, procedere poi con l'installazione Node,
installare poi tutte le varie dipendenze necessarie, copiare il codice e gli asset dell'applicazione e infine impostare 
i vari parametri di configurazione.

Il risultato è un immagine completa e funzionante della nostra applicazione Node che potrà essere eseguita in container.

Tutti i layer della nostra immagine sono bloccati, in modalità read-only, una volta che avvieremo un container da questa
immagine, Docker creerà un ulteriore layer in cima a tutti gli altri in modalità read-write, che conterrà tutte le
modifiche che verranno apportate al filesystem del container durante la sua esecuzione.

***

> __understanding docker images__
> 
> - read-only shared
> - read-write copy
> - copy-on-write

Quando avviamo un nuovo container, se disponiamo già dell'immagine, vedremo che sarà immediatamente disponibile. Questo
succede perche a tutti gli effetti non viene creata una copia dell'intero filesystem dell'immagine, ma viene solamente
creato un nuovo layer vuoto in cui iniziare a salvare solamente le modifiche rispetto all'immagine.

Questo significa che dalla stessa immagine potremo avviare più container, ognuno dei quali condividerà tutti i layers in
modalità read-only, ma avrà un proprio personale layer in modalità read-write.

Per fare un'analogia con la programmazione orientata agli oggetti, possiamo pensare alle **images** come al concetto di
**classes**, ai **layer** come al concetto di **inheritance** e ai **containers** come a delle **instances**.

***

> __understanding docker images__
>
> - chicken and egg
> - scratch image
> - commit
> - build

Come abbiamo visto precedentemente, le immagini Docker sono solamente read-only, come facciamo quindi a crearne una?

L'unico modo per creare un'immagine è quello di "congelare" lo stato di un container, ma l'unico modo per avviare un
container è a partire da un'immagine... Sembra un po' come il classico dilemma: _È nato prima l'uovo o la gallina?_

La risposta in questo caso è un po' più semplice e meno paradossale, esiste un'immagine speciale chiamata `scratch`, che
ci permette per l'appunto di creare un container da zero, ma dubito che avrete mai bisogno di farlo.

In ogni caso, una volta avviato un container e apportate le dovute modifiche, possiamo congelarne lo stato in un nuovo
layer tramite il comando `docker commit` che creerà un'immagine che è la copia effettiva del container in esecuzione.

Oppure utilizzare il metodo più comune, che è quello che vi ritroverete sicuramente a utilizzare quotidianamente, che
consiste nell'utilizzare il comando `docker build`, per compilare un'immagine a partire da un **Dockerfile**.

Nei prossimi capitoli vedremo come utilizzare questi due metodi per creare le nostre prime immagini Docker.

***

> __understanding docker images__
>
> - official images
> - community images
> - self-hosted images

Le immagini Docker possono essere suddivise in tre grandi categorie, anche dette namespaces: quelle ufficiali, quelle
create dalla community e quelle ospitate da terze parti rispetto al Docker Hub.

Le immagini ufficiali (ovvero quelle che si trovano nel **root namespace** come `busybox`, `alpine`, `ubuntu`, ecc...)
sono garantite da Docker e sono solitamente create e mantenute dal team di Docker o da terze parti verificate.
Includono specialmente piccole utilities, distribuzioni base di sistemi operativi e componenti e servizi pronti all'uso
come ad esempio database e web applications famose...

Le immagini create dalla community sono distribuite nel namespace degli utenti o delle organizzazioni sul registro di
Docker (come ad esempio `zavy86/clock`) dove il primo segmento rappresenta il nome dell'utente o dell'organizzazione, 
mentre il secondo rappresenta il nome dell'immagine stessa.

La terza possibilità invece è prevista per quelle immagini che non si trovano sul registro di Docker ma che sono invece
ospitate su un server privato o pubblico di terze parti. In questo caso, l'immagine dovrà contenere anche l'url (oppure
l'indirizzo ip e l'eventuale porta) del registro al quale fa riferimento. Un esempio potrebbe essere l'immagine [Actions
Runner](https://ghcr.io/actions/actions-runner) che si trova sul registro pubblico di Google.

***

In ogni caso, un'immagine Docker può stare solamente in due luoghi, o all'interno di un **registry** o all'interno di un
**host** sul quale è presente l'engine di Docker.

Tramite il client di Docker, possiamo chiedere al server di interfacciarsi a un registry (ufficiale o self-hosted) per 
cercare, scaricare o caricare le immagini che ci interessano.

Guardiamo ora quali immagini sono presenti all'interno della nostra macchina:

```shell
$ docker image ls
```

Riceveremo in output un elenco di tutte le immagini che possediamo:

```terminaloutput
REPOSITORY     TAG        IMAGE ID       CREATED      SIZE
alpine         latest     02f8efbefad6   1 hour ago   8.51MB
busybox        latest     e8291c1a323a   1 hour ago   4.17MB
zavy86/clock   latest     ed98027af201   1 hour ago   4.17MB
```

Possiamo vedere il nome dell'immagine, il tag, l'identificativo univoco, la data di creazione e la dimensione su disco.

Se vogliamo cercare una nuova immagine sul registro ufficiale di Docker, possiamo utilizzare il comando:

```shell
$ docker search wordpress
```

Cercando Wordpress otterremo un sacco di immagini, la cosa più importante che dobbiamo guardare è la colonna OFFICIAL.
Se è presente un'immagine ufficiale, dovremo sempre preferire quella, a meno di non avere un motivo particolare.
Un'altra indicazione della popolarità di un'immagine è il numero di stelle (STARS) che ha ricevuto dalla community.

In questo caso possiamo ad esempio vedere due immagini una ufficiale e una della community, e la differenza è palese:

```terminaloutput
NAME                DESCRIPTION                                     STARS   OFFICIAL
wordpress           The WordPress rich content management system…   5819    [OK]
bitnami/wordpress   Bitnami container image for WordPress           274
[...]
```

Una volta identificato il nome dell'immagine che ci interessa, possiamo scaricarla tramite il comando:

```shell
$ docker pull wordpress
```

Dopo un breve periodo di esecuzione, in base alla velocità della connessione, riceveremo un output simile a questo:

```terminaloutput
Using default tag: latest
latest: Pulling from library/wordpress
[...]
3c5574f7ca95: Pull complete 
f0b9fe21862b: Pull complete 
d033883923aa: Pull complete 
Digest: sha256:c5f075fe71c9120e769edbf761bcf20bf0b73d72d49dfde042a06aafcdfef08d
Status: Downloaded newer image for wordpress:latest
docker.io/library/wordpress:latest
```

Che ci indicherà che l'immagine è stata scaricata correttamente. Come abbiamo già visto nei capitoli precedente, qualora
provassimo ad avviare un container con un immagine non presente sulla nostra macchina, Docker provvederà in automatico a
scaricarla prima di avviarla realmente.

Quando scarichiamo un'immagine possiamo anche specificarne la versione tramite il tag, se non indichiamo nulla, Docker
utilizzerà di default il tag `latest` che dovrebbe rappresentare l'ultima versione stabile disponibile.

***

> __understanding docker images__
>
> - latest
>   - testing
>   - prototyping
>   - newest
> - specific
>   - production
>   - repeatability
>   - stability

Come abbiamo appena visto, il tag di default è `latest`, ma cosa significa esattamente e quando dovremmo usarlo?

Se stiamo effettuando dei test, stiamo sperimentando o vogliamo provare l'ultima versione di un immagine allora possiamo
spingerci senza remore a utilizzare il tag `latest`.

Tuttavia se stiamo mettendo un servizio in produzione, vogliamo rendere le nostre procedure e script riproducibili e
vogliamo garantire un minimo di stabilità sarebbe sempre opportuno utilizzare un tag specifico.

Un po' come già facciamo quotidianamente con le dipendenze all'interno dei nostri progetti.

Alcune immagini, fortunatamente sempre di più ultimamente, supportano varie architetture nativamente. Quindi la stessa 
immagine la potremo utilizzare su un computer x86, su un computer ARM, su un Raspberry Pi, ecc... Altre immagini invece
si differenziano tramite tag, dove ogni architettura ha un proprio tag. Altre ancora sono disponibili solo per alcune
specifiche piattaforme e quindi potremo usarle solo su macchine compatibili o ricorrendo all'emulazione.

***

[Prosegui](../07-interactive-images/IT.md) al prossimo capitolo.
