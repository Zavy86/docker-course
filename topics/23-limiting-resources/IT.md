# Limiting resources

> __limiting resources__
>
> - memory
> - compute
> - storage
> - network

Finora abbiamo utilizzato i container come comode unità di distribuzione autonome.
Ma cosa capita quando un container cerca di usare più risorse di quelle disponibili?
Cosa succede se più container tentano di usare la stessa risorsa?
Possiamo limitare le risorse disponibili per un container?
Spoiler, si!

I container, come abbiamo già visto, sono più simili a dei processi speciali piuttosto che a delle macchine virtuali.
Un container che gira in un host, è a tutti gli effetti un processo che gira su quell'host.

Quindi quello che dovremmo chiederci è cosa succede a un processo Linux che cerca di usare troppa memoria?
Nella migliore delle ipotesi, viene usata la memoria `swap` se disponibile, altrimenti il processo viene interrotto.

Se un container quindi utilizza troppa memoria, allo stesso modo verrà sfruttata la memoria `swap` finche disponibile
dopodiché il container verrà interrotto.

***

> __limiting resources__
>
> - --memory
> - --memory-swap
> - --cpus
> - --cpu-shares

Il kernel Linux offre dei meccanismi efficaci per limitare le risorse di un container.

La limitazione dell'utilizzo della memoria è un meccanismo che fa parte del subsystem `cgroup`, che permette di limitare
la memoria per un singolo processo o per un gruppo di processi. Docker utilizza quindi questo meccanismo per limitare la
memoria utilizzata da un container.

Le opzioni che docker permette di impostare per limitare le risorse sono svariati, per quanto riguarda la memoria i due
più usati sono sicuramente `--memory` e `--memory-swap`, il primo si occupa di limitare solamente la memoria "reale" 
mentre il secondo limita il consumo totale sommato della memoria `ram` e della `swap` utilizzate dal container.

I limiti possono essere specificati in bytes oppure in unità più leggibili come `k`, `m` e `g` rispettivamente per
`kilobytes`, `megabytes` e `gigabytes` ma lo vedremo poi in dettaglio fra poco.

Le opzioni per la limitazione delle risorse di calcolo più utilizzati sono `--cpus` e `--cpu-shares`, il primo imposta 
una percentuale limite di CPU da utilizzare, mentre il secondo imposta una priorità per i processi del container.
Anche queste opzioni possono essere utilizzate insieme o separatamente.

Di default tutti i container hanno una priorità impostata a 1024 che verrà poi usata dallo schedulatore del kernel per
assegnare le risorse. Fintanto che le CPU non sono a pieno carico questo numero non ha nessun effetto. Una volta che le
CPU sono a pieno carico, ogni container riceverà cicli di CPU solamente in proporzione alla sua priorità.

In parole povere impostando `--cpu-shares 2048` farà si che questo container riceva il doppio dei cicli di CPU degli
altri container o processi con tale valore di default.

Il limite sulla percentuale di CPU invece garantisce che un container non utilizzi più di una determinata percentuale di
CPU. Il numero va espresso in base 1 e se disponiamo di più core possiamo estendere questo valore oltre il 100%.

Infine le limitazioni sull'utilizzo dello storage sono strettamente dipendenti dal driver di storage utilizzato e alcuni
non permettono proprio di limitarlo. Questo significa che potenzialmente un singolo container potrebbe utilizzare tutto
lo storage disponibile. Quindi prestate molta attenzione ai logs e ai volumi dei vostri container.

***

Vediamo ora alcuni esempi di limitazione delle risorse.

Lanciamo un container Python limitandone la memoria a 100 megabyte:

```shell
$ docker run -it --rm --memory 100m python
```

In questo modo non appena supereremo i 100 megabyte di memoria, il container inizierà a utilizzare la memoria `swap` e 
risulterà piuttosto lento.

```python
i = 0
mb = 'X'
while True:
  i += 1
  print(f'{i}')
  mb += 'X' * 1024 * 1024
```

Se invece lo lanciamo con entrambe le opzioni:

```shell
$ docker run -it --rm --memory 100m --memory-swap 150m python
```

Come prima il nostro container una volta superati i 100 megabyte di memoria inizierà a utilizzare la memoria `swap` ma
dopo aver consumato 50 megabyte di `swap` verrà terminato.

```python
i = 0
mb = 'X'
while True:
  i += 1
  print(f'{i}')
  mb += 'X' * 1024 * 1024
```

Se vogliamo limitarne l'utilizzo della CPU al 50%:

```shell
$ docker run -it --rm --cpus="0.5" python
```

Se invece disponiamo di più core possiamo addirittura superare il 100%:

```shell
$ docker run -it --rm --cpus="2" python
```

In questo caso stiamo utilizzando il 200% di CPU ovvero due interi core.

Per quanto riguarda invece lo storage come già detto dipende dal driver di storage utilizzato e non tutti lo supportano.

In ogni caso per verificare lo spazio di storaga occupato da ogni container possiamo utilizzare il comando:

```shell
$ docker ps -as
```

Che ci mostrerà una ulteriore colonna con la dimensione in uso:

```terminaloutput
XXX
```

E se vogliamo poi vedere nel dettaglio un singolo container potremmo sfruttare il comando `docker diff` come già visto
nel [capitolo 7](../07-interactive-images/IT.md).

***

[Prosegui](../24-xxx/IT.md) al prossimo capitolo.
