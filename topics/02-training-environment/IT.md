# Our training environment

> __our training environment__
>
> - docker desktop
> - docker on linux vm
> - play with docker

Per seguire questi tutorial non hai bisogno di nulla, puoi semplicemente guardare i video o seguire questa documentazione.
Tuttavia il vero valore di questo corso sta nella possibilità di sperimentare: provare, smanettare e mettersi in gioco con
Docker è il modo più efficace per assimilare davvero ogni concetto.

Ed è per questo che avrai bisogno di un tuo personale ambiente di training.

Le opzioni sono molteplici, ma in questo capitolo vedremo le tre più comuni.

Se utilizziate Windows o MacOS, soluzione più veloce è sicuramente quella di andare sul sito ufficiale di Docker nella
sezione [Desktop](https://docker.com/desktop/) e scaricare l'applicazione **Docker Desktop**. Questa applicazione include 
tutto il necessario per eseguire Docker sul tuo computer, verra creatà una virtual machine in maniera del tutto trasparente.

Tramite questa applicazione potrete eseguire anche un sacco di operazioni tramite la sua comoda interfaccia grafica, tuttavia
nel corso mi vedrete utilizzare solo la **CLI** da terminale, che è il modo più comune e universale per interagire con Docker.

Se invece volete l'esperienza completa di quello che potrebbe essere l'utilizzo di Docker su un server Linux in produzione,
se siete un minimo esperti di macchine virtuali, e avete a disposizione un VPS in cloud, una VM in locale o un server fisico
di qualunque tipo, potrete installare direttamente il **Docker Engine** seguendo le istruzioni sempre disponibili sul sito
di Docker nella sezione [Documentazione](https://docs.docker.com/engine/install/).

Ma per cominciare e smanettare con i primi comandi potete anche saltare a pié pari questa sezione e utilizzare il comodissimo
sito [Play with Docker](https://labs.play-with-docker.com/) che vi permette di avere accesso a un ambiente Docker usa e getta
pronto all'uso senza dover installare nulla che verrà resettato dopo due ore.

Potrete poi sempre passare alle altre soluzioni in qualunque momento se lo riterrete opportuno.

Magari in questo momento non siete ancora convinti che Docker possa fare per voi, e lo capisco, ma alla fine di questo corso
scommetto che non vedrete l'ora di buttarvi a capofitto nel mondo della "containerizzazione".

***

> __our training environment__
>
> - engine
> - desktop
> - cli

Ma facciamo un saltino indietro. Che cos'è Docker? E Come funziona?

Con "installazione di Docker" si intende in sostanza l'installazione del **Docker Engine** (il motore vero e proprio) e la
**Docker CLI** (l'interfaccia da riga di comando). Questi sono i due componenti minimi che costituiscono Docker.

Il Docker Engine è un _daemon_, un servizio che gira in background e si occupa di gestire i container, nello stesso modo in
cui ad esempio un _hypervisor_ gestisce le macchine virtuali.

Per interagire con questo servizio si utilizza la Docker CLI, un programma a riga di comando da eseguire nel terminale e che
comunica con il Docker Engine tramite una serie di API (application programming interface).

**Docker Desktop** è un'ulteriore astrazione, una GUI che comunica anch'essa con il Docker Engine tramite API, e che facilita
la vita per le operazioni più comuni non dovendo digitare a mano tutta una serie di comandi e avendo a colpo d'occhio tutte
le informazioni relative allo stato dei container.

***

Se avete scelto di utilizzare il Play With Docker dovrete effettuare l'accesso con un account Docker (che potete creare 
gratuitamente) e premere il pulsante `ADD NEW INSTANCE`, a quel punto vedrete comparire un nodo tutto per voi, selezionatelo
e avrete accesso a una shell interattiva. Volendo potrete anche collegarvi tramite il vostro SSH preferito.

Se avete scelto di installare il Docker Desktop, semplicemente scaricate il setup per il vostro sistema operativo e seguite
le istruzioni, al termine aprite il vostro terminale preferito. Se siete in ambiente Windows vi consiglio di utilizzare la
[Git Bash](https://git-scm.com/downloads/win) che vi troverete già preinstallata qualora abbiate installato Git sul vostro
computer, oppure [Cygwin](https://cygwin.com/) che vi garantiscono l'esperienza più simile a quella di questo tutorial.
Se invece siete su MacOS il terminale nativo è completamente compatibile con tutti i comandi che verranno utilizzati.

Se invece avete scelto di utilizzare il Docker Engine in ambiente Linux, avrete già tutto sotto controllo!

Qualunque delle precedenti opzioni abbiate scelto un bel:

```shell
$ docker version
```

Sarà sufficiente per verificare che Docker sia installato e correttamente funzionante.

***

[Prosegui](../03-first-container/IT.md) al prossimo capitolo.
