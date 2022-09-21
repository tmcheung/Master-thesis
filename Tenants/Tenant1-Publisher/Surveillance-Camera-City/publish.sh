docker run --network="edgehub_public" -it --rm -v "$(pwd)":/src linuxserver/ffmpeg \
    -re -i src/city_video.mp4 -vcodec copy -loop -1 -c:a aac -b:a 160k -ar 44100 -strict -2 \
    -f flv "rtmp://streaming-service/live/smartcity.camera.stream.usa.ohio.store_x.city_surveillance?username=tenant-1&password=123456"
#https://www.youtube.com/watch?v=fK3q7-J8LTw