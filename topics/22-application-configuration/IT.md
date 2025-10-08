# Application configuration

> __application configuration__
>
> - configuration size
> - optional parameters
> - mandatory parameters
> - scope of configuration
> - frequency of changes

La configurazione di un'applicazione è uno degli step fondamentali per la distribuzione di un'applicazione.

Esistono diversi modi per configurare un'applicazione containerizzata e la scelta del metodo più adatto può dipendere da
diversi fattori. Come la dimensione della configurazione, la presenza di parametri opzionali od obbligatori, l'ambito di
rilevanza della configurazione e la frequenza con cui la configurazione debba essere aggiornata.

Spesso questi fattori sono correlati tra loro e la scelta della migliore soluzione non è semplice.

In questo capitolo vedremo alcuni fra i tipi di configurazione più comuni con i loro pro e contro.

***

> __application configuration__
>
> command-line parameters
> - pros:
>   - mandatory parameters
>   - convenient for utilities
> - cons:
>   - dynamic or bigger

Uno dei metodi possibili è sfruttare i parametri della riga di comando, passandoli direttamente tramite il comando `run`
dove un entrypoint li leggerà, li processerà e configurerà l'applicazione di conseguenza prima di avviarla.

Questo approccio funziona bene con i parametri obbligatori (senza i quali il servizio non può partite).

Può essere molto utile per il lancio di utilities, li abbiamo usati spesso con il container `busybox`.

Risulta molto scomodo per configurazioni che devono cambiare in maniera dinamica o con configurazioni molto grandi.

***

> __application configuration__
>
> environment variables
> - pros:
    >   - optional parameters
>   - lots of parameters
>   - multiple services
> - cons:
    >   - dynamic

Un altro approccio potrebbe essere quello di usare le variabili d'ambiente, che sono un insieme di coppie chiave-valore
che possono essere usate per passare parametri all'applicazione.

Possono essere passate sia da linea di comando che, più facilmente, tramite il file `docker-compose.yml`.

Sono molto utili per i parametri opzionali, che possono essere omessi senza problemi, lasciando il valore predefinito.

Sono adatte a configurazioni con molti parametri, proprio perché possiamo specificare solo quelli che vogliamo.

Sono convenienti quando dobbiamo instanziare vari servizi dello stesso tipo molte volte con parametri diversi.

È comodissima la possibilità di andare a vedere i valori di default all'interno dell'immagine.

Non sono la scelta migliore per configurazioni che devono cambiare in maniera dinamica.

***

> __application configuration__
>
> baked-in configuration
> - pros:
>   - single file
>   - stored in registry
> - cons:
>   - arbitrary customization
>   - require rebuild on change

Un altro metodo potrebbe essere quelli di scrivere la configurazione direttamente all'interno dell'immagine.
Magari copiando un file di configurazione in una directory specifica all'interno dell'immagine.

Ogni immagine sarebbe così preconfigurata e pronta all'uso.

Sono facilmente personalizzabili modificando un singolo file.

L'immagine configurata può essere salvata direttamente nel registro e scaricata da qualsiasi host.

C'è il rischio che un utente possa modificare la configurazione in maniera arbitraria e non prevista aggiungendo o 
rimuovendo parametri a suo piacere.

A ogni modifica della configurazione sarà necessario ricompilare l'immagine e ricaricarla nel registro.

***

> __application configuration__
>
> configuration volume
> - pros:
>   - shared configuration
>   - dynamically updatable
> - cons:
>   - arbitrary customization

E l'ultima modalità potrebbe essere quella di usare un volume con all'interno i files di configurazione e poi i volumi
possono essere montati su tutti i container che necessitano di quella specifica configurazione.

La sua maggiore utilità è la possibilità di condividere la stessa configurazione tra più container.

Le modifiche possono essere apportate in maniera dinamica e sarà sufficiente riavviare il container qualora il servizio
non disponga di un auto-reload delle configurazioni.

E anche qui c'è il rischio che un utente possa modificare la configurazione in maniera arbitraria e non prevista
aggiungendo o rimuovendo parametri a suo piacere.

***

> __application configuration__
>
> - secrets
> - orchestrator

Un ultimo accenno sui segreti, come password, chiavi private e altre informazioni sensibili.

Salvare informazioni sensibili all'interno di immagini o file di configurazione salvati all'interno di repository non è
mai una buona idea.

I sistemi di orchestrazione come Docker Swarm o Kubernetes (ad esempio) offrono metodi specifici per la gestione dei 
segreti in maniera sicura e sarebbe sempre preferibile usare questi sistemi in ambienti di produzione.

Senza sistemi di orchestrazione gestire i segreti in maniera sicura può risultare parecchio complesso.

***

[Prosegui](../23-limiting-resources/IT.md) al prossimo capitolo.
