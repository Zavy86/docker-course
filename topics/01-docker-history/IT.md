# History of Docker and containers

![cover](https://img.youtube.com/vi/xxxxxxxxxxx/mqdefault.jpg)  
Watch on YouTube: [https://youtu.be/xxxxxxxxxxx](https://youtu.be/xxxxxxxxxxx)

> __history of Docker and containers__
>
> - why containers
> - why Docker emerges

Ciao Devs, e benvenuti in questa nuova serie di video dedicati al mondo dei containers.

In questo primo video non vedremo nella pratica come usare Docker, ma faremo una breve panoramica sulla storia dei
containers e del motivo per il quale sono diventati così importanti negli ultimi anni e cosa ci ha portato a Docker.

***

> __history of Docker and containers__
>
> - monolithic applications
> - long development cycles
> - single environment
> - slowly scaling up

L'industria dello sviluppo software è cambiata.

Inutile stare qui a raccontarcela, applicazioni monolitiche in singoli ambienti di produzione sono stati la norma per
decenni, ma oggi le cose sono cambiate. 

Non possiamo più permetterci di avere soluzioni poco scalabili e con tempi di sviluppo lunghi.

***

> __history of Docker and containers__
>
> - decoupled services
> - fast, iterative improvements
> - multiple environments
> - quickly scaling out

Al giorno d'oggi le applicazioni sono composte da tanti piccoli servizi che collaborano tra loro, e che possono essere
distribuiti in molti ambienti diversi.

Le richieste del business sono sempre più veloci, e le applicazioni devono essere sviluppate in modo iterativo.

La velocità dei rilasci e la possibilità di scalare le risorse in maniera facile e veloce sono requisiti fondamentali.

***

> __history of Docker and containers__
>
> - many different stacks
> - many different targets

Questo ha portato nel tempo a complicare notevolmente lo sviluppo e la distribuzione delle applicazioni.

Abbiamo a che fare con svariati stack tecnologici, molti più linguaggi di programmazione, frameworks e databases.

E anche le destinazioni di distribuzione sono sempre maggiori, a partire dagli ambienti di sviluppo dei singoli
developers, passando per gli ambienti di test automatizzati, a quelli di quality assurance, quelli dedicati agli user
acceptance tests, agli ambienti di staging per finire poi con quelli di produzione.

***

> __history of Docker and containers__
>
> - on premise
> - in cloud
> - hybrid

In produzione dove? In locale? In cloud? In un ambiente ibrido?

Tutte queste opzioni non fanno altro che creare una matrice infernale dalla quale è sempre difficile districarsi.

***

> __history of Docker and containers__
>
> - reduction of costs
> - reduction of losses
> - maximization of production

Se proviamo a fare un parallelo con l'industria dei trasporti, nel corso del tempo sono trovati a dover gestire una 
simile complessità.

Immaginate varie tipologie di beni da trasportare come esempio: piccoli pacchi, scatole, sacchi, barili, casse, ecc...
Tutti questi beni hanno una loro dimensione differente e un proprio modo di essere trasportati, immaginate di dover 
avere per ognuna di queste tipologia una mezzo di trasporto differenze, la cosa era difficilmente scalabile.

Così sono stati inventati i Containers, ovvero delle scatole di dimensioni sempre uguali, con gli stessi agganci e con
le stesse caratteristiche. All'interno dei quali poi ognuno può metterci qualsiasi tipologia di beni. Gestendo eventuali
imballaggi, protezioni e supporti dedicati al singolo bene internamente al container.

Questo ha permesso di massimizzare la produzione i container e di standardizzare i mezzi di trasporto riducendo i costi,
riducendo le perdite e dando vita a quella che oggi è definita la globalizzazione.

Al giorno d'oggi oltre 5000 navi trasportano oltre 200 millioni di containers ogni anno!

***

> __history of Docker and containers__
>
> - instructions
> - scripts
> - Docker

Torniamo ora all'industria del software. Nel corso del tempo, siamo passati da quando i developers rilasciavano le
applicazioni allegando dei semplici file di testo con le istruzioni per la messa in produzione.

Passando poi per l'automazione tramite scripts o tool un po' più strutturati come ansible, ecc...

Per poi arrivare a oggi dove grazie a Docker possiamo definire tutta una serie di istruzione per la costruzione di un
container ed essere sicuri che se funziona in locale, funzionerà anche in produzione.

Giungendo finalmente alla risoluzione del fatidico "It works on my machine"!

***

> __history of Docker and containers__
>
> - onboarding
> - testing
> - versioning

Ma quali sono i punti di forza di Docker dal punto di vista degli sviluppatori?

Primo fra tutti l'on-boarding di nuovi collaboratori nel team.
Preparate un file Docker utilizzando le immagini ufficiali o delle immagini personalizzate, descrivete lo stack in un
file Docker Compose e committate il tutto all'interno del repository del progetto.
In questo modo, un nuovo collaboratore, dovrà semplicemente clonare il repository, eseguire il Docker compose e sarà
pronto per iniziare a lavorare in pochissimi minuti.

Passando poi per il testing automatico.
Grazie a un Docker compose dedicato potremo facilmente eseguire tutti i test in un ambiente isolato e sicuro.
Ogni esecuzione potrebbe avvenire in un ambiente pulito e separato, senza interferire con gli altri test.
Garantendoci che non ci siano dati inquinati da test precedenti, o da esecuzioni non andate a buon fine.
E sicuramente molto più economico rispetto alla creazione di una nuova macchina virtuale per ogni test.

E come non citare la velocità di rollback in caso di problemi.
Lavorando con le immagini Docker, avremo a disposizione un ambiente completo, non avremo solamente l'eseguibile della 
nostra applicazione ma anche tutte le sue dipendenze e la sua configurazione.
Mantenendo un versioning delle immagini, potremo facilmente tornare indietro a una versione precedente in caso di 
problemi con una nuova versione, anche nel caso di aggiornamento di dipendenze o di cambi di configurazioni.

***

> __history of Docker and containers__
>
> - standardization
> - distribution
> - deployment

Ma da dove arriva Docker, e perché prima del suo avvento la containerizzazione non era mai diventata mainstream?

Prima di Docker, non esisteva praticamente nessun metodo standardizzato per la costruzione di container.
Nonostante sui sistemi linux esistessero già tutti i componenti base per la costruzione di container, come chroot, LXC, 
cgroups, eccetera, il tutto era molto complesso e difficile da gestire.

Sicuramente non paragonabile a utilizzare un semplice comando come `docker run debian`!

Tornando all'analogia precedente, i container sviluppati per le spedizioni, non sono semplici scatole di metallo, sono
scatole di metallo standardizzate, con la stessa dimensione gli stessi buchi e gli stessi agganci.

Prima dell'avvento di Docker, si distribuivano pacchetti, `.deb`, `.rpm`, `.jar`, `.exe`, con un incredibile numero di
problemi dovuti alle dipendenze e alle configurazioni.
Grazie a Docker ora distribuiamo interi sistemi preconfezionati, non solo applicazioni e servizi.
Ovviamente questo ha un impatto sul peso del pacchetto, ma grazie alla distrubuzione a layers delle immagini, che avremo
modo di vedere in seguito, ci troveremo a dover distribuire solamente le parti che cambiano, risparmiando un sacco di
risorse e tempo.

Prima di Docker, le differenze fra gli ambienti di sviluppo, test e produzione erano all'ordine del giorno. 
Ognuno aveva un proprio sistema operativo, le proprie versioni di librerie e dipendenze, e la propria configurazione.
E capitava spesso che un applicazione funzionasse perfettamente in locale, desse dei warning in fase di test e crashasse
terribilmente una volta portata in produzione.
Grazie a Docker possiamo finalmente essere certi al cento per cento che se l'applicazione funziona in locale, lo farà
anche in test e produzione. Dovremo gestire altri problemi come i puntamenti e il networking, ma potremo essere certi
il codice sviluppato e distribuito sia funzionante.
In questo modo, potremo permetterci di automatizzare molti processi di deployment riducendo i tempi e i costi.

***

> __history of Docker and containers__
>
> - IMB VM/370 (1972)
> - FreeBSD jails (1999)
> - Linux VServers (2001)
> - Solaris Container (2004)
> - VPS age (2006)
> - PaaS period (2008)
> - Docker (2013)

Per concludere questo video, ripercorriamo un attimo la storia dei containers.

Le prime sperimentazioni risalgono al 1972 con il VM/370 di IBM, nel 1999 abbiamo i FreeBSD jails, nel 2001 Linux 
implementa la tecnologia VServers e nel 2004 ci prova anche Solaris.

Dopodiché questa tecnologia sembra finire un po' nel dimenticatoio, nel 2006 entra a gamba tesa la virtualizzazione 
dell'hardware con l'avvento delle VPS, nel 2008 iniziano a nascere i primi Platform as a Service e infine nel 2013 
alla PyCon di Santa Clara viene presentato per la prima volta al pubblico Docker, ma sarà soltanto nel 2016, dopo
aver raggiunto la versione 1.0 che inizierà a diventare un standard.

In quegli anni nasceranno anche la OCI (Open Container Initiative) e la CNCF (Cloud Native Computing Foundation).

***

[Prosegui](../02-training-environment/IT.md) al prossimo capitolo.
