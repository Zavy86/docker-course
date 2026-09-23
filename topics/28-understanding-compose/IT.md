# Understanding Docker Compose

> __understanding docker compose__
>
> - application stack
> - declarative configuration
> - repeatability

Nei capitoli precedenti abbiamo imparato a costruire immagini, avviare container, collegarli in rete e conservare i dati
nei volumi. Ma quando un'applicazione è composta da più pezzi dobbiamo anche ricordarci come metterli insieme.

Immaginiamo un'applicazione web con il suo database: quali immagini useremo? Dove salveremo i dati? E come potremmo fare
in modo di ripetere la stessa configurazione su un'altra macchina qualora dovessimo migrare il tutto?

**Docker Compose** ci permette di raccogliere queste informazioni in un file e di gestire insieme tutti i componenti
della nostra applicazione, quello che in gergo tecnico viene chiamato **stack**.

Abbiamo già incontrato Docker Compose nel [capitolo 20](../20-compose-development-stack/IT.md) per avviare un ambiente
di sviluppo locale ma non eravamo entrati troppo nei dettagli.

Da qui inizieremo a conoscerlo meglio e a capire come ragiona, mentre per quanto riguarda la sintassi vera e propria la
vedremo con calma nei prossimi capitoli.

***

> __understanding docker compose__
>
> - desired configuration
> - existing resources
> - create and update

Quando utilizziamo `docker run` dobbiamo passare al comando _inline_ tutte le istruzioni per avviare un container.

Con Compose invece, andremo semplicemente a scrivere in un file il risultato che vogliamo ottenere, come ad esempio un
server web, raggiungibile su una certa porta.

Questo è il significato di **configurazione dichiarativa**: descriviamo cosa ci serve e Compose si occuperà di creare le
risorse necessarie tramite l'Engine.

Risorse come i container, le reti e i volumi che sono gli stessi che abbiamo già imparato a conoscere nei capitoli
precedenti, nulla di nuovo.

Ma salvare il file, da solo, ovviamente non avvia e non modifica nulla. Serve eseguire un sistema che vada ad applicare
la configurazione desiderata, confrontandola con le risorse già presenti.

Questo sistema è Docker Compose, crea ciò che manca, aggiorna ciò che è cambiato e lascia intatte le risorse corrette.

Ma una cosa importante da sapere è che Compose non sorveglia autonomamente il file per applicare ogni cambiamento in
automatico, siamo noi a dovergli chiedere di farlo volta per volta in base alle necessità.

***

> __understanding docker compose__
>
> - file
> - services
> - images
> - containers

Il nome che useremo per il nostro file è `compose.yaml`. Si tratta di un normale file di testo scritto con la sintassi
YAML, un formato che permette di organizzare le impostazioni in modo ordinato e facilmente leggibile.

Il nome del file non è vincolante, ci sono anche altri nomi di default possibili, come ad esempio `docker-compose.yaml`
o le varianti con estensione abbreviata in `.yml`. O potremmo anche usare un nome completamente diverso, ma in quel caso
saremo obbligati a specificarlo ogni volta con l'opzione `-f` del comando `docker compose`.

Ma vediamo subito un piccolissimo esempio:

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

Non serve ancora conoscere tutte le regole, qui stiamo semplicemente dicendo che vogliamo un servizio chiamato `web`,
basato sull'immagine `nginx`, con la porta `80` del container raggiungibile sulla porta `8080` della macchina host.

**Nginx** come già avrete avuto modo di scoprire è un server web già pronto all'uso e l'immagine contiene tutto ciò che
serve per mostrarci una pagina di benvenuto.

***

> __understanding docker compose__
>
> - services
> - networks
> - volumes
> - configs
> - secrets

Oltre ai servizi possiamo anche descrivere tutto ciò di cui essi potranno aver bisogno aggiungendo al nostro stack tutti
i componenti che vogliamo. Le sezioni principali sono:

Le **reti** (`networks`) che permettono ai container di comunicare. Ma per iniziare non dobbiamo neppure definirne una,
infatti Compose crea autonomanente una rete predefinita per ogni progetto e vi collega in automatico tutti i servizi.

I **volumi** (`volumes`) dove andare a conservare i dati indipendentemente dal container. Pensiamo ad esempio ad un
database, possiamo sostituire il container mantenendo i dati nel volume che gli abbiamo assegnato, come visto nel
[capitolo sui volumi](../18-understanding-volumes/IT.md).

Le **configurazioni** (`configs`) che permettono di fornire ai servizi dei parametri variabili senza scriverli fissi
nell'immagine. Per esempio, possiamo consegnare al server web un file con le impostazioni del sito da servire.

E i **segreti** (`secrets`) all'interno dei quali salvare le informazioni sensibili. Tornando al database dell'esempio
precedente potremo fornire al servizio un segreto con la password per l'utente amministratore, senza scriverla nel file.

Ovviamente non dobbiamo riempire ogni volta tutte queste sezioni per poter usare Docker Compose! Aggiungeremo le risorse
quando serviranno mano a mano e le assegneremo ai servizi che ne avranno bisogno.

***

> __understanding docker compose__
>
> - frontend and backend
> - database and cache
> - workers and broker
> - object storage

Ma quali componenti possiamo mettere insieme? Pensiamo per esempio a un sito dove gli utenti caricano delle fotografie.

Il **frontend** fornirà l'interfaccia che l'utente vedrà nel browser. Il **backend** fornirà le _API_ che riceveranno
le richieste ed eseguiranno le operazioni applicative, come salvare la nuova fotografia in un _volume_ e i suoi metadati
in un **database** dove verranno conservate informazioni come utenti, titoli e descrizioni.

Se ci venissero richieste spesso le stesse informazioni, potremmo decidere anche di aggiungere una **cache** nella quale
conservare temporaneamente risultati pre-calcolati. 

Se volessimo generare le miniature delle fotografie senza far aspettare l'utente, potremmo affidare questo compito a un
processo **worker** che esegue attività in background. Un **broker** potrebbe fare da intermediario: il backend gli
consegna un messaggio con il lavoro da svolgere e il worker lo preleva per elaborarlo.

Per conservare le fotografie potremmo anche decidere di utilizzare un **object storage** al posto di un volume locale,
un servizio al quale l'applicazione invia e dal quale recupera file tramite comode API.

Sono ruoli molto comuni nelle applicazioni dette **cloud-native**, ma possiamo incontrarli tranquillamente anche se
lavoriamo in contesti locali su un singolo host.

Docker Compose ci aiuta ad avviare questi servizi, a fornirgli reti, indirizzi e configurazioni in maniera strutturata.

***

> __understanding docker compose__
>
> - compose specification
> - feature compatibility

Le regole che definiscono il contenuto del file si chiamano
[**Compose Specification**](https://docs.docker.com/reference/compose-file/), mentre il programma che legge il file e 
applica queste regole è ovviamente Docker Compose, che richiameremo sempre con il comando `docker compose`.

Nei vecchi esempi potreste trovare il comando `docker-compose`, con il trattino in quanto una volta era un programma
separato, mentre oggi è integrato direttamente nel comando `docker` e non è più necessario installarlo a parte.

Oppure in alcuni vecchi file potreste trovare una riga iniziale in cui compare la versione, ad esempio `version: "3"`,
quel campo è ormai obsoleto e non serve nei nuovi file e non abilita nessuna funzionalità aggiuntiva.

***

Andiamo ora a provare il nostro piccolo esempio.

Verifichiamo di avere a disposizione Docker Compose con il comando:

```shell
$ docker compose version
```

Poi creiamo una nuova directory chiamata `compose`, spostiamoci al suo interno con il comando:

```shell
$ mkdir compose && cd $_
```

e creiamo con il nostro editor preferito il file `compose.yaml`:

```shell
$ nano compose.yaml
```
```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

Con Docker avviato, da questa directory controlliamo che la configurazione sia valida:

```shell
$ docker compose config -q
```

Se non ci sono errori il comando termina senza stampare nulla.

Fate attenzione che questo comando verifica la sintassi della configurazione, ma non il funzionamento dell'applicazione.

Avviamo quindi il servizio in background con il comando:

```shell
$ docker compose up -d
```

Compose si occuperà di scaricare l'immagine qualora mancasse, creerà la rete del progetto e avvierà il container del web
server. Le risorse verranno poi raggruppate in un **progetto**, il cui nome normalmente deriva dalla directory che contiene il file avviato da Compose.

Aprendo il browser all'indirizzo [http://localhost:8080](http://localhost:8080) vedremo la pagina di benvenuto di Nginx.

Per vedere lo stato del progetto e dei servizi possiamo usare il comando:

```shell
$ docker compose ps
```

Ritroveremo il servizio `web`, l'immagine utilizzata, lo stato del container e la porta pubblicata.

Mentre se vogliamo vedere i singoli container gestiti direttamente dall'Engine di Docker possiamo usare il comando:

```shell
$ docker ps
```

Perche ovviamente Compose non fa altro che gestire i container, le reti e i volumi tramite l'Engine di Docker.

Se lanciamo nuovamente `docker compose up -d` dalla stessa directory, senza modificare nulla, Compose non applicherà
nessuna modifica, manterrà infatti il container già avviato senza aggiungere un nuovo server web a ogni esecuzione.

Quando abbiamo finito possiamo fermare e rimuovere l'esempio con il comando:

```shell
$ docker compose down
```

In questo caso vengono rimossi il container e la rete creata per il progetto. Il nostro `compose.yaml` rimane al
suo posto e l'immagine resta disponibile sull'host per un utilizzo successivo.

Un dettaglio importante è che il comando `down` **non elimina i volumi** autonomamente, avremmo sempre la possibilità di
recuperarli qualora ne avessimo la necessità.

***

> Resources:
>
> - [nginx](https://hub.docker.com/_/nginx)
