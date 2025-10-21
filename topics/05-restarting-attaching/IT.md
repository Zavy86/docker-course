# Restarting and attaching to containers

> __restarting and attaching to containers__
> 
> - attach background containers
> - restart stopped containers

Nei capitoli precedenti, abbiamo visto come eseguire containers in foreground, in maniera interattiva, e in background.
Ora vedremo come poterci ricollegare a un container in background così da poter nuovamente interagire con esso e come
riavviare un container arrestato.

La distinzione fra i container in background e quelli in foreground è del tutto arbitraria. Dal punto di vista di docker
infatti tutti i containers sono uguali e non c'è nessuna differenza. Vengono eseguiti tutti allo stesso modo, sia che ci
sia o che non cia sia un client collegato in maniera interattiva.

**È sempre possibile staccarsi da un container e riattaccarcisi in un secondo momento.**

Se volete un'analogia, immaginate l'azione di attaccarsi a un container come il collegare una tastiera e un monitor a un
server fisico.

***

Se avviamo un container in modalità interattiva, come abbiamo fatto prima, con il comando:

```shell
$ docker run -it alpine
```

Possiamo in qualunque momento staccarci dal container con la sequenza di shortcut `^P` e `^Q`, miraccomando, non con la
shortcut `^C` che a sua volta invia il segnale `SIGINT` che come abbiamo visto nella maggior parte dei casi termina
l'esecuzione container.

_Piccola nota per gli utenti Windows, se utilizzate il Prompt dei Comandi o la PowerShell, le sequenza sono differenti,
un consiglio spassionato è di utilizzare o la [Shell Git Bash](https://git-scm.com/downloads/win) o il [Subsystem Linux
per Windows](https://it.wikipedia.org/wiki/Windows_Subsystem_for_Linux)._

Qualora volessimo modificare manualmente questa sequenza di shortcut, possiamo farlo con l'opzione `--detach-keys`
seguita dalla stringa contenente la sequenza di tasti desiderata, ad esempio:

```shell
$ docker run -it --detach-keys ctrl-x alpine
```

Se non mi credete possiamo verificare che sia ancora in esecuzione con:

```shell
$ docker ps -l
```
```terminaloutput
CONTAINER ID   IMAGE     COMMAND     [...]
9dde841e8f2d   alpine    "/bin/sh"   [...]
```

Questa opzione può anche essere configurata a livello globale all'Engine di Docker ma magari questo lo vedremo in un 
prossimo video dedicato al file di configurazione di Docker.

Mentre se stiamo eseguendo un container in modalità non interattiva, ad esempio proviamo a rilanciare il container:

```shell
$ docker run zavy86/clock
```

E proviamo a staccarci dal container con la shortcut `^P` e `^Q`, non otterremo alcun risultato, in quanto non essendo
collegati in maniera interattiva, non possiamo staccarci dal container in questo modo.

```terminaloutput
[...]
Thu Aug 07 21:42:18 UTC 2025
Thu Aug 07 21:42:19 UTC 2025
Thu Aug 07 21:42:20 UTC 2025
[...]
```

L'unico modo che abbiamo per scollegarci è quello di terminare il client, in questo caso il nostro terminale.

***

Per ricollegarsi a un container in background, possiamo utilizzare il `attach` seguito dall'id del container:

```shell
$ docker attach 9dd
```

Per poter utilizzare questo comando, il container deve essere ancora in esecuzione e tenete anche a mente che più client
possono collegarsi allo stesso container. E qui le cose si fanno divertenti. Se provate infatti ad aprire due terminali
e a collegarvi allo stesso container, noterete che entrambi i terminali ricevono lo stesso output e che entrambi
possono inviare comandi al container. Proprio come se avessimo collegato due tastiere e due monitor allo stesso server.

In ogni caso ricordatevi che se volete visualizzare lo stato del container, non è necessario collegarvisi in maniera
interattiva, in quel caso ci basta utilizzare il comando `logs` con l'opzione `--follow` per monitorarlo il tempo reale.

***

Se invece volessimo ricollegarci a un container che era stato arrestato, ovvero che possiamo vedere con il comando:

```shell
$ docker ps -a
```

in stato Exited, come ad esempio il nostro alpine di prima,

```terminaloutput
CONTAINER ID   IMAGE     COMMAND     [...]   STATUS                       [...]
76b621f7b82f   alpine    "/bin/sh"   [...]   Exited (130) 2 minutes ago   [...]
```

possiamo farlo con il comando `start` seguito dall'id del container:

```shell
$ docker start 76b
```

In questo modo il container verrà riavviato con le stesse e identiche impostazioni con le quali era stato creato
originariamente, e potremo poi ricollegarci ad esso con il comando `attach`:

```shell
$ docker attach 76b
```

E come potrete notare siamo nuovamente nella shell del container. Tuttavia a volte potrebbe capitare di non visualizzare
nulla quando ci colleghiamo a un container, questo succede se ad accoglierci c'è un programma che funziona in modalità
REPL (Read-Eval-Print-Loop) perche essendo il collegamento un atto che non invia comandi, il sistema potrebbe non sapere
di doverci rinviare nulla. In questi casi ci basterà inviare il comando `^L` o `Enter` per ripristinare il prompt.

Anche se nella maggior parte dei casi quando ci ricolleghiamo, Docker invia al container il segnale `SIGWINCH` che serve
per l'appunto a notificare al programma che c'è stato un cambiamento nel terminale e la maggior parte dei programmi
risponde a questo segnale, ridisegnando nuovamente lo schermo automaticamente.

***

> Resources:
> - [clock](../../sources/clock)

[Prosegui](../06-docker-images/IT.md) al prossimo capitolo.
