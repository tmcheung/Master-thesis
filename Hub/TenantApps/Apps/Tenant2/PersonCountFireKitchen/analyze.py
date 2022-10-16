import cv2
from paho.mqtt import client as mqtt_client
import config
import time
import requests


HOGCV = cv2.HOGDescriptor()
HOGCV.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

def analyze_video(frame):
    bounding_box_cordinates, weights =  HOGCV.detectMultiScale(frame, winStride=(4,4), padding = (8, 8), scale = 1.03)
    people_count = 0
    for x,y,w,h in bounding_box_cordinates:
        # cv2.rectangle(frame, (x,y), (x+w,y+h), (0,255,0), 2)
        # cv2.putText(frame, f'person {people_count}', (x,y), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,255), 1)
        people_count += 1
    
    # cv2.putText(frame, 'Status : Detecting ', (40,40), cv2.FONT_HERSHEY_DUPLEX, 0.8, (255,0,0), 2)
    # cv2.putText(frame, f'Total Persons : {people_count}', (40,70), cv2.FONT_HERSHEY_DUPLEX, 0.8, (255,0,0), 2)

    return frame,people_count

def publish_people_count_mqtt(people_count):
    try:
        topic='/smartcity/camera/people_count/usa/ohio/kitchen_x/city_ai'
        msg=people_count        
        result = config.mqtt_client.publish(topic, msg)
        print("publish result:", result)
    except Exception as e:
        print(e)
        pass

def send_people_count_http(people_count):
    try:
        proxies = {
            'http': 'http://forward_proxy:80/local',
            'https': 'http://forward_proxy:443/local',
        }
        # proxies = {
        #     'http': 'http://forward_proxy:80',
        #     'https': 'http://forward_proxy:443',
        # }

        headers = {
            'Proxy-Authorization': 'tenant-2:123456',
            'Proxy-Authenticate': 'Basic',
            'Content-Type': 'application/json',
        }
        r = requests.put(
            'http://192.168.1.156:3009/people_count',
            json={'msg': f'kitchen_x people count: {str(people_count)}'},
            proxies=proxies,
            headers=headers,
        )
        print("http response:", r.status_code)
        print("http response:", r, str(r))
    except Exception as e:
        print("http results:",e)
        pass


def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker!")
        else:
            print("Failed to connect, return code %d\n", rc)

    try:
        print("Connecting")
        client = mqtt_client.Client(client_id="123456789")
        client.username_pw_set("tenant-2", "123456")
        client.on_connect = on_connect
        client.connect("virtual-mqtt", 1883)
        config.mqtt_client = client
    except Exception as e:
        print(e)
        pass


connect_mqtt()
while True:
    time.sleep(1)
    print("requesting video feed")
    
    try:
        video = cv2.VideoCapture('rtmp://streaming-service/live/smartcity.camera.stream.usa.ohio.kitchen_x.city_surveillance?username=tenant-2&password=123456')
        count = 0
        http_count = 0
        while video.isOpened():
            count = count +1
            check, frame =  video.read()

            # //Skip Frame 
            if count%30>0:
                continue

            try:
                frame,people_count = analyze_video(frame=frame)
                if(people_count == 1):
                    people_count = 0
                print("people:", people_count)
                publish_people_count_mqtt(people_count=people_count)
                
                if http_count%30:
                    send_people_count_http(people_count=people_count)
                http_count += 1
            except:
                pass

    except Exception as e:
        print(e)
