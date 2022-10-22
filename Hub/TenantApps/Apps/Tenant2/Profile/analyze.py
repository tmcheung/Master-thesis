import time
import requests

def current_milli_time():
    return round(time.time() * 1000)

def http():
    try:
        # proxies = {
        #     'http': 'http://forward_proxy:80/local',
        #     'https': 'http://forward_proxy:443/local',
        # }

        headers = {
            'Proxy-Authorization': 'tenant-2:123456',
            'Proxy-Authenticate': 'Basic',
            'Content-Type': 'application/json',
        }
        r = requests.put(
            'http://192.168.1.156:3009/people_count',
            json={'msg': f'Sent: {current_milli_time()}'},
            # proxies=proxies,
            headers=headers,
        )
        print(r.status_code)
    except Exception as e:
        print("http results:",e)
        pass


http()
print("finish", current_milli_time())