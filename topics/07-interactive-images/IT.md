# Building images interactively

> __building images interactively__
>
> - our first image
> - install new package
> - commit, tag, diff 

In questo capitolo vedremo come creare la nostra prima immagine docker in modalità interattiva.
Partiremo da un'immagine base per eseguire il nostro container, procederemo poi con l'installazione di un pacchetto, nel
caso specifico il solito Figlet già visto in precedenza, e infine salveremo il tutto in una nuova immagine docker.

Per eseguire queste operazioni avremo così modo di vedere il funzionamento dei comandi commit, tag e diff di Docker.

***

Cominciamo quindi come fatto già nei video precedenti eseguendo un container in modalità interattiva:

```shell
$ docker run -it alpine
```

Una volta avviato Alpine, procediamo nuovamente con l'installazione di Figlet:

```shell
$ apk add figlet
```
```terminaloutput
fetch https://dl-cdn.alpinelinux.org/alpine/v3.22/main/aarch64/APKINDEX.tar.gz
fetch https://dl-cdn.alpinelinux.org/alpine/v3.22/community/aarch64/APKINDEX.tar.gz
(1/1) Installing figlet (2.2.5-r3)
Executing busybox-1.37.0-r18.trigger
OK: 8 MiB in 17 packages
```

E accertiamoci che tutto sia andato a buon fine lanciando il comando:

```shell
$ figlet "Hello"
```
```terminaloutput
 _   _      _ _       
| | | | ___| | | ___  
| |_| |/ _ \ | |/ _ \ 
|  _  |  __/ | | (_) |
|_| |_|\___|_|_|\___/ 
```

A questo punto usciamo dal container digitando `exit` e utilizziamo il comando `docker diff` per vedere le differenze
tra il container appena terminato e l'immagine di partenza:

```shell
$ docker ps -al
$ docker diff 87b
```
```terminaloutput
C /etc
C /etc/apk
C /etc/apk/world
C /root
A /root/.ash_history
C /lib
C /lib/apk
C /lib/apk/db
C /lib/apk/db/installed
C /lib/apk/db/scripts.tar
C /lib/apk/db/triggers
C /usr
C /usr/share
A /usr/share/figlet
A /usr/share/figlet/fonts
A /usr/share/figlet/fonts/ivrit.flf
A /usr/share/figlet/fonts/smshadow.flf
A /usr/share/figlet/fonts/646-dk.flc
A /usr/share/figlet/fonts/ushebrew.flc
A /usr/share/figlet/fonts/646-cn.flc
A /usr/share/figlet/fonts/646-es.flc
A /usr/share/figlet/fonts/frango.flc
A /usr/share/figlet/fonts/jis0201.flc
A /usr/share/figlet/fonts/646-kr.flc
A /usr/share/figlet/fonts/646-no.flc
A /usr/share/figlet/fonts/koi8r.flc
A /usr/share/figlet/fonts/small.flf
A /usr/share/figlet/fonts/8859-2.flc
A /usr/share/figlet/fonts/8859-5.flc
A /usr/share/figlet/fonts/8859-9.flc
A /usr/share/figlet/fonts/bubble.flf
A /usr/share/figlet/fonts/8859-8.flc
A /usr/share/figlet/fonts/646-yu.flc
A /usr/share/figlet/fonts/646-ca.flc
A /usr/share/figlet/fonts/646-ca2.flc
A /usr/share/figlet/fonts/shadow.flf
A /usr/share/figlet/fonts/smslant.flf
A /usr/share/figlet/fonts/646-jp.flc
A /usr/share/figlet/fonts/646-es2.flc
A /usr/share/figlet/fonts/big.flf
A /usr/share/figlet/fonts/block.flf
A /usr/share/figlet/fonts/hz.flc
A /usr/share/figlet/fonts/646-pt.flc
A /usr/share/figlet/fonts/646-se.flc
A /usr/share/figlet/fonts/8859-3.flc
A /usr/share/figlet/fonts/ilhebrew.flc
A /usr/share/figlet/fonts/646-se2.flc
A /usr/share/figlet/fonts/8859-4.flc
A /usr/share/figlet/fonts/646-cu.flc
A /usr/share/figlet/fonts/lean.flf
A /usr/share/figlet/fonts/mnemonic.flf
A /usr/share/figlet/fonts/digital.flf
A /usr/share/figlet/fonts/script.flf
A /usr/share/figlet/fonts/646-gb.flc
A /usr/share/figlet/fonts/646-irv.flc
A /usr/share/figlet/fonts/646-de.flc
A /usr/share/figlet/fonts/646-fr.flc
A /usr/share/figlet/fonts/slant.flf
A /usr/share/figlet/fonts/standard.flf
A /usr/share/figlet/fonts/banner.flf
A /usr/share/figlet/fonts/upper.flc
A /usr/share/figlet/fonts/utf8.flc
A /usr/share/figlet/fonts/646-it.flc
A /usr/share/figlet/fonts/646-no2.flc
A /usr/share/figlet/fonts/646-pt2.flc
A /usr/share/figlet/fonts/smscript.flf
A /usr/share/figlet/fonts/8859-7.flc
A /usr/share/figlet/fonts/mini.flf
A /usr/share/figlet/fonts/moscow.flc
A /usr/share/figlet/fonts/term.flf
A /usr/share/figlet/fonts/uskata.flc
A /usr/share/figlet/fonts/646-hu.flc
C /usr/bin
A /usr/bin/chkfont
A /usr/bin/figlet
A /usr/bin/showfigfonts
A /usr/bin/figlist
C /var
C /var/cache
C /var/cache/apk
A /var/cache/apk/APKINDEX.3ec923cb.tar.gz
A /var/cache/apk/APKINDEX.96d0d294.tar.g
```

Docker traccia le modifiche apportate al filesystem del container rispetto all'immagine di partenza un po' come fa Git.
Essendo l'immagine di partenza read-only, tutte le modifiche vengono salvate in un layer superiore, i file che vengono
aggiunti sono contrassegnati con la lettera `A` (Added), quelli modificati con la `C` (Changed) e quelli rimossi con la
`D` (Deleted). Quando un file viene modificato, Docker in realtà non sovrascrive il file originale ma ne crea una copia
nel layer superiore e apporta le modifiche a questa copia, garantendo così l'integrità dell'immagine di partenza e una
performance di avvio notevole.

Grazie al comando `docker diff` possiamo quindi vedere quali file sono stati aggiunti, modificati o rimossi.

Ora che sappiamo quali modifiche sono state apportate, possiamo salvare il tutto in una nuova immagine con il comando:

```shell
$ docker commit 87b
```

L'output di questo comando ci restituirà l'ID della nuova immagine appena creata:

```terminaloutput
sha256:d04de44212d57d10f5300cab64e1116ac4ba4a151cdb3e22e997813317906288
```

Se vogliamo fare una prova possiamo infatti avviare un nuovo container basato su questa immagine:

```shell
$ docker run -it d04
$ figlet "Hello Again!"
```

E come potremo vedere Figlet è presente e perfettamente funzionante fin dal primo avvio:

```terminaloutput
 _   _      _ _            _               _       _ 
| | | | ___| | | ___      / \   __ _  __ _(_)_ __ | |
| |_| |/ _ \ | |/ _ \    / _ \ / _` |/ _` | | '_ \| |
|  _  |  __/ | | (_) |  / ___ \ (_| | (_| | | | | |_|
|_| |_|\___|_|_|\___/  /_/   \_\__, |\__,_|_|_| |_(_)
                               |___/                 
```

Ora converrete con me che utilizzare l'ID dell'immagine per avviare un container non sia proprio il massimo della vita.
Per rendere le cose più semplici possiamo infatti assegnare un nome alla nostra immagine o per meglio dire un `tag`.

Per farlo abbiamo due possibilià, direttamente in fase di commit aggiungendo alla fine il nome che vogliamo dare al tag
oppure con l'apposito comando tag avendo però l'accortezza di specificare l'ID dell'immagine e non quello del container.

```shell
$ docker commit 87b alpine-figlet
$ docker tag d04 alpine-figlet
```

In questo modo per avviare la nostra speciale versione di Alpine con Figlet ci basterà digitare:

```shell
$ docker run -it alpine-figlet
$ figlet Hello Tag!
```

E come possiamo vedere il tutto funziona come previsto:

```terminaloutput
 _   _      _ _         _____           _ 
| | | | ___| | | ___   |_   _|_ _  __ _| |
| |_| |/ _ \ | |/ _ \    | |/ _` |/ _` | |
|  _  |  __/ | | (_) |   | | (_| | (_| |_|
|_| |_|\___|_|_|\___/    |_|\__,_|\__, (_)
                                  |___/   
```

Ok, ma come non smetteremo mai di dire, fare le cose a mano è sempre una pessima idea.

Nel nostro lavoro dobbiamo imparare ad automatizzare il più possibile, ogni processo che deve essere ripetuto più volte
va automatizzato, e questo vale anche per la creazione delle immagini Docker.

Quindi la creazione delle immagini in modalità interattiva va bene per fare qualche prova e per capire un pochino come
funziona Docker dietro alle quinte, ma non è certo il modo in cui andremo a creare le immagini per i nostri progetti.

***

[Prosegui](../08-dockerfile/IT.md) al prossimo capitolo.
