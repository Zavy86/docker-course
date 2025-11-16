# Our training environment

> __our training environment__
>
> - on desktop
> - on linux server
> - play with docker

Per seguire questo corso non hai bisogno di nulla, puoi semplicemente guardare i video o seguire questa documentazione.
Tuttavia il vero valore di questo corso sta nella possibilità di sperimentare: provare, smanettare e mettersi in gioco 
con Docker è il modo più efficace per assimilare davvero ogni concetto.

Ed è per questo che avrai bisogno di un tuo personale ambiente di training.

Le opzioni sono molteplici, ma in questo capitolo vedremo le tre più comuni.

Se utilizzate Windows o MacOS o anche Linux, la soluzione più veloce è sicuramente quella di andare sul sito ufficiale 
di Docker nella sezione [Desktop](https://docker.com/desktop/) e scaricare l'applicazione **Docker Desktop**. 
Questa applicazione include tutto il necessario per eseguire Docker sul tuo computer.
Nel caso non siate in ambiente Linux verra creata una virtual machine per gestire il tutto in maniera trasparente.

Tramite questa applicazione potrete eseguire anche un sacco di operazioni tramite la sua comoda interfaccia grafica, 
tuttavia nel corso mi vedrete utilizzare solo la **CLI** da terminale, che è il modo più comune e universale per 
interagire con Docker.

Se invece volete l'esperienza completa di quello che potrebbe essere l'utilizzo di Docker su un server in produzione, se
siete un minimo esperti di macchine virtuali, e avete a disposizione un VPS in cloud, una VM in locale oppure un server
fisico di qualunque tipo (anche un semplice raspberry), potrete installare direttamente il **Docker Engine** seguendo le
istruzioni sempre disponibili sul sito di Docker nella sezione [Engine Install](https://docs.docker.com/engine/install/).

Ma per cominciare e smanettare con i primi comandi potete anche saltare a questa sezione e utilizzare il comodissimo
sito [Play with Docker](https://labs.play-with-docker.com/) che vi permette di avere accesso a un ambiente Docker "usa e
getta" pronto all'uso senza dover installare nulla che verrà resettato dopo due ore.

Potrete poi sempre passare alle altre soluzioni in qualunque momento se lo riterrete opportuno.

Magari in questo momento non siete ancora convinti che Docker possa fare per voi, e lo capisco, ma alla fine di questo
corso scommetto che non vedrete l'ora di buttarvi a capofitto nel mondo della "containerizzazione".

***

> __our training environment__
>
> - engine
> - desktop
> - cli

Ma facciamo un saltino indietro. Che cos'è Docker? E Come funziona?

Con "installazione di Docker" si intende in sostanza l'installazione del **Docker Engine** (il motore vero e proprio) e 
la **Docker CLI** (l'interfaccia da riga di comando). Questi sono i due componenti minimi che costituiscono Docker.

Il Docker Engine è un _daemon_, un servizio che gira in background e si occupa di gestire i container, più o meno per
semplificare di molto come un _hypervisor_ gestisce le macchine virtuali.

Per interagire con questo servizio si utilizza la Docker CLI, un programma a riga di comando da eseguire nel terminale e 
che comunica con il Docker Engine tramite una serie di API (application programming interface).

**Docker Desktop** è un'ulteriore astrazione, una GUI che comunica anch'essa con il Docker Engine tramite le sue API, e 
che facilita la vita per le operazioni più comuni non dovendo digitare a mano i vari comandi e avendo a colpo d'occhio
tutte le informazioni relative allo stato dei container.

***

Se avete scelto di utilizzare il Play With Docker dovrete effettuare l'accesso con un account Docker (che potete creare 
gratuitamente) e premere il pulsante `ADD NEW INSTANCE`, a quel punto vedrete comparire un nuovo nodo, selezionatelo
e avrete accesso a una shell interattiva (e volendo potrete anche collegarvi tramite il vostro SSH preferito).

Se avete scelto di installare il Docker Desktop, semplicemente scaricate il file di installazione per il vostro sistema
operativo e seguite le istruzioni, al termine aprite il vostro terminale preferito.

Se siete in ambiente Windows vi consiglio di utilizzare un terminale compatibile con lo standard POSIX, così da riuscire
a eseguire tutti i comando proprio come li vedere all'interno di questo corso, per esempio potreste optare per la
[Git Bash](https://git-scm.com/downloads/win) che vi troverete già preinstallata qualora abbiate già installato Git sul
vostro computer, oppure [Cygwin](https://cygwin.com/) che contiene una collezione di tool fra cui la shell Bash.
Mentre se siete su MacOS il terminale nativo è completamente compatibile con tutti i comandi che verranno utilizzati.

Se invece avete scelto di utilizzare il Docker Engine in ambiente Linux Server, il modo più semplice per installarlo è
utilizzare il comando:

```shell
$ sudo curl -fsSL get.docker.com | sh
```

Che sfrutterà un comodissimo script messo a disposizione da Docker per installare Docker sul vostro sistema.
Dopodiché se non volete dover utilizzare `sudo` ad ogni comando Docker, aggiungete il vostro utente al gruppo `docker` 
con il comando:

```shell
$ sudo usermod -aG docker $USER
```

Ed effettuate nuovamente l'accesso al terminale così da ricaricare i nuovi permessi.

---

Qualunque delle precedenti opzioni abbiate scelto di utilizzare dovreste essere in grado ora di eseguire il comando:

```shell
$ docker version
```

```terminaloutput
Client: Docker Engine - Community
 Version:           28.5.1
 API version:       1.51
 Go version:        go1.24.8
 Git commit:        e180ab8
 Built:             Wed Oct  8 12:18:19 2025
 OS/Arch:           linux/arm64
 Context:           default

Server: Docker Engine - Community
 Engine:
  Version:          28.5.1
  API version:      1.51 (minimum version 1.24)
  Go version:       go1.24.8
  Git commit:       f8215cc
  Built:            Wed Oct  8 12:18:19 2025
  OS/Arch:          linux/arm64
  Experimental:     false
 containerd:
  Version:          v1.7.28
  GitCommit:        b98a3aace656320842a23f4a392a33f46af97866
 runc:
  Version:          1.3.0
  GitCommit:        v1.3.0-0-g4ca628d1
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
```

Che vi permetterà di verificare che Docker sia installato e correttamente funzionante.

***

[Prosegui](../03-first-container/IT.md) al prossimo capitolo.
