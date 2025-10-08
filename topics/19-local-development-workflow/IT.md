# Local development workflow

> __local development workflow__
>
> - holding volumes
> - share volumes
> - host directories

I volumi Docker possono essere utilizzati per raggiungere molti scopi, come bypassare i limiti del filesystem standard
copy-on-write in modo da ottenere prestazioni di lettura e scrittura native, condividere files e directories fra più
container o direttamente con l'host, fino a utilizzare storage personalizzati o remoti tramite appositi drivers.

In parole povere, i volumi Docker non sono altro che directory speciali dichiarate direttamente nelle immagini tramite
l'istruzione `VOLUME` del Dockerfile, oppure create al volo al momento dell'esecuzione di un container tramite l'opzione
`-v` del comando `docker run`. Qualunque dei due metodi si scelga, Docker gestirà la directory segnalata come volume.

Inoltre i volumi esistono indipendentemente dai container, se un container viene stoppato o eliminato, il volume rimane
presente nell'host e potrà sempre essere riutilizzato da un altro container.

***

Per visualizzare i volumi presenti all'interno del nostro host possiamo utilizzare il comando:

```shell
$ docker volume ls
```

E otterremo una lista di tutti i volumi presenti con il relativo driver e l'identificativo univoco.

```terminaloutput
DRIVER    VOLUME NAME
local     0d5c47295b66a2cf1e4354db5aee95e548a0c6e64bc34971b735fa93602901ff
local     6b09acd4ae00e1f5e7919a435f2c66188bd7979f6bc5078a643a65bd0ec20445
local     6d0b2522c626ca3a4fe08a69e916541cd0da1fa775a190b26d492239535fc886
```






***

[Prosegui](../19-xxx/IT.md) al prossimo capitolo.
