from time import sleep

i = 0
while True:
    print('lol' + str(i))
    i += 1
    if i > 10:
        break
    sleep(.5)

