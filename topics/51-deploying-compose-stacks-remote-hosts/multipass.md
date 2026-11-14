# VM Multipass per il laboratorio Docker

Promemoria per preparare da zero una VM Ubuntu 26.04 e usarla dal Mac nella
[lezione 51](IT.md). Sul Mac devono essere già disponibili Multipass, Docker CLI,
Compose e SSH. Nei comandi usiamo `docker-course` come nome della VM e `lab-demo`
come nome del context Docker.

L'accesso SSH qui configurato usa una **password vuota, senza richiedere una
chiave**. È un'eccezione per una VM locale di prova isolata: chiunque riesca a
raggiungerla può entrare come `ubuntu` e, attraverso Docker, amministrarla.
Non usare questa configurazione su server pubblici o reti condivise.

## Creare la VM dal Mac

Per una nuova VM, con un nome ancora disponibile:

```bash
multipass launch 26.04 --name docker-course --cpus 2 --memory 4G --disk 20G
multipass list
multipass info docker-course
multipass shell docker-course
```

Da questo momento il terminale è dentro Ubuntu. Se la VM esiste già, basta
`multipass start docker-course` seguito da `multipass shell docker-course`.

## Installare Docker dentro Ubuntu

Questi comandi sono per una VM nuova, senza installazioni Docker precedenti.
Prepariamo la chiave del repository ufficiale:

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

Aggiungiamo il repository e installiamo Docker Engine, Buildx e Compose:

```bash
sudo tee /etc/apt/sources.list.d/docker.sources > /dev/null <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run --rm hello-world
docker compose version
```

Concediamo a `ubuntu` l'accesso a Docker senza `sudo`. Il gruppo `docker` dà
privilegi equivalenti a root nella VM:

```bash
sudo usermod -aG docker ubuntu
```

Il nuovo gruppo sarà disponibile nelle nuove sessioni; dopo la configurazione SSH
usciremo e rientreremo prima di verificarlo.

## Abilitare SSH senza password dentro Ubuntu

Nelle immagini Multipass il server SSH è normalmente già presente. Assicuriamoci
che sia installato e attivo:

```bash
sudo apt install -y openssh-server
sudo systemctl enable --now ssh
```

Creiamo un file locale che abilita le password vuote. Le direttive sono globali:
consentono l'accesso agli account con password vuota, che in questa prova
imposteremo soltanto per `ubuntu`. Il prefisso `00-` fa leggere il file prima
delle normali impostazioni di cloud-init.

```bash
sudo tee /etc/ssh/sshd_config.d/00-local-test.conf > /dev/null <<'EOF'
PasswordAuthentication yes
PermitEmptyPasswords yes
EOF
```

Controlliamo la sintassi e, solo se valida, cancelliamo la password di `ubuntu`
e ricarichiamo SSH:

```bash
sudo sshd -t && sudo passwd -d ubuntu && sudo systemctl reload ssh
```

Controlliamo le impostazioni effettive:

```bash
sudo sshd -T | grep -E '^(passwordauthentication|permitemptypasswords) '
```

Entrambe devono risultare `yes`. Le regole PAM possono comunque impedire le
password vuote: la verifica dal Mac nel passaggio successivo è necessaria.

Per vedere l'IP della VM da Ubuntu:

```bash
hostname -I
ip route get 1.1.1.1
```

Nel secondo comando l'indirizzo dopo `src` è quello dell'interfaccia usata per
uscire in rete. Usciamo per tornare al terminale del Mac:

```bash
exit
```

## Verificare SSH e Docker dal Mac

Rileggiamo l'IP assegnato alla VM:

```bash
multipass list
```

Impostiamo una variabile nel terminale del Mac. `192.168.252.4` è l'indirizzo
usato nella prova: **sostituirlo con quello attuale** se diverso.

```bash
VM_IP=192.168.252.4
ssh "ubuntu@$VM_IP" docker version
```

Al primo collegamento SSH chiede di confermare l'identità del server. Possiamo
controllare la sua impronta dalla VM con:

```bash
multipass exec docker-course -- ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

Confrontiamola con quella mostrata da SSH prima di rispondere `yes`. Se abbiamo
ricreato la VM e SSH segnala una chiave cambiata, verifichiamo prima la nuova
impronta tramite Multipass, poi rimuoviamo la vecchia registrazione e riproviamo:

```bash
ssh-keygen -R "$VM_IP"
ssh "ubuntu@$VM_IP" docker version
```

L'output di `docker version` deve contenere sia `Client` sia `Server`, senza
richiedere password e senza errori di accesso al socket Docker.

## Creare o aggiornare il context dal Mac

Se `lab-demo` non esiste ancora:

```bash
docker context create lab-demo --docker "host=ssh://ubuntu@$VM_IP"
```

Se invece esiste già, ispezioniamolo e, se è il context di questo laboratorio,
aggiorniamolo all'IP della nuova VM:

```bash
docker context inspect lab-demo
docker context update lab-demo --docker "host=ssh://ubuntu@$VM_IP"
```

Infine verifichiamo il collegamento:

```bash
docker context inspect lab-demo
docker --context lab-demo info
```

Deve comparire anche la sezione `Server` con le informazioni della VM. Possiamo
ora continuare con lo stack della [lezione 51](IT.md).

Docker documenta le chiavi come metodo supportato per i context SSH. La password
vuota è una particolarità di questo laboratorio: OpenSSH può accettare il metodo
`none` per gli account senza password quando le opzioni sopra lo consentono.
Non è una password memorizzata nel context.

## Se la connessione SSH viene interrotta

Se compare `Connection reset by peer`, la connessione viene chiusa prima
dell'autenticazione. Dal Mac proviamo a entrare con Multipass:

```bash
multipass shell docker-course
```

Dentro Ubuntu controlliamo configurazione, servizio e log:

```bash
sudo sshd -t
sudo systemctl status ssh.service ssh.socket --no-pager
sudo journalctl -u ssh.service -u ssh.socket --since '10 minutes ago' --no-pager -n 60
```

Questi controlli servono a individuare la causa; cambiare password o chiave non
risolve da solo un'interruzione che precede l'autenticazione.

## Ripristinare una password a fine prova

Dal Mac entriamo con `multipass shell docker-course`. Dentro Ubuntu impostiamo
una password non vuota e rimuoviamo l'eccezione:

```bash
sudo passwd ubuntu
sudo rm /etc/ssh/sshd_config.d/00-local-test.conf
sudo sshd -t && sudo systemctl reload ssh
exit
```

Questo disabilita la possibilità di entrare con password vuota. Per continuare
a usare il context Docker, predisporre l'accesso con chiave pubblica.

Per fermare e riavviare la VM dal Mac, conservandone i dati:

```bash
multipass stop docker-course
multipass start docker-course
```

## Riferimenti

- [Creazione di una VM Multipass](https://canonical.com/multipass/docs/latest/how-to-guides/manage-instances/create-an-instance/)
- [Docker Engine su Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Permessi Docker dopo l'installazione](https://docs.docker.com/engine/install/linux-postinstall/)
- [Configurazione OpenSSH: PermitEmptyPasswords](https://man.openbsd.org/sshd_config#PermitEmptyPasswords)
- [Metodo none in OpenSSH](https://github.com/openssh/openssh-portable/blob/master/auth2-none.c)
- [Collegamento Docker tramite SSH](https://docs.docker.com/reference/cli/dockerd/#daemon-socket-option)
