FROM alpine
RUN apk add gcc libc-dev
COPY hello.c /
RUN gcc /hello.c -o /hello
CMD /hello
