from random import random
from paho.mqtt import client as mqtt_client
import config
import time
import random


def publish_fire_alert(message):
    try:
        topic='/smartcity/camera/fire_detected/usa/ohio/kitchen_x/city_ai'
        msg= message
        result = config.mqtt_client.publish(topic, msg)
    except Exception as e:
        print("publish error:",e)
        pass


def connect_mqtt():
    def on_connect(client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT Broker!")

        else:
            print("Failed to connect, return code %d\n", rc)

    try:
        print("Connecting")
        client = mqtt_client.Client(client_id="111111999")
        client.username_pw_set("tenant-1", "123456")
        client.on_connect = on_connect
        client.connect("virtual-mqtt", 1883)
        config.mqtt_client = client
    except Exception as e:
        print("connection error:",e)
        pass



def current_milli_time():
    return round(time.time() * 1000)


connect_mqtt()
time.sleep(5)
number = random.randint(0,1000)
print("ts:", current_milli_time(), "number:", number)
publish_fire_alert(number)