# Managing application configuration with configs

> __managing application configuration with configs__
>
> - same image
> - different configuration
> - files instead of variables

Nel [capitolo precedente](../33-environment-variables-interpolation-precedence/IT.md) abbiamo passato delle impostazioni
attraverso le variabili d'ambiente. 

Ma non tutte le applicazioni si configurano così! 

Alcune si aspettano un file, magari con parecchie righe e una sintassi tutta loro.

Pensiamo ad esempio al solito Nginx, per cambiare il comportamento del server possiamo scrivere tutte le opzioni in un 
file di configurazione e non dobbiamo per forza copiarlo nell'immagine e rifare una build a ogni modifica, possiamo
invece consegnarlo al container attraverso l'opzione **configs** di Compose.

In questo modo l'immagine rimane la stessa ma cambia il file che mettiamo a disposizione dell'applicazione.

Questa cosa torna molto utile qualora dobbiamo prevedere diverse configurazioni per diversi ambienti...

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose-configs
```

E analizziamo il file `default.conf`:

```nginx
server {
  listen 80;
  default_type text/plain;
  location / {
    return 200 "Hello by configuration file!\n";
  }
}
```

In questo caso non si tratta di `YAML` ma della sintassi di Nginx.

Gli stiamo chiedendo di ascoltare sulla porta `80` e di rispondere con una frase specifica, invece di mostrare la pagina
di benvenuto classica. Per questa semplice prova non ci serve conoscere altre direttive specifiche di Nginx.

Nella stessa directory troviamo anche il file `compose.yaml`:

```yaml
configs:
  web_config:
    file: ./default.conf

services:
  web:
    image: nginx
    ports:
      - "8080:80"
    configs:
      - source: web_config
        target: /etc/nginx/conf.d/default.conf
```

Come possiamo vedere la voce `configs` compare in due punti, con due compiti diversi.

Nella sezione in alto, allo stesso livello di `services`, stiamo dichiarando una configurazione chiamata `web_config` e
indicando il file da utilizzare (il percorso è sempre relativo al nostro Compose file).

Dentro alla sezione `web` invece nella mappa `configs` assegniamo quella configurazione al servizio.

Con `source` scegliamo quale configurazione applicare (non il percorso del file) e in `target` impostiamo il percorso
in cui verrà "montato" il file dentro al container. In questo caso abbiamo scelto proprio uno dei file che Nginx legge
all'avvio per caricare la propria configurazione.

Questo mount non sovrascrive il file omonimo già presente nell'immagine, semplicemente lo oscura senza modificarlo.

Se aggiungessimo un secondo servizio Nginx basato sulla stessa immagine, questo non riceverebbe automaticamente il file
da `web_config` ma leggerebbe la versione standard del file presente nell'immagine.

Testiamo ora la configurazione sfruttando il parametro `-t` di Nginx:

```shell
$ docker compose run --rm web nginx -t
```
```terminaloutput
Container compose-configs-web-run-a1a9ba450963 Creating 
Container compose-configs-web-run-a1a9ba450963 Created 
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
10-listen-on-ipv6-by-default.sh: info: can not modify /etc/nginx/conf.d/default.conf (read-only file system?)
/docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

Se vediamo che il test passa, proseguiamo quindi con l'avvio dello stack:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-configs-web-1 Started                                                                          0.1s
```

Aprendo il browser sulla porta `http://localhost:8080` al posto della pagina iniziale dovremmo trovare il nostro saluto.

***

Procediamo ora aggiornando il saluto nella configurazione:

```shell
$ nano default.conf
```
```nginx
server {
  listen 80;
  default_type text/plain;
  location / {
    return 200 "Hello by configuration file updated!\n";
  }
}
```

Se nel browser andiamo ad aggiornare la pagina, non vedremo applicata ancora la nostra modifica, questo perché alcune
applicazioni, come Nginx in questo caso richiedo il `reload` per applicare modifiche alla propria configurazione. 

Procediamo quindi con il comando:

```shell
$ docker compose up -d --force-recreate web
```
```terminaloutput
[+] up 1/1
 ✔ Container compose-configs-web-1 Started                                                                          0.2s
```

Aggiorniamo la pagina nel browser e ora dovremmo vedere il nuovo testo. 

Anche in questo caso l'immagine non è stata ricostruita ma è stato sostituito il container.

Quando abbiamo finito, rimuoviamo le risorse dell'esempio con:

```shell
$ docker compose down
```

***

> __managing application configuration with configs__
>
> - environments
> - configs
> - mounts

Come scegliamo tra le possibilità che visto nel corso di questi capitoli?

Io solitamente se l'applicazione accetta una semplice variabile, come un livello di log o una singola riga di parametro,
solitamente opto per gli `environments`, se legge l'applicazione legge un file strutturato, `configs` rende esplicito
che stiamo fornendo configurazione e ci permette di scrivere un file di configurazione più comodamente.

Nel caso invece in cui voglio condividere una intera directory di sorgenti o altri file dell'host utilizzo il bind mount
che mi permette in un colpo solo di condividere il tutto e mantenerli sincronizzati in entrambe le direzioni.

Nel nostro esempio potremmo infatti ottenere un risultato simile con un volume:

```yaml
volumes:
  - ./default.conf:/etc/nginx/conf.d/default.conf:ro
```

***

> __managing application configuration with configs__
>
> - readable files
> - implementation limits
> - configuration is not a secret

La sintassi completa della mappa prevede anche `uid`, `gid` e `mode`, cioè proprietario, gruppo e permessi del file.

Controlliamo sempre i permessi della sorgente rispetto all'utente che legge il file nel container in modo da risolvere
eventuali problemi di accesso.

Soprattutto, ricordatevi sempre che **config non significa secret**.

Non mettiamo password in questi files in quanto questi files possono spesso venire committati su Git o comunque l'intero
container (ogni suo processo) è in grado di leggerli.

***

> Resources:
>
> - [Compose configs](https://docs.docker.com/reference/compose-file/configs/)
