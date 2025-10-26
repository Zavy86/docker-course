# Local development workflow

> __local development workflow__
>
> - missing dependencies
> - inconsistent environments
> - it works on my machine!

Sfruttare i container nel proprio ambiente di sviluppo locale è un ottima soluzione per risolvere alcuni dei principali
problemi dei più classici workflow di sviluppo, come la gestione delle dipendenze e la coerenza tra ambienti di sviluppo 
dei vari collaboratori. Come abbiamo già detto per risolvere una volta per tutte il _"It works on my machine!"_.

Vediamo quindi quale potrebbe essere un semplice workflow di sviluppo locale per un'applicazione **Node.js**.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Il che potrebbe rappresentare di per se un qualunque repository nel quale andremo a inserire il nostro progetto e poi
spostiamoci nella directory:

```shell
$ cd docker-course/source/namer
```

In cui è presente il nostro progetto di web application Node chiamato **namer** comprensivo di Dockerfile.

Diamo un occhiata in giro:

```shell
$ tree
```

Possiamo vedere all'interno della directory `public` il file `index.html` che rappresenta la pagina web principale della
nostra applicazione, il file `style.css` e la `favicon.ico`. Un `package.json` che contiene tutte le informazioni
sulla nostra applicazione e un `server.js` che contiene il codice del nostro server Node.

Ma soffermiamoci un attimo sul [`Dockerfile`](../../sources/namer/Dockerfile):

```shell
$ cat Dockerfile
```

Come possiamo notare è piuttosto semplice, parte dall'immagine ufficiale di Node e installa a livello globale `nodemom`, 
un pacchetto che ci permette di tracciare le modifiche apportate al codice e riavviare automaticamente il server Node ed
esegue uno script shell che mostra alcune informazioni, installa le dipendenze e avvia il server in modalità sviluppo e
infine espone la porta 3000, quella standard di Node.js.

Procediamo quindi con la compilazione dell'immagine:

```shell
$ docker build -t namer .
```
```terminaloutput
[+] Building 1.2s (8/8) FINISHED                                                                                                                          docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 334B                                                                                                                                      0.0s 
 => [internal] load metadata for docker.io/library/node:24-alpine                                                                                                         1.1s 
 => [auth] library/node:pull token for registry-1.docker.io                                                                                                               0.0s
 => [internal] load .dockerignore                                                                                                                                         0.0s
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/3] FROM docker.io/library/node:24-alpine@sha256:775ba24d35a13e74dedce1d2af4ad510337b68d8e22be89e0ce2ccc299329083                                                   0.0s 
 => CACHED [2/3] WORKDIR /app                                                                                                                                             0.0s 
 => CACHED [3/3] RUN [ "npm", "install", "-g", "nodemon" ]                                                                                                                0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:c3cef0d1ca3d2595187841b8b01b70959a381e067d901ac61c408aa574e72de0                                                                              0.0s 
 => => naming to docker.io/library/namer                                                                                                                                  0.0s 
```

A questo punto non ci resta che avviare il container con alcuni parametri aggiuntivi:

```shell
$ docker run --rm -ti -p 3000:3000 -v $(pwd):/app namer
```

Il primo parametro `--rm` indica che il container dovrà essere rimosso al termine dell'esecuzione, il parametro `-ti`
come abbiamo già visto ci permette di interagire con il container in modalità terminale, il parametro `-p 3000:3000`
espone la porta sul nostro host e il parametro `-v` monta la directory corrente `$(pwd)` all'interno della directory
`/app` del container.

```terminaloutput
Namer - Development Container
Installing or updating dependencies...

added 99 packages, and audited 100 packages in 840ms

18 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
Starting development server with nodemon...

> namer@1.0.0 dev
> nodemon server.js

[nodemon] 3.1.10
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,cjs,json
[nodemon] starting `node server.js`
Server running on http://localhost:3000
```

Al suo avvio il container procederà con l'installazione delle dipendenze con tramite NPM e con l'avvio del server.
Grazie a nodemon il container sarà anche in grado di rilevare ogni modifica apportata al codice e potrà così riavviare 
in automatico il server per rendere effettive le modifiche.

Ora se apriamo il browser all'indirizzo [http://localhost:3000/](http://localhost:3000/) potremo vedere in funzione la
nostra applicazione.

Come possiamo vedere è una semplicissima applicazione che genera dei nomi casuali.

---

Ora ipotizziamo di voler modificare qualcosa all'interno del codice del nostro progetto.

Apriamo il file `server.js`:

```shell
$ nano server.js
```

E modifichiamo la riga `31` in modo da aggiungere un log per ogni nome generato.

```js
console.log(`Last generated name: ${name}`);
```

Non appena salviamo il file, noteremo che nella console dove stavamo eseguendo il container, `nodemon` si accorgerà
della modifica e riavvierà automaticamente il server. 

E aggiornando la pagina vedremo che il nostro log viene visualizzato correttamente.

Ora non ci resterà che effettuare il commit della modifica e tutti gli altri membri del team potranno avviare il loro
container e vedere le modifiche apportate.

Questo ovviamente è un esempio banale, potremo modificare le dipendenze del `package.json`, potremo aggiungere nuovi
file o quello che vogliamo, con la certezza che chiunque sarà sempre allineato con il nostro ambiente di sviluppo.

---

Se notate ora è presente una nuova directory `node_modules` che contiene tutte le dipendenze installate dal nostro
`package.json`. 

```shell
$ ls -l
```
```terminaloutput
total 120
-rw-r--r--@  1 zavy  staff    295 Aug 07 15:57 Dockerfile
-rw-r--r--@  1 zavy  staff    377 Aug 07 16:41 README.md
drwxr-xr-x  98 zavy  staff   3136 Aug 07 16:50 node_modules
-rw-r--r--   1 zavy  staff  42398 Aug 07 16:50 package-lock.json
-rw-r--r--@  1 zavy  staff    271 Aug 07 15:39 package.json
drwxr-xr-x@  5 zavy  staff    160 Aug 07 16:40 public
-rw-r--r--@  1 zavy  staff   1099 Aug 07 16:38 server.js
```

Essa è stata generata al primo avvio del nostro server, il fatto che resti a disposizione sul nostro computer, fa sì che
non sia necessario installarle a ogni avvio del container, risparmiando tempo e risorse.

Qualora in ogni caso cancellassimo questa cartella

```shell
$ rm -R node_modules 
```

Al successivo avvio del container, verrebbe ricreata automaticamente.

***

> __local development workflow__
>
> - missing dependencies
> - inconsistent environments
> - it works on my machine!

Come potrete quindi intuire in questo modo ci siamo completamente svincolati dalla nostra macchina. Non abbiamo nemmno
dovuto installare Node.js ma lo abbiamo eseguito direttamente tramite un container, e grazie al `package-lock.json` ci
ritroviamo un ambiente coerente tra tutti i membri del team, al resto ci penserà [Git](https://git-scm.com/).

***

[Prosegui](../20-compose-development-stack/IT.md) al prossimo capitolo.
