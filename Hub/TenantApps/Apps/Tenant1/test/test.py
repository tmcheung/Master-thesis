import requests
import time

while True:
    time.sleep(10)

    proxies = {
    'http': 'http://forward_proxy:80',
    'https': 'http://forward_proxy:443',
    }
    headers = {
        'Proxy-Authorization': 'tenant-1:123456',
        'Proxy-Authenticate': 'Basic'
    }
    r = requests.get(
        'http://httpbin.org/get',
        proxies=proxies,
        headers=headers
    )