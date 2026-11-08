# Resource limits and runtime configuration

> __resource budgets__
>
> - leave room for the host
> - protect the other services
> - verify the effective settings

Immaginiamo più servizi che condividono CPU e memoria su uno stesso host, se uno di questi consumasse troppe risorse, 
per esempio durante un picco di richieste o a causa di un errore, rischierebbe di rallentare gli altri container e il
sistema operativo stesso dell'host.

Per contenere questo problema, possiamo impostare dei limiti per i singoli container, assicurandoci così di lasciare 
spazio a sufficienza anche agli altri servizi e all'host. Questi limiti vanno accompagnati dal controllo dell'utilizzo
complessivo della macchina host.

Ovviamente non esiste un valore adatto per tutte le applicazioni, partiamo quindi da un piccolo esempio per capire come
applicare e controllare i limiti e poi starà a voi dimensionarli volta per volta in base al vostro stack reale.

In questo capitolo vedremo anche altre impostazioni che influenzano l'esecuzione dei processi e l'arresto dei container,
distinguendole dai limiti di CPU e memoria.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose/resources
```

E analizziamo il file `compose.yaml`:

```yaml
services:
  app:
    image: busybox
    command: [ "sleep", "infinity" ]
    init: true
    cpus: 0.5
    mem_limit: 64m
    pids_limit: 64
```

In questo esempio, tramite la solita busybox, andreamo ad avviare un container che rimarrà in attesa infinita, ma grazie
alle opzioni di limitazione impostate, il processo consumerà pochissime risorse.

Come già visto in un capitolo precedeente `init` aggiunge un piccolo processo che inoltra i segnali e raccoglie i 
processi figli terminati.

L'opzione `cpus` assegna un tetto equivalente a metà del tempo di una CPU, non seleziona metà dei core e non garantisce
una CPU dedicata, semplicemente quando il processo esaurisce il proprio budget, viene rallentato fino al periodo di cpu
successivo, continuando a competere con gli altri carichi dell'host.

Con `mem_limit` impostiamo un limite di memoria di 64 MiB per l'intero container. Questo limite è condiviso dai processi
al suo interno e non è possibile assegnarlo separatamente a ciascuno. Bisogna fare attenzione al fatto che la memoria 
utilizzata da un servizio può cambiare nel tempo, per esempio durante l'avvio oppure quando arrivano molte richieste 
contemporaneamente o durante un'attività di manutenzione. 

Tramite `pids_limit` limitiamo a 64 i task del container, compresi i processi e i thread conteggiati dal kernel Linux.
Questo aiuta a contenere una creazione incontrollata di processi.

***

> __resource budgets__
>
> - measure usage under load
> - understand the effects of low limits
> - limits do not reserve resources

Per scegliere limiti adeguati di CPU e memoria non basta osservare il servizio quando è inattivo. Misuriamo l'utilizzo
di entrambe le risorse anche durante le attività più impegnative e lasciamo un margine per le variazioni, tenendo conto
delle risorse disponibili sull'host.

Se il limite di memoria è troppo basso, le conseguenze possono essere più gravi rispetto a un limite di CPU troppo 
restrittivo. Mentre la CPU viene rallentata fino al periodo successivo, la memoria esaurita può portare il kernel a 
terminare un processo. E se viene terminato il processo principale, il container si ferma. Anche un limite di processi
troppo basso può creare problemi, impedendo all'applicazione di avviare i processi o i thread necessari. Una politica 
di riavvio potrebbe farlo ripartire, ma non corregge il problema e può produrre un ciclo continuo di errori.

Considerate anche il fatto che un limite non è una prenotazione di risorse libere. Se dieci servizi possono usare 1 GiB
ciascuno, non significa che la macchina disponga automaticamente di 10 GiB per loro.

***

Procediamo quindi con l'avvio dello stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network resources_default Created                                                                                0.0s
 ✔ Container resources-app-1 Started                                                                                0.1s
```

E verifichiamo le impostazioni effettive con il comando:

```shell
$ docker inspect --format '{{ json .HostConfig }}' $(docker compose ps -q app) | jq '{ NanoCpus, Memory, PidsLimit }'
```
```json
{
  "NanoCpus": 500000000,
  "Memory": 67108864,
  "PidsLimit": 64
}
```

Per questa configurazione ci aspettiamo `500000000` di processore, `67108864` byte di memoria e `64` per il limite dei
processi. Il primo valore usa miliardesimi di CPU, non indica una frequenza di clock.

Per verificare invece le statistiche di runtime utilizziamo il comando:

```shell
$ docker stats --no-stream $(docker compose ps -q app)
```
```terminaloutput
CONTAINER ID   NAME              CPU %     MEM USAGE / LIMIT   MEM %     NET I/O         BLOCK I/O    PIDS
55227ccbc7e0   resources-app-1   0.00%     5.555MiB / 64MiB    8.68%     1.75kB / 126B   3.8MB / 0B   2
```

Questo è l'utilizzo corrente, che nel nostro esempio è ovviamente molto basso. La CPU percentuale può anche superare il
100% per container che usano più CPU, quindi va letta insieme al numero di CPU disponibili e ai limiti configurati.

Il consumo di memoria può risultare diverso a seconda dello strumento utilizzato. Su Linux, per esempio, `docker stats`
sottrae dal totale una parte della cache che il sistema può recuperare, mentre altri strumenti possono includerla. Per
confrontare le misure nel tempo, usiamo lo stesso strumento e teniamo conto di questa differenza.

***

Possiamo aggiungere anche un limite al numero di files che ciascun processo può tenere aperti contemporaneamente:

```yaml
[...]
ulimits:
  nofile:
    soft: 1024
    hard: 2048
```

Il limite soft è quello normalmente applicato al processo, quello hard invece rappresenta il massimo entro cui il soft
può essere aumentato secondo i permessi disponibili. Socket e connessioni consumano anch'essi descrittori, non contano
soltanto i documenti aperti sul disco.

Per abilitare i nuovi limiti riavviamo il servizio con il comando:

```shell
$ docker compose up -d app
```
```terminaloutput
[+] up 1/1
 ✔ Container resources-app-1 Started                                                                                0.2s
```

E verifichiamo l'applicazione dei limiti con il comando:

```shell
$ docker compose exec app sh -c 'ulimit -Sn; ulimit -Hn'
```
```terminaloutput
1024
2048
```

Per verificare invece i descrittori aperti dal processo principale del nostro container utilizziamo il comando:

```shell
docker compose exec app ls -l /proc/1/fd
```
```terminaloutput
total 0
lrwx------    1 root     root            64 Nov  8 10:32 0 -> /dev/null
l-wx------    1 root     root            64 Nov  8 10:32 1 -> pipe:[5315]
l-wx------    1 root     root            64 Nov  8 10:32 2 -> pipe:[5316]
```

Le tre voci 0, 1 e 2 rappresentano i descrittori aperti dal processo e non occupano blocchi su disco come normali file.
Il totale `0` indica lo spazio su disco attribuito alle voci elencate, espresso in blocchi.

Attenzione la fatto che l'errore `Too many open files` può indicare sia un limite insufficiente, sia una perdita di 
descrittori da parte dell'applicazione. Alzare questo valore senza cercarne la causa può soltanto rimandare il problema.

***

> __shared memory and shutdown__
>
> - size shared memory
> - allow graceful shutdown
> - do not confuse different limits

Oltre alla memoria usata dai singoli processi, un'applicazione può utilizzare anche della memoria condivisa. Questa 
permette a più processi di accedere alla stessa area e scambiarsi dati senza doverli copiare ogni volta da un processo
all'altro. Su Linux le applicazioni possono usare a questo scopo uno spazio temporaneo mantenuto in memoria che rientra
nel consumo del container.

Per esempio, un browser headless può usarlo per condividere dati tra i propri processi, mentre alcuni database possono
usarlo per coordinare le proprie attività. Dipende comunque da come è progettata e configurata l'applicazione, non tutti
i programmi ne hanno bisogno allo stesso modo.

Normalmente ogni container dispone del proprio spazio di memoria condivisa, isolato da quello degli altri container. La
sua dimensione massima è distinta dal limite di memoria complessivo e aumentarla non aumenta automaticamente la memoria
disponibile al container. Se invece questo spazio si riempie, un'applicazione può incontrare errori anche quando il
container dispone ancora di altra memoria classica.

***

Per impostare la dimensione massima di questa memoria condivisa, possiamo utilizzare:

```yaml
shm_size: 16m
stop_grace_period: 20s
```

L'opzione `shm_size` permette al container di usare fino a 16 MiB in quello spazio e la memoria effettivamente usata
contribuisce al consumo complessivo. Se lo spazio è troppo piccolo, le operazioni che ne hanno bisogno possono fallire.
Il valore della prova è piccolo, scegliamolo coerentemente in base alle esigenze e alle misure dell'applicazione.

Mentre l'opzione `stop_grace_period` riguarda invece l'arresto dei singoli processi, lasciando a ogniuno di essi, in 
questo caso, fino a venti secondi per terminare correttamente prima dell'interruzione forzata.

Per abilitare i nuovi limiti riavviamo il servizio con il comando:

```shell
$ docker compose up -d app
```
```terminaloutput
[+] up 1/1
 ✔ Container resources-app-1 Started                                                                                0.2s
```

Controlliamo poi lo spazio con il comando:

```shell
$ docker compose exec app df -h /dev/shm
```
```terminaloutput
Filesystem                Size      Used Available Use% Mounted on
shm                      16.0M         0     16.0M   0% /dev/shm
```

Terminiamo poi il tutto con il solito comando:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container resources-app-1 Removed                                                                                0.1s
 ✔ Network resources_default Removed                                                                                0.1s
```

Un ultima considerazione da fare è che su Docker Desktop, sia su Windows che su MacOS, i container Linux condividono le
risorse della VM, non della macchina. Un computer con molta RAM potrebbe comunque aver assegnato a Docker un budget
inferiore al suo massimale, verifichiamo sempre anche questi valori prima di assegnare dei limiti.

E teniamo conto che anche con il Docker Engine nativo su Linux resta comunque necessario lasciare spazio sufficiente al
sistema operativo e agli altri processi di base dell'host.

***

> Resources
>
> - [Container resource constraints](https://docs.docker.com/engine/containers/resource_constraints/)
