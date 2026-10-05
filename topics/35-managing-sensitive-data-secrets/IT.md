# Managing sensitive data with secrets

> __managing sensitive data with secrets__
>
> - passwords and tokens
> - explicit access
> - files, not printed values

Nel [capitolo precedente](../34-managing-application-configuration-configs/IT.md) abbiamo vistom come fornire a Nginx un
file di configurazione ma vi avevo detto esplicitamente che questo metodo non era da utilizzare per passare dei segreti.

Non vorremmo certo scrivere delle password, o dei token di autenticazione direttamente nei Dockerfile, o nei files di
configurazione e pubblicarli insieme ai sorgenti del progetto o ritrovarceli per sbaglio nei logs.

Per queste informazioni sensibili, Compose ci permette di dichiarare questi dati come **secrets** e assegnarli soltanto
ai servizi che ne hanno realmente bisogno.

L'idea pratica è semplice, l'applicazione riceve un file da leggere, invece di ricevere automaticamente una variabile
d'ambiente con dentro il segreto.

Ma vediamolo nella pratica.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose-secrets
```

E creiamo manualmente il file:

```shell
$ nano token.secret
```
```text
sample-secret-token
```

Come possiamo vedere in questa directory è anche già presenti i files di _ignore_, che provvede a ignorare qualunque 
files con estensione `.secret`.

```shell
$ cat .dockerignore
$ cat .gitignore
```
```terminaloutput
*.secret
```

Cosicché i file con questa estensione non verranno passati contesto di build di Docker e non verranno mai aggiunti ai
commit di Git.

In un progetto reale in questi casi è buona norma conservare un file chiamato `token.secret.sample` ovviamente **vuoto**
accompagnato dalle istruzioni per creare la propria copia privata del file.


Analizzando poi il file `compose.yaml`:

```yaml
secrets:
  token:
    file: ./token.secret

services:
  demo:
    image: alpine
    secrets:
      - token
    command: >
      sh -c 'if test -r /run/secrets/token && test -s /run/secrets/token;
             then echo "Secret available";
             else echo "Secret missing or empty";
             fi'
```

Ritroveremo la struttura in due parti come già visto per le configurazioni. In alto abbiamo dichiarato la sorgente, poi
dentro al servizio `demo` ne abbiamo assegnato l'accesso.

Il secret di nome `token` diventa, nella forma breve, il file `/run/secrets/token` nel container.

Il comando lanciato è una piccola verifica: `test -r` controlla che il file sia leggibile, `test -s` che non sia vuoto.

Solo se entrambi i controlli passano viene stampato `Secret available`.

Proviamo quindi a eseguire il container con il comando:

```shell
$ docker compose run --rm demo
```
```terminaloutput
Container compose-secrets-demo-run-cbd4914c62ff Creating 
Container compose-secrets-demo-run-cbd4914c62ff Created 
Secret available
```

Se la prova dovesse fallire, controlliamo sorgente, contenuto non vuoto, percorso e permessi.

Per osservare la selezione per servizio, togliamo temporaneamente le due righe `secrets` dentro a `demo`, lasciando la
dichiarazione in cima, e ripetiamo il `run`. Il controllo fallirà: dichiarare un secret infatti non lo consegna a tutti.

***

> __managing sensitive data with secrets__
>
> - _FILE convention
> - the application must read the file
> - choose a different target when needed

Il comando del nostro esempio legge solo le informazioni necessarie alla verifica della presenza del file, in realtà una
vera applicazione dovrebbe invece aprire il file e usare il contenuto per autenticarsi.

Alcune immagini supportano variabili d'ambiente con suffisso `_FILE` come convenzione, ad esempio l'immagine ufficiale
di PostgreSQL permette di configurare l'opzione `POSTGRES_PASSWORD_FILE` con il percorso del secret con la password.

In questi casi la variabile contiene **il percorso**, non la password stessa. 

Ovviamente aggiungere il suffisso `_FILE` a un parametro esistente dell'applicazione non la rende capace di leggerlo,
dobbiamo controllare le opzioni supportate dall'immagine o dall'applicazione. 

Se il programma ad esempio si aspetta di trovare il token in un percorso specifico, possiamo usare la forma estesa della
mappa `secret`, sostituendo la singola riga `file` con le due voci `source` e `target` come in questo esempio:

```yaml
secrets:
  - source: token
    target: /full/token/path.ext
```

***

> __managing sensitive data with secrets__
>
> - local secrets are not a vault
> - protect files and backups
> - verify filesystem permissions

In ogni caso la parola secret non deve darci una falsa sensazione di sicurezza. Nel normale Compose locale, una sorgente
`file` viene montata in sola lettura, Compose **non cifra il file sul nostro disco** e non gestisce da solo scadenza,
revoca o rinnovo della credenziale.

Chi amministra l'host o controlla il daemon Docker può accedere a questi dati e anche il servizio in cui viene montato
può leggerli e, se compromesso, divulgarli. Assegnare i secrets solo dove e quando necessari riduce ciò che esponiamo,
ma non sostituisce la protezione dell'host e dell'applicazione.

Dobbiamo ricordarci di proteggere sorgenti e backup, consentendo l'accesso solo agli utenti necessari. Su Linux contano
proprietario, gruppo e permessi; su Windows anche le ACL e la condivisione di Docker Desktop. Il processo nel container
deve comunque riuscire a leggere il file, un permesso molto restrittivo assegnato all'utente sbagliato lo bloccherebbe.

Come per le config, con secrets locali basati su `file` gli attributi Compose `uid`, `gid` e `mode` non rimappano i veri
permessi della sorgente, ma solamente quelli del file montato nel container. Verifichiamo quindi l'accesso con l'utente
effettivo del servizio, senza risolvere ogni problema concedendo lettura a tutti.

La prova con Alpine non dimostra da sola che un'applicazione eseguita come utente non root abbia gli stessi accessi.

***

> __managing sensitive data with secrets__
>
> - rotate the credential
> - update consumers
> - revoke the old value

Supponiamo di dover cambiare il token, modificare solamente il file `token.secret` ovviamene non è sufficiente.

In un caso reale dovremmo prima di tutto generare un nuovo token per il servizio, poi aggiorneremo il file sull'host e
poi riavvieremo i servizi che lo utilizzano. Verifichiamo poi che il tutto funzioni e poi revocheremo il vecchio token.

Per i servizi persistenti che leggono il secret all'avvio, una possibile applicazione della modifica è quella di usare
l'opzione `--force-recreate` seguita da nome del singolo servizio che vogliamo rilanciare. Attenzione che se il servizio
non è replicato incorreremo in una interruzione, quindi pianifichiamo questi aggiornamenti avvisando gli utenti.

Poi in alcuni casi, ad esempio per il PostgreSQL visto precedentemente, cambiare il file della password non modifica la
password di un database già inizializzato. In quel caso servirebbe anche l'operazione prevista dal database oltre che
l'aggiornamento di tutti i client che ci si collegano.

***

> __managing sensitive data with secrets__
>
> - runtime and build are separate
> - avoid accidental disclosure
> - keep only safe examples

Un'ultima distinzione da fare è che i secrets assegnati al servizio servono a **runtime** quando eseguiamo il container.

Non sono automaticamente disponibili durante la build dell'immagine.

Se la build deve scaricare una dipendenza privata, dovremmo usare i `build.secrets` al posto dei normali `secrets` e una
mount dedicata nel Dockerfile con `run --mount=type=secret`. Non passiamo il token con `ARG`, `ENV` o `COPY` o potremmo
rischiare di lasciarlo involontariamente nell'immagine o nei metadati della build.

E importante, anche usando il mount corretto, il comando eseguito non deve mai copiare il segreto o stamparlo in debug.

Lo stesso vale anche a runtime, niente `cat` del secret, niente password nei messaggi di debug e attenzione agli output
condivisi. 

Al termine della prova come sempre lanciamo un:

```shell
$ docker compose down
```
```terminaloutput
[+] down 1/1
 ✔ Network compose-secrets_default Removed                                                                          0.1s
```

Per ripulire tutto l'ambiente, anche se lanciamo i container con l'opzione `--rm` le altre risorse come ad esempio le
reti vengono comunque conservate nell'host, con `down` possiamo essere sicuri di cancellare tutto lo stack.

***

> Resources:
>
> - [Secrets in Compose](https://docs.docker.com/compose/how-tos/use-secrets/)
