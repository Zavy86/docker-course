# Reusing configuration with anchors, extensions, and includes

> __reusing configuration__
>
> - write shared values once
> - keep differences visible
> - choose one tool at a time

In questo capitolo, ci occuperemo delle situazioni in cui più servizi condividono una parte della loro configurazione.

Un'applicazione e il suo worker, per esempio, potrebbero usare la stessa immagine e le stesse variabili.

Potremmo semplicemente copiare la stesa informazione in entrambi, ma quando si aggiornano, dovremmo ricordarci di 
aggiornarle entrambe, oppure possiamo decidere di scrivere queste impostazioni una volta sola e riutilizzarle.

Ma come sempre, bando alle ciance e vediamo nella pratica come farlo...

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose/reuse
```

Ed analizziamo il file `compose.yaml`:

```yaml
x-environment: &shared
  DEMO_COLOR: "blue"
  DEMO_SIZE: "small"

services:
  first:
    image: alpine
    environment: *shared
    command: [ "printenv", "DEMO_COLOR", "DEMO_SIZE" ]
  second:
    image: alpine
    environment: *shared
    command: [ "printenv", "DEMO_COLOR", "DEMO_SIZE" ]
```

In questo caso, con il simbolo `&` assegniamo un nome a un valore YAML, è una sorta di **ancora**, un punto al quale
potremmo poi riferirci in futuro con `*`, in questo caso `*shared`.

Il nome `shared` l'ho scelto io, potete scegliere un nome qualsiasi, l'importante e che non ci siano spazi.

Il parametro `x-environment` invece è un campo di estensione di Compose.

Il prefisso `x-` ci permette di conservare un frammento senza dichiarare un servizio, non verrà creato nessun container
chiamato `x-environment`, il campo, da solo, non applica nulla, sono i riferimenti dentro `services` a utilizzare il suo
contenuto.

Anchor e alias appartengono a YAML, il significato del prefisso `x-` appartiene a Compose.

Possiamo anche definire un'ancora direttamente su un valore dentro un servizio, ma tenerla separata rende più evidente
che si tratta di impostazioni condivise.

Controlliamo il risultato:

```shell
$ docker compose run --rm first
```
```terminaloutput
[+] run 1/1
 ✔ Network compose-reuse_default Created                                                                            0.0s
Image alpine Pulling 
Image alpine Pulled 
Container compose-reuse-first-run-cda52adbd57b Creating 
Container compose-reuse-first-run-cda52adbd57b Created 
blue
small
```

```shell
$ docker compose run --rm second
```
```terminaloutput
Container compose-reuse-second-run-9228d410fcef Creating 
Container compose-reuse-second-run-9228d410fcef Created 
blue
small
```

Come possiamo vedere entrambi i comandi stampano `blue` e `small` su due righe.

***

> __reusing configuration__
>
> - merge mappings with <<
> - override individual keys
> - no automatic deep merge

Dopo aver visto come riutilizzare un intero blocco tramite anchor e alias, facciamo un passo in più, usiamo quel blocco
come base comune, ma permetteremo a un singolo servizio di modificarne solo una parte. In questo modo potremo mantenere
le impostazioni condivise in un punto solo, senza rinunciare alle differenze specifiche dei singoli servizi.

***

Se volessimo cambiare soltanto il colore del secondo servizio, potremmo sostituire il blocco `environment` con questo
frammento, mantenendo il resto del file invariato:

```yaml
  second:
    image: alpine
    environment:
      <<: *shared
      DEMO_COLOR: "red"
    command: [ "printenv", "DEMO_COLOR", "DEMO_SIZE" ]
```

Con le doppie freccette `<<` si inseriscono le chiavi della mappa condivisa, mentre il valore scritto esplicitamente nel
servizio prevale e la sovrascrive, in questo caso `DEMO_COLOR` diventerà `red`, mentre `DEMO_SIZE` rimarrà `small`.

```shell
$ docker compose run --rm second
```
```terminaloutput
Container compose-reuse-second-run-c0feb6bce6f0 Creating 
Container compose-reuse-second-run-c0feb6bce6f0 Created 
red
small
```

Dopo aver verificato, eliminiamo definitivamente questo stack con:

```shell
$ docker compose down
```
```terminaloutput
[+] down 1/1
 ✔ Network compose-reuse_default Removed                                                                            0.1s
```

Attenzione che cambiare il valore nel secondo servizio non modifica i valori del primo.

Il merge YAML funziona sono sulle **mappe**, non concatena le liste. 

Le anchor valgono nel documento YAML in cui sono definite. Un'anchor nella base non diventa disponibile in un altro file
passato con `-f`. Inoltre vengono risolte prima dell'interpolazione, possiamo usare variabili nei valori condivisi, ma 
non possiamo usare la sintassi di interpolazionedelle variabili `${...}` per costruire il nome dell'ancora.

***

> __reusing configuration__
>
> - reuse one service definition
> - customize the inherited values
> - declare required resources

Quando la configurazione comune non riguarda più soltanto qualche valore isolato, ma quasi tutta la definizione di un
servizio, copiare e incollare lo stesso blocco in più punti diventa presto scomodo, ogni modifica va riportata a mano,
aumenta il rischio di dimenticanze e diventa meno chiaro quali parti siano davvero diverse. 

Ci serve quindi un modo per mantenere una definizione principale riutilizzabile e lasciare visibili solo le variazioni
necessarie nei servizi che la usano.

***

Per riutilizzare la definizione di un servizio da un altro file possiamo usare l'istruzione `extends`.

Proviamo questa **alternativa** spostandoci nella directory `compose-extends`:

E analizzando il file `common.yaml`:

```yaml
services:
  base:
    image: alpine
    environment:
      DEMO_COLOR: "blue"
      DEMO_SIZE: "small"
    command: ["printenv", "DEMO_COLOR", "DEMO_SIZE"]
```

E il file `compose.yaml`:

```yaml
services:
  demo:
    extends:
      file: common.yaml
      service: base
    environment:
      DEMO_COLOR: "green"
```

In questo caso Compose prende la configurazione di `base` e la combina con quella del servizio `demo`.

Qui è Compose a unire le definizioni, nella mappa `environment` conserva `DEMO_SIZE` e aggiorna il colore.

```shell
$ docker compose run --rm demo
```
```terminaloutput
[+] run 1/1
 ✔ Network compose-extends_default Created                                                                          0.0s
Container compose-extends-demo-run-b6b6cd02305e Creating 
Container compose-extends-demo-run-b6b6cd02305e Created 
green
small
```

Come possiamo vedere il modello contiene soltanto `demo`, che stampa `green` e `small`.

Mentre il servizio `base` nel file esterno non viene aggiunto automaticamente allo stack.

Se invece estendiamo un servizio dichiarato nello stesso file, anche quel servizio resta parte del modello e non diventa
un modello astratto.

L'istruzione `extends` non importa automaticamente tutte le risorse necessarie.

Se il servizio ereditato usa una rete, un volume nominato o un secret, dobbiamo dichiararlo anche nel modello che lo 
utilizza. Lo stesso vale per eventuali altri servizi richiesti tramite `depends_on`.

Facciamo comunque molta attenzione e cerchiamo di evitare di creare catene circolari di estensioni.

Per ogni dubbio, ricordiamoci che possiamo sempre leggere il risultato con il comando `docker compose config`.

Eliminiamo infine lo stack con:

```shell
$ docker compose down
```
```terminaloutput
[+] down 1/1
 ✔ Network compose-reuse_default Removed                                                                            0.1s
```

***

> __reusing configuration__
>
> - preserve local paths
> - compose complete modules
> - avoid resource name conflicts

Quando una parte della configurazione non è più soltanto una base da personalizzare, ma rappresenta un pezzetto completo
del nostro stack, tenerla nello stesso file principale può rendere il tutto affollato e meno modulare.

Dobbiamo quindi trovare un modo per tenere questi blocchi separati e riutilizzabili, senza rompere i percorsi relativi 
ai files e senza dimenticare che, una volta caricati, servizi e risorse finiranno comunque nello stesso progetto.

***

Spostiamoci quindi nella directory `compose-include` e analizziamonela struttura:

```shell
$ tree
```
```terminaloutput
compose-include/
├── compose.yaml
└── tools/
    ├── compose.yaml
    └── demo.env
```

Vediamo quindi il contenuto dei vari files:

```shell
$ cat compose.yaml
```
```yaml
include:
  - ./tools/compose.yaml

services:
  web:
    image: nginx
```

Nel file principale troviamo due parti, nella prima viene incluso un altro file Compose, mentre nella seconda viene 
dichiarato un servizio `web` basato sull'immagine `nginx`.

```shell
$ cat tools/compose.yaml
```
```yaml
services:
  inspect:
    image: alpine
    env_file: ./demo.env
    command: [ "printenv", "MESSAGE" ]
```

Nel file dentro la directory `tools` troviamo un secondo servizio, chiamato `inspect`, che usa l'immagine `alpine`.

Questo servizio carica le variabili dal file `.env` nella stessa directory e poi esegue un comando che stampa il valore
della variabile `MESSAGE`.

```shell
$ cat tools/demo.env
```
```dotenv
MESSAGE=Tools module configuration
```

Il file `demo.env` infine, contiene la variabile usata dal servizio `inspect`.

Proviamo quindi a lanciare questo stack e vediamo cosa succede:

```shell
$ docker compose up
```
```terminaloutput
[+] up 13/13
 ✔ Image nginx                         Pulled                                                                       3.0s
 ✔ Network compose-include_default     Created                                                                      0.0s
 ✔ Container compose-include-web-1     Created                                                                      0.2s
 ✔ Container compose-include-inspect-1 Created                                                                      0.2s
Attaching to inspect-1, web-1
web-1  | /docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
web-1  | /docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
web-1  | 10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
web-1  | 10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf
web-1  | /docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
web-1  | /docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
web-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
web-1  | 2026/11/01 08:58:55 [notice] 1#1: using the "epoll" event method
web-1  | 2026/11/01 08:58:55 [notice] 1#1: nginx/1.31.8
web-1  | 2026/11/01 08:58:55 [notice] 1#1: built by gcc 14.2.0 (Debian 14.2.0-19) 
web-1  | 2026/11/01 08:58:55 [notice] 1#1: OS: Linux 7.0.14-linuxkit
web-1  | 2026/11/01 08:58:55 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1048576:1048576
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker processes
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 29
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 30
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 31
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 32
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 33
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 34
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 35
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 36
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 37
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 38
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 39
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 40
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 41
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 42
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 43
web-1  | 2026/11/01 08:58:55 [notice] 1#1: start worker process 44
inspect-1  | Tools module configuration
inspect-1 exited with code 0                                                                                  
Gracefully Stopping... press Ctrl+C again to force
Container compose-include-inspect-1 Stopping 
Container compose-include-web-1 Stopping 
Container compose-include-inspect-1 Stopped
```

Al'avvio vedremo i log del container `web` seguiti dala stampa del messaggio da parte di `inspect`.

Come possiamo notare, il percorso `./demo.env` viene risolto dalla directory `tools`, non da quella del file principale.

Ogni file incluso mantiene la propria directory di riferimento, dopodiché le sue definizioni entrano **nello stesso 
progetto**, non otteniamo stack con cicli di vita indipendenti.

Premiamo `CTRL + C` per chiudere e stoppiamo lo stack con:

```shell
$ docker compose down
```
```terminaloutput
[+] down 3/3
 ✔ Container compose-include-web-1     Removed                                                                      0.1s
 ✔ Container compose-include-inspect-1 Removed                                                                      0.0s
 ✔ Network compose-include_default     Removed                                                                      0.1s
```

***

> __reusing configuration__
>
> - fragments: anchors and x-
> - one service: extends
> - complete modules: include
> - environment changes: overrides

A questo punto abbiamo diversi strumenti a disposizione, ma non sono intercambiabili in modo automatico.

Se dobbiamo riutilizzare poche impostazioni nello stesso file, le ancore con le `x-` sono spesso la scelta più semplice.

Se invece vogliamo partire da una definizione di servizio già pronta, possiamo valutare `extends`. 

Quando una parte dello stack ha senso come modulo completo, con i propri servizi e i propri file di supporto, allora
`include` diventa il formato più adatto.

Per le variazioni tra ambienti o tra esecuzioni diverse, restano invece molto utili i file Compose aggiuntivi passati 
con l'opzione `-f` all'avvio.

La regola pratica è scegliere il meccanismo più semplice che risolve il problema senza rendere la configurazione più 
complessa da interpretare. Riutilizzare non significa nascondere tutto, significa ridurre la duplicazione dove porta 
davvero un beneficio, mantenendo chiaro da dove arrivano i valori e quale sarà il modello finale.

Per questo, ogni volta che combiniamo più file o più tecniche, conviene sempre controllare il risultato con il comando
`docker compose config`, per verificare che il risultato ottenuto sia coerente con le reali necessità.

***

> Resources:
>
> - [Compose file reference](https://docs.docker.com/reference/compose-file/)
