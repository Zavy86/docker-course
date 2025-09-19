# Copying files during the Build

> __copying files during the build__
>
> - copy
> - context
> - .dockerignore

Nei capitoli precedenti abbiamo visto come creare un'immagine personalizzata installando un pacchetto tramite il package
manager della distribuzione.

Ovviamente possiamo anche copiare dei files all'interno delle nostre immagini. Ma per poter eseguire questa operazione
dobbiamo introdurre il contesto di costruzione.

Se vi ricordate avevamo creato una directory e al suo interno avevamo creato un Dockerfile. Dopodiché quando abbiamo
eseguito il comando build abbiamo specificato il build context aggiungendo un punto `.` alla fine del comando.

Quando eseguiamo questo comando tutto il contenuto all'interno della directory indicata viene passato al builder per
la creazione dell'immagine. All'interno di questa directory deve necessariamente essere presente un Dockerfile.
Tutti i files passati al contesto di build non vengono automaticamente copiati nell'immagine, ma saranno disponibili
all'interno del Dockerfile per eseguire eventuali operazioni.

Come magari avrete già visto in Git, anche in Docker è possibile specificare un file per escludere eventuali files e
directory che non vogliamo vengano inclusi nel contesto di build.

Ma vediamolo nella pratica.

***

Partiamo con il creare una directory di lavoro e spostiamoci al suo interno:

```shell
$ mkdir hello && cd $_
```

Immaginiamo di voler creare un'immagine che ci permetta di compilare ed eseguire un semplice programma scritto in `C`.

Creiamo quindi il nostro file sorgente:

```shell
$ nano hello.c
```
```c
#include <stdio.h>

int main () {
  puts("Hello World");
  return 0;
}
```

Non è importante che conosciate il linguaggio `C`, come vedete è un semplice hello world.
Tuttavia dovete sapere che il linguaggio `C` necessita di essere compilato per poter essere eseguito.
E per farlo useremo il compilatore `gcc` all'interno del nostro Dockerfile, tranquilli non dovete installare nulla sulla
vostra macchina.

Creiamo quindi il nostro Dockerfile:

```shell
$ nano Dockerfile
```
```dockerfile
FROM alpine
RUN apk add gcc libc-dev
COPY hello.c /
RUN gcc /hello.c -o /hello
CMD /hello
```

Come avevamo fatto precedentemente, partiamo dall'immagine base `alpine` e installiamo il compilatore `gcc` e la sua
libreria di supporto.

Dopodiché ecco che entra in azione il comando `COPY` che ci permette per l'appunto di copiare il nostro file sorgente
all'interno dell'immagine. Il primo parametro sarà il nome del file da copiare e il secondo il percorso in cui copiarlo.
Come vedete non ho specificato nessun path completo, quindi il file verrà preso dalla cartella corrente, sempre rispetto
al contesto di build, quindi ci aspettiamo che il file `hello.c` sia nella stessa identica posizione del `Dockerfile`.
E verrà copiato nella root directory della nostra immagine.

Dopodiché tramite il comando `RUN` compiliamo il sorgente generando l'eseguibile `hello`, in unix come saprete non sono
obbligatorie le estensioni dei files.

E infine con `CMD`, come visto precedentemente impostiamo di eseguirlo all'avvio del container.

Proviamo quindi a effettuare la build dell'immagine:

```shell
$ docker build -t hello .
```
```terminaloutput
[+] Building 3.3s (9/9) FINISHED                                                                                                                          docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 138B                                                                                                                                      0.0s 
 => WARN: JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 5)                                           0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => CACHED [1/4] FROM docker.io/library/alpine:latest                                                                                                                     0.0s 
 => [internal] load build context                                                                                                                                         0.0s 
 => => transferring context: 107B                                                                                                                                         0.0s 
 => [2/4] RUN apk add gcc libc-dev                                                                                                                             2.8s 
 => [3/4] COPY hello.c /                                                                                                                                                  0.0s 
 => [4/4] RUN gcc /hello.c -o /hello                                                                                                                                      0.1s 
 => exporting to image                                                                                                                                                    0.3s 
 => => exporting layers                                                                                                                                                   0.3s
 => => writing image sha256:b491cabe6103759a93b4547183d7eba842b3e996aeb0b333f5179ce159b16fab                                                                              0.0s 
 => => naming to docker.io/library/hello                                                                                                                                  0.0s 
                                                                                                                                                                               
 1 warning found (use docker --debug to expand):
 - JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 5)                                                       

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/edvglpcq38tc2al7k1o1poia5

What's next: View a summary of image vulnerabilities and recommendations → docker scout quickview 
```

Ok, ignorando i soliti warning che ci suggeriscono di usare il formato JSON per quanto riguarda gli argomenti dei nostri
comandi, possiamo vedere dal log che la copia del file e la compilazione del nostro programma sono andate a buon fine.

Vediamo quindi se funziona:

```shell
$ docker run hello
```
```terminaloutput
Hello World
```

Direi proprio di si!

Ora vediamo come funziona la cache del builder in caso di files esterni.

Se proviamo a rilanciare la stessa build senza modificare nulla:


```shell
$ docker build -t hello .
```
```terminaloutput
[+] Building 0.0s (9/9) FINISHED                                                                                                                          docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 127B                                                                                                                                      0.0s 
 => WARN: JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 5)                                           0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/4] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => [internal] load build context                                                                                                                                         0.0s 
 => => transferring context: 28B                                                                                                                                          0.0s 
 => CACHED [2/4] RUN apk add gcc libc-dev                                                                                                                                 0.0s 
 => CACHED [3/4] COPY hello.c /                                                                                                                                           0.0s 
 => CACHED [4/4] RUN gcc /hello.c -o /hello                                                                                                                               0.0s 
 => exporting to image                                                                                                                                                    0.0s 
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:0917280deb4532e7960fbc4e59f0f8c7eb8c2b1a6fbb5693d03ac80b2424b92b                                                                              0.0s 
 => => naming to docker.io/library/hello                                                                                                                               0.0s 
                                                                                                                                                                               
 1 warning found (use docker --debug to expand):
 - JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 5)                                                       

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/edvglpcq38tc2al7k1o1poia5

What's next: View a summary of image vulnerabilities and recommendations → docker scout quickview 
```

Vedremo che tutte le operazioni sono state eseguite sfruttando la cache.

Se invece facciamo una piccola modifica al nostro file sorgente:

```shell
$ nano hello.c
```
```c
#include <stdio.h>

int main () {
  puts("Hello World!");
  return 0;
}
```

Ed effettuiamo nuovamente la build:

```shell
$ docker build -t hello .
```
```terminaloutput
[+] Building 0.2s (9/9) FINISHED                                                                                                                          docker:desktop-linux
 => [internal] load build definition from Dockerfile                                                                                                                      0.0s
 => => transferring dockerfile: 127B                                                                                                                                      0.0s 
 => WARN: JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 5)                                           0.0s 
 => [internal] load metadata for docker.io/library/alpine:latest                                                                                                          0.0s
 => [internal] load .dockerignore                                                                                                                                         0.0s 
 => => transferring context: 2B                                                                                                                                           0.0s 
 => [1/4] FROM docker.io/library/alpine:latest                                                                                                                            0.0s 
 => [internal] load build context                                                                                                                                         0.0s 
 => => transferring context: 106B                                                                                                                                         0.0s 
 => CACHED [2/4] RUN apk add gcc libc-dev                                                                                                                                 0.0s 
 => [3/4] COPY hello.c /                                                                                                                                                  0.0s 
 => [4/4] RUN gcc /hello.c -o /hello                                                                                                                                      0.2s 
 => exporting to image                                                                                                                                                    0.0s
 => => exporting layers                                                                                                                                                   0.0s 
 => => writing image sha256:0d0307813688cf3cd2c91522a80bb3dd109aab183833be1430646f81f9ac9c05                                                                              0.0s 
 => => naming to docker.io/library/hello                                                                                                                               0.0s 
                                                                                                                                                                               
 1 warning found (use docker --debug to expand):
 - JSONArgsRecommended: JSON arguments recommended for CMD to prevent unintended behavior related to OS signals (line 5)                                                       

View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/edvglpcq38tc2al7k1o1poia5

What's next: View a summary of image vulnerabilities and recommendations → docker scout quickview 
```

Come vediamo, abbiamo sfruttato comunque la cache per tutta la parte di installazione del compilatore, che fra l'altro
era quella più onerosa in termini di tempo, e successivamente la copia del file è stata fatta normalmente in quanto il
builder si è reso conto che il file era stato modificato, e ha anche provveduto a invalidare la cache del comando
successivo perché si è reso conto che era collegato al file modificato e ha per cui eseguito nuovamente la compilazione.

Se eseguiamo nuovamente il container:

```shell
$ docker run hello
```
```terminaloutput
Hello World
```

Vedremo il messaggio aggiornato!

Giusto per concludere il comando `COPY` ci permette di copiare sia singoli files che intere directory. Nel qual caso la
copia avviene in maniera ricorsiva. Se utilizziamo infatti nel nostro Dockerfile la sintassi:

```dockerfile
[...]
COPY . /
[...]
```

Copieremo tutti i files, le directory e le sottodirectory presenti all'interno del contesto di build a eccezione di
quanto specificato nel file `.dockerignore`.

***

> Resources:
> - [hello](../../sources/fhello) (hello world in c)

[Prosegui](../11-reduce-images-size/IT.md) al prossimo capitolo.
