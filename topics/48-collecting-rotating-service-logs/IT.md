# Collecting and rotating service logs

> __read what services report__
>
> - standard output and standard error
> - service names and timestamps
> - bounded log retention

Quando un servizio si comporta in modo inatteso, senza informazioni sugli eventi è difficile capire cosa sia successo.

I log, solitamente visibili tramite lo standard output e lo standard error, ci aiutano a ricostruire il comportamento
delle applicazioni. È quindi importante raccoglierli e limitarne la crescita nel tempo per mantenerli consultabili.

Un messaggio di log racconta un evento avvenuto in un preciso momento, per esempio, l'avvio di un servizio o un errore
durante una richiesta. Quando più container lavorano insieme, leggere questi messaggi con il nome del servizio e l'ora
aiuta a collegare ciò che è successo nei diversi componenti.

Allo stesso tempo, i log continuano a occupare sempre più spazio mentre i servizi sono in esecuzione. Impostare una
rotazione significa limitare quanti ne vengono conservati localmente, decidendo quando eliminare i messaggi più vecchi
in favore di quelli nuovi.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose/logs
```

E analizziamo il file `compose.yaml`:

```yaml
services:
  app:
    image: busybox
    init: true
    command:
      - sh
      - -c
      - |
        while true; do
          echo "level=info event=heartbeat"
          echo "level=warn event=demo_warning" >&2
          sleep 5
        done
```

Questo semplice comando emette un messaggio su standard output e uno su standard error ogni cinque secondi. In questo
esempio non scriviamo i logs su un file, faremo in modo che Docker li raccolga direttamente da entrambi i flussi.

Lanciamo quindi lo stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network logs_default Created                                                                                     0.0s
 ✔ Container logs-app-1 Started                                                                                     0.1s
```

e analizziamo i logs:

```shell
$ docker compose logs -f --timestamps app
```
```terminaloutput
app-1  | 2026-11-14T10:53:23.429826875Z level=warn event=demo_warning
app-1  | 2026-11-14T10:53:23.429866042Z level=info event=heartbeat
app-1  | 2026-11-14T10:53:28.430855877Z level=warn event=demo_warning
app-1  | 2026-11-14T10:53:28.430856127Z level=info event=heartbeat
app-1  | 2026-11-14T10:53:33.433732880Z level=warn event=demo_warning
app-1  | 2026-11-14T10:53:33.433786130Z level=info event=heartbeat
```

Interrompiamo poi la leggura con `Ctrl+C`, senza fermare il container.

Oltre che vedere i log in diretta, possiamo anche esportarne una porzione per una diagnosi più approfondita:

```shell
$ docker compose logs --no-color --timestamps --since 9m app > logs.txt
```

In questo modo, Docker estrare i logs degli ultimi 9 minuti del servizio `app` e li salverà in un file sul nostro host.

***

> __write logs where Docker can collect them__
>
> - stderr for diagnostics
> - stdout for regular events
> - structured fields when useful

Se un'applicazione scrive i suoi logs soltanto su file, Docker non sarà in grado di leggerli automaticamente. Dove
possibile, configuriamola, per scrivere sui flussi standard, oppure predisponiamo una raccolta specifica dei files. 

Non tutti i messaggi su standard error indicano un guasto e non tutti quelli su standard output indicano successo. Il
significato dipende dall'applicazione, non dal flusso scelto.

Per applicazioni reali sono comodi messaggi strutturati, per esempio JSON con livello, evento e request ID. Evitiamo di
aggiungere interi body delle richieste o dati personali quando bastano pochi campi essenziali. Attenzione anche a token,
password e stringhe di connessione che non devono mai finire nei log.

Durante una diagnosi possiamo aumentare temporaneamente il livello di dettaglio dei log, per osservare più da vicino il 
comportamento del servizio. Questa scelta produce però più messaggi e può esporre informazioni riservate, attiviamola
solo per il tempo necessario e al termine ripristiniamo il livello abituale.

***

Un servizio che continua a scrivere può riempire facilmente il disco.

Aggiungiamo quindi alla nostra `app` questo frammento:

```yaml
[...]
logging:
  driver: local
  options:
    max-size: "9m"
    max-file: "3"
```

In questo modo, tramite il driver `local`, Docker conserva sul disco dell'host i logs con rotazione e compressione.

Possiamo scegliere la dimensione massima e il numero dei files di log, in questo esempio tre files da 9 MB ciascuno. A
rotazione il driver eliminerà i file più vecchi lasciandoci a disposizione sempre i record più recenti.

Riavviamo lo stack:

```shell
$ docker compose up -d
$ 
```
```terminaloutput
[+] up 1/1
 ✔ Container logs-app-1 Started                                                                                     0.2s
```

E verifichiamo le opzioni applicate:

```shell
$ docker inspect $(docker compose ps -q app) --format '{{json .HostConfig.LogConfig}}' | jq
```
```json
{
  "Type": "local",
  "Config": {
    "max-file": "3",
    "max-size": "9m"
  }
}
```

Le dimensioni valgono per ogni container, se un servizio dispone di più repliche, ogniuna avrà i suoi tre file di logs.

Una volta terminate le prove, stoppiamo lo stack con:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container logs-app-1 Removed                                                                                     0.1s
 ✔ Network logs_default Removed                                                                                     0.1s
```

***

> __plan collection and failure behavior__
>
> - local logs follow container lifecycle
> - central collection needs its own retention
> - buffering can lose messages

I log locali sono comodi per controllare rapidamente un servizio, ma non costituiscono un archivio storico. La rotazione
elimina progressivamente i messaggi più vecchi e, quando rimuoviamo un container, possiamo perdere l'accesso ai suoi log
locali. Se ci servono per una diagnosi, raccogliamoli prima della sua rimozione.

Quando dobbiamo conservare i messaggi più a lungo o cercare eventi provenienti da più stack, possiamo usare un sistema
di raccolta centralizzato. Anche questa destinazione avrà bisogno di spazio e di regole, decidiamo per quanto tempo
conservare i dati, chi potrà consultarli e come proteggerli. La possibilità di leggere ancora i messaggi con il comando
`logs` dipende dal driver scelto e dall'eventuale cache locale, quindi verifichiamola quando cambiamo configurazione.

Dobbiamo considerare anche cosa succede se la destinazione dei log rallenta o non è raggiungibile. Se la scrittura dei
log non avviene in maniera asincrona, chi scrive può essere rallentato; con quella asincrona, passando attraverso un
buffer di dimensioni limitate, qualora si accumulassero e lo riempissero potrebbero andare persi. La scelta dipende da
quanto è importante conservare ogni messaggio e da quanto il servizio può tollerare eventuali rallentamenti.

Bene, in questo capitolo abbiamo visto come leggere i messaggi dei servizi e configurare la rotazione per limitarne la
crescita. Sapere dove trovare i log e quanto a lungo restano disponibili ci permette di usarli con maggiore efficacia
quando ci capiterà, e sicuramente prima o poi ci capiterà, di dover ricostruire un problema.

***

> Resources
>
> - [Docker logging drivers](https://docs.docker.com/engine/logging/configure/)
