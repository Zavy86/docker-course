# Environment variables, interpolation, and precedence

> __environment variables, interpolation, and precedence__
>
> - configure compose
> - configure the container
> - two different steps

Finora abbiamo visto che creare dei file di configurazione per Compose statici, ma se volessimo cambiare un tag o un
parametro senza modificare ogni volta il file Compose, potremmo anche utilizzare delle variabili.

Il punto importante è capire chi le legge e quando. Alcune servono a Compose per completare la configurazione; altre 
invece vengono consegnate al processo nel container che le legge in fase di runtime.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose-env
```

E analizziamo nuovamente il file `compose.yaml`:

```yaml
services:
  demo:
    image: "alpine:${TAG:-latest}"
    environment:
      MESSAGE: "${MESSAGE:-Hello by Compose}"
    command: ["printenv", "MESSAGE"]
```

In questo script vediamo una sintassi particolare, per utilizzare una variabile dobbiamo infatti inserire il simbolo del
dollaro, seguito da una coppia di parentesi graffe, e all'interno il nome della variabile, seguito eventualmente da un
trattino con il suo valore di default. In questo caso, se la variabile si chiama `TAG` e se non specificata prende come
valore predefinito `latest`.

Lo stesso vale per la variabile `MESSAGE`, che se non specificata prende come valore predefinito `Hello by Compose`.
Il comando `printenv` serve a stampare il valore della variabile `MESSAGE` e termina.

Ora con il comando:

```shell
$ docker compose config
```
```terminaloutput
name: compose-env
services:
  demo:
    command:
      - printenv
      - MESSAGE
    environment:
      MESSAGE: Hello by Compose
    image: alpine:latest
    networks:
      default: null
networks:
  default:
    name: compose-env_default
```

Senza impostazioni esterne specifiche, nella configurazione interpretata troveremo `alpine:latest` e `MESSAGE: Hello by
Compose`.

Facciamo una prova veloce lanciando:

```shell
$ docker compose run --rm demo
```
```terminaloutput
Container compose-env-demo-run-6ce7644c98cc Creating 
Container compose-env-demo-run-6ce7644c98cc Created 
Hello by Compose
```

Il comando `run` ci permette di creare un container ed eseguirlo. L'opzione `--rm` lo rimuove quando il comando termina.

Qui ci aspettiamo il saluto, poi il ritorno al terminale. Approfondiremo poi `run` nel capitolo sui comandi temporanei.

***

Ora sempre nella stessa directory creiamo un file chiamato esattamente `.env`, incluso il punto iniziale:

```shell
nano .env
```
```dotenv
TAG=latest
MESSAGE=Hello by .env
```

Se ora lanciamo nuovamente il comando:

```shell
$ docker compose config
```
```terminaloutput
name: compose-env
services:
  demo:
    command:
      - printenv
      - MESSAGE
    environment:
      MESSAGE: Hello by .env
    image: alpine:latest
    networks:
      default: null
networks:
  default:
    name: compose-env_default
```

Vedremo che automaticamente Compose caricherà il file `.env` e sostituirà il valore della variabile `MESSAGE` con `Hello
 by .env`, senza bisogno di specificare nulla manualmente.

Se lo eseguiamo infatti vedremo:

```shell
$ docker compose run --rm demo
```
```terminaloutput
[+] run 1/1
 ✔ Network compose-env_default Created                                                                              0.0s
Container compose-env-demo-run-dd5c3022b70e Creating 
Container compose-env-demo-run-dd5c3022b70e Created 
Hello by .env
```

Se invece volessimo impostare una variabile in maniera temporanea direttamente nella shell, possiamo farlo precedendo il
comando con l'assegnazione della variabile, ad esempio:

```shell
$ MESSAGE="Hello by shell" docker compose run --rm demo
```
```terminaloutput
Container compose-env-demo-run-dd5c3022b70e Creating 
Container compose-env-demo-run-dd5c3022b70e Created 
Hello by shell
```

In questo modo, il valore viene assegnato alla singola esecuzione, e come potete verdere non viene apportata nessuna
modifica al file `.env`.

A livello di priorità, la variabile nella shell prevale sul valore inserito nel file.

Possiamo anche avere più file `.env` e scegliere quale usare, in questo caso però dovremo indicarne esplicitamente il 
nome durante l'avvio dello stack.

Creiamo un nuovo file `test.env`:

```shell
$ nano test.env
```
```dotenv
TAG=latest
MESSAGE=Hello by test.env
```

E per avviarlo utilizziamo l'opzione `--env-file`:

```shell
$ docker compose --env-file test.env run --rm demo
```
```terminaloutput
Container compose-env-demo-run-bd08de262530 Creating 
Container compose-env-demo-run-bd08de262530 Created 
Hello by test.env
```

E come ci saremmo aspettati, il saluto cambia nuovamente mostrandoci `Hello by test.env`.

Fate attenzione che il percorso di questa opzione è relativo alla directory da cui eseguiamo il comando, essendo noi qui
nella stessa directory possiamo specificare direttamente il nome del file, altrimenti se ad esempio stessimo scrivendo 
uno script dovremmo ricordarci di specificare il path relativo o completo, qualora il file non sia presente nel percorso
indicato Compose si bloccherà con un errore e lo stack non verrà avviato.

Possiamo anche passare più volte l'opzione `--env-file`, per esempio con:

```shell
$ docker compose --env-file .env --env-file test.env run config
```
```terminaloutput
name: compose-env
services:
  demo:
    command:
      - printenv
      - MESSAGE
    environment:
      MESSAGE: Hello by test.env
    image: alpine:3.6
    networks:
      default: null
networks:
  default:
    name: compose-env_default
```

Come possiamo vedere i due file vengono letti entrambi, nell'esatto ordine indicato, e se sono presenti delle chiavi
ripetute, viene mantenuta l'ultima letta. In questo caso abbiamo prima letto `.env` impostando il tag dell'immagine al
valore `3.6` e il messaggio a `Hello by .env`, in seguito abbiamo letto `test.env` che ha sovrascritto il messaggio con 
`Hello by test.env` andando a integrare il file precedente.

Anche in questo caso, l'eventuale variabile d'ambiente della shell continua a prevalere:

```shell
$ MESSAGE="Hello by shell" docker compose --env-file .env --env-file test.env run --rm demo
```
```terminaloutput
Container compose-env-demo-run-f6cbef645183 Creating 
Container compose-env-demo-run-f6cbef645183 Created 
Hello by shell
```

***

> __environment variables, interpolation, and precedence__
>
> - defaults
> - required values
> - empty is not unset

Negli esempi visti finora, abbiamo utilizzato delle variabili con un valore predefinito. In molti casi, questa è una
scelta comoda, se non viene specificato un valore, Compose usa quello predefinito.

Tuttavia in altri casi potremmo preferire fermarci se l'utente non specifica un valore. 

Compose ci mette a disposizione varie forme di sintassi per gestire le variabili d'ambiente:

- `${VAR:-valore}` usa il valore predefinito sia quando la variabile manca sia quando è vuota.
- `${VAR-valore}` lo usa solo quando manca, una stringa vuota viene conservata tale.
- `${VAR:?messaggio}` scatena un errore sia per l'assenza sia per il valore vuoto.
- `${VAR?messaggio}` rifiuta soltanto l'assenza della variabile.
- `${VAR:+valore}` usa il valore solo quando la variabile è impostata (anche se vuota).
- `${VAR+valore}` lo usa solamente quando la variabile è presente e non vuota.

***

Per vedere queste varie forme in azione, andiamo a modificare il `MESSAGE` del nostro file compose:


```shell
$ nano compose.yaml
```
```yaml
environment:
  MESSAGE: "${MESSAGE:?Set a value for MESSAGE in .env or shell}"
```

E andiamo temporaneamente a rimuovere la variabile `MESSAGE` dal file `.env`:

```shell
$ nano .env
```
```dotenv
TAG=3.6
#MESSAGE=Hello by .env
```

Se ora lanciamo nuovamente il nostro stack:

```shell
$ docker compose run --rm demo
```
```terminaloutput
error while interpolating services.demo.environment.MESSAGE: required variable MESSAGE is missing a value: 
Set a value for MESSAGE in .env or shell
```

Vedremo che Compose ci segnala l'errore, indicando che la variabile non ha un valore e mostrerà il nostro avviso.

Se ora proviamo a passare un valore vuoto dalla shell per questa variabile:

```shell
$ MESSAGE= docker compose run --rm demo
```
```terminaloutput
error while interpolating services.demo.environment.MESSAGE: required variable MESSAGE is missing a value:
Set a value for MESSAGE in .env or shell
```

Otterremo lo stesso identico errore, tuttavia se nel file compose andassimo a togliere i due punti:

```yaml
environment:
  MESSAGE: "${MESSAGE?Set a value for MESSAGE in .env or shell}"
```

E rilanciassimo lo stesso comando:

```shell
$ MESSAGE= docker compose run --rm demo
```
```terminaloutput
Container compose-env-demo-run-005d238a9765 Creating 
Container compose-env-demo-run-005d238a9765 Created 

```

Vedremo semplicemente una riga vuota, senza alcun errore.

Vi lascio a voi esplorare anche le altre casistiche, e se vi state chiedendo in quali occasioni sia utile usare la forma
con il `+`, pensate magari a quei casi in cui volete per esempio impostare un valore predefinito da passare alla vostra
applicazione indipendentemente dal valore della variabile assegnata dall'utente, un esempio potrebbe essere un flag per
abilitare o disabilitare il debug, in questo caso magari vogliamo semplicemente forzare i valori true o false, senza che
l'utente abbia la possibilità di passare un valore arbitrario.

In questo caso potremmo usare la forma:

```yaml
environment:
  DEBUG: "${DEBUG:+true}"
```

Di modo che all'utente sia sufficiente specificare il flag senza dover necessariamente sapere quale valore si aspetta di
leggere la nostra applicazione.

***

Ora creiamo un nuovo file `runtime.env`, sempre nella stessa directory:

```shell
$ nano runtime.env
```
```dotenv
MESSAGE=Hello by runtime.env
EXTRA=Another extra message
```

E modifichiamo poi il file compose in aggiungendo l'opzione `env_file`:

```yaml
services:
  demo:
    image: "alpine:${TAG:-latest}"
    env_file:
      - ./runtime.env
    environment:
      MESSAGE: "${MESSAGE?Set a value for MESSAGE in .env or shell}"
    command: ["printenv", "MESSAGE"]

```

Ora se ci facciamo caso, i troviamo una variabile definita due volte, infatti `MESSAGE` l'abbiamo sia definita dentro al
file `runtime.env`, sia dentro al `compose.yaml`, vediamo come funzionano le precedenze in questo caso:

```shell
$ docker compose config
```
```terminaloutput
name: compose-env
services:
  demo:
    command:
      - printenv
      - MESSAGE
    environment:
      EXTRA: Another extra message
      MESSAGE: Hello by Compose
    image: alpine:3.6
    networks:
      default: null
networks:
  default:
    name: compose-env_default
```

Se non stiamo passando la variabile `MESSAGE`, vi ricordo che dentro a `.env` l'avevamo commentata, viene presa quella
predefinita dichiarata nel file `compose.yaml`, perche quanto dichiarato nella sezione `environment` prevale su quanto
definito nel file importato tramite `env_file`, tuttavia se andassimo a scommentare il file `.env`, vedremo come prima
che esso prevarrebbe anche su quanto definito nel compose.

Vediamo inoltre che nell'interpretazione abbiamo ottenuto una nuova variabile di ambiente chiamata extra, che volendo
potremmo utilizzare anche dentro al nostro container, ad esempio andando a specificare manualmente il comando:

```shell
$ docker compose run --rm demo printenv EXTRA
```
```terminaloutput
Container compose-env-demo-run-1c17aa0f5858 Creating 
Container compose-env-demo-run-1c17aa0f5858 Created 
Another extra message
```

In ogni caso il consiglio principale per evitare problemi con le precedenze è quello di fare sempre una verifica prima 
di lanciare lo stack con il comando `config`, in questo modo ci toglieremo ogni dubbio.

***

> Resources:
>
> - [Environment variables in Compose](https://docs.docker.com/compose/how-tos/environment-variables/)
