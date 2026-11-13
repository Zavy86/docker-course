# Monitoring stacks with metrics and alerts

> __observe trends and react__
>
> - metrics describe change over time
> - dashboards help investigation
> - alerts request an action

Come possiamo accorgerci che un servizio sta iniziando ad avere problemi, prima che smetta di rispondere? Leggere i log
non è sempre sufficiente, perché un consumo di memoria che cresce lentamente o richieste sempre più lente possono essere
difficili da riconoscere osservando i singoli eventi.

Per individuare questi segnali possiamo affiancare ai log le metriche e gli alert. Mentre un log ci racconta un singolo
evento, una metrica ci permette di raccogliere valori e confrontarli nel tempo. Se osserviamo, per esempio, quanta
memoria usa un servizio durante la giornata, possiamo accorgerci che il consumo continua a crescere anche quando
l'applicazione sembra funzionare normalmente.

Riportando questi valori su un grafico diventa più semplice riconoscere un andamento insolito. Non possiamo però restare
davanti a una dashboard per tutta la giornata, ed è qui che entrano in gioco gli alert. Possiamo definire una condizione
da controllare automaticamente e ricevere un avviso quando serve intervenire, senza dover verificare continuamente i
grafici.

In questo capitolo useremo un servizio per raccogliere le metriche a intervalli regolari e controllare le condizioni di
allarme e gli affiancheremo poi un altro servizio che riceverà gli allarmi e gestirà le notifiche. Partiremo dalla
raccolta dei dati e arriveremo a simulare un guasto, così da seguire il percorso che porta dal problema all'avviso.

***

Se non lo abbiamo ancora fatto, cloniamo il repository del corso per avere a disposizione i file dell'esempio.

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci quindi nella directory dedicata al monitoraggio.

```shell
$ cd docker-course/sources/compose/monitoring
```

Prima di avviare i servizi, vediamo quali file contiene.

```shell
$ ls
```
```terminaloutput
alerts.yaml
alertmanager.yaml
compose.yaml
prometheus.yaml
```

Ignoriamo per ora i primi due e partiamo dal file `prometheus.yaml`, nel quale indichiamo a Prometheus dove raccogliere 
le metriche e con quale frequenza farlo.

```yaml
global:
  scrape_interval: 10s
  evaluation_interval: 10s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: [ "localhost:9090" ]
```

Prometheus raccoglie le metriche inviando periodicamente richieste HTTP ai servizi che vogliamo monitorare. Ogni
destinazione da interrogare viene chiamata target e nell'elenco `targets` ne indichiamo l'indirizzo e la porta.

In questa prima prova vogliamo monitorare Prometheus stesso, quindi abbiamo indicato `localhost:9090`. Prometheus
leggerà le proprie metriche usando il percorso `/metrics` previsto per impostazione predefinita. In questo caso la
richiesta parte dal container di Prometheus, perciò `localhost` si riferisce al container stesso.

Con `scrape_interval` impostiamo la raccolta ogni nove secondi, mentre `evaluation_interval` stabilisce ogni quanto
valutare le regole di allarme che aggiungeremo tra poco. Questa configurazione ci permette di osservare Prometheus,
ma per monitorare anche gli altri servizi dovremo configurare i rispettivi target.

Passiamo ora al `compose.yaml`, che definisce il servizio e il volume nel quale conservare le metriche raccolte.

```yaml
volumes:
  prometheus-data:

services:
  prometheus:
    image: prom/prometheus:v3.13.3
    command:
      - --config.file=/etc/prometheus/prometheus.yaml
      - --storage.tsdb.path=/prometheus
      - --storage.tsdb.retention.time=7d
      - --storage.tsdb.retention.size=512MB
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yaml:/etc/prometheus/prometheus.yaml:ro
      - prometheus-data:/prometheus
```

Attraverso gli argomenti del comando indichiamo il percorso del file di configurazione, dove salvare le metriche e quali
limiti usare per la loro conservazione, in questo caso sette giorni e 512 MB. Torneremo sul significato di questi limiti
alla fine del capitolo. Esponiamo poi la porta `9090` e montiamo il file di configurazione in sola lettura e usiamo il
volume `prometheus-data` per mantenere i dati anche quando ricreiamo il container. 

A questo punto possiamo avviare lo stack.

```shell
$ docker compose up -d
```

Una volta avviato il servizio, apriamo `http://localhost:9090` e apriamo la pagina dei target nel menu status. Se quello
configurato compare come `UP`, Prometheus sta riuscendo a raccoglierne le metriche. Passiamo quindi alla vista delle
query ed eseguiamo il comando `up`, il risultato verrà mostrato prima come tabella ma potremo poi anche passare alla
visualizzazione e grafico, così da vedere come lo stesso dato possa essere letto in modi diversi.

Quando `up` vale 1 sappiamo che la raccolta è riuscita. Questo dato, da solo, non ci dice però se tutte le funzioni di
un'applicazione stiano funzionando correttamente. Un servizio potrebbe rispondere alle richieste di monitoraggio e avere
comunque un problema durante un pagamento o il caricamento di un file.

Proviamo anche la query `process_resident_memory_bytes`, che ci permette di osservare la memoria occupata dal processo.
Guardando il grafico possiamo seguirne l'andamento nel tempo, ricordandoci che stiamo misurando quel singolo processo e
non la memoria utilizzata dall'intera macchina.

***

Ora che riusciamo a raccogliere e visualizzare i dati, aggiungiamo una regola che segnali quando la raccolta fallisce.

Guardiamo quindi la configurazione del file `alerts.yaml`:

```yaml
groups:
  - name: demo
    rules:
      - alert: DemoTargetDown
        expr: up{job="prometheus"} == 0
        for: 30s
        labels:
          severity: warning
        annotations:
          summary: "The demo target is down"
```

Oltre al nome del gruppo e il nome della regola, troviamo l'espressione che controlla che `up` valga zero per il target
associato al job `prometheus`. Con `for: 30s` chiediamo che la condizione rimanga vera per l'intera durata di trenta
secondi prima di considerare attivo l'allarme, evitando così che un singolo errore transitorio produca subito un alert.

Per far leggere la regola a Prometheus, andiamo a modificare il file `prometheus.yaml`:

```yaml
rule_files:
  - /etc/prometheus/alerts.yaml

alerting:
  alertmanagers:
    - static_configs:
        - targets: [ "alertmanager:9093" ]
```

In questo modo andremo a indicare sia il file delle regole sia l'indirizzo del servizio Alertmanager, che aggiungeremo
allo stack modificando il file `compose.yaml`:

```yaml
volumes:
  prometheus-data:
  alertmanager-data:

services:
  prometheus:
    image: prom/prometheus:v3.13.3
    command:
      - --config.file=/etc/prometheus/prometheus.yaml
      - --storage.tsdb.path=/prometheus
      - --storage.tsdb.retention.time=7d
      - --storage.tsdb.retention.size=512MB
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yaml:/etc/prometheus/prometheus.yaml:ro
      - ./alerts.yaml:/etc/prometheus/alerts.yaml:ro
      - prometheus-data:/prometheus

  alertmanager:
    image: prom/alertmanager:v0.34.1
    command:
      - --config.file=/etc/alertmanager/alertmanager.yaml
      - --storage.path=/alertmanager
      - --cluster.listen-address=
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yaml:/etc/alertmanager/alertmanager.yaml:ro
      - alertmanager-data:/alertmanager
```

Dichiariamo anche `alertmanager-data` nella sezione `volumes` al primo livello del file. Questo volume conserverà lo
stato di Alertmanager, incluse le regole impostate per sospendere temporaneamente le notifiche. Aggiungiamo poi al
servizio di prometheus il mount del file `alerts.yaml` e configuriamo il servizio Alertmanager, in maniera molto simile
al primo. L'argomento vuoto disattiva l'ascolto per il cluster, che non ci serve in questo esempio a singola istanza.

Giusto per chiarire, Prometheus si occupa di valutare le regole, mentre Alertmanager riceve gli allarmi e decide come
raggrupparli e a chi inviarli. Procediamo quindi creando il file `alertmanager.yaml`:

```yaml
receivers:
  - name: demo

route:
  receiver: demo
  group_by: [ alertname ]
  group_wait: 5s
  group_interval: 30s
  repeat_interval: 1h
```

In questa configurazione tutti gli allarmi vengono indirizzati al destinatario chiamato `demo` e raggruppati in base al
loro nome. Le attese configurate permettono di raccogliere insieme gli avvisi correlati e di regolare l'invio degli 
aggiornamenti e delle ripetizioni, evitando di produrre una notifica per ogni singolo evento.

Per il momento il destinatario `demo` non contiene un'integrazione esterna. Potremo quindi vedere l'allarme solamente
nell'interfaccia di Alertmanager, ma non riceveremo ancora email o messaggi. Ci serve per verificare che i due servizi
comunichino correttamente, prima di aggiungere un vero canale di notifica.

Prima di applicare le modifiche, controlliamo la configurazione di entrambi i servizi con gli strumenti forniti
dalle rispettive immagini, sia per Prometheus:

```shell
$ docker compose run --rm --no-deps --entrypoint promtool prometheus check config /etc/prometheus/prometheus.yaml
```
```terminaloutput
[+] run 1/1
 ✔ Container monitoring-prometheus-run-b5e808a019d4 Created                                                         0.0s
Checking /etc/prometheus/prometheus.yaml
  SUCCESS: 1 rule files found
 SUCCESS: /etc/prometheus/prometheus.yaml is valid prometheus config file syntax
Checking /etc/prometheus/alerts.yaml
  SUCCESS: 1 rules found
```

Che per Alertmanager:

```shell
$ docker compose run --rm --no-deps --entrypoint amtool alertmanager check-config /etc/alertmanager/alertmanager.yaml
```
```terminaloutput
[+] run 10/10
 ✔ Volume monitoring_alertmanager-data                Created                                                       0.0s
 ✔ Image prom/alertmanager:v0.34.1                    Pulled                                                        2.3s
 ✔ Container monitoring-alertmanager-run-3c3fc70c0443 Created                                                       0.0s
Checking '/etc/alertmanager/alertmanager.yaml'  SUCCESS
Found:
 - global config
 - route
 - 0 inhibit rules
 - 1 receivers
 - 0 templates
```

Se tutto è andato a buon fine, ricreiamo i container per caricare i nuovi file:

```shell
$ docker compose up -d --force-recreate
```
```terminaloutput
[+] up 2/2
 ✔ Container monitoring-alertmanager-1 Started                                                                      0.3s
 ✔ Container monitoring-prometheus-1   Started                                                                      0.2s
```

Una volta riavviato lo stack, apriamo anche `http://localhost:9093`, dove troveremo l'interfaccia di Alertmanager.

Se ci spostiamo nella sezione `Status` possiamo accertarci che tutto stia funzionando correttamente, l'etichetta
`disabled` sul cluster corrisponde correttamente a quanto abbiamo impostato nel Compose file.

Torniamo nella sezione `Alerts` e per vedere l'intero percorso di un allarme, simuliamo un problema cambiando soltanto
il target di raccolta in `prometheus.yaml` da `localhost:9090` a `localhost:9091`. Con questa porta sbagliata la 
raccolta fallirà, mentre Prometheus continuerà a funzionare e potrà quindi rilevare il problema e segnalarlo.

Applichiamo la modifica con forzando la ricreazione del container:

```shell
$ docker compose up -d --force-recreate prometheus
```
```terminaloutput
[+] up 1/1
 ✔ Container monitoring-prometheus-1 Started                                                                        0.2s
```

E osserviamo cosa succede nelle due interfacce. 

Nella vista degli `Alerts` di Prometheus potremo seguire facilmente questo passaggio, quando la condizione viene 
rilevata, l'allarme entra nello stato `pending`, cioè rimane in attesa di verificare che il problema persista. Se il 
problema continua per il tempo previsto, passa a `firing` e può essere inviato ad Alertmanager. I tempi che osserveremo
dipendono anche dagli intervalli di raccolta e di valutazione configurati prima.

Dopo alcuni cicli di raccolta e valutazione vedremo `up` scendere a zero e l'allarme passare prima a `pending` e poi a 
`firing`. A quel punto comparirà anche in Alertmanager, confermando che la segnalazione è arrivata a destinazione.

Terminata la prova, ripristiniamo `localhost:9090` e ricreiamo Prometheus con lo stesso comando:

```shell
$ docker compose up -d --force-recreate prometheus
```
```terminaloutput
[+] up 1/1
 ✔ Container monitoring-prometheus-1 Started                                                                        0.2s
```

Controlliamo che il target torni `UP` e che l'allarme si risolva, lasciando anche ad Alertmanager il tempo di aggiornare
il proprio stato. Attenzione, dopo una ricreazione di Prometheus possono essere necessari alcuni minuti perché scada 
l'allarme precedente, anche se la raccolta delle metriche è già ripresa correttamente.

Per verificare quale indirizzo viene interrogato adesso, guardiamo la pagina dei target di Prometheus, dove deve
comparire `localhost:9090` con stato `UP`. Dopo la ricreazione, la query `up` può mostrare ancora per qualche minuto
anche il vecchio valore zero di `localhost:9091`, perché i dati raccolti in precedenza sono rimasti nel volume. Le due
porte identificano due serie diverse, quindi il nuovo valore di `9090` non sostituisce quello di `9091`.

Stoppiamo infine lo stack con:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container logs-app-1 Removed                                                                                     0.1s
 ✔ Network logs_default Removed                                                                                     0.1s
```

***

> __test the last mile__
>
> - configure a real destination
> - verify firing and resolved messages
> - protect notification credentials

Finora abbiamo verificato che l'allarme arrivi ad Alertmanager ma per essere avvisati anche quando non abbiamo
l'interfaccia aperta, dobbiamo collegare un canale che controlliamo abitualmente. Per farlo potremmo usare un qualunque
servizio per il quale Alertmanager dispone già di un'integrazione. Ma questo passaggio velo lascio scegliere a voi...

Una volta modificata e validata la nuova configurazione con `amtool` e ricreato il servizio `alertmanager`, ripetete il
guasto dimostrativo cambiando temporaneamente la porta del target e seguite la prova fino alla notifica, verificando di
ricevere sia il messaggio di allarme sia quello di risoluzione dopo il ripristino.

La prova è completa quando il destinatario riceve effettivamente il messaggio. Vedere l'allarme nell'interfaccia ci
conferma soltanto una parte del percorso. Nel preparare le notifiche cerchiamo anche di renderle utili a chi le riceve,
indicando cosa controllare e chi deve intervenire. Il raggruppamento e gli intervalli di ripetizione ci aiutano poi a
evitare che lo stesso problema produca una sequenza continua di avvisi.

***

> __expand only where needed__
>
> - useful dashboards
> - host and application metrics
> - protected monitoring endpoints

In questo esempio abbiamo osservato soltanto Prometheus ma per estendere il monitoraggio a un'applicazione reale, 
dovremmo aggiungere il suo endpoint di metriche oppure un exporter adatto al sistema che vogliamo controllare.

Un exporter raccoglie informazioni da quel sistema e le espone nel formato che Prometheus sa leggere. Anche se abbiamo
già definito un healthcheck Docker, servirà comunque una raccolta esplicita per avere quei dati disponibili nel tempo
dentro Prometheus.

Conviene partire da pochi segnali che ci aiutino a capire come sta funzionando il servizio, ad esempio la disponibilità,
il numero di errori e la durata delle richieste. In base alle esigenze possiamo poi aggiungere il consumo di memoria e
CPU, i riavvii, lo spazio libero, la crescita dei volumi o la scadenza dei certificati.

Per lo storage può essere utile osservare anche gli inode liberi, dai quali dipende la possibilità di creare nuovi file.

Prima di scrivere una regola di allarme, verifichiamo sempre che la relativa metrica venga davvero raccolta e che
rappresenti ciò che vogliamo realmente misurare.

Per raccogliere le metriche di un host Linux possiamo usare `Node Exporter`, mentre per controllare la risposta di un
endpoint HTTP o il suo certificato TLS possiamo usare una sonda dedicata. Quando un exporter richiede accesso ai
filesystem o ai namespace dell'host, valutiamo i privilegi necessari prima di aggiungerli al container.

Se vogliamo riunire più grafici in dashboard riutilizzabili, possiamo integrare Grafana come servizio separato sulla
rete di monitoraggio, assegnandogli un volume per conservare il proprio stato e proteggendo l'accesso amministrativo.

Partiamo da un pannello basato su una query che abbiamo già verificato in Prometheus, così da sapere quali dati
aspettarci. Potremo poi aggiungere gli altri grafici necessari. Se importiamo una dashboard preparata da altri,
controlliamo quali metriche ed exporter richiede, perché in loro assenza alcuni pannelli resteranno vuoti e non ci 
daranno informazioni sullo stato dei nostri servizi.

Per il nostro esercizio sono sufficienti le viste e i grafici di Prometheus. Se in seguito vorremo accedere al
monitoraggio da remoto, dovremo proteggere sia le interfacce sia gli endpoint delle metriche con autenticazione e
controllo degli accessi. I dati raccolti possono infatti rivelare nomi interni, percorsi e informazioni sul 
comportamento dei servizi, quindi non vanno esposti liberamente su Internet.

***

> __monitor the monitoring system__
>
> - retention consumes disk
> - same-host monitoring shares failures
> - verify recovery and delivery

Anche il sistema di monitoraggio usa risorse e ha bisogno di essere controllato. Nella configurazione iniziale abbiamo
impostato sette giorni e 512 MB per la conservazione delle metriche. Il primo dei due limiti raggiunto determina la
rimozione dei dati storici, ma questo non significa che il volume non possa superare i 512 MB.

Prometheus deve conservare anche i dati recenti e il registro delle scritture, chiamato WAL, e ha bisogno di spazio
durante la compattazione, quando riorganizza i dati salvati.

Lasciamo quindi un margine sul disco e osserviamo anche la crescita dello storage usato dal monitoraggio.

La rotazione dei log vista nel capitolo precedente riguarda i messaggi dei container, mentre il database delle metriche
viene gestito da Prometheus attraverso le proprie impostazioni di conservazione.

Consideriamo anche dove stiamo eseguendo questi servizi. Se l'applicazione, Prometheus e Alertmanager girano sullo
stesso host, un guasto dell'intera macchina può fermare anche il sistema che dovrebbe avvisarci.

Per accorgerci di questa situazione serve un controllo eseguito da un sistema indipendente, oppure un heartbeat esterno,
cioè un segnale periodico la cui assenza faccia scattare una segnalazione. E ovviamente anche questo meccanismo va
provato, interrompendo il segnale in modo controllato e verificando che l'avviso arrivi.

***

> Resources
>
> - [Getting started with Prometheus](https://prometheus.io/docs/prometheus/latest/getting_started/)
