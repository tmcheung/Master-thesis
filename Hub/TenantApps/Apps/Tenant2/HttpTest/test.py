import requests
import time

print("starting up")

while True:
    time.sleep(10)
    try:

        print("requesting")
        proxies = {
            'http': 'http://forward_proxy:80',
            'https': 'http://forward_proxy:443',
        }
        headers = {
            'Proxy-Authorization': 'tenant-2:123456',
            'Proxy-Authenticate': 'Basic'
        }
        r = requests.put(
            'http://httpbin.org/put',
            proxies=proxies,
            headers=headers
        )

        print(r.status_code)
    except Exception as e:
        print("Exception:", e)
