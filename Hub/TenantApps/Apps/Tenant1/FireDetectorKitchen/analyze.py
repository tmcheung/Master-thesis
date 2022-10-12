import cv2
from paho.mqtt import client as mqtt_client
import config
import time

HOGCV = cv2.HOGDescriptor()
HOGCV.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

def publish_fire_alert():
    try:
        topic='/smartcity/camera/fire_detected/usa/ohio/kitchen_x/city_ai'
        msg=1        
        result = config.mqtt_client.publish(topic, msg)
    except Exception as e:
        print(e)
        pass


def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker!")
        else:
            print("Failed to connect, return code %d\n", rc)

    try:
        print("Connecting")
        client = mqtt_client.Client(client_id="111111")
        client.username_pw_set("tenant-1", "123456")
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
        video = cv2.VideoCapture('rtmp://streaming-service/live/smartcity.camera.stream.usa.ohio.kitchen_x.city_surveillance?username=tenant-1&password=123456')
        while video.isOpened():
            print("video open")
            time.sleep(20)
            for i in range(100):
                try:
                    print("publishing fire alert")
                    publish_fire_alert()
                    time.sleep(10)
                except:
                    pass

    except Exception as e:
        print(e)
