# Background Containers

```slide
Background Containers
-----------------------------------
- run non-interactive
- run in background
- list running containers
- check the logs
- stop a container
- list stopped containers
```

Nel capitolo precedente, abbiamo visto come eseguire un container in modalità interattiva.

Mentre ora vedremo come eseguirli in modalità non interattiva e in background.  
Vedremo poi come ottenere la lista di tutti i container in esecuzione e come leggerne i logs.  
Scopriremo infine come stopparli e come ottenere la lista di tutti i containers arrestati.

***

Iniziamo quindi con l'esecuzione di un piccolo [container](/sources/clock/) non interattivo. 

```shell
$ docker run zavy86/clock
```

Questo container stampa semplicemente la data e l'ora correnti ogni secondo.

```terminaloutput
Thu Aug 07 18:27:45 UTC 2025
Thu Aug 07 18:27:46 UTC 2025
Thu Aug 07 18:27:47 UTC 2025
...
```
Questo container, resterà in esecuzione per sempre, e non abbiamo nessun modo per interagire con esso, infatti se
proviamo a inserire qualunque comando, non avendo a disposizione una shell verrà ignorato.
