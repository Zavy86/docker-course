#include <stdio.h>
#include <time.h>
#include <unistd.h>

int main() {
    time_t rawtime;
    struct tm *info;
    while (1) {
        time(&rawtime);
        info = localtime(&rawtime);
        printf("%s",asctime(info));
        fflush(stdout);
        sleep(1);
    }    
    return 0;
}
