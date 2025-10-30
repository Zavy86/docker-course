# Common docker settings

> __common docker settings__
>
> - storage
> - networking
> - security
> - system

Questa capitolo l'ho volutamente tenuto per la fine, nonostante ritengo sia forse una delle prime cose da fare quando si
inizia a utilizzare Docker, per non spaventare chi si approccia a questo strumento per la prima volta.

Tuttavia personalizzare la configurazione di Docker ci garantirà fin da subito di non incorrere in problemi difficili da
scoprire e risolvere per chi è alle prime armi, per cui ora che avrete capito se Docker fa per voi e averete tritato per
bene il vostro ambiente di test, proseguiamo con la configurazione del nostro ambiente di sviluppo reale.

In questo capitolo vedremo come configurare le impostazioni di storage, networking e qualche altro parametro utile.

***

Per prima cosa, per modificare le impostazioni di Docker dovremo agire sul file:

```shell
$ nano /etc/docker/daemon.json
```

Oppure qualora stessimo eseguendo Docker in modalità rootless dovremo modificare il file:

```shell
$ nano ~/.config/docker/daemon.json
```

O ancora se state utilizzando Docker Desktop, in ambiente Windows o MacOS, fate riferimento alla sezione impostazioni.

All'interno di questo file potremo andare a specificare le impostazioni che vogliamo sovrascrivere rispetto ai valori
predefiniti. Vi lascio ovviamente i riferimenti alla [documentazione ufficiale](https://docs.docker.com/engine/daemon/)
per approfondire per bene il tutto, qui vedremo solo alcuni esempi.

---

Un aspetto super importante è la gestione dei volumi, ricordatevi sempre che l'unico responsabile dei dati dei volumi 
siete voi, non ci sono infatti sistemi automatici di backup o altro e se non li tenete sotto controllo potrebbero andare
anche a saturare la memoria della vostra macchina. 

Inoltre in alcuni casi dove magari disponete di un NAS o anche solo diverse partizioni sul disco della vostra macchina, 
potreste voler decidere dove salvare i dati dei volumi, quindi il primo passo è proprio specificare:

```json
{
  "storage-driver": "overlay2",
  "data-root": "/mnt/nas/zavy86/docker"
}
```

Il driver `overlay2` è molto più performante rispetto a quelli utilizzati precedentemente e se siete su sistemi Linux
moderni dovrebbe già essere impostato così di default, ma specificarlo non fa mai male.

---

Un'altra delle cose a mio avviso più importanti sono le configurazioni relative al networking, infatti soprattutto se 
siamo in contesti aziendali con reti parecchio complesse, è facile incorrere in conflitti di indirizzi IP tra le reti 
Docker e quelle esistenti gestite dagli amministratori di rete.

Il primo parametro da tenere in considerazione è il `bip` che permette di specificare l'indirizzo IP del bridge standard
di Docker il cosiddetto `docker0`, ovvero la rete nella quale vengono distribuiti tutti i container se non diversamente
specificato tramite l'opzione `--network`.

```json
{
  "bip": "10.86.0.1/16"
}
```

In questo caso io ho scelto la rete `10.86.0.0/16` perché è una rete privata che non è utilizzata da nessun'altra parte,
solitamente più i numeri sono alti meno è probabile che siano utilizzati, in ogni caso, due parole in merito davanti
alla macchinetta del caffé con il vostro amministratore di rete saranno più che sufficienti per accordarsi!

---

Analogamente andremo poi a modificare il parametro `default-address-pools` che permette di specificare gli indirizzi IP 
che verranno assegnati alle reti bridge personalizzate che andremo a creare, manualmente o tramite Docker Compose.

```json
{
  "default-address-pools": [
    {
      "base": "10.87.0.0/16",
      "size": 24
    }
  ]
}
```

Anche in questo caso ho utilizzato la maschera `/16` che mi permette di avere a disposizione oltre 65 mila indirizzi IP
suddivisi poi in subnet da `/24`, ovvero 256 indirizzi per ogni singola rete bridge che verrà creata. Per un ambiente
di sviluppo locale ritengo che questi parametri siano più che sufficienti.

---

Potrebbe poi tornarci utile anche la configurazione manuale dei server DNS, ovvero gli indirizzi IP dei server che i
container utilizzeranno per risolvere i nomi di dominio.

```json
{
  "dns": [
    "172.16.1.254", 
    "8.8.8.8", 
    "1.1.1.1"
  ]
}
```

Anche in questo caso se abbiamo un DNS aziendale ricordiamoci di inserirlo così da poter sfruttare i nomi di dominio
personalizzati e poi specifichiamo anche eventuali altri server DNS esterni.

---

Per quanto riguarda gli ambienti di sviluppo, potremo magari voler abilitare i registry locali con protocollo HTTP.
Di default Docker non permette di utilizzare i registry che non siano serviti in HTTPS, ma come visto in un precedente
capitolo potremo magari voler utilizzare un registry base in locale, se vogliamo accedere a questi registry da altri 
client dovremo andare ad abilitarli puntualmente tramite l'opzione `--insecure-registry`.

```json
{
  "insecure-registries": [
    "registry.domain.local:5000",
    "172.16.32.64:5000",
    "localhost:5000"
  ]
}
```

---

Passiamo poi alle configurazioni relative ai logs, proprio come per i volumi anche qui dobbiamo prestare la massima
attenzione, in modo di evitare di ritrovarci con un server pieno zeppo di files di testo (spesso) inutili.

```json
{
  "data-root": "/mnt/nas/zavy86/docker",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "9m",
    "max-file": "3"
  }
}
```

In questo caso ho lasciato dei valori piuttosto classici, ovvero il driver json-file che permette di salvare i logs in
file di testo, con una rotazione al raggiungimento dei 9 megabyte per file e un massimo di 3 file storici per container.

Da notare il parametro `data-root` che è lo stesso già configurato per i volumi, infatti Docker non permette di andare
a specificare directory separate per ogni suo dato, ma usa una directory unica, se volessimo andare a modificarle in 
maniera puntuale dovremo "giocare" con i links simbolici.

---

Infine un altro parametro importante è quello relativo al restore, che se abilitato permette di riavviare il daemon di
Docker senza riavviare al contempo tutti i container, utilissimo in ambienti di produzione, crea spesso problemi invece
negli ambienti di sviluppo, dove magari ci capita di voler riavviare tutto quanto.

```json
{
  "live-restore": false
}
```

In questo modo quando andremo a riavviare il servizio di Docker oltre che a riavviare il daemon, andremo a killare e a 
riavviare anche tutti i container attualmente in esecuzione.

---

Un'ultimissima cosa che potremmo voler fare è quella di modificare massivamente la combinazione di tasti che ci permette
di staccarci dai container in esecuzione in modalità interattiva, in questo caso dovremo specificare il parametro:


```json
{
  "detach-keys": "ctrl-p,q"
}
```

---

Come vi dicevo queste sono le impostazioni che più spesso mi sono ritrovato a modificare nelle mie installazioni di
Docker, ma nonostante siano molto utili, non sono tutte le impostazioni che possono essere modificate, quindi come già
detto all'inizio fate riferimento alla documentazione ufficiale per approfondire per bene il tutto.

Una volta terminato di apportare tutte le modifiche che riteniamo necessarie, dovremo ricordarci di riavviare Docker:

```shell
$ sudo systemctl restart docker
```

***

[Prosegui](../27-container-internals/IT.md) al prossimo capitolo.
