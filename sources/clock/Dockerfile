FROM ubuntu:noble
LABEL maintainer="Manuel Zavatta <manuel.zavatta@gmail.com>"
# @todo scrivere la descrizione completa (aggiornare anche su docker-hub)
LABEL description="Image for my Docker course"
RUN apt-get update
RUN apt-get install -y build-essential libbsd-dev
WORKDIR /root
COPY clock.c .
RUN gcc clock.c -o clock -lbsd
CMD [ "./clock" ]
