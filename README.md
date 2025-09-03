# Full-Stack Notification System (Angular + Node.js + RabbitMQ)

This project implements a practical full stack project:

- **Backend**: Node.js + Express + RabbitMQ producer/consumer  
- **Frontend**: Angular (zoneless) polling UI  
- **Message broker**: RabbitMQ (Docker)  
- **Tests**: Jest (backend), Karma/Jasmine (frontend)

Messages are submitted through the frontend → sent to RabbitMQ → processed asynchronously (with simulated delay & random failure) → results are polled and shown back in the UI.

---

## 1. Clone the repository

```bash
git clone <your-repo-url>
cd <your-repo-folder>
```

---

## 2. Start RabbitMQ (Docker)

Run RabbitMQ with default user/password/vhost dev:
```bash
docker run -d --name rabbitmq \
  -p 5672:5672 -p 15672:15672 \
  -e RABBITMQ_DEFAULT_USER=dev \
  -e RABBITMQ_DEFAULT_PASS=dev \
  -e RABBITMQ_DEFAULT_VHOST=dev \
  --restart=unless-stopped \
  rabbitmq:3.13-management
```

•	**Management UI:** http://localhost:15672
(user: dev, pass: dev)

•	**AMQP URL:** amqp://dev:dev@localhost:5672/dev

---

## 3. Backend setup
```bash
cd backend
npm install
```

### Environment

Create a .env file in `backend/`:

```
AMQP_URL=amqp://localhost:5672
AMQP_USER=dev
AMQP_PASS=dev
AMQP_VHOST=dev
APP_PORT=3000
YOUR_NAME=your-name
```

### Run backend
```bash
npm run dev
```

Backend logs should show:
```bash
[amqp] connecting to amqp://dev:****@localhost:5672/dev
Backend listening on :3000
```

### Endpoints:
	•	POST /api/notificar → publish message
	•	GET /api/notificacao/status/:id → poll status

---

## 4. Frontend setup
```bash
cd frontend/app
npm install
```

### Run frontend
```bash
ng serve -o
```

This will open *http://localhost:4200*.

⸻

## 5. Usage
	1.	Open the UI.
	2.	Type a message → click "Enviar Notificação".
	3.	It appears in the list with status AGUARDANDO_PROCESSAMENTO.
	4.	Within ~1–2s (processing) + up to 4s (polling), the status changes to:
	•	PROCESSADO_SUCESSO (80% chance), or
	•	FALHA_PROCESSAMENTO (20% chance).

⸻

## 6. Run tests

### Backend (Jest)
```bash
cd backend
npm test
```

### Frontend (Karma/Jasmine)
```bash
cd frontend/app
ng test
```

---

## 7. Notes
	•	Polling was used for simplicity.
	•	In-memory Map is used for status storage (ephemeral).
	•	RabbitMQ is required to be running before starting backend.
	•	Management UI helps debug queues:
	•	fila.notificacao.entrada.[YOUR_NAME]
	•	fila.notificacao.status.[YOUR_NAME]



