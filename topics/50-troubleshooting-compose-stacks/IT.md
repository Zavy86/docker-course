# Troubleshooting Compose stacks

> __collect evidence before changing things__
>
> - identify the target
> - change one thing at a time
> - inspect configuration and state

Quando un'applicazione smette di rispondere, non è sempre immediato capire dove si trovi il problema. Il container
potrebbe essersi fermato, un servizio da cui dipende potrebbe non essere pronto oppure a causa di un aggiornamento una
applicazione potrebbe ascoltare su una porta diversa da quella prevista. Dall'esterno il risultato può sembrare lo
stesso, ma ciascuna di queste situazioni richiede un intervento diverso.

La tentazione è riavviare tutto o eliminare qualche risorsa per ripartire da una situazione pulita. Il riavvio, però,
può far scomparire temporaneamente il sintomo senza aiutarci a capirne la causa, mentre una pulizia può cancellare dati
che ci sarebbero serviti per ricostruire ciò che è successo.

Se il problema si ripresenta, rischiamo così di ritrovarci al punto di partenza.

Per uscirne ci serve un metodo che ci accompagni dal sintomo alla causa. Potremmo partire dalla configurazione e dallo
stato dei servizi, potremmo leggere i log e confrontare ciò che osserviamo con il comportamento atteso. Queste 
informazioni ci aiutano a formulare un'ipotesi e a scegliere una modifica mirata.

Ogni modifica che ci viene in mente di provare dovrà essere applicata una alla volta, ripetendo la verifica ogni volta,
cosi da capire se la correzione ha avuto l'effetto previsto o meno.

In questo capitolo vedremo quindi come indagarne la causa di un problema. 

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/sources/compose/troubleshooting
```

E iniziamo chiarendo su quale host stiamo operando:

```shell
$ docker context show
```
```terminaloutput
default
```

In questo caso l'host locale, verifichiamo la configurazione dello stack:

```shell
$ docker compose config
```
```terminaloutput
name: troubleshooting
services:
  client:
    command:
      - sh
      - -c
      - |
        while true; do
          wget -T 2 -q -O - http://web:8081 || echo "Request failed"
          sleep 5
        done
    image: busybox
    init: true
    networks:
      default: null
  web:
    command:
      - sh
      - -ec
      - |
        mkdir -p /www
        echo "Service available" > /www/index.html
        exec httpd -f -p 8080 -h /www
    image: busybox
    networks:
      default: null
networks:
  default:
    name: troubleshooting_default
```

Avviamo lo stack qualora non lo sia ancora (in un contesto di analisi in produzione ovviamente lo sarà già):

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 3/3
 ✔ Network troubleshooting_default    Created                                                                       0.0s
 ✔ Container troubleshooting-web-1    Started                                                                       0.1s
 ✔ Container troubleshooting-client-1 Started                                                                       0.1s
```

E scopriamo i dettagli dello stack con:

```shell
$ docker compose ls
```
```terminaloutput
NAME                STATUS              CONFIG FILES
troubleshooting     running(2)          /Users/Zavy/Repositories/docker/sources/compose/troubleshooting/compose.yaml
```

E il dettaglio dei container con:

```shell
$ docker compose ps -a
```
```terminaloutput
NAME                       IMAGE     COMMAND                  SERVICE   CREATED              STATUS
troubleshooting-client-1   busybox   "sh -c 'while true; …"   client    About a minute ago   Up About a minute   
troubleshooting-web-1      busybox   "sh -ec 'mkdir -p /w…"   web       About a minute ago   Up About a minute  
```

Facciamo anche attenzione a eventuali parametri aggiuntivi usati durante l'avvio dello stack. Eventuali `--env-file`,
`-f`, `-p` vanno mantenuti identici. A questo scopo io solitamente mi preparo sempre dei Makefile così da non richiare 
di diagnosticare un modello diverso da quello distribuito.

Andiamo quindi a visualizzare i logs del client per capire meglio cosa sta succedendo:

```shell
$ docker compose logs --tail 9 --timestamps client
```
```terminaloutput
client-1  | 2026-11-14T09:24:36.956208800Z wget: can't connect to remote host (172.19.0.2): Connection refused
client-1  | 2026-11-14T09:24:36.956370300Z Request failed
client-1  | 2026-11-14T09:24:41.962772844Z wget: can't connect to remote host (172.19.0.2): Connection refused
client-1  | 2026-11-14T09:24:41.963008885Z Request failed
client-1  | 2026-11-14T09:24:46.971715013Z wget: can't connect to remote host (172.19.0.2): Connection refused
client-1  | 2026-11-14T09:24:46.971930971Z Request failed
client-1  | 2026-11-14T09:24:51.976441793Z wget: can't connect to remote host (172.19.0.2): Connection refused
client-1  | 2026-11-14T09:24:51.977356126Z Request failed
client-1  | 2026-11-14T09:24:56.986025003Z wget: can't connect to remote host (172.19.0.2): Connection refused
client-1  | 2026-11-14T09:24:56.986172795Z Request failed
```

Come avevamo visto nei controlli precedenti nonostante il modello sia valido e i container possano risultare `running`,
le richieste falliscono lo stesso.

Non avendo ancora evidenza di un problema legato a Docker, proviamo a simulare il comportamento del client:

```shell
$ docker compose exec client nslookup web
```
```terminaloutput
Server:         127.0.0.11
Address:        127.0.0.11:53
Non-authoritative answer:
Name:    web
Address: 172.19.0.2
```

Come possiamo vedere la risoluzione dell'hostname funziona correttamente, proviamo quindi a scaricare la pagina:

```shell
$ docker compose exec client wget -T 2 -O - http://web:8080
```
```terminaloutput
Connecting to web:8080 (172.19.0.2:8080)
100% |****************************************************|    18  0:00:00 ETA
writing to stdout

Service available
```

Anche in questo secondo comando otteniamo il risultato atteso, cosa sta succedendo quindi?

Torniamo a verificare il file `compose.yaml`:

```shell
$ nano compose.yaml
```

Se guardiamo attentamente, il server espone correttamente il servizio sulla porta `8080`, tuttavia il nostro client sta
provando a collegarsi alla porta `8081`. Andiamo quindi a correggere il comando del client e ricreiamo lo stack:

```shell
$ docker compose up -d client
```
```terminaloutput
[+] up 1/1
 ✔ Container troubleshooting-client-1 Started                                                                       0.1s
```

Controlliamo poi di nuovo i log:

```shell
$ docker compose logs --tail 9 --timestamps client
```
```terminaloutput
client-1  | 2026-11-14T09:37:25.304351044Z Service available
client-1  | 2026-11-14T09:37:30.311207838Z Service available
client-1  | 2026-11-14T09:37:35.318069382Z Service available
client-1  | 2026-11-14T09:37:40.323190843Z Service available
client-1  | 2026-11-14T09:37:45.331062970Z Service available
client-1  | 2026-11-14T09:37:50.334784958Z Service available
client-1  | 2026-11-14T09:37:55.341112377Z Service available
client-1  | 2026-11-14T09:38:00.344881880Z Service available
client-1  | 2026-11-14T09:38:05.353587841Z Service available
```

E come possiamo notare ora tutto è tornato a funzionare correttamente.

Distruggiamo poi lo stack con il solito:

```shell
$ docker compose down
```
```terminaloutput
[+] down 3/3
 ✔ Container troubleshooting-client-1 Removed                                                                       0.1s
 ✔ Container troubleshooting-web-1    Removed                                                                       3.1s
 ✔ Network troubleshooting_default    Removed                                                                       0.1s
```

In questo esempio, abbiamo individuato una differenza precisa, applicato e verificato la correzione, agendo solamente
sul client, senza cancellare reti, immagini o volumi.

***

> __investigate container startup failures__
>
> - read Compose error messages
> - check images and required resources
> - inspect exit codes and application logs

L'esempio della porta sbagliata ci mostra quanto sia utile capire in quale punto si interrompe il funzionamento dello
stack. Possiamo applicare lo stesso ragionamento ad altri problemi, scegliendo i controlli in base a ciò che osserviamo,
invece di provare modifiche senza un'ipotesi precisa.

Se il container non viene nemmeno creato, partiamo dal messaggio di errore restituito da Compose. Potremmo scoprire che
l'immagine non è disponibile, che non abbiamo l'autorizzazione per scaricarla dal registry oppure che manca una rete
esterna o un percorso sull'host. Anche un'immagine costruita per un'architettura incompatibile può impedire l'avvio del
processo. Un file YAML valido, quindi, non basta a garantire che il servizio possa partire sul nostro specifico host.

Quando invece il container viene creato ma il processo termina, possiamo partire dal comando `ps -a` per vedere anche i
container fermati e leggere poi i log del servizio coinvolto. Mettere insieme lo stato del container, il codice di
uscita e i messaggi dell'applicazione ci aiuta a ricostruire l'accaduto. Un singolo dato può essere ambiguo, per esempio
un codice di errore `137`, da solo, non dimostra che la memoria sia effettivamente esaurita.

***

> __check health and service communication__
>
> - inspect failing healthchecks
> - verify name resolution and connections
> - interpret HTTP responses

Potremmo anche trovare un servizio indicato come `unhealthy` mentre il suo processo è ancora attivo. In questo caso è il
controllo di salute a non riuscire, quindi leggiamo l'output dei suoi tentativi e proviamo a eseguire a mano lo stesso
controllo e verifichiamone l'esisto. Questo ci aiuta a capire se l'applicazione non è realmente pronta o se il controllo
stesso è configurato male e se l'applicazione necessita di più tempo per essere pronta potremmo aggiungere una pausa.

Se il problema riguarda la comunicazione tra servizi, distinguiamo la risoluzione del nome dalla connessione. Quando il
nome non viene risolto, verifichiamo che i servizi condividano la rete prevista e che il nome o l'alias usato sia
corretto. Se invece il nome si risolve ma la connessione viene rifiutata, torniamo a controllare la porta e l'indirizzo
su cui il processo è in ascolto.

Ricordiamoci che `localhost`, dentro un container, indica il container stesso e non un altro servizio dell'host.

Ricevere una risposta HTTP ci porta a un passaggio successivo della diagnosi. Se otteniamo un errore come `401`, `403`
o `404`, abbiamo raggiunto un server HTTP, anche se potrebbe essere un proxy o un servizio diverso da quello atteso.
Possiamo quindi controllare le credenziali, il percorso richiesto, l'hostname e la configurazione dell'applicazione o
del proxy, usando la risposta ricevuta per orientare la ricerca.

***

> __use debug tools and inspect mounts__
>
> - use temporary diagnostic tools
> - verify mount sources and destinations
> - check ownership and permissions

Durante questi controlli potremmo anche accorgerci che l'immagine non contiene una shell, `curl` o gli strumenti per 
verificare il DNS. È una situazione comune con le immagini minimali. Per proseguire potremmo quindi usare un servizio
temporaneo dedicato alla diagnosi, collegato alla rete interessata, scegliendo un'immagine affidabile e assegnandogli
solo i privilegi necessari. Avremo così gli strumenti utili senza dover modificare il container che stiamo esaminando.

Oppure se proprio vogliamo modificare il container installando i tool necessari, sarebbe buona pratica, una volta finito
di eliminare il container aggiornato e riavviare lo stack con il container ufficialmente distribuito.

Se notiamo un errore di un file mancante o non scrivibile controlliamo ciò che il container ha davvero montato al suo 
interno. Verifichiamo sorgente del mount, destinazione, sola lettura e UID/GID. Un volume montato su una directory può
anche nascondere i file predefiniti dell'immagine.

Non trasformiamo un problema di permessi in un accesso indiscriminato all'intero filesystem. Correggiamo il percorso e
il proprietario previsti, dopo aver verificato quali dati stiamo modificando e dove risiedono.

***

> __a full disk needs an inventory__
>
> - distinguish data, images, logs and cache
> - project cleanup is not daemon cleanup
> - preserve recovery material

Quando lo spazio sul disco si esaurisce, uno stack può smettere di funzionare anche se la sua configurazione non è
cambiata. La tentazione potrebbe essere eliminare subito immagini, container o volumi per recuperare spazio, ma senza
sapere che cosa lo stia occupando rischiamo di cancellare dati utili e di lasciare irrisolta la causa del problema.

Per intervenire partiamo quindi da un inventario, distinguendo lo spazio occupato da immagini, container, volumi,
log e cache di build. Affianchiamo a questa panoramica il controllo del filesystem dell'host e dei percorsi usati dai
bind mount, perché lo spazio occupato dalle risorse Docker non racconta necessariamente tutta la situazione.

Una volta individuato che cosa occupa spazio, dobbiamo capire che cosa possiamo davvero eliminare. Un volume non
utilizzato da un container attivo potrebbe ancora contenere i dati di un'applicazione, mentre un'immagine precedente
privata potrebbe servirci per tornare a una versione funzionante. Anche la cache di build potrebbe essere usata da altri
progetti presenti sullo stesso host. Il fatto che una risorsa non sia in uso in quel momento non significa quindi che
sia sacrificabile.

Prima di procedere con una pulizia verifichiamo perciò quali risorse saranno coinvolte e se abbiamo i backup necessari
per recuperare i dati che vogliamo conservare. Le operazioni di pulizia generali possono interessare più progetti
gestiti dallo stesso daemon, indipendentemente dalla directory in cui ci troviamo. Preferiamo sempre un intervento 
mirato e controlliamo poi lo spazio recuperato e il comportamento dell'applicazione per verificare che il problema
sia stato effettivamente risolto.

Una buona diagnosi produce una causa verificabile e una modifica mirata. 

***

> Resources
>
> - [Inspecting Docker objects](https://docs.docker.com/reference/cli/docker/inspect/)
