# Selecting optional services with profiles

> __selecting optional services__
>
> - one configuration, optional components
> - keep the core services enabled
> - activate tools when needed

Quando una configurazione Compose cresce, non tutti i servizi hanno la stessa importanza in ogni momento.

Alcuni componenti fanno parte dello stack principale e devono essere avviati quasi sempre, per esempio l'applicazione, 
il database o un reverse proxy.

Altri invece sono utili solo in situazioni specifiche, come strumenti di debug, container di manutenzione, pannelli di 
ispezione o comandi temporanei.

Grazie ai **profili** possiamo tenere tutte le configurazioni nello stesso file Compose, ma decidere puntualmente quali
servizi attivare solo quando servono.

In questo modo possiamo evitare di commentare e decommentare i blocchi di configurazione, mantenendo lo stack ordinato
e più facile da controllare.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose-profiles
```

E analizziamo il file `compose.yaml`:

```yaml
services:
  web:
    image: nginx
  debug:
    image: alpine
    profiles: [ debug ]
    depends_on:
      - web
    command: [ "sleep", "infinity" ]
  info:
    image: alpine
    profiles: [ debug ]
    command: [ "uname", "-m" ]
```

Come possiamo notare il servizio `web` non ha nessun profilo assegnato, quindi fa parte dell'avvio normale.

Mentre i servizi `debug` e `info` appartengono al profilo `debug`.

Il nome del servizio e quello del profilo coincidono per uno dei servizi, ma sono due cose distinte, il profilo è una
semplice etichetta che può raggruppare più servizi, non è necessario che ci sia un servizio con lo stesso nome.

Il servizio `debug`, tamite il comando `sleep` rimane in esecuzione per permetterci di lanciare comandi al suo interno.

Mentr il servizio `info` stampa l'architettura vista dal container e termina.

Verifichiamo ora i profili disponibili con il comando:

```shell
$ docker compose config --profiles
```
```terminaloutput
debug
```

Mentre con il comando:

```shell
$ docker compose config --services
```
```terminaloutput
web
```

Possiamo vedere quali sono i servizi inclusi dalla configurazione corrente, senza specificare nessun profilo troviamo
soltanto `web`.

Lanciamo quindi lo stack principale con il comando:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network compose-profiles_default Created                                                                         0.0s
 ✔ Container compose-profiles-web-1 Started                                                                         0.1s
```

Come possiamo infatti vedere dal log in questo caso è stato caricato solamente il container di Nginx.

***

Attiviamo ora il profilo di debug.

Per prima cosa verifichiamo nuovamente la configurazione passando il parametro aggiuntivo:

```shell
$ docker compose --profile debug config --services
```
```terminaloutput
web
debug
info
```

In questo caso come possiamo vedere attiveremo tutti e tre i servizi presenti nel nostro Compose file.

Avviamo lo stack con questo profilo selezionato:

```shell
$ docker compose --profile debug up -d
```
```terminaloutput
[+] up 3/3
 ✔ Container compose-profiles-web-1   Started                                                                       0.2s
 ✔ Container compose-profiles-info-1  Started                                                                       0.3s
 ✔ Container compose-profiles-debug-1 Started                                                                       0.2s
```

Lanciamo un `ps` per verificare i container attivi:

```shell
$ docker compose --profile debug ps -a
```
```terminaloutput
NAME                       IMAGE     COMMAND                  SERVICE   [...]
compose-profiles-debug-1   alpine    "sleep infinity"         debug     [...]
compose-profiles-info-1    alpine    "uname -m"               info      [...]
compose-profiles-web-1     nginx     "/docker-entrypoint.…"   web       [...]
```

E proviamo a vedere il log del servizio `info`:

```shell
$ docker compose --profile debug logs info
```
```terminaloutput
info-1 | aarch64
```

Che comprendono solamente la stampa dell'architettura sulla quale gira il container stesso.

E passiamo poi a sfruttare invece il container di debug per provare a scaricare la pagina predefinita di Nginx:

```shell
$ docker compose exec debug wget -q -O - http://web
```
```terminaloutput
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, nginx is successfully installed and working.
Further configuration is required for the web server, reverse proxy, 
API gateway, load balancer, content cache, or other features.</p>
<p>For online documentation and support please refer to
<a href="https://nginx.org/">nginx.org</a>.<br/>
To engage with the community please visit
<a href="https://community.nginx.org/">community.nginx.org</a>.<br/>
For enterprise grade support, professional services, additional 
security features and capabilities please refer to
<a href="https://f5.com/nginx">f5.com/nginx</a>.</p>
<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

Se tutto è andato a buon fine riceveremo l'HTML della pagina.

***

In casi più complessi potremmo anche avere la necessita di selezionare più profili contemporaneamente, in quei casi ci
basterà ripetere `--profile` più volte, ad esempio `--profile debug --profile tools` oppure possiamo impostare nella
shell la variabile di ambiente `COMPOSE_PROFILES=debug,tools` direttamente nella console o nel file `.env`.

Un servizio può anche appartenere a più profili, anche in questo caso aggiungendolo all'array nel file Compose, e verrà
avviato quando è attivo in **almeno uno** dei profili specificati, non soltanto quando sono attivi entrambi.

***

Ora stoppiamo lo stack con:

```shell
$ docker compose --profile "*" down
```
```terminaloutput
[+] down 4/4
 ✔ Container compose-profiles-info-1  Removed                                                                       0.0s
 ✔ Container compose-profiles-debug-1 Removed                                                                       3.1s
 ✔ Container compose-profiles-web-1   Removed                                                                       0.1s
 ✔ Network compose-profiles_default   Removed                                                                       0.1s
```

Tramite l'asterisco possiamo stoppare tutti i profili definiti in un colpo solo.

E avviamo solamente il servizio `debug` tramite il comando:

```shell
$ docker compose up -d debug
```
```terminaloutput
[+] up 3/3
 ✔ Network compose-profiles_default   Created                                                                       0.0s
 ✔ Container compose-profiles-web-1   Started                                                                       0.1s
 ✔ Container compose-profiles-debug-1 Started                                                                       0.1s
```

Come possiamo vedere, in questo caso è stato avviato il container `debug` e anche il container `web`, poiché nella sua
configurazione:

```shell
$ cat compose.yaml
```
```yaml
services:
  [...]
  debug:
    image: alpine
    profiles: [ debug ]
    depends_on:
      - web
    command: [ "sleep", "infinity" ]
  [...]
```

Avevamo specificicato la dipendenza, e Compose in questo caso l'ha rispettata!

Stoppiamo nuovamente tutto con:

```shell
$ docker compose --profile "*" down
```
```terminaloutput
[+] down 3/3
 ✔ Container compose-profiles-debug-1 Removed                                                                       2.9s
 ✔ Container compose-profiles-web-1   Removed                                                                       0.1s
 ✔ Network compose-profiles_default   Removed                                                                       0.1s
```

***

> __selecting optional services__
>
> - keep required services available
> - validate each combination
> - avoid hidden dependencies

Nel nostro esempio la direzione della dipendenza è intenzionale, lo strumento facoltativo di `debug` richiede `web`,
non il contrario. Un servizio essenziale non dovrebbe dipendere da uno strumento che normalmente rimane disattivato.

Quando una dipendenza coinvolge servizi assegnati a profili diversi, attivare un profilo non attiva automaticamente
anche gli altri. Compose seleziona solo i servizi inclusi nella combinazione richiesta, quindi la configurazione può
diventare non valida se una dipendenza rimane esclusa.

In questi casi dobbiamo rendere esplicita la combinazione corretta, abilitiamo anche il profilo che contiene la
dipendenza, o assegniamo i servizi correlati a un profilo comune, oppure lasciamo senza profilo il servizio che deve
essere sempre disponibile.

***

> __selecting optional services__
>
> - select services, not settings
> - keep project identity explicit
> - stop tools explicitly

I profili agiscono sulla selezione dei servizi da includere e non sulle sezioni principali della configurazione come
reti, volumi, configs e secrets. Un profilo non cambia l'immagine, la porta o le variabili di un servizio, decide 
solamente se includerlo o meno nella selezione.

Questo significa che non dobbiamo usarli come se fossero ambienti separati. Un profilo chiamato `debug`, `tools` o
`admin` abilita servizi aggiuntivi, ma non trasforma automaticamente lo stack in una configurazione diversa. 

Se dobbiamo cambiare impostazioni di un servizio, per esempio un'immagine, una porta pubblicata, un volume montato o una
variabile d'ambiente lo strumento più adatto resta un file di override oppure una configurazione esplicita del servizio.

Anche l'identità del progetto rimane la stessa, a parità di nome progetto, Compose continua a lavorare sugli stessi
container, sulle stesse reti e sugli stessi volumi. Attivare o disattivare un profilo non crea un confine separato, non
isola i dati e non aggiunge protezioni particolari.

Infine, ricordiamoci che avviare nuovamente lo stack senza indicare un profilo non spegne automaticamente i container
opzionali già avviati. I profili controllano quali servizi vengono selezionati dal comando corrente, non sono un sistema
di pulizia automatica. 

Se abbiamo avviato strumenti temporanei, dobbiamo fermarli esplicitamente quando non servono più.

***

> Resources:
>
> - [Using profiles with Compose](https://docs.docker.com/compose/how-tos/profiles/)
