# Container internals

> __container internals__
>
> - nerd alert

Questo capitolo è dedicato ai nerd, a tutti coloro a cui piace scoprire i dettagli del come funzionano le cose e che
vogliono approfondire le tecnologie che stanno alla base dei container.

Se siete giunti fin qui e il vostro unico scopo è utilizzare Docker potete anche saltare questo capitolo, ma se siete un
pochino curiosi, fate un ultimo sforzo e vedrete che ne varrà la pena!

***

> __container internals__
>
> - namespaces
> - control groups
> - copy-on-write

Se guardassimo attentamente il codice sorgente di Linux, ci renderemmo conto che non esiste di per sé nessun codice
relativo ai container nello specifico, infatti i container per come li conosciamo oggi funzionano grazie a tutta una
serie di tecnologie, non strettamente collegate fra loro, ma che sfruttate in maniera sinergica hanno permesso a Docker
di poter diventare quello è diventato.

I container infatti basano tutte la loro funzionalità su tre tecnologie portanti: i `namespaces` per isolare dal sistema
host i processi, i `cgroups` per limitarne l'utilizzo delle risorse, e la gestione del filesystem con il `copy-on-write`
per ridurre la quantità di spazio necessario per l'esecuzione e il salvataggio dei dati all'interno dei container.

Ci sono poi anche tutta un'altra serie di tecnologie che permettono di gestire la sicurezza come `seccomp`, la gestione
dei processi come l'`init system` che gestisce il ciclo di vita dei processi e del container stesso, e molte altre.

***

> __container internals__
>
> control groups
> - hierarchy
> - metering
> - limiting
> - freeze
> - kill

I `control groups` garantiscono la possibilità di effettuare la misurazione e la limitazione delle risorse.

Possono essere sfruttati per misurare e limitare le classiche risorse di computazione, la memoria, e i processi di I/O.
Ma anche quelle più particolari come le risorse di rete, le risorse di sistema, il numero di processi, risorse grafiche
messe a disposizione dalle schede video, e ogni altro dispositivo che possa essere utilizzato dai container.

Inoltre permettono anche di raggruppare i processi in gruppi facendo in modo che possano essere manipolati insieme come
un'unica entità ad esempio nel caso volessimo congelare o terminare tutti i processi di un container.

Il loro funzionamento è basato su una gerarchia ad albero dove nodo rappresenta un livello di isolamento e a ogni nodo 
possono essere impostate delle regole di limitazione specifiche. Dopodiché è possibile spostare uno o più processi in
uno di questi nodi e il processo (o i processi) che si trovano in quel nodo saranno costretti a rispettarne le regole.

***

L'interfaccia principale di interazione con i `control groups`, come d'altronde ogni cosa nei sistemi UNIX, sono files,
o diciamo una rappresentazione a file, se infatti lanciamo il comando:

```shell
$ tree /sys/fs/cgroup/ -d
```

Otterremo un albero con al suo interno fra le altre cose anche i container che sono attualmente in esecuzione:

```terminaloutput
/sys/fs/cgroup/
├── init.scope
├── [...]
├── system.slice
│   ├── boot-efi.mount
│   ├── [...]
│   ├── docker-1745e91b305ede9884509b317bf325a8b0aa8519620231a6ad545a4becddb6ac.scope
│   ├── docker-1bc0619dbf1b0b2fda424a3f52bc5f21199b5837f70494eb6869a0e7490b75da.scope
│   ├── docker-43948a0a9f66338eb1cb1e71d182c9e76a76ba5d978c046869caac279e27faf2.scope
│   ├── docker.service
│   ├── docker.socket
│   ├── [...]
└── user.slice
    └── user-1001.slice
        ├── session-1.scope
        └── user@1001.service
            ├── app.slice
            │   ├── dbus.socket
            │   └── gpg-agent-ssh.socket
            └── init.scope
```

Se volessimo per esempio verificare l'utilizzo del processore, possiamo utilizzare il comando:

```shell
$ cat /proc/$$/cgroup
```

Per risalire al nodo della sessione corrente:

```terminaloutput
0::/user.slice/user-1001.slice/session-1.scope
```

E dopodiché possiamo utilizzare il comando:

```shell
$ cat /sys/fs/cgroup/user.slice/user-1001.slice/cpu.max
```

Per ottenere il limite attuale:

```terminaloutput
max 100000
```

In questo caso `max` significa illimitato e 100.000 rappresenta il periodo in microsecondi.

---

Anche la memoria è monitorata e gestibile tramite file, ad esempio con il comando:

```shell
$ cat /sys/fs/cgroup/user.slice/user-1001.slice/memory.max
```

Possiamo verificare se sul nostro utente sono stati impostati dei limiti:

```terminaloutput
max
```

In questo caso no, e tramite il file:

```shell
$ cat /sys/fs/cgroup/memory.stat
```

Potremo verificare l'utilizzo della memoria da parte di files, processi del kernel, socket e molto altro:

```terminaloutput
anon 1750036480
file 7802949632
kernel 1063206912
kernel_stack 12779520
pagetables 49807360
sec_pagetables 0
percpu 13969248
sock 57344
vmalloc 995328
shmem 21913600
zswap 0
zswapped 0
file_mapped 979922944
file_dirty 327680
[...]
```

E così via anche per le altre risorse.

***

> __container internals__
>
> namespaces
> - limit

I `namespaces` sono un sistema di isolamento delle risorse che permettono di limitare la visibilità all'interno di una
sorta di recinto invalicabile. Nei kernel moderni esistono svariati spazi disponibili, come quello dei processi, quello
delle reti, quello dei punti di montaggio, e molti altri...

Una volta creato uno spazio deve essere assegnato a uno o più processi e quando l'ultimo processo termina lo spazio e
tutte le risorse a esso associate vengono rimossi automaticamente dal sistema.

***

Anche i `namespaces` sono materializzati all'interno del sistema come files e possiamo vederli con il comando:

```shell
$ ls -l /proc/self/ns
```
```terminaloutput
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 cgroup -> 'cgroup:[4026531835]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 ipc -> 'ipc:[4026531839]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 mnt -> 'mnt:[4026531841]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 net -> 'net:[4026531840]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 pid -> 'pid:[4026531836]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 pid_for_children -> 'pid:[4026531836]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 time -> 'time:[4026531834]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 time_for_children -> 'time:[4026531834]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 user -> 'user:[4026531837]'
lrwxrwxrwx 1 ubuntu ubuntu 0 Oct 25 12:57 uts -> 'uts:[4026531838]'
```

Se volessimo creare un semplice namespace `uts` per dimostrare il livello di separazione possiamo eseguire il comando:

```shell
$ sudo unshare --uts
```

E già qui notiamo che ora siamo diventati `root` e non siamo più l'utente `ubuntu`:

Ora se lanciamo il comando:

```shell
$ sudo unshare --uts
```

Vedremo il nome della nostra macchina:

```terminaloutput
docker
```

Proviamo ora a modificarlo:

```shell
$ hostname zavyns
```

E lanciamo nuovamente il comando:

```shell
$ hostname
```

Come possiamo vedere otterremo il nome che abbiamo appena impostato:

```terminaloutput
zavyns
```

Ma se ora apriamo un nuovo terminale sempre sul nostro server e lanciamo il comando:

```shell
$ hostname
```

Qui vedremo che la modifica non è stata apportata, infatti vediamo nuovamente:

```terminaloutput
docker
```

Come possiamo intuire le modifiche apportate all'interno di uno spazio non sono visibili al suo esterno.

***

> __container internals__
>
> copy-on-write
> - filesystem
> - process memory
> - snapshots

L'ultimo punto che vorrei trattare, che è anche uno dei miei preferiti, ci permette di capire in maniera concreta la
potenza dei Container e ci permette di scoprire come possano essere avviati e gestiti in maniera tanto efficiente.

Il filesystem `copy-on-write` è un meccanismo che permette la condivisione dei dati fra più sistemi.

Quando avviamo un container, possiamo vedere e interagire con tutti i file presenti all'interno del filesystem, come se
fossero a tutti gli effetti dei file veri e propri, ma in realtà non sono altro che dei link (o riferimenti) che puntano 
ai dati originali presenti nel filesystem del nostro host.

E la situazione rimane questa fintanto che non effettuiamo una modifica a un file, solo in quel momento il file viene
realmente copiato nel filesystem del container e lì vengono apportate le modifiche.

Questo si traduci in un grandissimo risparmio di spazio e di risorse di computazione, in quanto ci ritroveremo una copia
di un file solamente quando il contenuto di questo file sarà diverso da quello presente nell'host e in tutti gli altri
container che condividono lo stesso file.

Il copy-on-write nei sistemi UNIX è ovunque, non solo nel filesystem ma anche nella memoria, ad esempio se effettuiamo
un `fork` di un processo, il processo figlio condividerà la memoria con il processo padre, fintanto che uno dei due non
apporti una modifica all'area di memoria, in quel caso ne verrà effettuata una copia e verrà modificata, ma lo stesso
processo viene anche utilizzato negli snapshots dei dischi e in molte altri casi...

***

Per mostrarvi l'efficienza dei container vi farò un semplice esempio, lanciamo un tot di container della stessa immagine
e vediamo come si comportano:

```shell
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
```

Innanzitutto come possiamo aver notato i container sono stati tutti avviati in una manciata di millisecondi, ma la cosa
più assurda è che se lanciamo il comando:

```shell
$ docker ps --size
```

Vedremo che lo spazio occupato da tutti questi container è `0B (virtual 4.17MB)` ovvero zero bytes, il peso invece che
si vede fra parentesi, ovvero il peso virtuale del container, in questo caso è rappresentato solamente dai quattro mega
byte che sono il peso dell'immagine stessa.

```terminaloutput
CONTAINER ID   IMAGE          [...]   NAMES                 SIZE
e13ecdd28d09   zavy86/clock   [...]   goofy_turing          0B (virtual 4.17MB)
c1cc638ac9a5   zavy86/clock   [...]   practical_feynman     0B (virtual 4.17MB)
cb201213dce7   zavy86/clock   [...]   charming_poitras      0B (virtual 4.17MB)
5551615713b3   zavy86/clock   [...]   unruffled_agnesi      0B (virtual 4.17MB)
004b54ebd3ef   zavy86/clock   [...]   kind_burnell          0B (virtual 4.17MB)
f98cb899aa54   zavy86/clock   [...]   angry_kilby           0B (virtual 4.17MB)
2a4b068277cb   zavy86/clock   [...]   intelligent_haslett   0B (virtual 4.17MB)
faa676649677   zavy86/clock   [...]   hungry_jang           0B (virtual 4.17MB)
32876e33691d   zavy86/clock   [...]   kind_joliot           0B (virtual 4.17MB)
```

Il che significa che tutti e nove i container stanno condividendo lo stesso filesystem con l'immagine per cui i files
presenti al loro interno non sono altro che dei link ai file presenti nell'immagine stessa.

Se da un altro terminale lanciamo un nuovo container:

```shell
$ docker run -d zavy86/clock
```

E andiamo a creare un nuovo file al suo interno:

```shell
$ echo "Hello World!" > test.txt
```

E lanciamo nuovamente il comando:

```shell
$ docker ps --size
```
```terminaloutput
CONTAINER ID   IMAGE          [...]   NAMES                 SIZE
ccd33ea22d5d   zavy86/clock   [...]   elated_hamilton       58B (virtual 4.17MB)
e13ecdd28d09   zavy86/clock   [...]   goofy_turing          0B (virtual 4.17MB)
c1cc638ac9a5   zavy86/clock   [...]   practical_feynman     0B (virtual 4.17MB)
cb201213dce7   zavy86/clock   [...]   charming_poitras      0B (virtual 4.17MB)
5551615713b3   zavy86/clock   [...]   unruffled_agnesi      0B (virtual 4.17MB)
004b54ebd3ef   zavy86/clock   [...]   kind_burnell          0B (virtual 4.17MB)
f98cb899aa54   zavy86/clock   [...]   angry_kilby           0B (virtual 4.17MB)
2a4b068277cb   zavy86/clock   [...]   intelligent_haslett   0B (virtual 4.17MB)
faa676649677   zavy86/clock   [...]   hungry_jang           0B (virtual 4.17MB)
32876e33691d   zavy86/clock   [...]   kind_joliot           0B (virtual 4.17MB)
```

Vedremo che la dimensione di questo ultimo container sarà 58 bytes, ovvero solamente il peso del file `test.txt` che
abbiamo appena creato e questo peso ovviamente non ha nessun impatto su tutti gli altri container.

Se lanciamo poi il comando:

```shell
$ docker ps --size
```

Noteremo proprio le differenze apportate rispetto all'immagine originale:

```terminaloutput
C /root
A /root/.ash_history
A /test.txt
```

L'aggiunta del file `test.txt` e la modifica della directory `/root` nella quale è stato aggiunto il file `.ash_history`
che contiene la storia del comando appena eseguito per poterlo richiamare con la freccia in su...

***

> __container internals__
>
> open container initiative
> - open governance
> - industry standards
> - formats and runtimes

Non mi soffermerò su tutti gli altri componenti in quanto già a questo punto credo di aver perso tutti gli ascoltatori,
in ogni caso se siete fra coloro che volessero approfondire il funzionamento dei container perché magari volete in prima
persona contribuire al loro sviluppo, vi rimando alla [Open Container Initiative](https://opencontainers.org/).

Una struttura di governance istituita con l'obiettivo specifico di creare standard industriali aperti per i formati e i
runtime dei container, fondata nel 2015 da Docker e altri leader del settore, per garantire che le tecnologie container
siano portabili e interoperabili tra diversi fornitori e piattaforme, standardizzandone i componenti fondamentali.

***

[Prosegui](../../thanks/IT.md) al prossimo capitolo.
