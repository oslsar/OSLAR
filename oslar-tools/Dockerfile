FROM python:3.12-slim
WORKDIR /work
RUN pip install --no-cache-dir lxml psycopg2-binary
COPY . .
CMD ["tail", "-f", "/dev/null"]
