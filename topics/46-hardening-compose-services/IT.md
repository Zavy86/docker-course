# Hardening Compose services

> __reduce unnecessary access__
>
> - start from application needs
> - grant fewer privileges ever
> - verify after each change

Quando sviluppiamo un'applicazione, il primo obiettivo è farla funzionare. Ma una volta avviato il servizio, è facile
lasciare la configurazione così com'è, senza chiederci quali permessi siano davvero necessari al suo funzionamento.

Un container, però, potrebbe avere accesso a file o risorse che l'applicazione non usa. Se un errore o un attacco 
sfruttasse questi accessi, le conseguenze potrebbero essere più gravi di quanto possiamo immaginare.

Il processo di hardening consiste nel rendere un servizio più sicuro riducendo ciò che può fare. Un esempio fra tutti 
potrebbe essere quello di evitare di eseguire l'applicazione come utente root quando non serve.

In questo capitolo partiremo dalle esigenze del servizio, limiteremo i permessi e verificheremo dopo ogni modifica che
il tutto continui a funzionare correttamente.

***


Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose/hardening
```

E analizziamo il file `compose.yaml`:

```yaml
services:
  app:
    image: busybox
    command: [ "sleep", "infinity" ]
```

Partiremo dalla solita immagine `busybox` con il solito comando `sleep infinity` che abbiamo già visto in precedenza.

Avviamo quindi lo stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network hardening_default Created                                                                                0.0s
 ✔ Container hardening-app-1 Started                                                                                0.1s
```

E verifichiamo con quale id viene eseguita questa immagine:

```shell
$ docker compose exec app id
```
```terminaloutput
uid=0(root) gid=0(root) groups=0(root),10(wheel)
```

Come possiamo vedere, in questa immagine, il processo parte come utente root.

Quesot non significa che ogni container root possa controllare automaticamente tutto l'host, ma possiamo evitare di dare
privilegi che non sono necesari al nostro piccolo servizio, rendendo il tutto più sicuro.

***

Andiamo quindi a modificare la definizione del nostro servizio aggiungendo un id utente specifico:

```yaml
[...]
user: "1000:1000"
```

E riavviamo lo stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container hardening-app-1 Started                                                                                2.7s
```

A questo punto se rilanciamo lo stesso comando:

```shell
$ docker compose exec app id
```
```terminaloutput
uid=1000 gid=1000 groups=1000
```

Il processo viene ora eseguito con l'identificatore utente (UID) `1000` e l'identificatore gruppo (GID) `1000`.

Questi numeri sono usati dal sistema per riconoscere l'utente e il gruppo, per questo esempio non è necessario che
nell'immagine esista un utente con un nome associato a quell'identificati. Alcune applicazioni potrebbero però invece
richiedere anche un utente presente nell'immagine e una directory home utilizzabile.

Su Linux, senza rimappazione degli utenti, questi stessi numeri vengono usati anche per verificare i permessi delle
cartelle dell'host montate nel container. Per esempio, se una cartella appartiene all'utente dell'host con UID `1000`,
indipendentemente dal suo nome, il processo nel container può risultarne proprietario.

Non scegliamo quindi un numero a caso per qualsiasi servizio, preferiamo l'utente non root predefinito dell'immagine e
teniamo anche conto del proprietario e dei permessi dei file dell'host che l'applicazione dovrà eventualmente poter 
modificare. Verifichiamo che l'utente scelto abbia accesso a tutti i percorsi necessari.

Ricordiamoci che cambiare `user` non modifica anche il proprietario o i permessi dei file già presenti nei volumi.

***

Un'altra cosa che possiamo fare, se il nostro processo non deve modificare i file dell'immagine, è impostare il file
system del container in sola lettura, con eventualmente un'area temporanea scrivibile.

Modifichiamo quindi ulteriormente il file `docker-compose.yml` aggiungendo:

```yaml
[...]
read_only: true
tmpfs:
  - /tmp:size=16m,mode=1777
```

In questo modo la directory `/tmp` verrà impostata come un'area temporanea di 16 MiB scrivibile grazie alla modalità
`1777` che permette la scrittura a tutti gli utenti.

Rilanciamo lo stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container hardening-app-1 Started                                                                                1.8s
```

Se proviamo poi a creare un file: 

```shell
$ docker compose exec app touch /etc/test-file
```
```terminaloutput
touch: /etc/test-file: Read-only file system
```

Otterremo per l'appunto un errore che ci indica che il file system è in sola lettura.

Se proviamo invece a leggere e scrivere nella directory `tmp`:

```shell
$ docker compose exec app sh -c 'echo temporary > /tmp/test-file'
```
```shell
$ docker compose exec app cat /tmp/test-file
```
```terminaloutput
temporary
```

Vedremo che qui possiamo farlo senza nessun problema.

Ricordiamoci che `read_only` non rende automaticamente in sola lettura anche tutte le mount. Un volume o un bind mount
scrivibile rimane un punto in cui il processo può modificare dati. Per le sorgenti che devono soltanto essere lette
impostiamo anche il mount con il flag in sola lettura.

***

Possiamo poi ulteriormente ridurre i privilegi del processo, rimuovendo quelli che non gli servono e impedendogli di
ottenerne di nuovi.

Completiamo il servizio con questo ultimo frammento:

```yaml
cap_drop:
  - ALL
security_opt:
  - no-new-privileges:true
```

Le capability permettono di assegnare a un processo specifici privilegi, il nostro `sleep` non ne richiede nessuno,
quindi possiamo rimuoverli tutti. Per altre applicazioni dovremmo verificare e aggiungere solo quelli necessari.

L'opzione `no-new-privileges` invece impedisce al processo di acquisire nuovi privilegi, eseguendo per esempio alcuni
programmi come `setuid`, rimane comunque necessario usare un utente non root per evitare toltalmente questo problema.

Riavviamo nuovamente lo stack con:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container hardening-app-1 Started                                                                                3.6s
```

E verifichiamo che le impostazioni di sicurezza siano attive nel container:

```shell
$ docker compose exec app sh -c 'grep -E "CapEff|NoNewPrivs" /proc/1/status'
```
```terminaloutput
CapEff: 0000000000000000
NoNewPrivs:     1
```

Ovviamente in produzione dovremmo poi anche verificare il tutto con una prova delle funzioni reali dell'applicazione,
l'assenza di errori all'avvio non è una garanzia di funzionamento di tutte le funzionalità previste.

Stoppiamo infine tutto lo stack con il solito:

```shell
$ docker compose down
```
```terminaloutput
[+] down 2/2
 ✔ Container hardening-app-1 Removed                                                                                2.7s
 ✔ Network hardening_default Removed                                                                                0.1s
```

***

> __review what enters the host__
>
> - narrow mounts and networks
> - no unrestricted Docker socket
> - non-root container is not rootless Docker

Un file Compose scaricato da Internet descrive anche ciò che stiamo autorizzando sulla nostra macchina.

Prima di avviarlo leggiamo immagini, build, comandi, mount, porte, dispositivi e privilegi e controlliamo anche i file
richiamati da `include` ed `extends` e la loro provenienza.

Ricordiamoci del comando `docker compose config` che ci può aiutare a leggere il modello automaticamente risolto.

Anche la risoluzione di riferimenti remoti può scaricare contenuti, quindi partiamo dalla lettura delle sorgenti e
fissiamo revisioni affidabili quando scarichiamo gli aggiornamenti o modifichiamo la configurazione.

Evitiamo opzioni come `privileged`, namespace dell'host, dispositivi e directory host ampie se il servizio non ne ha un
bisogno concreto. Un mount della home può esporre chiavi e credenziali anche in un container che non viene eseguito come
utente root.

Il socket Docker merita un'attenzione particolare. Applicazioni come Portainer o simiti che possono comandare un daemon
con privilegi elevati possono ottenere accessi molto ampi verso l'host. E montare il socket in modalità read-only non
rende di sola lettura le operazioni dell'API Docker, quindi non è da considerarsi una protezione sufficiente.

Riduciamo anche la rete esposta, pubblichiamo soltanto le porte necessarie e usiamo la `loopback` per strumenti locali.

Su Linux non assumiamo che le sole regole di firewall filtrino automaticamente tutte le porte pubblicate da Docker, 
verifichiamo l'integrazione del firewall e l'accesso da altri dispositivi, soprattutto se operiamo su VPS pubbliche.

E ricordiamoci che un container non root può comunque leggere e inviare all'esterno tutti i dati ai quali ha accesso.

Facciamo attenzione all'opzione `user` vista in questo capitolo, che riguarda solamente il processo del container.

La modalità Docker rootless invece cambia proprio il modo in cui vengono eseguiti anche daemon e container stessi, senza
root sull'host. Ma questa è una scelta di tutto l'ambiente, non un'opzione che si attiva nei singoli files Compose.

Rootless può inoltre introdurre differenze su mapping degli utenti, rete, porte e limiti delle risorse.

L'hardening è un insieme di scelte piccole e verificabili, nel prossimo capitolo applicheremo gli stessi criteri 
all'ingresso `HTTP`, lasciando esposto un solo punto di accesso a tutto il nostro sistema.

***

> Resources
>
> - [Compose trust model](https://docs.docker.com/compose/trust-model/)
