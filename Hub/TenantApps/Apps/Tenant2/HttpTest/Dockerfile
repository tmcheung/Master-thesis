FROM python:3.8
ADD requirements.txt /requirements.txt
RUN apt update && apt install ffmpeg libsm6 libxext6  -y
RUN pip3 install -r /requirements.txt
COPY . .
CMD [ "python", "-u", "test.py" ]
