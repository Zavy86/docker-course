# Logging and monitoring

> __logging and monitoring__
>
> - standard output
> - standard error
> - local files
> - services

Esistono svariati modi per inviare dei logs nei sistemi unix. Partendo dai più banali come ad esempio dirigerli verso lo
standard output o lo standard error, a quelli un po' più complessi come la scrittura di file locali (dove dovremo poi 
occuparci di gestirne le rotazioni periodiche), fino all'utilizzo di servizi interni o esterni dedicati proprio alla 
raccolta dei log.

Tutti questi metodi sono anche disponibili per i container Docker.

---

Lo standard output e lo standard error sono i due canali principali e più spesso utilizzati per inviare i log. Questi
due canali sono gestiti direttamente dall'engine e ogni singola riga scritta su uno di questi due canali viene quindi 
ricevuta direttamente da Docker che per comportamento predefinito li trascrive all'interno di un suo file di logs.

Questo file può essere visualizzato tramite il comando `docker logs` e tramite le relative API, comportamento che, come
vedremo in seguito, può anche essere personalizzato.

---

La scrittura di file di logs locali è un metodo apparentemente molto efficace, tuttavia presenta alcuni dettagli da
tenere in considerazione. Per prima cosa per accedere a questi file dovremo "entrare" nel container con il comando 
`docker exec` o dovremo estrarli tramite il comando `docker cp`, inoltre qualora il container si stoppasse e non fosse
facilmente riavviabile non avremo potremo accedervi dovendo quindi utilizzare altre strategie già viste nei capitoli 
precedenti. Infine qualora cancellassimo il container anche i relativi logs sarebbero persi per sempre.

Come dovremmo comportarci quindi con quelle applicazioni che possono solamente generare log su file?
Una soluzione potrebbe essere quella di utilizzare un volume montato nella directory in cui i logs vengono scritti in
maniera predefinita dall'applicazione e potremmo lanciare quindi un secondo container che condivida lo stesso volume con
un'applicazione come `filebeat` che si occupi di raccogliere i log e di inviarli a un server di logs centralizzato.
Un'altra potrebbe essere quella di usare un volume mappato in una directory locale cosi da poterci accedere direttamente
dall'host.

---

L'utilizzo di servizi di logging tramite framework o protocolli dedicati hanno diversi vantaggi. Tali meccanismi possono
essere utilizzati sia all'interno che all'esterno dei container senza troppe differenze. In alcuni casi, possiamo anche
sfruttare il networking dei container per semplificare la configurazione: ad esempio, il nostro codice può inviare dei
messaggi di log a un server chiamato log, il cui nome verrà risolto in indirizzi diversi a seconda che ci troviamo in 
ambiente di sviluppo, piuttosto che in quello di produzione, ecc...

Se invece la nostra applicazione (o il programma che eseguiamo nel container) utilizza il protocollo syslog, una delle
possibilità è quella di eseguire un server syslog all'interno del container, che potrà essere configurato per scrivere 
su file locali oppure inoltrare i log in rete.

***

Come dicevamo precedentemente, di default qualora i log siano gestiti tramite lo standard output e lo standard error, 
questi verranno trasmessi direttamente all'interno del file di logs del container. Questo perché il driver di default
utilizzato da Docker è il `json-file` come possiamo facilmente verificare tramite il comando:

```shell
$ docker info --format '{{ json .LoggingDriver}}'
```

Ma tramite plugin potremo scegliere di utilizzare il metodo che più si adatta al nostro ambiente.

Tuttavia se scegliamo di mantenere il driver predefinito, dobbiamo tenere in considerazione alcuni aspetti. Primo fra 
tutti, se non specificato diversamente, la dimensione dei file di logs non è limitata e quindi container molto verbosi 
piuttosto che container in esecuzione per parecchio tempo potrebbero generare file di log di dimensioni sempre maggiori 
fino a consumare tutto lo spazio disponibile sul disco.

Per evitare questo problema, possiamo impostare una dimensione massima per i file di log e il numero di file di log da
mantenere, superati i quali i vecchi log verranno via via eliminati.

Queste impostazioni posso essere gestite tramite il file di configurazione `daemon.json` come vedremo in un prossimo
capitolo dedicato alle [impostazioni di Docker](../26-common-settings/IT.md) o per singolo container.

Utilizzando l'opzione `--log-opt` possiamo impostare alcune variabili come ad esempio:

```shell
$ docker run -d --log-opt max-size=9m --log-opt max-file=3 zavy86/clock
```

E per verificare le impostazioni possiamo utilizzare il comando:

```shell
$ docker inspect --format '{{json .HostConfig.LogConfig}}' $(docker ps -lq) | jq
```
```json
{
  "Type": "json-file",
  "Config": {
    "max-file": "3",
    "max-size": "9m"
  }
}
```

***

> __logging and monitoring__
>
> - elk stack
>   - elasticsearch
>   - logstash
>   - kibana
> - gelf socket

Vediamo ora un esempio alternativo di gestione dei log tramite lo stack `ELK`.

Lo stack ELK è una combinazione di tre progetti open source: Elasticsearch, Logstash e Kibana. Viene utilizzato per
raccogliere, aggregare, analizzare e visualizzare i log ed è molto popolare per via della loro licenza open-source.

Elasticsearch è una sorta di database in cui andremo a memorizzare i log, Logstash è un tool che ci permette di ricevere
i log, elaborarli e inoltrarli verso varie destinazioni, e Kibana è un'interfaccia web che ci permette di visualizzare e
ricercare i log tramite una comoda interfaccia web.

Utilizzeremo quindi il protocollo `GELF` per inviare i log verso Logstash che provvederà a inoltrarli a Elasticsearch.

***

Andiamo quindi ad avviare uno questo stack ELK tramite il [Docker Compose](../../sources/elk) che trovate allegato in 
questo repository.

Qualora ancora non l'avessimo fatto cloniamolo:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

E spostiamoci nella directory:

```shell
$ cd docker-course/source/elk
```

E lanciamo il comando:

```shell
$ docker compose up -d
```
```terminaloutput
[+] Running 4/4
 ✔ Network elk_default            Created
 ✔ Container elk-elasticsearch-1  Started 
 ✔ Container elk-kibana-1         Started
 ✔ Container elk-logstash-1       Started
```

Come potrete vedere dai container che sono stati avviati stiamo usando le immagini ufficiali del Docker Hub.

```shell
$ cat docker-compose.yml
```

E la configurazione è semplicissima, per quanto riguarda Elasticsearch abbiamo semplicemente impostato l'immagine, per 
Kibana abbiamo impostato una variabile d'ambiente con l'URL del server di Elasticsearch ed esposto la porta che andremo
poi a utilizzare nel browser per accedere all'interfaccia web, mentre per Logstash abbiamo impostato una configurazione 
di base per ricevere i log in formato `GELF` sulla porta `12201/udp` e inoltrarli a Elasticsearch.

Lanciamo poi il nostro container `clock` per intasare un po' i nostri log:

```shell
$ docker run -d --log-driver=gelf --log-opt=gelf-address=udp://localhost:12201 zavy86/clock
```

Apriamo quindi la pagina web di Kibana alla porta `5601` dell'indirizzo IP del nostro host e creiamo un nuovo index name
con valore `logstash-*` e con Time-field `@timestamp`.

Andiamo poi nella sezione `Discover` in alto a sinistra e premiamo su `Last 15 minutes` in alto a destra e selezioniamo
`Auto-refresh` scegliendo l'opzione ogni `5 seconds`.

Se tutto è andato a buon fine dovremo vedere comparire i log generati dal nostro container `clock` come ad esempio:

```terminaloutput
[...]
"_source": {
    "version": "1.1",
    "host": "worker1",
    "level": 6,
    "@version": "1",
    "@timestamp": "2025-10-08T16:10:35.079Z",
    "source_host": "172.20.0.1",
    "message": "Wed Oct  8 16:10:35 UTC 2025",
    "command": "/bin/sh -c while date; do sleep 1; done;",
    "container_id": "cbe2b858479c312d6e16640ff11f7a17c389c8155b3307ddeb017557ea7176bb",
    "container_name": "exciting_noether",
    "created": "2025-10-08T16:07:10.798858261Z",
    "image_id": "sha256:44f02f010b3da74ebff1a90b59ebb86037849279997b7020f4726e7a4ca4005b",
    "image_name": "clock",
    "tag": "cbe2b858479c"
}
[...]
```

Ovviamente ci tengo a precisare ulteriormente che questa è una configurazione di prova da utilizzare solamente a scopo
didattico e dimostrativo, le versioni di questi software utilizzate sono molto vecchie e sono state scelte per la loro
leggerezza e semplicità di utilizzo, in un ambiente di produzione andrebbero però utilizzate versioni più aggiornate e
affidabili.

***

> Resources:
> - [elk](../../sources/elk)
> - [elasticsearch](https://hub.docker.com/_/elasticsearch)
> - [kibana](https://hub.docker.com/_/kibana)
> - [logstash](https://hub.docker.com/_/logstash)
> - [zavy86/clock](https://hub.docker.com/r/zavy86/clock)

[Prosegui](../25-multi-architecture-builds/IT.md) al prossimo capitolo.
