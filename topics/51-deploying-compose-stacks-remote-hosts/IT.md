# Deploying Compose stacks to remote hosts

> __same model, different Docker Engine__
>
> - local client
> - remote daemon
> - explicit destination

Anche se sul nostro computer funziona tutto correttamente, portare lo stack su un server può far emergere problemi che
in locale non avevamo. Finché abbiamo lavorato in locale, il file Compose, le directory da montare e i container si
trovavano sulla stessa macchina. Passando a un host remoto, questa corrispondenza viene meno e un comando eseguito dal
nostro terminale potrebbe agire sul server sbagliato oppure cercare file che su quel server non esistono.

Per gestire questo passaggio in maniera più agevole, possiamo usare un contesto Docker, o context, che conserva le
informazioni necessarie per collegarci al daemon del server senza doverci collegare prima al terminale dello stesso.

Continueremo a usare Compose dal nostro computer, ma sceglieremo esplicitamente una diversa destinazione per i comandi.
Il modello dello stack rimane lo stesso, mentre cambiano la macchina che esegue i container e il luogo in cui vengono
conservati i dati.

Scegliere la destinazione, però, è solo la prima parte del lavoro. Dovremo anche preparare l'accesso al server e capire
quali immagini, file e directory serviranno per avviare l'applicazione.

***

> __prepare the destination__
>
> - compatible Docker Engine
> - SSH access and verified host identity
> - documented storage and network requirements

In questo capitolo partiremo da un piccolo servizio web, così da vedere il percorso completo. Per seguire questa prova
ci servirà un server che controlliamo, che sia online o una macchina virtuale sul nostro stesso computer è indifferente.

Ma prima di collegarci distinguiamo i ruoli delle due macchine. Sul nostro computer servono il client Docker, Compose e
il client SSH, perché è da qui che leggeremo la configurazione e invieremo i comandi. Sul server deve invece esserci un
Docker Engine funzionante, possibilmente della stessa versione, capace di eseguire le immagini scelte e un server SSH.

L'utente con cui accediamo via SSH deve quindi poter usare Docker sul server. Se il daemon viene eseguito come root,
l'accesso al suo socket, anche attraverso il gruppo `docker`, può dare un controllo equivalente a quello di un
amministratore. Concediamolo soltanto agli utenti che devono gestire la macchina. Se usiamo Docker in modalità rootless,
dobbiamo invece verificare il socket e i requisiti di accesso di quella configurazione.

***

> __use an explicit context__
>
> - SSH protects daemon access
> - inspect before applying changes
> - avoid changing the global default

Possiamo ora preparare il collegamento. Nei comandi seguenti `docker-user@lab.example.com` è un segnaposto da sostituire
con l'utente e l'indirizzo del nostro server di prova. 

Per prima cosa verifichiamo di riuscire a usare Docker attraverso SSH:

```shell
$ ssh docker-user@lab.example.com docker version
```
```terminaloutput
Client: Docker Engine - Community
 Version:           29.9.3
 API version:       1.56
 Go version:        go1.26.10
 Git commit:        5457199
 Built:             Tue Nov  3 21:42:05 2026
 OS/Arch:           linux/arm64
 Context:           default

Server: Docker Engine - Community
 Engine:
  Version:          29.9.3
  API version:      1.56 (minimum version 1.40)
  Go version:       go1.26.10
  Git commit:       70efc0e
  Built:            Tue Nov  3 21:42:05 2026
  OS/Arch:          linux/arm64
  Experimental:     false
 containerd:
  Version:          v2.4.2
  GitCommit:        b7a25261e029d68978bbf290df0a62fc819b3c51
 runc:
  Version:          1.5.3
  GitCommit:        v1.5.3-0-g46365c62
 docker-init:
  Version:          0.19.0
  GitCommit:        de40ad0
```

Poi creiamo un context chiamato `lab-demo` con il comando:

```shell
$ docker context create lab-demo --docker host=ssh://docker-user@lab.example.com
```
```terminaloutput
lab-demo
Successfully created context "lab-demo"
```

E controlliamo la destinazione registrata:

```shell
$ docker context inspect lab-demo
```
```json
[
    {
        "Name": "lab-demo",
        "Metadata": {},
        "Endpoints": {
            "docker": {
                "Host": "ssh://docker-user@lab.example.com",
                "SkipTLSVerify": false
            }
        },
       [...]
    }
]
```

Il context conserva le informazioni di connessione, così possiamo richiamarle per nome nei comandi successivi.

Durante le prove di questo capitolo indicheremo sempre `--context lab-demo`, in modo da rendere visibile la destinazione
senza cambiare il context predefinito della macchina. Prima di creare risorse, leggiamo l'output di:

```shell
$ docker --context lab-demo info
```
```terminaloutput
Client:
 Version:    29.9.3
 Context:    lab-demo
 Debug Mode: false
 Plugins: [...]

Server:
 Containers: 0
  Running: 0
  Paused: 0
  Stopped: 0
 Images: 1
 Server Version: 29.9.3
 [...]
```

E accertiamoci che le informazioni mostrate corrispondano al server previsto.

La connessione passa attraverso SSH, quindi non abbiamo bisogno di esporre l'API Docker sulla porta TCP 2375 senza
autenticazione. Possiamo gestire il daemon remoto mantenendo protetto questo accesso amministrativo.

***

Per la prima distribuzione useremo un semplice server Nginx, che ormai conosciamo a menadito, così possiamo concentrarci
sul collegamento al server e sulla verifica del servizio.

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

E spostiamoci nella directory:

```shell
$ cd docker-course/sources/compose/remote
```

E verifichiamo il solito file `compose.yaml`:

```yaml
services:
  web:
    image: nginx
    restart: unless-stopped
    ports:
      - "18080:80"
```

Avviamo quindi lo stack, specificando però il nome del contesto:

```shell
$ docker --context lab-demo compose up -d
```
```terminaloutput
[+] up 12/12
 ✔ Image nginx                 Pulled                                                                               3.0s
 ✔ Network remote-demo_default Created                                                                              0.0s
 ✔ Container remote-demo-web-1 Started                                                                              0.2s
```

Se tutto è andato a buon fine verifichiamo i logs del container:

```shell
$ docker --context lab-demo compose logs web
```
```terminaloutput
web-1  | /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
web-1  | /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
web-1  | 10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
web-1  | 10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf
web-1  | /docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
web-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
web-1  | 2026/11/14 10:35:11 [notice] 1#1: using the "epoll" event method
web-1  | 2026/11/14 10:35:11 [notice] 1#1: nginx/1.31.8
web-1  | 2026/11/14 10:35:11 [notice] 1#1: built by gcc 14.2.0 (Debian 14.2.0-19) 
web-1  | 2026/11/14 10:35:11 [notice] 1#1: OS: Linux 7.0.0-38-generic
web-1  | 2026/11/14 10:35:11 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1024:524288
web-1  | 2026/11/14 10:35:11 [notice] 1#1: start worker processes
web-1  | 2026/11/14 10:35:11 [notice] 1#1: start worker process 29
web-1  | 2026/11/14 10:35:11 [notice] 1#1: start worker process 30
```

Anche se abbiamo lanciato i comandi dal nostro terminale, l'immagine viene scaricata dal daemon remoto e viene avviata
sul server. Quest'ultimo deve quindi poter raggiungere il registry e fidarsi dei suoi certificati. Se il registry è
privato, dobbiamo ricordarci di predisporre le credenziali con i permessi necessari attraverso il normale login del
client, senza inserirle nel file YAML.

Lo stesso ragionamento vale per la porta pubblicata. Il mapping `18080:80` rende disponibile la porta 18080 sulle
interfacce del server, e non quelle sul nostro computer. 

Per vedere quindi la pagina possiamo aprire il nostro browser all'indirizzo `lab.example.com:18080`, assicurandoci che
eventuali problemi di rete o blocchi sui firewall non interferiscano con il collegamento.

Per stoppare lo stack sul server remoto, utilizziamo il solito comando, specificando ovviamente il contesto:

```shell
$ docker --context lab-demo compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container remote-demo-web-1 Removed                                                                              0.1s
 ✔ Network remote-demo_default Removed                                                                              0.0s
```

Questo esempio è semplicissimo, ma ogni cosa vista fino a questo momento può essere fatta anche su un contesto remoto.

***

> __know where every file lives__
>
> - Compose reads the model locally
> - bind mounts use daemon-side paths
> - deployment does not copy application data

Il collegamento remoto ci permette di usare gli stessi comandi, ma non rende condivisi i filesystem delle due macchine.
Il file Compose e i file usati per l'interpolazione vengono letti dal client sul nostro computer. Mentre i container e i
volumi nominati vengono invece creati dal daemon sul server, dove rimangono anche i dati dei volumi.

Questa distinzione diventa importante quando aggiungiamo un bind mount. Il percorso sorgente deve essere disponibile
sull'host del daemon, perché il mount non trasferisce una directory dal nostro computer al server. E anche `configs` e
`secrets` definiti a partire da file possono dipendere da mount di file nell'implementazione Compose locale. Il solo uso
di un context SSH non ci garantisce quindi la distribuzione delle loro sorgenti.

Abbiamo evitato i bind nel primo esempio proprio per non mescolare questi due aspetti. Quando servono file sul server,
dobbiamo trasferirli con una procedura esplicita e preparare percorsi remoti assoluti con i permessi adeguati. Scrivere
`./data` nel file Compose non rende disponibile al daemon la directory del nostro computer.

Se lo stack dipende da diversi file, può essere più semplice trasferire sul server i file non sensibili del rilascio ed
eseguire Compose dalla directory di installazione, dentro una sessione SSH. In quel caso configurazione, percorsi 
relativi e daemon si trovano così sulla stessa macchina.

I segreti richiedono comunque un trasferimento o un recupero separato, attraverso un canale protetto e con accesso
ristretto. Prima dell'avvio prepariamo anche le directory e le eventuali reti esterne richieste dallo stack. Un file di
esempio con i nomi delle variabili ci aiuta a documentare ciò che ci servirà senza includere credenziali vere.

***

> __ship images, not accidental workspaces__
>
> - build and publish deliberately
> - check architecture support
> - keep release inputs available

Finora abbiamo usato un'immagine già disponibile. Per distribuire una nostra applicazione possiamo costruire l'immagine,
pubblicarla in un registry e farla scaricare al server con lo stesso procedimento. In questo modo sull'host del server
remoto arriverà ciò che serve ad avviare il servizio, senza dovervi trasferire tutti i sorgenti.

Se decidiamo di costruire l'immagine da qui, dobbiamo però controllare quale builder eseguirà la build e dove verrà reso
disponibile il risultato. Il context usato per gestire i container non basta, da solo, a chiarire questi aspetti. Nel
caso di una build remota verifichiamo anche quali file inviamo come contesto di build, escludendo dati locali e segreti
attraverso al file `.dockerignore`.

Anche l'architettura deve corrispondere a quella del server. Un'immagine costruita soltanto per ARM64 potrebbe non
funzionare su un host AMD64. Scegliamo quindi una variante compatibile o prepariamo una build multi-piattaforma
verificata, senza dare per scontato che l'emulazione sia disponibile o che offra le prestazioni necessarie.

Per poter ripetere la distribuzione conserviamo la configurazione di rilascio, i riferimenti delle immagini e le
istruzioni per ripristinare i dati. Il context ci permette di collegarci al server, ma non conserva una copia dello
stack e non trasferisce automaticamente il contenuto dei volumi.

Dopo la distribuzione, lo stato dei container è il primo controllo. Leggiamo anche i log e facciamo una richiesta
all'applicazione. Quando lo stack contiene dati persistenti, verifichiamo che il servizio riesca a leggerli e a usarli.

E ricordiamoci poi che lo stack dipende dal server su cui lo abbiamo avviato. La politica `unless-stopped` può far
ripartire i container quando torna disponibile il daemon remoto. Assicuriamoci quindi che Docker si avvii insieme
al server cosicché i container potranno ripartire anche senza il nostro computer collegato.

***

> Resources
>
> - [Docker daemon access over SSH](https://docs.docker.com/engine/security/protect-access/)
