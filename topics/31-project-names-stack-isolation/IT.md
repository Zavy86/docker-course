# Project names and stack isolation

> __project names and stack isolation__
>
> - one definition
> - multiple projects
> - independent lifecycles

Nel [capitolo precedente](../30-managing-stack-lifecycle/IT.md) abbiamo gestito il ciclo di vita di un piccolo stack.

Ma come fa Compose a sapere quali container appartengono proprio a quello stack?

Immaginiamo di voler tenere aperte due copie della stessa applicazione: una per lavorare e una per fare dei tests.

Entrambe avranno un servizio chiamato `web`, non dobbiamo inventare un nome diverso per ogni servizio, possiamo invece
assegnare un nome diverso all'intero **progetto**.

Il progetto è il raggruppamento con il quale Compose identifica e gestisce le risorse di una particolare istanza dello
stack, il file `compose.yaml` descrive cosa creare, mentre il nome del progetto distingue un'esecuzione dalle altre.

Ma vediamolo nella pratica.

***

Qualora ancora non l'avessimo fatto cloniamo il repository di questo corso:

```shell
$ git clone https://github.com/Zavy86/docker-course.git
```

Spostiamoci nella directory:

```shell
$ cd docker-course/source/compose-projects
```

E analizziamo nuovamente il file `compose.yaml`:

```yaml
services:
  web:
    image: nginx
    ports:
      - target: 80
        host_ip: 127.0.0.1
```

È ancora il nostro Nginx. Questa volta indichiamo la porta del container `80`, ma lasciamo scegliere a Docker una porta 
libera sull'host, `127.0.0.1` limita la pubblicazione alla macchina locale, per questa prova non ci serve raggiungere il
server dagli altri dispositivi della rete.

Procediamo con l'avviamento dei due istanze di progetto:

```shell
$ docker compose -p blue up -d
$ docker compose -p blue ps
$ docker compose -p green ps
```
```terminaloutput
[+] up 2/2
 ✔ Network blue_default  Created                                                                                    0.0s
 ✔ Container blue-web-1  Started                                                                                    0.2s
```
```shell
$ docker compose -p green up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network green_default  Created                                                                                   0.0s
 ✔ Container green-web-1  Started                                                                                   0.2s
```

L'opzione `-p` ci permette per l'appunto di scegliere il nome del progetto. Con le impostazioni standard vedremo nomi 
come `blue-web-1` e `green-web-1` (progetto-servizio-container).

Anche le reti predefinite sono distinte: `blue_default` e `green_default`. Se dichiarassimo un volume nominato `data`, 
senza personalizzarne il nome, avremmo analogamente `blue_data` e `green_data`.

Se ora provassimo a eseguire il comando `ps`, Compose non troverebbe alcuno stack attivo nella directory corrente.

```shell
$ docker compose ps
```
```terminaloutput
NAME   IMAGE   COMMAND   SERVICE   CREATED   STATUS    PORTS
```

Dovremmo indicare il progetto giusto con `-p` per vedere i container attivi:

```shell
$ docker compose -p blue ps
```
```terminaloutput
NAME         IMAGE   COMMAND                  SERVICE   CREATED         STATUS         PORTS
blue-web-1   nginx   "/docker-entrypoint.…"   web       9 seconds ago   Up 9 seconds
```

In questo caso possiamo ance notare quale porta è stata assegnata per il progetto `blue`. 

Per trovare anche la porta assegnata al progetto `green` possiamo usare lo stesso comando o il comando:

```shell
$ docker compose -p green port web 80
```
```terminaloutput
127.0.0.1:49978
```

Se apriamolo nel browser questi due indirizzi, vedremo due pagine uguali, ma servite da due container diversi.

Ovviamente le porte effettive dipendono dalla macchina, sulla vostra potrebbero essere diverse e possono anche cambiare
dopo una ricreazione dei containers.

***

Sebbene i nomi dei container ci possano aiutare a trovarli a colpo d'occhio nell'elenco, se ci piace lavorare con gli
script, Compose ci mette anche a disposizione delle comode _label_, ovvero dei metadati sulle varie risorse.

Sui container ad esempio con il comando: 

```shell
docker inspect green-web-1
```
```terminaloutput
[
    {
        "Id": "3f35ddc7cb9f2ad113b0d09951566df54d9fd50b16c27c6710723e2830b3eee1",
        ...
        "Config": {
            ...
            "Labels": {
                "com.docker.compose.config-hash": "c5fae9444dba6cf20755250384a79074cbbfca481b2a0b47ec2856f69d7ecc53",
                "com.docker.compose.container-number": "1",
                "com.docker.compose.depends_on": "",
                "com.docker.compose.image": "sha256:114aa6a9f20362f71d64d65bf60aa438fc971a656cec9fa69e732838c6f2425f",
                "com.docker.compose.oneoff": "False",
                "com.docker.compose.project": "green",
                "com.docker.compose.project.config_files": ".../compose.yaml",
                "com.docker.compose.project.working_dir": ".../compose-projects",
                "com.docker.compose.service": "web",
                "com.docker.compose.version": "5.5.1",
                "maintainer": "NGINX Docker Maintainers \u003cdocker-maint@nginx.com\u003e"
            },
            ...
        },
        ...
    }
]
```

Possiamo notare, fra le altre, `com.docker.compose.project` e `com.docker.compose.service`, utilissime per filtrare i
container di un progetto o di un servizio specifico anche senza conoscere il loro nome completo:

```shell
$ docker ps -a --filter label=com.docker.compose.project=blue
```
```terminaloutput
CONTAINER ID   IMAGE   COMMAND                  CREATED          STATUS          PORTS                     NAMES
d89b023209d1   nginx   "/docker-entrypoint.…"   18 seconds ago   Up 18 seconds   127.0.0.1:49957->80/tcp   blue-web-1
```

Il prefisso `com.docker.compose` è riservato a Compose, quindi non lo possiamo usare per le nostre etichette.

***

Ora fermiamo soltanto il progetto `blue`:

```shell
$ docker compose -p blue stop
```
```terminaloutput
[+] stop 1/1
 ✔ Container blue-web-1 Stopped                                                                                     0.2s
```

Come possiamo vedere, il progetto `green` continua a funzionare:

```shell
$ docker compose -p green ps
```
```terminaloutput
NAME          IMAGE   COMMAND                  SERVICE   CREATED          STATUS          PORTS
green-web-1   nginx   "/docker-entrypoint.…"   web       27 seconds ago   Up 27 seconds   127.0.0.1:49978->80/tcp
```

Possiamo poi rilanciarlo con il comando:

```shell
$ docker compose -p blue start
```
```terminaloutput
[+] start 1/1
 ✔ Container blue-web-1 Started                                                                                     0.2s
```

Lo stesso criterio vale per `logs`, `restart` e `down`, se lanciamo con il comando `up` uno stack specificando un nome
di progetto manualmente, dovremo sempre continuare a indicarlo per poterci interfacciare con esso.

Se omettiamo il parametro `-p`, Compose potrebbe mostrarci uno stack vuoto:

```shell
$ docker compose ps
```
```terminaloutput
NAME   IMAGE   COMMAND   SERVICE   CREATED   STATUS   PORTS
```

Non significa che i container siano spariti, infatti se controlliamo con:

```shell
$ docker compose ls -a
```
```terminaloutput
NAME            STATUS       CONFIG FILES
compose-blue    running(1)   .../compose-projects/compose.yaml
compose-green   running(1)   .../compose-projects/compose.yaml
```

Vedremo che entrambi i progetti sono ancora attivi semplicemente Compose non sapeva con quale stack volevamo interagire.

***

> __project names and stack isolation__
>
> - command-line override
> - explicit project name
> - directory default

Oltre a utilizzare l'opzione `-p` possiamo anche fissare il nome del progetto direttamente nel file `compose.yaml` o
specificarlo come variabile d'ambiente. In questo modo non dovremo ricordarci di passare `-p` a ogni comando.

La priorità con cui Compose determina il nome del progetto è prima di tutto l'opzione a linea di comando, poi viene la
variabile d'ambiente, quindi il nome assegnato all'interno del file e infine il nome della directory del progetto.

***

Per fissare il nome nel nostro file possiamo aggiungere, prima di `services`, questa riga:

```yaml
name: demo
```

Ricordiamo in questi casi di usare nomi semplici con lettere minuscole, numeri o trattini per evitare problemi.

Cambiare il nome progetto non rinomina né migra gli stack precedente eseguiti, se infatti lanciamo nuovamente un:

```shell
$ docker compose up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network demo_default Created                                                                                     0.0s
 ✔ Container demo-web-1 Created                                                                                     0.2s
```

Vedremo un terzo progetto chiamato `demo`, con la propria rete e i propri container.

***

> __project names and stack isolation__
>
> - host ports are shared
> - avoid fixed container names
> - isolation has boundaries

Se vi ricordate, nella configurazione del file `compose.yaml` non abbiamo indicati quale porta dell'host usare per il
servizio `web`, ma abbiamo specificato solamente di esporre la porta `80` del container.

```yaml
services:
  web:
    image: nginx
    ports:
      - target: 80
        host_ip: 127.0.0.1
```

In questo esempio la cosa era voluta, in quanto se avessimo specificato una porta fissa, per esempio `"8080:80"`, quando
avremmo lanciato la seconda copia del progetto non sarebbe riuscita a partire, in quanto la porta `8080` sarebbe stata
già occupata dal primo progetto.

Due container non possono occupare contemporaneamente la stessa combinazione di indirizzo, porta e protocollo, anche se
fanno parte di progetti diversi, in quanto stanno condividendo le risorse dello stesso host.

Un altro ostacolo potrebbe essere l'opzione `container_name`, che ci permette di assegnare un nome fisso al container
che verrà creato da Compose, anche in questo caso, la seconda copia del progetto cercherebbe di riutilizzarlo andando in
errore, questo inoltre impedisce anche di avviare più repliche dello stesso servizio.

Nei nostri esempi lasciamo quindi generare i nomi a Compose per evitare problemi.

Ci sono anche altre risorse che possiamo condividere senza accorgercene.

Due bind mount verso la stessa directory dell'host vedono gli stessi file.

Un `name` esplicito sotto una definizione di rete o volume usa quel nome così com'è, senza il prefisso del progetto.

Le immagini locali appartengono al daemon, due progetti possono usare la stessa immagine senza duplicarne i layer.

Facciamo quindi sempre attenzione perché non tutto ciò che uno stack utilizza è una risorsa privata di quel progetto.

Questa separazione ci aiuta a organizzare il lavoro, ma **non è un confine di sicurezza completo**.

I progetti condividono l'host, porte pubblicate, mount e reti comuni possono collegarli.

E anche chi controlla il daemon di Docker può intervenire su entrambi.

***

> __project names and stack isolation__
>
> - independent applications
> - shared reverse proxy
> - explicit network ownership

Pensiamo ora a un host sul quale vogliamo eseguire più applicazioni indipendenti, ognuna con il proprio ciclo di vita,
ma tutte raggiungibili tramite la porta `80` o `443` dell'host. 

In questi casi la soluzione migliore è usare un reverse proxy per instradare le richieste verso i container giusti,
senza dover esporre le porte di ogni singolo servizio, ed evitando _race condition_ per l'occupazione delle porte.

In questi casi, ci conviene quindi eseguire il reverse proxy in un progetto separato con una propria rete "pubblica" e 
collegare poi a quella rete tutti i servizi che vogliamo rendere raggiungibili dall'esterno.

***

In questo semplice esempio non vedremo un vero reverse proxy in azione, ma vediamo intanto come fare a configurare una
rete condivisibile dai progetti.

Eseguiamo il comando:

```shell
$ docker network create ingress
```
```terminaloutput
af43623359f4a70fdf3432defa0c426338e4181cf62b56dbe30a2e6ff04273ce
```

E andiamo poi a modificare il nostro progetto collegando il servizio `web` alla rete appena creata:

```yaml
name: compose-demo
services:
  web:
    image: nginx
    ports:
      - target: 80
        host_ip: 127.0.0.1
    networks:
      - ingress

networks:
  ingress:
    external: true
    name: ingress
```

Nel servizio `web` stiamo dicendo di utilizzare la rete `ingress`, mentre al livello principale, abbiamo aggiunto una
nuova sezione `networks` nella quale dichiariamo la rete `ingress` come esterna, con il nome che abbiamo creato prima.

Rilanciamo il progetto con:

```shell
$ docker compose -p compose-demo up -d
```
```terminaloutput
[+] up 2/2
 ✔ Network ingress  Created                                                                                         0.0s
 ✔ Container compose-demo-web-1  Started                                                                            0.2s
```

E andiamo a verificare che il container sia collegato alla rete `ingress`:

```shell
$ docker network inspect ingress
```
```terminaloutput
[
    {
        "Name": "ingress",
        "Id": "af43623359f4a70fdf3432defa0c426338e4181cf62b56dbe30a2e6ff04273ce",
        ...
        "Containers": {
            "09d50e861c5f156f33c23e67bb16e984f36b656ecea3e2324f366123e759c1a9": {
                "Name": "demo-web-1",
                "EndpointID": "79d37d083445c9478a837d54caa61e6b7b54040b3cdb3344c533c63488c81f6e",
                "MacAddress": "e6:98:15:83:0e:99",
                "IPv4Address": "172.30.0.2/16",
                "IPv6Address": ""
            }
        },
        ...
    }
]
```

Come possiamo notare, il container `demo-web-1` è stato correttamente collegato alla rete `ingress`.

Il progetto del reverse proxy dovrà poi dichiarare la stessa rete esterna e dovrà impegnare le porte `80` e `443`.

Punteremo poi lì i nostri record DNS, e il proxy potrà instradare le richieste verso i container giusti senza che questi 
debbano esporre le proprie porte.

In questo caso la rete comune resta sotto la responsabilità di chi gestisce l'infrastruttura, alternativamente avremmo
potuto dichiarare la rete nel progetto del reverse proxy così da farla creare a Compose, ma in questo caso il progetto
del reverse proxy avrebbe dovuto essere avviato prima di tutti gli altri, io preferisco sempre creare la rete a mano.

***

Facciamo ora un po' di pulizia, fermando e rimuovendo i tre progetti che abbiamo creato in questo capitolo:

```shell
$ docker compose down
$ docker compose -p blue down
$ docker compose -p green down
```

***

> Resources:
>
> - [Project names](https://docs.docker.com/compose/how-tos/project-name/)
