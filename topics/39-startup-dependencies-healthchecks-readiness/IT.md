# Startup dependencies, healthchecks, and readiness

> __startup dependencies and readiness__
>
> - running is not ready
> - check the service, not just the process
> - recover after startup too

Quando avviamo uno stack con più servizi l'ordine di partenza non basta sempre a garantire che tutto sia davvero pronto.

Un container può risultare già in esecuzione anche mentre l'applicazione sta ancora caricando la configurazione, aprendo
connessioni, preparando dati iniziali o aspettando che un processo interno sia disponibile.

**Avviato** e **pronto** sono quindi due condizioni diverse. 

Per verificare una condizione concreta, possiamo definire degli healthcheck, che Compose può attendere prima di avviare
un servizio dipendente.

E vedremo anche cosa succede dopo che una dipendenza smette di rispondere quando lo stack è già partito.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose/readiness
```

E analizziamo il file `compose.yaml`:

```yaml
services:
  server:
    image: busybox
    command:
      - sh
      - -c
      - |
        sleep 9
        mkdir -p /www
        echo ready > /www/ready
        exec httpd -f -p 8080 -h /www
  client:
    image: busybox
    init: true
    depends_on:
      - server
    command:
      - sh
      - -c
      - |
        while true; do
          if wget -q -T 2 -O /dev/null http://server:8080/ready; then
            echo "Request succeeded"
          else
            echo "Service unavailable, retrying"
          fi
          sleep 2
        done
```

Useremo l'immagine `busybox` che contiene un piccolo server HTTP e il client che ci servono per questo esempio.

Nel primo servizio, chiamato `server`, abbiamo definito un comando che aspetta per nove secondi, prepara un file `ready`
e tramite `exec` avvia un server HTTP in foreground.

Il ritardo, in questo esempio, ci serve soltanto a rendere visibile l'inizializzazione...

Nel servizio `client` invece il comando prova a fare una richiesta ogni due secondi. Se fallisce, stampa un messaggio e
riprova invece di terminare.

L'opzione `init: true` avvia un piccolo processo init nel container, utile in questo esempio per inoltrare correttamente
i segnali e ripulire eventuali processi figli terminati.

Proviamo quindi ad avviare lo stack e vediamo cosa succede:

```shell
$ docker compose up
```
```terminaloutput
[+] up 6/6
 ✔ Image busybox                        Pulled                                                                      2.9s
 ✔ Network compose-readiness_default    Created                                                                     0.0s
 ✔ Container compose-readiness-server-1 Created                                                                     0.0s
 ✔ Container compose-readiness-client-1 Created                                                                     0.0s
Attaching to client-1, server-1
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
Gracefully Stopping... press Ctrl+C again to force
Container compose-readiness-client-1 Stopping 
Container compose-readiness-client-1 Stopped 
Container compose-readiness-server-1 Stopping 
client-1 exited with code 143                                                                                
Container compose-readiness-server-1 Stopped                                                                 
server-1 exited with code 137
```

A parte le possibili differenze di Indirizzi IP, dovreste vedere qualcosa di simile, nei primi secondi di avvio possiamo
osservare delle richieste fallire per poi riuscire correttamente dopo i nove secondi definiti.

Grazie all'opzione `depends_on` Compose ha rispettato l'ordine ma non ha atteso che il server fosse pronto a ricevere le
connessioni HTTP, il risultato è stato appunto quello di ricevere degli errori lato client.

Usiamo `Ctrl+C` per uscire e arrestiamo lo stack con il comando:

```shell
$ docker compose up
```
```terminaloutput
[+] down 3/3
 ✔ Container compose-readiness-client-1 Removed                                                                     0.0s
 ✔ Container compose-readiness-server-1 Removed                                                                     0.0s
 ✔ Network compose-readiness_default    Removed                                                                     0.1s
```

***

Andiamo ora a modificare il servizio `server` aggiungendo un blocco dedicato al controllo:

```yaml
services:
  server:
    [...]
    healthcheck:
      test: [ "CMD", "wget", "-q", "-T", "2", "-O", "/dev/null", "http://127.0.0.1:8080/ready" ]
      interval: 2s
      timeout: 5s
      retries: 3
      start_period: 30s
    [...]
```

Questo controllo viene eseguito dentro il container stesso come possiamo notare dall'indirizzo `127.0.0.1`.

L'istruzione `CMD` esegue il programma e i suoi argomenti senza una shell, qualora avessimo la necessità di utilizzare
espressioni complesse con `&&`, pipe o variabili interpretate dalla shell dovremo useremmo `CMD-SHELL`.

Oltre al test, dobbiamo anche specificare un `interval`, ovvero la frequenza in cui verranno effettuati i controlli, il
`timeout` per limitare la durata di ciascun tentativo, il numero di `retries` per indicare quanti fallimenti consecutivi
servono per considerare il container `unhealthy` e lo `start_period` che definisce un periodo iniziale nel quale i 
fallimenti non vengono conteggiati.

Lo start period non obbliga ad aspettare trenta secondi, un controllo riuscito può rendere il container `healthy` prima.

Infine, nel servizio `client` sostituiamo la lista di `depends_on` con questa mappa:

```yaml
[...]
  client:
    image: busybox
    depends_on:
      server:
        condition: service_healthy
  [...]
```

Rifacciamo la prova rilanciando lo stack con:

```shell
$ docker compose up
```
```terminaloutput
[+] up 3/3
 ✔ Network compose-readiness_default    Created                                                                     0.0s
 ✔ Container compose-readiness-server-1 Created                                                                     0.0s
 ✔ Container compose-readiness-client-1 Created                                                                     0.0s
Attaching to client-1, server-1
Container compose-readiness-server-1 Waiting 
Container compose-readiness-server-1 Healthy 
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
Gracefully Stopping... press Ctrl+C again to force
Container compose-readiness-client-1 Stopping 
Container compose-readiness-client-1 Stopped 
Container compose-readiness-server-1 Stopping 
client-1 exited with code 143                                                                                
Container compose-readiness-server-1 Stopped 
server-1 exited with code 137
```

E vedremo che ora Compose aspetterà che l'healthcheck del `server` risponda positivamente prima di avviare il `client`.

L'attesa iniziale è visibile nel comando di avvio, quando termina correttamente, `server` risulta `healthy` e il client
comincia a inviare le richieste ottenendo immediatamente risposta riuscita.

***

> __read the health status__
>
> - starting
> - healthy
> - unhealthy
> - completed

Le condizioni disponibili rappresentano tre esigenze diverse: `service_started` corrisponde all'attesa del semplice 
avvio, come nella lista iniziale. `service_healthy` richiede un healthcheck riuscito, mentre `service_completed_successfully` 
aspetta invece che un servizio termini con codice zero, adatto ad attività di inizializzazione, che approfondiremo nel
prossimo capitolo.

Non mettiamo `service_completed_successfully` su un server che deve rimanere acceso perché Compose starebbe ad aspettare
la sua conclusione senza riuscire mai a ottenere un esito.

Lo stato di salute parte da `starting` e cambia in base ai risultati del controllo.

Ricordiamoci che un healthcheck ci dice soltanto ciò che abbiamo deciso di misurare.

***

Ora riavviamo nuovamente lo stack in background con:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Container compose-readiness-server-1 Healthy                                                                    10.1s
 ✔ Container compose-readiness-client-1 Started                                                                     0.1s
```

E fermiamo manualmente il server con il comando:

```shell
$ docker compose stop server
```
```terminaloutput
[+] stop 1/1
 ✔ Container compose-readiness-server-1 Stopped                                                                     3.1s
```

E andiamo a vedere gli ultimi logs del client:

```shell
$ docker compose logs --tail 10 -f client
```
```terminaloutput
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | wget: bad address 'server:8080'
client-1  | Service unavailable, retrying
client-1  | wget: bad address 'server:8080'
client-1  | Service unavailable, retrying
client-1  | wget: bad address 'server:8080'
client-1  | Service unavailable, retrying
```

Come possiamo notare, il client continua a vivere e segnala che il servizio non è disponibile.

Usciamo dai log con `Ctrl+C`, poi riavviamo il server:

```shell
$ docker compose start server
```
```terminaloutput
[+] start 1/1
 ✔ Container compose-readiness-server-1 Started                                                                     0.1s
```

E torniamo a visionare il log del client:

```shell
$ docker compose logs --tail 10 -f client
```
```terminaloutput
client-1  | wget: bad address 'server:8080'
client-1  | Service unavailable, retrying
client-1  | wget: bad address 'server:8080'
client-1  | Service unavailable, retrying
client-1  | wget: bad address 'server:8080'
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | wget: can't connect to remote host (172.18.0.2): Connection refused
client-1  | Service unavailable, retrying
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
```

Noteremo che dopo il ritardo iniziale, le richieste tornano a riuscire.

***

Facciamo ora un'ultima prova, senza fermare il server. Usciamo dai log e spostiamo temporaneamente il file dimostrativo 
dentro il container:

```shell
$ docker compose exec web mv /www/ready /www/ready.off
```

Dopo alcuni controlli falliti, Docker ci mostrerà `server` ancora in esecuzione ma `unhealthy`.

```shell
$ docker compose ps
```
```terminaloutput
NAME                         IMAGE     COMMAND                   SERVICE   CREATED          STATUS
compose-readiness-client-1   busybox   "sh -c 'while true; …"    client    18 minutes ago   Up 9 minutes               
compose-readiness-server-1   busybox   "sh -c 'sleep 9\nmkdi…"   server    18 minutes ago   Up 3 minutes (unhealthy)  
```

Il server funziona, però quell'URL non risponde più con successo. Anche il client registrerà il problema:

```shell
$ docker compose logs --tail 10 -f client
```
```terminaloutput
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | Request succeeded
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
client-1  | wget: server returned error: HTTP/1.1 404 Not Found
client-1  | Service unavailable, retrying
```

Le normali politiche `restart`, come `unless-stopped`, reagiscono alla terminazione del processo, non al solo stato 
`unhealthy`. Compose non sostituisce automaticamente il container per questo motivo e non arresta i servizi che avevano 
già superato la condizione `service_healthy`.

Ripristiniamo quindi il file:

```shell
$ docker compose exec server mv /www/ready.off /www/ready
```

E noteremo che lo stato tornerà ad essere `healthy`:

```shell
$ docker compose ps
```
```terminaloutput
NAME                         IMAGE     COMMAND                   SERVICE   CREATED          STATUS
compose-readiness-client-1   busybox   "sh -c 'while true; …"    client    20 minutes ago   Up 11 minutes               
compose-readiness-server-1   busybox   "sh -c 'sleep 9\nmkdi…"   server    20 minutes ago   Up 5 minutes (healthy)  
```

Rimuoviamo infine lo stack con il solito comando:

```shell
$ docker compose down
```
```terminaloutput
[+] down 3/3
 ✔ Container compose-readiness-client-1 Removed                                                                     0.1s
 ✔ Container compose-readiness-server-1 Removed                                                                     3.1s
 ✔ Network compose-readiness_default    Removed                                                                     0.1s
```

Un buon avvio e un buon recupero sono quindi due responsabilità complementari, Compose può coordinare le condizioni 
iniziali, mentre l'applicazione deve saper gestire ciò che succede durante il funzionamento.

L'healthcheck rende osservabile una condizione ma non ripara da sola i servizi.

***

> Resources:
>
> - [Control startup and shutdown order](https://docs.docker.com/compose/how-tos/startup-order/)
