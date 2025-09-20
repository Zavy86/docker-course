# Run our first container

> __run our first container__
> 
> - seen Docker in action
> - start our first container

In questo capitolo vedremo Docker in azione avviando il nostro primo container.

In realtà se avete seguito il video precedente e avete installato Docker sulla vostra macchina, avrete già avviato un
container, il famoso `hello-world` con cui ci siamo accertati che l'installazione fosse avvenuta correttamente.

Ma non perdiamoci in chiacchiere e riapriamo il nostro fantastico terminale.

***

Per eseguire il nostro primo container, utilizzeremo un comando un pochino più complicato rispetto a quello che ci era
stato proposto dall'installer di Docker. 

```shell
$ docker run busybox echo hello world
```

Lanciando questo comando chiederemo al motore di Docker di creare e avviare un container partendo dall'immagine chiamata
`busybox`, una delle più piccole e semplici immagini che ci vengono messe a disposizione dal team di Docker.

Quest'immagine viene spesso usata in sistemi embedded, come smartphones o routers ed è una sorta di coltellino svizzero.

Il comando `echo hello world` che segue il nome dell'immagine fa si che venga eseguito il comando `echo` con l'argomento
`hello world` e il risultato è proprio quello che vedete stampato sul terminale.

```terminaloutput
Unable to find image 'busybox:latest' locally
latest: Pulling from library/busybox
499bcf3c8ead: Already exists 
Digest: sha256:ab33eacc8251e3807b85bb6dba570e4698c3998eca6f0fc2ccb60575a563ea74
Status: Downloaded newer image for busybox:latest
hello world
```

Se è la prima volta che lanciate questo comando, oltre alla scritta `hello world` vedrete anche alcune altre righe di
log relative al download dell'immagine, ma su questi concetti ci torneremo più avanti.

***

Passiamo ora a qualcosa di più succoso.
Con il comando precedente, abbiamo semplicemente avviato un container e abbiamo ottenuto in output una scritta.
Proviamo ora invece a eseguire sempre il comando `run` ma con altri parametri.

```shell
$ docker run -it alpine
```

Questo comando avvia un nuovo container, completamente separato rispetto a quello precedente.

```terminaloutput
Unable to find image 'alpine:latest' locally
latest: Pulling from library/alpine
6e174226ea69: Pull complete 
Digest: sha256:4bcff63911fcb4448bd4fdacec207030997caf25e9bea4045fa6c8c44de311d1
Status: Downloaded newer image for alpine:latest
/ #
```

Il parametro `-it`, versione abbreviata di `--interactive --tty`, ci permette di avviare il container in modalità
interattiva; ovvero richiede a Docker di connetterci allo STDIN del container e di allocarci uno pseudo terminale.

Se utilizziamo infatti il comando:

```shell
$ echo $0
```

Vedremo che il container ci risponderà con `sh` che altro non è che la shell che stiamo utilizzando.

```terminaloutput
/bin/sh
```

Quindi avendo a disposizione una shell, possiamo iniziare a lanciare qualche comando, proviamo ad esempio con:

```shell
$ figlet "Hello World!"
```

Filget è un programma che permette di disegnare i testi che prende in input in formato ASCII, tuttavia come vediamo dal 
messaggio di errore, questa utility non è presente all'interno dell'immagine Alpine, né tanto meno nel nostro container.

```terminaloutput
/bin/sh: figlet: not found
```

Procediamo quindi con l'installazione di questo programma.

```shell
$ apk add figlet
```
```terminaloutput
fetch https://dl-cdn.alpinelinux.org/alpine/v3.22/main/aarch64/APKINDEX.tar.gz
fetch https://dl-cdn.alpinelinux.org/alpine/v3.22/community/aarch64/APKINDEX.tar.gz
(1/1) Installing figlet (2.2.5-r3)
Executing busybox-1.37.0-r18.trigger
OK: 8 MiB in 17 packages
```

Una volta terminata l'installazione, riproviamo a lanciare il comando precedente e questa volta vederemo comparire una
bellissima frase in formato ASCII:

```terminaloutput
 _   _      _ _        __        __         _     _ _ 
| | | | ___| | | ___   \ \      / /__  _ __| | __| | |
| |_| |/ _ \ | |/ _ \   \ \ /\ / / _ \| '__| |/ _` | |
|  _  |  __/ | | (_) |   \ V  V / (_) | |  | | (_| |_|
|_| |_|\___|_|_|\___/     \_/\_/ \___/|_|  |_|\__,_(_)
```

Fantastica vero?

Ora, se usciamo dal container, con il comando `exit` o con la scorciatoia `^D`, e proviamo a lanciare sul terminale il
comando `figlet`, vedremo che il sistema ci avvertirà che non trova nessun programma con questo nome (a patto che non lo
aveste già presente sul vostro sistema).

***

> __run our first container__
>
> - shared kernel
> - indipendent packages
> - any container in any host

Questo succede perché l'_host_ in cui è stato installato Docker e i _containers_ che vengono avviati e gestiti al suo
interno, sono cose completamente separate e indipendenti fra loro.

Nonostante condividanmo lo stesso kernel, ogni container è indipendente e qualunque pacchetto venga installato al suo
interno non viene esposto all'host e vice-versa. Anche se eseguiamo la stessa distrubuzione di Linux su un host e un
container, non avremo alcun conflitto né interdipendenze...

Questo ci permette di eseguire qualunque container su qualunque host, anche con diverse distrubuzioni di Linux.

***

> __run our first container__
>
> - stopped state
> - exists on disk
> - all resources freed

Ma che fine ha fatto il nostro container, una volta che ci siamo scollegati?

Quando un container termina la sua esecuzione, viene spento e tutte le risorse che erano state allocate per lui vengono
liberate. Ma resta comunque presente su disco, con tutti i suoi files, pronto per poter essere riavviato nuovamente.

***

Torniamo quindi nel nostro terminale e rilanciamo il comando:

```shell
$ docker run -it alpine
```

E una volta ricollegati alla shell, proviamo a lanciare nuovamente il comando `figlet`:

```terminaloutput
/bin/sh: figlet: not found
```

Che succede? Come mai non trova più il programma che avevamo installato?

Questo succede perché ogni volta che avviamo un nuovo container esso viene creato da zero, partendo dall'immagine
specificata, in questo caso `alpine`, e come avevamo potuto vedere precedentemente, l'utility `figlet` non era presente
all'interno di quell'immagine e l'avevamo installata manualmente.

Come facciamo quindi a riutilizzare il container che avevamo personalizzato con tanta cura?

***

> __run our first container__
>
> - yes we can
> - not a good practice
> - docker workflow
> - custom image

Possibile che non ci sia un modo per riutilizzare il container che avevamo creato? Certo che c'è, ma questo modo di
agire non è una buona pratica.

Docker ha una sorta di _workflow_ che ci permette di risolvere questo problema in maniera radicale.

Se abbiamo bisogno di qualche cosa all'interno dei nostri container, che non è presente all'interno dell'immagine
originale, possiamo creare un'immagine personalizzata e poi utilizzare questa per avviare i nostri futuri container.

Sembra una cosa complicatissima detta così, ma in realtà è piuttosto semplice.

E il punto focale di questa pratica è che mette un forte accento sull'automazione e la ripetibilità, uno dei concetti
fondanti di Docker.

***

> __run our first container__
>
> - pets
>   - distinctive names
>   - unique configurations
>   - irreplaceable
> - cattle
>   - generic names
>   - generic configurations
>   - replaceables

Una metafora super azzeccata è quella della differenza tra animali domestici e bestiame.

Immaginate due tipologie di server, il primo con un suo nome ben distintivo, una sua configurazione unica e per il quale
saremmo disposti a fare di tutto pure di tenerlo sempre in esecuzione, in maniera affidabile e sicura; il secondo,
con un nome generico, una configurazione generica che possiamo replicare facilmente, magari anche tramite sistemi di
gestione centralizzati e che qualora dovesse presentare dei problemi non ci faremmmo nessuna remora nel rimpiazzarlo
immediatamente con un suo clone.

***

> __run our first container__
>
> - create virtual machine
> - install packages
> - setup environment
> - work on project
> - tweek environment
> - repeat

Qual è la connessione tra questa metafora e Docker?

Pensiamo ai nostri ambienti di sviluppo: solitamente partiamo con la creazione di una macchina virtuale, installiamo i
pacchetti e le dipendenze di cui abbiamo bisogno, configuriamo l'ambiente di sviluppo e iniziamo a lavorare al progetto.

Spegniamo la macchina e quando dobbiamo tornare sul progetto: la riavviamo, eventualmente modifichiamo l'ambiente di
sviluppo, proseguiamo con il progetto e via dicendo...

Magari questa operazione avviene più volte, magari anche su macchine diverse, magari con diverse persone che si mettono
a lavorarci sopra, e alla fine succede che nessuno abbia più il controllo della situazione e non ci sia più alcun modo
per ricreare l'ambiente da zero su una nuova macchina senza ricorrere a documentazioni e specifiche, se presenti...

***

> __run our first container__
>
> - create image
> - run container
> - work on project
> - repeat

Lo sviluppo con Docker, si trasforma in un ciclo molto più semplice: creiamo un immagine con all'interno tutte le
dipendenze e le configurazioni dell'ambiente necessari al progetto, avviamo un container da questa immagine e
proseguiamo con il progetto.

Quando dovremo tornare sul progetto, ed eventualmente modificarne la configurazione, creiamo una nuova immagine e
avviamo un nuovo container da questa nuova immagine.

Committiamo l'immagine nel repository del progetto cosicché chiunque vorra lavorarci sopra avra sempre a disposizione la 
stessa e identica nostra configurazione, documentata e completamente riproducibile...

Nei prossimi capitoli vedremo come creare un'immagine personalizzata di Alpine con all'interno l'utility Figlet. 
Ma prima di addentrarci nella creazione delle immagini dobbiamo ancora vedere alcuni concetti di base.

***

[Prosegui](../04-background-containers/IT.md) al prossimo capitolo.
