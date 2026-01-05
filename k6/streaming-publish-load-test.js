import http from 'k6/http';
import { sleep } from 'k6';

export default function () {
  const payload = JSON.stringify({
    data: `test-data-${Date.now()}-${Math.random()}`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  http.post(`http://localhost:3000/streaming/publish`, payload, params);

  sleep(0.1); // 100ms 待機
}
