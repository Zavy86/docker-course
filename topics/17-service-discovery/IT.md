# Service discovery with containers

> __service discovery with containers__
>
> - bridge
> - null/none
> - host
> - container

Dopo aver visto brevemente nel capitolo precedente come funzionano le reti in Docker, andiamo ora a vedere i vari
driver di rete che Docker ci mette a disposizione.





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













***

[Prosegui](../17-xxx/IT.md) al prossimo capitolo.
