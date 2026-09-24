# Compose files syntax

> __compose files syntax__
>
> - YAML
> - indentation
> - keys and values

Nel [capitolo precedente](../28-understanding-compose/IT.md) abbiamo visto le potenzialità di Docker Compose e abbiamo
avviato un piccolo web server scrivendo appena cinque righe di configurazione.

Ora cerchiamo di capire come leggere quelle righe e come modificarle senza andare per tentativi alla cieca.

Il formato utilizzato dai file di configurazione di Docker Compose è lo **YAML**. Non è un vero e proprio linguaggio di
programmazione, non dobbiamo scrivere funzioni o algoritmi, dobbiamo semplicemente organizzare dei parametri in maniera
strutturata, cosìcché Compose leggerà questi dati per capire come dovrà comportasi.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory dell'esempio precedente:

```shell
$ cd docker-course/source/compose
```

E analizziamo il file `compose.yaml`:

```shell
$ cat compose.yaml
```
```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

La prima cosa che salta all'occhio è che alcune righe iniziano più a destra di altre. Questi spazi (attenzione non tab)
si chiamano **indentazione** e non servono solo a rendere il file più bello o più facilmente leggibile, ci dicono quali
elementi appartengono a quali altri in una sorta di gerarchia.

Dentro `services` troviamo `web`, mentre dentro `web` troviamo `image` e `ports`. Quindi l'immagine e le porte sono da
considerarsi come impostazioni del solo servizio `web`, non dell'intero progetto.

***

> __compose files syntax__
>
> - indentation
> - mappings
> - nested values
> - unique keys

Per quanto riguarda l'indentazione, nei nostri esempi useremo **due spazi per ogni livello**, Qualora volessimo possiamo
eventualmente anche configurare la maggior parte degli editor in modo che il tasto Tab inserisca automaticamente degli
spazi nel numero che preferiamo. Non è importante che siano due, tre o quattro spazi, l'importante è che siano coerenti.

Una **mappa** invece è semplicemente un insieme di coppie chiave-valore. Per esempio, nella terza riga `image: nginx`,
la chiave è `image` e il valore è `nginx`. Tra i due dobbiamo mettere il carattere dei due punti seguiti da uno spazio.

Il valore può anche essere un gruppo di altre impostazioni, ad esempio come succede con `web:` alla seconda riga, invece
di scrivere qualcosa subito dopo i due punti, siamo andati a capo e abbiamo aggiunginto altre proprietà in un livello di
rientro gerarchico in più.

***

Ovviamente anche `services` è una mappa. Se volessimo dichiarare due servizi, li scriveremmo allo stesso livello:

```yaml
services:
  web:
    image: nginx
  cache:
    image: redis
```

In questo caso `web` e `cache` sono due nomi scelti da noi, mentre `services` e `image` sono istruzioni riconosciute da
Compose e devono essere scritte esattamente così, rispettando anche maiuscole e minuscole.

Le due chiavi `image` duplicate, in questo caso, non creano problemi perché appartengono a servizi diversi. Non possiamo
invece ripetere la stessa chiave nella stessa mappa, se volessimo aggiungere un servizio, lo dovremmo scrivere sempre in
un livello gerarchico sotto `services`, senza ricreare una nuova sezione `services` in fondo al file.

```yaml
services:
  web:
    image: nginx
  cache:
    image: redis
  db:
    image: postgres
```

Questo esempio ci serviva solo a vedere la struttura, quindi annulliamo le modifiche che per le prove di oggi ci basta
mantenere il solo servizio `web`.

***

> __compose files syntax__
>
> - lists
> - one item per line
> - mappings inside lists

Se ci avete fatto caso, sotto alla voce `ports`, è presente una riga che inizia con un trattino, invece della coppia
chiave-valore come per `image`, quel trattino sta a indicare un elemento di una **lista**.

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

Quando un'impostazione può contenere più elementi dello stesso tipo, possiamo elencarli andando a capo e mettendo un
trattino seguito da uno spazio davanti a ciascuno. Per esempio, questo frammento pubblicherebbe due porte del nostro
host verso la stessa porta del container:

```yaml
...
ports:
  - "8080:80"
  - "8081:80"
...
```

Questo pezzetto è da considerarsi come un'alternativa alla sezione `ports` dell'esempio iniziale, da inserire sempre
dentro al servizio `web`. Da qui in avanti useremo anche frammenti di codice come questo per concentrarci sulle righe
che ci interessano senza che vi debba mostrare ogni volta i file completi che come avrete modo di vedere tenderanno a
diventare sempre più lunghi...

La cosa importante da sapere è che se un parametro si aspetta come valore una lista, dobbiamo scriverlo come una lista,
anche se contiene un solo elemento come nel nostro file di partenza.

***

Una lista non deve per forza contenere solamente un valore, possiamo anche trovare una mappa dentro una lista.

Compose, per esempio, permette di scrivere le porte anche in una forma più esplicita:

```yaml
services:
  web:
    image: nginx
    ports:
      - target: 80
        published: 8080
```

In questo caso il trattino introduce una elemento della lista che viene poi descritto da due proprietà: `target` che è 
la porta del container e `published` che è la porta del nostro host. Le due chiavi come vedete sono allineate perché
appartengono allo stesso elemento.

Non dobbiamo imparare adesso tutte le opzioni delle porte. Ci basta riconoscere che una lista può contenere sia valori
semplici sia elementi con più proprietà.

Attenzione però, non siamo noi a decidere liberamente se un campo debba essere una mappa o una lista, è Compose stesso a
stabilire quali forme accetta per ogni impostazione, YAML ci dà solo il modo di scriverle, per sapere come le dobbiamo
scrivere dobbiamo sempre fare riferimento alla documentazione ufficiale di Docker Compose.

***

> __compose files syntax__
>
> - strings
> - quoted values
> - numbers and booleans

Finora abbiamo guardato soprattutto la struttura, ma dobbiamo anche fare attenzione ai tipi dei valori.

```yaml
services:
  web:
    image: nginx
    ports:
      - "8080:80"
```

In questo caso, `nginx` è una stringa e possiamo usare questa definizione per le stringhe "semplici", senza spazi o
caratteri speciali, se volessimo invece scrivere un testo più complesso, come ad esempio la porta `8080:80`, dovremmo
racchiuderlo tra virgolette.

Esistono poi anche altri tipi di valori, come i booleani (che vengono espressi con `true` o `false`), il valore speciale
`null` (che rappresenta l'assenza di un valore, diverso da una stringa vuota) e qualunque eventuale altro dato che possa
ad esempio essere accettato da un'applicazione, come numeri decimali o virgola mobile.

```yaml
...
environment:
  DEMO_ERROR: null
  DEMO_VALUE: "18.9"
  DEMO_ENABLED: true
...
```

Pensiamo alle variabili d'ambiente, che abbiamo già incontrato nei capitoli precedenti. In Compose possiamo passarle al
container con una semplice mappa chiamata `environment`.

***

> __compose files syntax__
>
> - comments
> - special characters
> - single and double quotes

Come in qualsiasi linguaggio, anche in _YAML_ possiamo inserire dei commenti nel file, in questo caso con il carattere
`#`. Compose li ignorerà, ma potranno aiutare noi o chi leggerà la configurazione dopo di noi a capirne le scelte:

```yaml
image: nginx # latest will be used
```

Se invece il cancelletto (o altri caratteri speciali) devono fare parte del testo che dobbiamo passare come parametro,
dobbiamo racchiudere il valore tra virgolette:

```yaml
environment:
  DEMO_LOG: "# Status: Ready"
```

Senza virgolette, questi caratteri potrebbero essere interpretati come struttura YAML o come inizio di un commento.

Possiamo usare sia apici singoli che le virgolette, la differenza utile da ricordare è che le virgolette interpretano
anche le sequenze di escape, come ad esempio il `\n` che verrà interpretato come un ritorno a capo:

```yaml
environment:
  DEMO_ONE_LINE: 'first row\nfirst row'
  DEMO_TWO_LINES: "first row\nsecond row"
```

Nel primo caso il valore conterrà proprio i caratteri `\` e `n`.

***

> __compose files syntax__
>
> - multiline strings
> - literal style
> - folded style

Se il testo fosse più lungo, non dobbiamo per forza scrivere tutto su una sola riga o aggiungere tanti `\n`.

Possiamo usare il simbolo `|` e scrivere il contenuto nelle righe successive, con un livello di rientro in più:

```yaml
...
environment:
  DEMO_MESSAGE: |
    First message row.
    Second message row.
...
```

In questo caso i ritorni a capo vengono mantenuti, il valore è una sola stringa su più righe e non una lista.

Con il simbolo `>` possiamo invece spezzare una frase lunga su più righe, facendola leggere come un unico paragrafo:

```yaml
environment:
  DEMO_MESSAGE: >
    This long message is
    written on two lines.

    This is a new paragraph.
```

In questo caso il ritorno a capo tra le due righe diventa un semplice spazio. Le righe vuote permettono invece di creare
diversi paragrafi.

Entrambe le forme mantengono normalmente un ritorno a capo alla fine del testo, se non desideriamo possiamo aggiungere
un trattino dopo al simbolo `|-` oppure `>-`.

```yaml
...
environment:
  DEMO_MESSAGE: >-
    A single paragraph line
    without a final line break.
...
```

***

Ritorniamo ora nel nostro file di esempio e proviamo nuovamente a validarlo con il comando:

```shell
$ docker compose config
```

Se il comando termina senza mostrare nulla come detto precedentemente, significa che ha superato la validazione.

Ora proviamo a introdurre un errore, togliendo il trattino davanti a `target`, ottenendo questa struttura **volutamente
errata**:

```yaml
services:
  web:
    image: nginx
    ports:
      target: 80
      published: 8080
```

Ed eseguiamo di nuovo la validazione:

```shell
$ docker compose config
```
```terminaloutput
validating compose.yaml: services.web.ports must be a array
```

Come possiamo vedere l'errore ci segnala che `ports` deve essere una lista, non una mappa.

Togliendo `-q` possiamo anche vedere come la configurazione viene interpretata da Compose:

```shell
$ docker compose config
```
```terminaloutput
name: compose
services:
  web:
    image: nginx
    networks:
      default: null
    ports:
      - mode: ingress
        target: 80
        published: 8080
        protocol: tcp
networks:
  default:
    name: compose_default
```

L'output può essere più lungo del nostro file, in quanto Compose rende esplicite alcune impostazioni e normalizza le
forme abbreviate. Non sta riscrivendo il nostro file, ci sta semplicemente mostrando come lo ha interpretato.

È un controllo utile anche quando non ci sono errori così da poter verificare che i valori siano quelli che volevamo.

Una configurazione valida, però, non garantisce che l'applicazione funzioni, un'immagine potrebbe non esistere o una
porta potrebbe essere già occupata. Questi problemi emergeranno solamente quando proveremo ad avviare lo stack.

***

> __compose files syntax__
>
> - don't panic
> - take it easy 

In ogni caso niente paura, anche se può sembrare complicato a prima vista in realtà non lo è.

Non serve imparare tutta la sintassi _YAML_ in una sola volta per poter utilizzare Docker Compose!

Già solo con mappe, liste, valori e un minimo di attenzione all'indentazione abbiamo tutti gli strumenti per comprendere
i file che andremo a realizzare nei prossimi capitoli.

***

> Resources:
>
> - [YAML](https://yaml.org/)
