# Entrypoint and command

> __entrypoint and command__
>
> - cmd
>   - multiple binaries
> - entrypoint
>   - single binary

In questo capitolo vedremo come possiamo dire a Docker di eseguire un comando all'avvio del container.

Queste due istruzioni, seppur molto simili, hanno due casi d'uso molto diversi.

La prima permette di eseguire un comando specifico e puntuale, molto utile in caso di immagini che contengono al loro
interno diversi programmi o applicazioni che si vuole poter fare eseguire dall'utente.

Il secondo permette di predisporre un comando fisso, lasciando poi all'utente la possibilità di aggiungere parametri
o argomenti relativi al comando stesso, più utile in caso di immagini che contengono un singolo programma.

Ma vediamoli in azione...

***

Riprendiamo il Dockerfile che avevamo creato nello capitolo precedente e andiamo a modificarlo:

```shell
$ nano Dockerfile
```

Aggiungiamo il comando:

```dockerfile
FROM alpine
RUN [ "apk", "add", "figlet" ]
CMD figlet -f script "Welcome"
```

Tramite l'istruzione `CMD` stiamo impostando un comando di default che verrà eseguito all'avvio del container qualora
non venga specificato altrimenti al momento della sua creazione.

L'espressione `CMD` è un cosiddetto metadata, ovvero non è un comando che viene eseguito durante la build dell'immagine
ma solamente in fase di esecuzione, per cui non importa se la mettiamo in cima, in mezzo o in fondo al Dockerfile.
Tenete però presente che se la inserirete più volte l'ultima avrà sempre la meglio sovrascrivendo le precedenti.

Usciamo e salviamo il file e rieseguiamo la build dell'immagine:

```shell
$ docker build -t figlet .
```
```terminaloutput
[+] Building 0.1s (6/6) FINISHED                                                                                                                          docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 111B                                                                                                                                      0.0s
 => WARN: JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 3)                                           0.0s
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                                                         0.0s
 => => transferring context: 2B                                                                                                                                           0.0s
 => [1/2] FROM docker.io/library/alpine:latest                                                                                                                            0.0s
 => CACHED [2/2] RUN [ "apk", "add", "figlet" ]                                                                                                                           0.0s
 => exporting to image                                                                                                                                                    0.0s
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:e35f3599a6cfadf7530756eba187d1565756412975ffc3ae2c28d913bebdf607                                                                              0.0s 
 => => naming to docker.io/library/figlet                                                                                                                                 0.0s 
                                                                                                                                                                               
 1 warning found (use docker --debug to expand):
 - JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 3)                                                       

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/of4b8647bi56yf2ljn8cgyou9

What's next: View a summary of image vulnerabilities and recommendations → docker scout quickview 
```

Come possiamo notare non c'è traccia del comando all'interno delle operazioni eseguite dal builder, perché come dicevamo
sarà poi valutato dal runtime e non in fase di build.

Possiamo anche notare un warning che ci segnala che sarebbe meglio utilizzare la modalità JSON per il comando, come per
l'istruzione `RUN` infatti anche `CMD` accetta la sintassi JSON ma per il momento possiamo ignorare la notifica.

Eseguiamo il container:

```shell
$ docker run figlet
```
```terminaloutput
 _              _                           
(_|   |   |_/  | |                          
  |   |   | _  | |  __   __   _  _  _    _  
  |   |   ||/  |/  /    /  \_/ |/ |/ |  |/  
   \_/ \_/ |__/|__/\___/\__/   |  |  |_/|__/
```

A differenza di prima, se ora provassimo a eseguire il container in modalità interattiva, con il solito parametro `-ti`,
noteremo che non avremo accesso a shell come succedeva prima.

Questo perche l'immagine alpine aveva come comando di default `/bin/sh`, avendo ora noi definito un `CMD` personalizzato
abbiamo sovrascritto il comando di default, ricordate che vi avevo detto che fa sempre fede l'ultimo?

Per cui se volessimo avere nuovamente accesso alla shell, dovremmo specificare in fase di run un nuovo comando così da
sovrascrivere nuovamente quanto definito nel Dockerfile:

```shell
$ docker run -ti figlet /bin/sh
```

O anche solo `sh` in ogni caso il comando va inserito dopo il nome dell'immagine.

Come potremo notare ora abbiamo a disposizione la shell `sh` e non abbiamo più ottenuto il benvenuto da Figlet.

***

Poniamo ora di voler dare all'utente la possibilità di personalizzare il messaggio da visualizzare direttamente in fase
di avvio del container, ora come ora l'utente potrebbe farlo andando a sovrascrivere il comando in questo modo:

```shell
$ docker run figlet figlet Hello Zavy
```
```terminaloutput
 _   _      _ _         _____                 
| | | | ___| | | ___   |__  /__ ___   ___   _ 
| |_| |/ _ \ | |/ _ \    / // _` \ \ / / | | |
|  _  |  __/ | | (_) |  / /| (_| |\ V /| |_| |
|_| |_|\___|_|_|\___/  /____\__,_| \_/  \__, |
                                        |___/ 
```

Come vedete abbiamo dovuto rimettere dopo al nome dell'immagine sia il nome del programma che i suoi parametri.

Se volessimo far si che il comando `figlet` sia implicito, magari anche con il parametro per personalizzare il font da
utilizzare, possiamo utilizzare l'istruzione `ENTRYPOINT` per definire il comando di default e inserire in fase di run
solamente il messaggio che vogliamo visualizzare.

Andiamo quindi a modificare nuovamente il Dockerfile:

```shell
$ nano Dockerfile
```

Utilizzando questo volta la sintassi JSON, in primo luogo per evitare il warning, ma non solo:

```dockerfile
FROM alpine
RUN [ "apk", "add", "figlet" ]
ENTRYPOINT [ "figlet", "-f", "script" ]
```

Quando eseguiremo il container, ora verrà eseguito il comando presente nell'istruzione `ENTRYPOINT` e qualora sia
presente anche un istruzione a seguire il nome dell'immagine, essa verrà inserita all'interno del `CMD` verrà accodata
a quanto definito in `ENTRYPOINT`.

Ma perche abbiamo usato la sintassi `exec` e non la `shell` come prima?

Se avessimo utilizzato la sintassi base il comando sarebbe stato interpretato dalla shell in `sh -c "figlet -f script"` 
ed essendo racchiuso all'interno degli apici non avremmo potuto passare alcun ulteriore parametro. Utilizzando invece
la modalità JSON, il comando viene eseguito senza interpretazione permettendoci di aggiungere qualunque altro parametro.

Rifacciamo quindi la build dell'immagine:

```shell
$ docker build -t figlet .
```
```terminaloutput
[+] Building 0.0s (6/6) FINISHED                                                                                                                          docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 120B                                                                                                                                      0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s 
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/2] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => CACHED [2/2] RUN [ "apk", "add", "figlet" ]                                                                                                                           0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:1e07b8999b54f162bc5bbd2d4664793c3639c393c42d3f230677efa82aeccab2                                                                              0.0s 
 => => naming to docker.io/library/figlet

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/of4b8647bi56yf2ljn8cgyou9

What's next: View a summary of image vulnerabilities and recommendations → docker scout quickview 
```

Anche in questo caso ovviamente in fase di build non compare nulla relativo all'entry point...

Ed eseguiamo il container questa volta passando come parametro solamente il messaggio che vogliamo visualizzare:

```shell
$ docker run figlet Hello Zavy
```
```terminaloutput
 ,          _   _          __                   
/|   |     | | | |        (_ \                  
 |___|  _  | | | |  __       /  __,             
 |   |\|/  |/  |/  /  \_    /  /  |  |  |_|   | 
 |   |/|__/|__/|__/\__/    /__/\_/|_/ \/   \_/|/
                            /|               /| 
                            \|               \| 
```

E come possiamo notare dal "fantastico font" il comando inserito è stato concatenato a quanto definito nel Dockerfile.

Ora però se proviamo a eseguire il container con il nome della shell al fondo per entrare in modalità interattiva come
avevamo fatto precedentemente:

```shell
$ docker run -ti figlet sh
```

Noteremo qualcosa di strano, invece di ottenere la shell `sh` abbiamo ottenuto sh scritto da Figlet:

```terminaloutput
     _     
    | |    
 ,  | |    
/ \_|/ \   
 \/ |   |_/
```

Questo perché come dicevamo, se è presente un `ENTRYPOINT`, qualsiasi comando venga passato in fase di run verrà
inserito all'interno del `CMD` e gli verrà concatenato.

Se volessimo ottenere una shell dovremo quindi andare a sovrascrivere l'istruzione `ENTRYPOINT` con la shell:

```shell
$ docker run -ti --entrypoint sh figlet
```

In questo modo abbiamo ottenuto la shell `sh` come previsto.

***

> Resources:
> - [figlet-command](../../sources/figlet-command)
> - [figlet-entrypoint](../../sources/figlet-entrypoint)

[Prosegui](../10-copying-files/IT.md) al prossimo capitolo.
