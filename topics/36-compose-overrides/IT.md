# Compose overrides

> __multiple Compose files and environments__
>
> - a shared base
> - small differences
> - one resulting configuration

Se dovessimo usare lo stesso stack in ambienti diversi, probabilmente avremmo bisogno di adattare una parte della
configurazione a seconda di dove lo avviamo. Potremmo quindi partire dalla configurazione che abbiamo già, farne una
copia per ogni ambiente e modificare quello che serve. All'inizio sarebbe un modo semplice per ottenere quello che
vogliamo, soprattutto se le differenze fossero poche.

Il problema si presenterebbe qualora dovessimo cambiare qualcosa che vale per tutti gli ambienti. A quel punto dovremmo
riportare la stessa modifica in ogni copia, tenendo conto delle impostazioni specifiche che abbiamo aggiunto nel
frattempo. Se ci dimenticassimo di aggiornarne una, in quell'ambiente lo stack continuerebbe a usare la vecchia
configurazione e, col passare del tempo, diventerebbe più difficile capire quali differenze avessimo introdotto di
proposito.

Con Compose possiamo raccogliere in un file di base tutto quello che gli ambienti hanno in comune e usare i file di
override per descrivere solo le differenze. Quando cambia qualcosa che riguarda tutti gli ambienti, ci basta aggiornare
il file condiviso. In questo modo, ogni ambiente parte dalla stessa base aggiornata.

Quando scegliamo l'ambiente in cui avviare lo stack, Compose legge la base e i file di override che gli indichiamo e li
combina in un'unica configurazione che Compose userà per avviare lo stack.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/sources/compose/overrides
```

Ed analizziamo il file `compose.yaml`:

```yaml
services:
  web:
    image: nginx
    environment:
      MESSAGE: "Common configuration"
      COLOR: "blue"
```

Le due variabili d'ambiente ci serviranno per osservare il risultato del merge, sono dimostrative e non cambiano il
comportamento di Nginx, inoltre come possiamo vedere nella configurazione base non abbiamo pubblicato nessuna porta.

Guardiamo ora il file `compose.override.yaml`:

```yaml
services:
  web:
    ports:
      - "8080:80"
    environment:
      MESSAGE: "Development environment"
```

Quando non specifichiamo i files, Compose legge normalmente `compose.yaml` e l'eventuale `compose.override.yaml`.

Guardiamo infatti il risultato della configurazione senza avviare nulla con il comando:

```shell
$ docker compose config
```
```terminaloutput
services:
  web:
    environment:
      COLOR: blue
      MESSAGE: Development environment
    image: nginx
    networks:
      default: null
    ports:
      - mode: ingress
        target: 80
        published: "8080"
        protocol: tcp
networks:
  default:
    name: compose-overrides_default
```

Come vediamo il servizio conserva l'immagine `nginx`, riceve la porta `8080` e ha il `MESSAGE` impostato su `Development
environment`, mentre `COLOR` rimane impostato a `blue`, non è stata cancellato solo perché manca nel file di override.

Poniamo attenzione al fatto che il nome del servizio deve essere sempre lo stesso, in questo caso `web`, se lo avessimo 
chiamato `web-dev`, avremmo aggiunto un altro servizio e non avremmo modificato quello originale.

***

Ora come possiamo vedere, nella directory è anche presente il file `compose.test.yaml`:

```yaml
services:
  web:
    ports:
      - "8081:80"
    environment:
      MESSAGE: "Test environment"
```

Per utilizzarlo, questa volta scegliamo i file esplicitamente, usando più volte l'opzione `-f`:

```shell
$ docker compose -f compose.yaml -f compose.test.yaml config
```
```terminaloutput
services:
  web:
    environment:
      COLOR: blue
      MESSAGE: Test environment
    image: nginx
    networks:
      default: null
    ports:
      - mode: ingress
        target: 80
        published: "8081"
        protocol: tcp
networks:
  default:
    name: compose-overrides_default
```

Compose parte nuovamente dalla configurazione dalla base e applica le modifiche presenti nel file di test.

Se i file si trovassero in directory diverse, i percorsi relativi al loro interno, come quelli dei bind mount o dei
contesti di build, verrebbero comunque risolti rispetto al primo file passato con `-f`. Non diventano relativi alla
directory di ciascun override, controlliamo quindi sempre i percorsi nel modello restituito da `config`.

Troveremo quindi la porta `8081`, non quella di sviluppo e il messaggio personalizzato per l'ambiente di test.

Possiamo passare anche più di due files e facciamo sempre attenzione all'ordine in cui li passiamo.

Per i valori che vengono sostituiti prevale sempre il file successivo, per gli altri campi invece, come vedremo meglio
tra poco, le voci possono combinarsi senza problemi.

I file di variazione possono essere incompleti da soli, per esempio nei nostri due casi non abbiamo specificato nemmeno
un'immagine. Va quindi validato insieme alla base, non come se fosse uno stack autonomo.

Il comando:

```shell
docker compose -f compose.test.yaml config
```
```terminaloutput
service "web" has neither an image nor a build context specified: invalid compose project
```

Ci restituirebbe giustamente un errore.

***

Qualora volessimo provare le configurazioni di sviluppo e di test contemporaneamente sullo stesso host, possiamo farlo
utilizzando nomi di progetto diversi.

Possiamo ad esempio avviare lo stack di sviluppo con:

```shell
$ docker compose -p dev up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network dev_default Created                                                                                      0.1s
 ✔ Container dev-web-1 Started                                                                                      0.2s
```

E quello di test con:

```shell
$ docker compose -p test -f compose.yaml -f compose.test.yaml up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network test_default Created                                                                                     0.1s
 ✔ Container test-web-1 Started                                                                                     0.2s
```

Aprendo poi sul browser le porte `8080` e `8081` vedremo che entrambe mostreranno la pagina di benvenuto di Nginx.

Per vedere la differenza nelle variabili:

```shell
$ docker compose -p dev exec web printenv MESSAGE
```
```terminaloutput
Development environment
```
```shell
$ docker compose -p test -f compose.yaml -f compose.test.yaml exec web printenv MESSAGE
```
```terminaloutput
Test environment
```

Eliminiamo ora entrambi gli stack con:

```shell
$ docker compose -p dev down
$ docker compose -p test -f compose.yaml -f compose.test.yaml down
```

***

> __how Compose merges files__
>
> - scalars are replaced
> - mappings are merged
> - lists need attention

Per quanto riguarda gli overrides ci sono tre comportamenti da saper riconoscere e da tenere a mente.

Un valore singolo, come `image` o `restart`, viene sostituito da quello del file successivo.

Le mappe, come il nostro `environment`, conservano le chiavi non modificate e aggiornano quelle ripetute.

Le liste, invece, possono accumulare elementi: non supponiamo che l'ultima lista cancelli le precedenti.

Vediamolo con il solito esempio.

***

Se avviamo lo stack includendo tutti i files:

```shell
$ docker compose -f compose.yaml -f compose.override.yaml -f compose.test.yaml up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network compose-overrides_default Created                                                                        0.1s
 ✔ Container compose-overrides-web-1 Started                                                                        0.2s
```

Se facciamo un controllo:

```shell
$ docker compose ps
```
```terminaloutput
NAME                      IMAGE     COMMAND                  SERVICE   [...]   PORTS
compose-overrides-web-1   nginx     "/docker-entrypoint.…"   web       [...]   0.0.0.0:8080->80/tcp, 0.0.0.0:8081->80/tcp
```

Vedremo che il servizio sarà stato esposto su **entrambe le porte**, `8080` e `8081`!

Mentre la variabile `MESSAGE`, invece:

```shell
$ docker compose -f compose.yaml -f compose.override.yaml -f compose.test.yaml exec web printenv MESSAGE
```
```terminaloutput
Test environment
```

Avrà il valore del test.

Per eliminare lo stack procediamo con il comando composto:

```shell
$ docker compose -f compose.yaml -f compose.override.yaml -f compose.test.yaml down
```
```terminaloutput
[+] down 2/2
 ✔ Container compose-overrides-web-1 Removed                                                                        0.3s
 ✔ Network compose-overrides_default Removed                                                                        0.1s
```

Per i mount di `volumes`, `configs` e `secrets` conta invece il percorso di destinazione nel container, una voce con lo
stesso target viene combinata con quella precedente, mentre un target diverso aggiunge un mount.

C'è anche un'eccezione importante alle liste: `command` ed `entrypoint` vengono sempre sostituiti e mai concatenati.

Lo stesso vale per il `test` all'interno della mappa `healthcheck` che approfondiremo nel capitolo dedicato.

***

Se volessimo invece proprio sostituire tutte le porte già definite, andando in opposizione al comportamento standard,
dovremmo specificare l'opzione `!override` nel file, come fatto nel file `compose.replace.yaml`:

```yaml
services:
  web:
    ports: !override
      - "8082:80"
```

Accodiamolo ai files già precedentemente concatenati:

```shell
$ docker compose -f compose.yaml -f compose.override.yaml -f compose.test.yaml -f compose.replace.yaml config
```
```terminaloutput
name: compose-overrides
services:
  web:
    environment:
      COLOR: blue
      MESSAGE: Test environment
    image: nginx
    networks:
      default: null
    ports:
      - mode: ingress
        target: 80
        published: "8082"
        protocol: tcp
networks:
  default:
    name: compose-overrides_default
```

Come vediamo, in questo caso, sarà presente solamente la porta `8082` e non più le altre due.

Per rimuovere del tutto un valore possiamo invece usare l'opzione `!reset` come nel file `compose.reset.yaml`:

```yaml
services:
  web:
    ports: !reset []
```

Che come vedremo lanciando l'interpretazione della configurazione:

```shell
$ docker compose -f compose.yaml -f compose.override.yaml -f compose.reset.yaml config
```
```terminaloutput
name: compose-overrides
services:
  web:
    environment:
      COLOR: blue
      MESSAGE: Development environment
    image: nginx
    networks:
      default: null
networks:
  default:
    name: compose-overrides_default
```

Nel risultato non ci saranno più porte pubblicate. Attenzione, una lista vuota `ports: []`, senza il tag `!reset`, non
cancella le porte precedenti!

***

> Resources:
>
> - [Merge Compose files](https://docs.docker.com/reference/compose-file/merge/)
> - [nginx](https://hub.docker.com/_/nginx)

[Prosegui](../37-reusing-configuration/IT.md) al prossimo capitolo.
