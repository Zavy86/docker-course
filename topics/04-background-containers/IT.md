# Run containers in background

> __run containers in background__
> 
> - run non-interactive
> - run in background
> - list running containers
> - check the logs
> - stop a container
> - list stopped containers

Nel capitolo precedente, abbiamo visto come eseguire un container in modalità interattiva.

Mentre ora vedremo come eseguirli in modalità non interattiva e in background;
Vedremo poi come ottenere la lista di tutti i container in esecuzione e come leggerne i logs;
E scopriremo infine come stopparli e come ottenere la lista di tutti i containers arrestati.

***

Iniziamo quindi con l'esecuzione di un piccolo [container](/sources/clock/) non interattivo. 

```shell
$ docker run zavy86/clock
```

Una volta avviato inizierà a stampare semplicemente la data e l'ora correnti ogni secondo.

```terminaloutput
Thu Aug 07 18:27:45 UTC 2025
Thu Aug 07 18:27:46 UTC 2025
Thu Aug 07 18:27:47 UTC 2025
...
```

Questo container resterà in esecuzione per sempre e non abbiamo nessun modo per interagire con esso, infatti se
proviamo a inserire qualunque comando, non avendo a disposizione una shell verrà ignorato.

L'unica cosa che possiamo fare è premere `^C` per arrestarlo.

Non avendo mai utilizzato questa immagine prima d'ora, come già visto precedentemente con l'immagine Ubuntu, il sistema
l'ha scaricata in automatico dal registro Docker Hub.

Torneremo più avanti sul concetto di immagini e registri per il momento limitiamoci a considerare che si tratta di un
immagine personalizzata creata dall'utente Zavy86.

***

> __run containers in background__
> 
> - SIGINT
>   - interactive -> foreground process
>   - default -> process PID 1

A volte capita che un `^C` non sia sufficiente per arrestare un container, cerchiamo di capirne il perché.

Quando premiamo `^C` viene inviato al container un segnale di interruzione `SIGINT`.
Se abbiamo avviato il container in modalità interattiva `-it` il segnale viene inviato al processo in foreground.
Mentre se abbiamo lanciato un container in modalità non interattiva, come in questo caso, il segnale viene inviato al
processo con `PID 1`.
Questo processo è un po' particolare, a meno che non sia stato specificatamente programmato per gestire questo segnale,
di default ignora il segnale `SIGINT` e considera solamente i segnali `SIGKILL` e `SIGTERM`.

Il processo `PID 1` è speciale perché ha alcune responsabilità extra.
Direttamente o indirettamente si occupa dell'avvio di tutti gli altri processi del container.
Quando il processo `PID 1` termina, tutto il resto si ferma: Nelle macchine classiche stopparlo equivale a causare un 
kernel panic; In un container, equivale a uccidere tutti i processi in esecuzione.
Visto che non vogliamo che questo avvenga accidentalmente è stato aggiunto questo layer di protezione extra.

Come facciamo quindi a stoppare questi container?
Al momento, abbiamo un'unica soluzione: aprire un'altra sessione del terminale e lanciare il comando `docker kill`.

***

Vediamo ora la modalità in background.
Per lanciare un container in background dobbiamo aggiungere l'opzione `-d` al comando `docker run`.

```shell
$ docker run -d zavy86/clock
```

E questa volta, otterremo in output solamente l'ID del container appena avviato.

```terminaloutput
66e1d31f67d9551b8efca347b7c1d6e978decb30f381a21059dc86fbb435681a
```

Rispetto a prima non vedremo più nessun output, ma niente paura, Docker sta lavorando per noi, sta collezionando tutti 
i dati in background e li sta salvando in un log.

***

Come facciamo quindi a sapere quali container sono in esecuzione?

Nei sistemi unix esiste il comando `ps` che ci permette di vedere i processi in esecuzione, analogamento Docker ci mette
a disposizione il comando:

```shell
$ docker ps
```

Tramite il quale potremo vedere alcune informazioni utili sui container in esecuzione.
Come ad esempio l'ID del container, l'immagine utilizzata per il suo avvio, il tempo trascorso dalle sua creazione e lo
stato attuale, in questo momento vediamo infatti che è in esecuzione da qualche minuto.

```terminaloutput
CONTAINER ID   IMAGE          [...]   CREATED         STATUS         [...]
66e1d31f67d9   zavy86/clock   [...]   2 minutes ago   Up 2 minutes   [...]
```

Ci mostra poi anche altre informazioni come COMMAND, PORTS e NAMES che per il momento possiamo ignorare, le tratteremo
nei prossimi capitoli.

Avviamo ora altri due containers in background.

```shell
$ docker run -d zavy86/clock
$ docker run -d zavy86/clock
```

Ed otterremo in output altri due diversi ID.

```terminaloutput
a658e9ee5d97afd72bdc52653f118f0881bf481f13aa4f2f35b616ff9ea20a8e
58f2e75907e201206ce072667bf9d1d6c2b6023033c4ba548015ed874690b067
```

Lanciamo nuovamente il comando:

```shell
$ docker ps
```

e potremo vedere che sono presenti tre containers in esecuzione.

```terminaloutput
CONTAINER ID   IMAGE          [...]   CREATED              STATUS              [...]
58f2e75907e2   zavy86/clock   [...]   About a minute ago   Up About a minute   [...]
a658e9ee5d97   zavy86/clock   [...]   About a minute ago   Up About a minute   [...]
66e1d31f67d9   zavy86/clock   [...]   3 minutes ago        Up 3 minutes        [...]
```

In un ambiente in utilizzo, è molto probabile che ci siano decine, centinaia o migliaia di container in esecuzione. E
in questi casi il comando `docker ps` potrebbe risultare molto lungo e difficile da leggere. Ed è qui che entra in gioco
l'opzione `-l` che ci permette di visualizzare solamente l'ultimo container avviato.

```shell
$ docker ps
```

Come possiamo vedere ora il comando ne restituisce soltanto uno.

```terminaloutput
CONTAINER ID   IMAGE          [...]   CREATED              STATUS              [...]
58f2e75907e2   zavy86/clock   [...]   2 minutes ago        Up 2 minutes        [...]
```

Un'altra opzione interessante è `-q` che sta per Quick:

```shell
$ docker ps -q
``` 

e ci permette di visualizzare solamente gli ID dei container in esecuzione.

```terminaloutput
58f2e75907e2
a658e9ee5d97
66e1d31f67d9
```

Ovviamente queste opzioni possono essere combinate. 

```shell
$ docker ps -lq
``` 

Usandole infatti entrambe otterremo in risposta l'ID dello ultimo container che abbiamo avviato...

```terminaloutput
58f2e75907e2
```

Se siete pratici dei sistemi UNIX immagino che vi stia già venendo in mente quanto può essere utile questo comando
abbinato al pipelining. Fate tuttavia attenzione che questo comando è soggetto alle cosiddette race conditions. Ovvero
se viene avviato un altro container subito dopo, potremmo ottenere un risultato inaspettato.

***

Tornando invece all'output dei containers, come vi dicevo Docker sta collezionando tutti i dati in background e li sta
salvando in un log. Per visualizzarli dovremo usare il comando:

```shell
$ docker logs 58f
``` 

Come vi avevo già accennato, possiamo inserire anche solo una parte dell'ID del container purché sia univoca.
E come vediamo, questo comando ci restituisce proprio l'output che ci aspettavamo, ovvero date e ora correnti.

```terminaloutput
[...]
Thu Aug 07 18:36:09 UTC 2025
Thu Aug 07 18:36:10 UTC 2025
Thu Aug 07 18:36:11 UTC 2025
```

Questo comando ci mostra tutti i log catturati dal container, e spesso possono essere molto lunghi. In queste situazioni
possiamo sfruttare il parametro `--tail` che ci permette di visualizzare solamente un numero prefissato di righe.

```shell
$ docker logs --tail 1 58f
``` 

In questo modo otterremo soltanto una riga del log partendo dal fondo.

```terminaloutput
[...]
Thu Aug 07 18:36:36 UTC 2025
```

Un'altra cosa utile potrebbe essere quella di mettersi in ascolto dei log in tempo reale. Per ottenere questo risultato
dovremo usare l'opzione `--follow`.

```shell
$ docker logs --tail 1 --follow 58f
``` 

Come potrete notare, questo comando non restituisce alcun output fino a quando non si verifica un cambiamento nel log
nel caso del nostro container clock ogni secondo.

```terminaloutput
[...]
Thu Aug 07 18:36:54 UTC 2025
Thu Aug 07 18:36:55 UTC 2025
Thu Aug 07 18:36:56 UTC 2025
```

Per uscire e tornare al nostro terminare, premiamo `^C`.

***

> __run containers in background__
>
> - docker stop -> SIGTERM + SIGKILL @todo verificare che sia term e non stop
> - docker kill -> SIGKILL

Vediamo ora come stoppare i container.

Per arrestare i container in esecuzione in background abbiamo a disposizione due comandi: `docker stop` e `docker kill`.
Che rispettivamente inviano al container i segnali `SIGTERM` e `SIGKILL`.
Il secondo è quello più aggressivo, invia immediatamente il segnale `SIGKILL` che forza l'arresto del container.
Mentre il secondo è un po più tollerante, invia il segnale `SIGTERM` e se il processo in esecuzione è in grado di 
gestirlo farà si che la nostra applicazione termini in maniera corretta; se entro dieci secondi il container è ancora in
esecuzione invierà il segnale `SIGKILL` e ne forzerà l'arresto immediato.

***

Procediamo quindi con il comando:

```shell
$ docker stop 58f
```

Vedremo che non succederà nulla, in quanto il container contiene un semplice shell script che non è stato progettato 
per gestire il segnale `SIGTERM` dovremo quindi attendere dieci secondi che il `SIGKILL` venga inviato e faccia il suo
sporco lavoro.

Per i prossimi due andiamo giù pesante direttamente con il comando:

```shell
$ docker kill a65 66e
```

E come possiamo notare, verranno entrambi stoppati immediatamente.
Se lanciamo infatti nuovamente il comando:

```shell
$ docker ps
```

non vedremo più nulla in esecuzione.

```terminaloutput
CONTAINER ID   IMAGE   [...]   CREATED   STATUS   [...]
```

***

Se volessimo infine, vedere che fine hanno fatto i container che abbiamo arrestato, usiamo il comando:

```shell
$ docker ps -a
```

che sta per all, e ci restituisce per l'appunto tutti i container, anche quelli arrestati.

```terminaloutput
CONTAINER ID   IMAGE          [...]   CREATED         STATUS                           [...]
58f2e75907e2   zavy86/clock   [...]   5 minutes ago   Exited(137) About a minute ago   [...]
a658e9ee5d97   zavy86/clock   [...]   5 minutes ago   Exited(137) About a minute ago   [...]
66e1d31f67d9   zavy86/clock   [...]   5 minutes ago   Exited(137) About a minute ago   [...]
```

Vedremo poi nei capitoli successivi come far sparire i container da questa lista.

***

> Resources:
> - [clock](../../sources/clock)

[Prosegui](../05-restarting-attaching/IT.md) al prossimo capitolo.
