# Backup and restore

> __a backup must be restorable__
>
> - consistent data
> - independent copy
> - verified recovery

Se dovessimo recuperare dei dati, a seguito di un errore in un'applicazione, riavviare la singola app o tutto lo stack
potrebbe non essere sufficiente. Il volume potrebbe essere ancora presente e il nuovo servizio avviarsi regolarmente,
tuttavia i dati di cui abbiamo bisogno potrebbero non essere più disponibili. Senza infatti una copia separata dei dati,
un'applicazione che fino a poco prima funzionava potrebbe diventare inutilizzabile.

Per prepararci a una situazione di questo tipo dovremmo conservare un backup, raccogliendo i dati in uno stato coerente
e scegliendo dove custodirli in base ai problemi da cui vogliamo proteggerci. Il volume infatti mantiene i dati durante
la ricreazione dei container, mentre un backup dello stesso ci permette di conservarne una copia da usare qualora quelli
originali venissero persi o danneggiati.

Creare una copia, tuttavia, non ci garantisce da solo di poter recuperare l'intero servizio. Dobbiamo anche provare a
ripristinarla e verificare che l'applicazione riesca effettivamente a utilizzare i dati recuperati, così da conoscere
la procedura e le eventuali difficoltà prima di averne realmente bisogno.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

E spostiamoci nella directory:

```shell
$ cd docker-course/sources/compose/backups
```

E analizziamo il file `compose.yaml`:

```yaml
volumes:
  app-data:
  
services:
  app:
    image: busybox
    command: [ "httpd", "-f", "-p", "8080", "-h", "/data" ]
    volumes:
      - app-data:/data
  tools:
    image: busybox
    profiles: [tools]
    volumes:
      - app-data:/data
      - type: bind
        source: ./backups
        target: /backup
```

Lo stack comprende due servizi basati sull'immagine `busybox`, il primo avvia il server HTTP sulla porta `8080` e
pubblica i file presenti nella directory `/data`. La directory `/data` è collegata al volume `app-data`, dove
conserveremo i dati dell'applicazione. Il suo contenuto rimarrà quindi disponibile anche quando rimuoveremo il container
per ricrearlo. Per eseguire il backup dovremo copiare questi dati in una posizione separata dal volume.

Il servizio `tools` ci permetterà di svolgere le operazioni di backup e ripristino montando lo stesso volume in `/data`.
È associato al profilo `tools`, quindi non partirà normalmente insieme allo stack di default, ma potremo richiamarlo
quando ne avremo bisogno. Inoltre, un bind mount collega la directory locale `./backups` a `/backup` nel container, così
gli archivi creati rimarranno sul computer anche dopo la rimozione del container e del volume.

Per avviare gli stack useremo due progetti diversi, `demo-production` e `demo-restore`, così da mantenerli separati:

Partiamo avviando il primo:

```shell
$ docker compose -p demo-production up -d
```
```terminaloutput
[+] up 3/3
 ✔ Network demo-production_default Created                                                                          0.0s
 ✔ Volume demo-production_app-data Created                                                                          0.0s
 ✔ Container demo-production-app-1 Started                                                                          0.1s
```

Come previsto verrà creata la rete, il volume e il container del nostro servizio.

Procediamo quindi con il creare un file all'interno del volume:

```shell
$ docker compose -p demo-production exec app sh -c 'echo "data to preserve" > /data/index.html'
```

E assicuriamoci che venga servito correttamente dal nostro web server.

```shell
$ docker compose -p demo-production exec app wget -q -O - http://localhost:8080
```
```terminaloutput
data to preserve
```

***

Per questa prova scegliamo il metodo più semplice, fermiamo semplicemente l'applicazione mentre copieremo i dati del
volume (in un sistema reale dovremo fermare o coordinare tutti i processi che scrivono o leggono quei dati, compresi workers ed eventuali job esterni).

```shell
$ docker compose -p demo-production stop app
```
```terminaloutput
[+] stop 1/1
 ✔ Container demo-production-app-1 Stopped                                                                          3.1s
```

Procediamo poi con l'avvio del tool per effettuare il bakcup:

```shell
$ docker compose -p demo-production run --rm --no-deps -T tools sh -ec 'tar -cf /backup/app-data.tar -C /data .'
```
```terminaloutput
[+] run 1/1
 ✔ Container demo-production-tools-run-9da90ff1324e Created                                                         0.0s
```

Se tutto è andato a buon fine, nella directory corrente sotto a `backups` ci troveremo un file chiamato `app-data.tar`.

Verifichiamo che il file sia stato creto correttamente ispezionandone il contenuto con il comando:

```shell
$ docker compose -p demo-production run --rm --no-deps -T tools tar -tf /backup/app-data.tar
```
```terminaloutput
./
./index.html
```

Infine, riavviamo l'applicazione:

```shell
$ docker compose -p demo-production start app
```
```terminaloutput
[+] start 1/1
 ✔ Container demo-production-app-1 Started                                                                          0.1s
```

Facciamo attenzione a cosa backuppiamo e dove salviamo questi backup, in questo piccolo esempio l'archivio contiene solo
un file HTML, i backup veri possono contenere anche segreti e dati personali, quindi scegliamo permessi restrittivi,
se necessario effettuiamone una cifratura e scegliamo lo storage più appropriato dove conservarli.

***

Per testare la procedura di ripristino, senza toccare il volume originale, avviamo quindi il nuovo stack:

```shell
$ docker compose -p demo-restore create app
```
```terminaloutput
[+] create 3/3
 ✔ Network demo-restore_default Created                                                                             0.0s
 ✔ Volume demo-restore_app-data Created                                                                             0.0s
 ✔ Container demo-restore-app-1 Created                                                                             0.0s
```

Con questo comando chiediamo a Compose di creare il contenitore senza avviarlo, contemporaneamente verranno anche creati
la rete e il volume, così da poterlo poi utilizzare per il ripristino.

Procediamo poi con il ripristino dei dati:

```shell
$ docker compose -p demo-restore run --rm --no-deps -T tools sh -ec 'tar -xf /backup/app-data.tar -C /data'
```
```terminaloutput
[+] run 1/1
 ✔ Container demo-restore-tools-run-31a69f49fc4b Created                                                            0.0s
```

A questo punto possiamo avviare il servizio:

```shell
$ docker compose -p demo-restore up -d app
```
```terminaloutput
[+] up 1/1
 ✔ Container demo-restore-app-1 Started                                                                             0.1s
```

Verificare che i dati siano stati ripristinati:

```shell
$ docker compose -p demo-restore exec app cat /data/index.html
```
```terminaloutput
data to preserve
```

E assicuriamoci che il server HTTP sia in grado di servirne il contenuto:

```shell
$ docker compose -p demo-restore exec app wget -q -O - http://localhost:8080
```
```terminaloutput
data to preserve
```

Una volta che ci siamo assicurati che il test di ripristino abbia funzionato, possiamo procedere anche con il ripristino
in produzione.

Distruggiamo lo stack di prova con:

```shell
$ docker compose -p demo-restore down
```
```terminaloutput
[+] down 2/2
 ✔ Container demo-restore-app-1 Removed                                                                             3.1s
 ✔ Network demo-restore_default Removed                                                                             0.1s
```

E come fatto precedentemente iniziamo stoppando l'applicazione nel progetto di produzione:

```shell
$ docker compose -p demo-production stop app
```
```terminaloutput
[+] stop 1/1
 ✔ Container demo-production-app-1 Stopped                                                                          3.1s
```

Procediamo poi con l'avvio del tool per effettuare il ripristino:

```shell
$ docker compose -p demo-production run --rm --no-deps -T tools sh -ec 'tar -xf /backup/app-data.tar -C /data'
```
```terminaloutput
[+] run 1/1
 ✔ Container demo-production-tools-run-9615a66ff33c Created                                                         0.0s
```

Riavviamo l'applicazione:

```shell
$ docker compose -p demo-production start app
```
```terminaloutput
[+] start 1/1
 ✔ Container demo-production-app-1 Started                                                                          0.1s
```

E assicuriamoci che il server HTTP sia nuovamente in grado di servirne il contenuto:

```shell
$ docker compose -p demo-production exec app wget -q -O - http://localhost:8080
```
```terminaloutput
data to preserve
```

Per concludere, eliminiamo anche lo stack di produzione:

```shell
$ docker compose -p demo-production down
```
```terminaloutput
[+] down 2/2
 ✔ Container demo-production-app-1 Removed                                                                          3.1s
 ✔ Network demo-production_default Removed                                                                          0.1s
```

***

> __database backups need database rules__
>
> - use supported backup tools
> - test version compatibility
> - coordinate related data

La procedura che abbiamo appena provato è adatta ai files del nostro esempio, ma nel caso in cui i dati appartengano a 
un database, dovremmo assicurarci alcune accortezze in più. Se copiassimo con `tar` la directory di un database in
esecuzione, i file potrebbero cambiare durante la lettura e finiremmo per raccogliere dati riferiti a momenti diversi.
L'archivio potrebbe quindi essere creato senza errori, ma risultare inutilizzabile al momento del ripristino.

Per PostgreSQL, MySQL o altri database conviene utilizzare uno degli strumenti di backup previsti dal prodotto.

Possiamo ricorrere a un backup logico, come un dump dei dati, oppure a una copia fisica dei file, seguendo in entrambi
i casi la procedura documentata. Anche fermando correttamente il database, infatti, dobbiamo rispettare le condizioni
richieste per la copia e verificare la compatibilità delle versioni e, quando necessario, dell'architettura. 

Dobbiamo inoltre considerare gli eventuali file collegati ai dati del database. Se un record in una tabella si riferisce
a un documento caricato dall'utente, recuperare soltanto il record non ci restituirà anche il documento. Il backup dovrà
comprendere entrambi, mantenendoli coerenti tra loro, altrimenti l'applicazione potrebbe avviarsi regolarmente ma
ritrovarsi con alcuni contenuti mancanti.

***

> __prepare for losing the host__
>
> - off-host copy
> - configuration and secrets
> - recovery point and recovery time

La directory `backups` sullo stesso host è certo comoda per una prova, ma non ci protegge da eventuali problemi dello
stesso host. Conserviamo sempre almeno una copia fuori dall'host, con accessi separati e una retention che non elimini
l'ultima copia valida prima di averne verificata un'altra.

Un riferimento utile è la
[regola del backup 3-2-1](https://www.cisa.gov/sites/default/files/publications/data_backup_options.pdf). Che prevede di
conservare almeno tre copie dei dati, contando l'originale più due backup, su due tipi di supporto diversi, con almeno
una copia in un luogo separato da quello in cui si trova il sistema originale. Quest'ultima ci permette per l'appunto di
proteggerci anche da eventi che coinvolgono un intera sede operativa, come un incendio o un furto.

Conserviamo inoltre file Compose, configurazione, riferimenti delle immagini, istruzioni, segreti e chiavi necessarie. I
segreti e le chiavi di cifratura vanno protetti e recuperabili separatamente, non affidati soltanto alla macchina che
stiamo cercando di ricostruire, altrimenti potremmo trovarci con tutti i backup a disposizione ma senza le chiavi per
poterli ripristinare.

E ricordiamoci che solo provando il recupero di un backup possiamo essere certi di quali passaggi servono e quanto tempo
potrebbe essere necessario per tornare operativi, non sottovalutiamo questo aspetto.

***

> Resources
>
> - [Back up and restore Docker volumes](https://docs.docker.com/engine/storage/volumes/#back-up-restore-or-migrate-data-volumes)
> - [busybox](https://hub.docker.com/_/busybox)

[Prosegui](../54-private-registry/IT.md) al prossimo capitolo.
