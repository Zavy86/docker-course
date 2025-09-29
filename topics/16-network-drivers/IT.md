# Container network drivers

> __container network drivers__
>
> - bridge
> - null/none
> - host
> - container

Dopo aver visto brevemente nel capitolo precedente come funzionano le reti in Docker, andiamo ora a vedere i vari
driver di rete che Docker ci mette a disposizione.

---

Di default, qualora non specificato diversamente, ogni container riceve un'interfaccia di rete virtuale tramite driver
`bridge` assegnata su `eth0` (in aggiunta all'interfaccia privata di loopback assegnata su `lo`).

Questa interfaccia virtuale è fornita tramite una coppia di virtual ethernet `veth` che agisce come un tunnel di rete
tra il container e l'engine di Docker.

La connessione avviene in modalità bridge e il suo nome di default è `docker0`.
Gli indirizzi di questa rete privata sono allocati in una subnet interna, di default viene utilizzata `172.17.0.0/16`.

Il traffico in uscita passa viene mascherato tramite una regola del firewall, permettendo ai pacchetti di uscire dalla
rete privata del container verso l'esterno, mentre il traffico in ingresso passa attraverso una tabella di routing.

Ogni container può poi ovviamente avere le sue personali regole di routing, firewalling, ecc...

---

Se scegliamo di utilizzare il driver di rete `null`, al container non verrà assegnata nessuna interfaccia di rete
virtuale, disporra solamente dell'interfaccia di loopback.

Il container non potra né inviare né ricevere traffico di rete.

È spesso utilizzata in contesti di test o per isolare dei container dall'ambiente host.

---

Se avviamo un container impostandolo sulla rete `host` sarà abilitato a vedere e ad accedere a tutte le interfacce di
rete del sistema host.

Potrà quindi impegnare qualsiasi indirizzo e qualsiasi porta disponibile sul sistema, nel bene e nel male.

Il traffico non verrà né filtrato né mascherato e le performance saranno quelle native dell'interfaccia di rete.

Questo scenario è spesso utilizzato per eseguire applicazioni che richiedono una bassa latenza o un elevato numero di
connessioni simultanee, come ad esempio sistemi VOIP, server di streaming, server di gaming, ecc...

---

Infine il tramite il driver `container` potremo forzare un container ad riutilizzare l'interfaccia di rete di un altro
container. Condividendo con esso la stessa interfaccia di rete, lo stesso indirizzo ip, le stesse regole di routing, di
firewalling, ecc...

In questo caso i container potranno comunicare tra di loro direttamente tramite le proprie interfacce di loopback.

***

Per gestire le reti in Docker, come per le immagini, possiamo utilizzare il gruppo di comandi raggruppati in `network`,
ad esempio con il comando:

```shell
$ docker network ls
```

Potremo vedere l'elenco delle reti attualmente disponibili:

```terminaloutput
NETWORK ID     NAME     DRIVER    SCOPE
c43104847bdb   bridge   bridge    local
ed6460e832d4   host     host      local
40ad1bedef47   none     null      local
```

Ovviamente possiamo anche creare altre reti personalizzate. In fase di creazione possiamo specificare il driver di
rete da utilizzare e assegnargli una specifica subnet.

***

> __container network drivers__
>
> - isolated
> - multiple
> - aliases

Di default le reti Docker sono isolate fra loro, ciò significa che i container su una rete non possono comunicare con
i container su un'altra rete.

Un container può anche essere collegato a più reti contemporaneamente, in tal caso riceverà un indirizzo ip diverso
per ogni rete.

Per ogni rete assegnata possiamo anche specificare uno o più alias, che potranno essere utilizzati per raggiungere il
container al posto del suo indirizzo ip. Il nome assegnato al container è sempre utilizzato come alias predefinito.

***

Creiamo ora una nuova rete personalizzata chiamata `tutorial`:

```shell
$ docker network create tutorial
```

E come possiamo vedere di default verrà utilizzato il driver `bridge`.

```shell
$ docker network ls
```
```terminaloutput
NETWORK ID     NAME       DRIVER    SCOPE
c43104847bdb   bridge     bridge    local
ed6460e832d4   host       host      local
40ad1bedef47   none       null      local
40ad1bedef47   tutorial   bridge    local
```

Lanciamo quindi un container e assegniamogli questa nuova rete:

```shell
$ docker run -d --name webserver --net tutorial nginx
```

Ora lanciamo un nuovo container sulla medesima rete:

```shell
$ docker run -it --net tutorial busybox
```

E proviamo a effettuare un ping al container di Nginx:

```shell
# ping webserver
```

Come possiamo vedere, il ping ha avuto esito positivo tramite l'alias assegnato dal nome del container.

```terminaloutput
PING webserver (172.26.0.2): 56 data bytes
64 bytes from 172.26.0.2: seq=0 ttl=64 time=0.302 ms
```

Come possiamo notare la subnet utilizzata per questa rete nel mio caso è la `172.26.0.0/16`.

Se proviamo tuttavia a pingare un container su una rete differente, ad esempio il container di Nginx che avevamo
lanciato nel capitolo precedente:

```shell
# ping 172.17.0.2
```

Non otterremo nessuna risposta.

***

[Prosegui](../17-service-discovery/IT.md) al prossimo capitolo.
