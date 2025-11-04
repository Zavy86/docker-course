# Working with volumes

> __working with volumes__
>
> - holding volumes
> - share volumes
> - host directories

I volumi Docker possono essere utilizzati per raggiungere molti scopi, come bypassare i limiti del filesystem standard
copy-on-write in modo da: ottenere prestazioni di lettura e scrittura native, condividere files e directories fra più
container o direttamente con l'host, fino a utilizzare storage personalizzati o remoti tramite appositi drivers.

In parole povere, i volumi Docker non sono altro che directory speciali dichiarate direttamente nelle immagini tramite
l'istruzione `VOLUME` del Dockerfile, oppure create al volo al momento dell'esecuzione di un container tramite l'opzione
`-v` del comando `docker run`. Qualunque dei due metodi si scelga, Docker gestirà la directory segnalata come un volume.

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

I nomi esadecimali identificano i volumi creati in automatico da Docker, ma come vedremo a breve in fase di avvio di un
container o creandolo manualmente potremo specificare un nome più leggibile per i volumi che andremo a creare.

Proviamo quindi a creare un volume nel quale andremo a gestire le pagine di un webserver:

```shell
$ docker volume create nginx-www
$ docker volume ls
```

In questo caso vedremo l'etichetta scelta come nome del volume al posto dell'identificativo esadecimale:

```terminaloutput
DRIVER    VOLUME NAME
[...]
local     nginx-www
[...]
```

A questo punto lanciamo un container con nginx puntando la directory html del server web al volume appena creato:

```shell
$ docker run -d -p 8080:80 -v nginx-www:/usr/share/nginx/html nginx
``` 

In questo modo il web server andrà a servire le pagine presenti nel volume, come possiamo vedere puntando il browser su:
`http://localhost:8080`.

Lanciamo ora un secondo container puntando allo stesso volume:

```shell
$ docker run -ti -v nginx-www:/www alpine
```

In questo caso abbiamo usato un path differente nel container `alpine`, proviamo a vedere cosa contiene:

```shell
# ls -l /www
```

Ed ecco il contenuto del volume:

```terminaloutput
total 8
-rw-r--r--    1 root     root           497 Aug 13 14:33 50x.html
-rw-r--r--    1 root     root           615 Aug 13 14:33 index.html
```

Proviamo ora a modificare il file index:

```shell
# apk add nano
# nano /www/index.html
```

Ed modifichiamo il contenuto del file: 

```html
[...]
<h1>Welcome from Volume</h1>
[...]
```

Usciamo salvando con `^X` e `Y`, poi torniamo al browser e aggiorniamo la pagina: `http://localhost:8080` e vedremo che
la pagina sarà servita con il contenuto aggiornato!

***

> __working with volumes__
>
> - all empty
> - empty volumes
> - non-empty volumes

Quando montiamo un volume in un container, possono esserci tre casi.

Se il volume che stiamo montando è vuoto e viene montato su una directory vuota (o inesistente) viene semplicemente
creata la directory all'interno del container.

Se montiamo un volume vuoto all'interno di una directory esistente e non vuota del container, Docker copierà tutto il
contenuto della directory esistente nel volume.

Se montiamo un volume non vuoto, a prescindere che la directory esista o meno all'interno del container, il contenuto 
del volume sovrascriverà quello presente nella directory.

***

Se proviamo infatti a stoppare ed eliminare il container di nginx:

```shell
$ docker ps
$ docker stop 171
$ docker rm 171
```

E lo rilanciamo con gli stessi parametri di prima:

```shell
$ docker run -d -p 8080:80 -v nginx-www:/usr/share/nginx/html nginx
``` 

E torniamo al browser e aggiorniamo la pagina: `http://localhost:8080` e vedremo che la pagina servirà il contenuto come
lo avevamo aggiornato nel volume!

***

> __working with volumes__
>
> - bind
> - storage
> - development

I volumi classici Docker sono comodi, centralizzati e gestibili con i comandi della CLI.

Tuttavia a volte potremo voler specificare puntualmente una directory all'interno del filesystem del nostro host, o su
un NAS o una SAN per poter utilizzare un volume personalizzato o un volume remoto.

In questo modo potremo avere un controllo più minuzioso del volume, gestire snapshots e backup, utilizzare magari dischi
più veloci o più capienti o con maggiore resilienza.

Un altro vantaggio, soprattutto se stiamo sviluppando in locale, è quello di poter lavorare sulla stessa directory del 
nostro sistema operativo direttamente con il nostro editor preferito e vedere le modifiche applicate immediatamente. 

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci quindi nella directory `docker-course`:

```shell
$ cd docker-course
```

E lanciamo nuovamente il container di nginx con il parametro `-v` per montare il volume in una directory specifica:

```shell
$ docker run -d -p 8080:80 -v ./sources/volumes/nginx-www:/usr/share/nginx/html nginx
``` 

E dal nostro browser apriamo nuovamente la pagina: `http://localhost:8080` e vedremo che la pagina servita questa volta
sarà la stessa presente all'interno della directory `./sources/volumes/nginx-www`:

```shell
$ nano ./sources/volumes/nginx-www/index.html
```
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hello World</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>From a bind-mounted volume</p>
</body>
</html>
```

Se proviamo a modificarla:

```html
[...]
  <h1>Hello World!</h1>
[...]
```

E aggiorniamo la pagina nel browser, vedremo che la modifica sarà immediatamente visibile.

***

> __working with volumes__
>
> - bind
> - storage
> - development

I volumi sono anche uno strumento potente per gestire le migrazioni e gli aggiornamenti di release delle applicazioni.

Nello scenario di aggiornamento di un database per esempio potremmo montare il vecchio volume sul nuovo container e
gestire così la migrazione mantenendo i dati presenti nel vecchio volume.

Per questa specifica esigenza possiamo anche sfruttare l'opzione `--volumes-from` per montare un volume esistente anche
se non ne conosciamo il nome, ci basta sapere quale sia il container che lo ha creato.

***

Lanciamo per esempio un container con Redis versione `7`:

```shell
$ docker run -d --name redis7 redis:7
``` 

Dopodiché sfruttiamo il solito `busybox` per collegarci tramite `telnet` al database:

```shell
$ docker run -ti --rm --link redis7 busybox telnet redis7 6379
``` 

> Usando l'opzione `--link` è un piccolo workaround per poter collegare i due container senza dover creare una rete 
bridge dedicata. L'opzione è segnalata come deprecata, quindi non fatene affidamento in un sistema di produzione, ma per 
il nostro semplice esempio va più che bene... Altrimenti potrete usare la rete `--net tutorial` creata precedentemente.

```terminaloutput
Connected to redis7
```

Lanciamo poi questa sequenza di comandi per creare una nuova chiave `counter` con valore `42`, salvare e uscire.

```redis
SET counter 42
SAVE
QUIT
```

Procediamo quindi con l'aggiornamento alla versione `8` di Redis effettuando la migrazione del volume.

Stoppiamo il container precedente:

```shell
$ docker stop redis7
``` 

E avviamo il nuovo container:

```shell
$ docker run -d --name redis8 --volumes-from redis7 redis:8
``` 

Ricolleghiamoci nuovamente tramite `telnet`:

```shell
$ docker run -ti --rm --link redis8 busybox telnet redis8 6379
``` 
```terminaloutput
Connected to redis8
```

E verifichiamo che il valore della chiave `counter` sia ancora presente:

```redis
GET counter
QUIT
```

Infine per chiudere questo capitolo, vediamo come eliminare un volume.

Per sapere quali volumi sono associati a un container possiamo usare il comando:

```shell
$ docker inspect --format '{{ json .Mounts }}' redis8 | jq
```
```json
[
  {
    "Type": "volume",
    "Name": "3552875a311b31e9764e79a83c73ba87b5628de966f05a7e35a822693813b3ca",
    "Source": "/var/lib/docker/volumes/3552875a311b31e9764e79a83c73ba87b5628de966f05a7e35a822693813b3ca/_data",
    "Destination": "/data",
    "Driver": "local",
    "Mode": "",
    "RW": true,
    "Propagation": ""
  }
]
```

Stoppiamo ed eliminiamo i due container Redis:

```shell
$ docker stop redis8
$ docker rm redis7 redis8 
``` 

Infine possiamo eliminare il volume con il comando:

```shell
$ docker volume rm 3552875a311b31e9764e79a83c73ba87b5628de966f05a7e35a822693813b3ca
``` 

In questo caso a differenza dei container non possiamo usare un identificativo abbreviato ma dovremo specificalo intero.

Un altro comando che può tornare utile è:

```shell
$ docker volume prune
``` 

Che permette di eliminare tutti i volumi non utilizzati da nessun container.

> Fate ovviamente attenzione e ricordatevi sempre che gli unici responsabili dei volumi siete voi, impostate dei backup,
monitorate l'utilizzo del disco e ogni tanto fate pulizia.

Ultima nota, l'opzione `-v` può essere usata anche per montare singoli file, non solo directory.

Ad esempio potrebbe capitarvi spesso di veder montare il socket di Docker in questo modo:

```shell
$ docker run -ti -v /var/run/docker.sock:/var/run/docker.sock docker sh
``` 

In questo caso stiamo creando un cosiddetto "Docker in Docker" che ci permette di controllare il nostro host Docker da 
dentro un container, se lanciamo infatti il comando:

```shell
# docker ps
```

Come potete vedere quello che vediamo è lo stesso risultato che avremmo ottenuto lanciando il comando sul nostro host.

```terminaloutput
CONTAINER ID   IMAGE    [...]
bef846693b5e   docker   [...]
```

E potremo anche auto spegnerci:

```shell
# docker stop bef
```

;-)

***

> Resources:
> - [alpine](https://hub.docker.com/_/alpine)
> - [busybox](https://hub.docker.com/_/busybox)
> - [docker](https://hub.docker.com/_/docker)
> - [nginx](https://hub.docker.com/_/nginx)
> - [redis](https://hub.docker.com/_/redis)

[Prosegui](../19-local-development-workflow/IT.md) al prossimo capitolo.
