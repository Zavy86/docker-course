FROM alpine
RUN apk add nginx
RUN echo "invalid_directive;" > /etc/nginx/nginx.conf
CMD nginx > /dev/null 2>&1
