# Scalability and Production Architecture

## Overview

The current project is a working prototype. It is not intended to actually operate 80,000 cameras.

The production architecture is designed so that the same core components can evolve into a large distributed platform through:

- Central, regional and edge processing
- Horizontal scaling and load balancing
- Video bandwidth optimization
- Database indexing and scaling
- Caching and message queues
- GPU/accelerator-based AI processing
- Hot, warm and cold storage
- Monitoring, logging and health checks
- High availability and disaster recovery
- Cybersecurity and network segmentation

The goal is to scale the architecture without making the central application responsible for processing every raw video stream.

---

# 1. Central, Regional and Edge Processing

Instead of sending all camera video directly to one central server, processing is distributed across three layers.

```text
                    +-------------------------+
                    |      CENTRAL CLOUD      |
                    |                         |
                    | API / Dashboard         |
                    | Global Watchlist        |
                    | Analytics / Reporting   |
                    | Central Database        |
                    +------------+------------+
                                 |
              +------------------+------------------+
              |                  |                  |
       +------v------+     +-----v-------+    +-----v-------+
       |  REGION A   |     |  REGION B   |    |  REGION C   |
       |             |     |             |    |             |
       | Stream      |     | Stream      |    | Stream      |
       | Relay       |     | Relay       |    | Relay       |
       | AI Workers  |     | AI Workers  |    | AI Workers  |
       | Event Queue |     | Event Queue |    | Event Queue |
       +------+------+     +------+------+    +------+------+
              |                   |                  |
           Cameras             Cameras            Cameras
```

### Edge Layer

The edge layer is located close to cameras.

Responsibilities:

- Basic video preprocessing
- Motion filtering
- Lightweight AI inference
- Local buffering
- Sending metadata instead of unnecessary raw video
- Continuing limited operation during temporary network failures

Example:

```text
Camera
   |
   v
Edge Device
   |
   +----> Local AI inference
   |
   +----> Detection metadata
             |
             v
        Regional Server
```

### Regional Layer

Regional infrastructure handles cameras within a geographic area.

Responsibilities:

- Stream relay
- Video transcoding
- GPU-based AI inference
- Event processing
- Local buffering
- Regional health monitoring

### Central Layer

The central cloud provides global services.

Responsibilities:

- Operator dashboard
- Global watchlist
- User management
- Cross-region entity searches
- Global reporting
- Central event storage
- System configuration

---

# 2. Horizontal Scaling and Load Balancing

The API should remain as stateless as possible.

Instead of running one API server:

```text
80,000 Cameras
       |
       v
   API Server
```

the production architecture uses multiple instances:

```text
                  Load Balancer
                       |
          +------------+------------+
          |            |            |
          v            v            v
       API #1       API #2       API #3
          |            |            |
          +------------+------------+
                       |
                Shared Services
```

When traffic increases, more API instances can be added.

### Scaling stages

| Deployment | API | Processing |
|---|---:|---|
| Prototype | 1-2 instances | Local |
| Small deployment | 3-5 instances | Regional workers |
| Large deployment | Auto-scaled cluster | Distributed workers |
| 80K-camera target | Multiple regional clusters | Edge + regional GPU workers |

Load balancing distributes HTTP and API traffic between healthy instances.

For WebSocket connections, a shared messaging layer such as Redis or Kafka can distribute events across multiple application instances.

---

# 3. Video Bandwidth and Low-Bandwidth Strategies

Video is expected to be one of the largest infrastructure costs.

Sending every camera's full-resolution video continuously to the central cloud would create unnecessary network and storage requirements.

The architecture therefore prioritizes processing close to the camera.

```text
Camera
   |
   v
Edge / Regional Gateway
   |
   +----> AI Processing
   |
   +----> Event Metadata ----> Central Cloud
   |
   +----> Video only when required
```

### Bandwidth optimization techniques

- H.264/H.265 compression
- Adaptive bitrate streaming
- Lower-resolution dashboard previews
- FPS reduction where full FPS is unnecessary
- Motion-based processing
- Edge inference
- Event-triggered video upload
- Regional video caching
- Metadata-first event transmission
- On-demand high-resolution playback

For example, the dashboard can use a low-resolution stream for normal monitoring while an operator can request a higher-resolution recording when investigating an alert.

---

# 4. Database Indexing and Scaling

The prototype database can be replaced with a highly available PostgreSQL or MySQL-compatible deployment.

Important indexes should exist on frequently queried fields.

### Camera

- `camera_id`
- `status`
- `department`
- `zone`

### Detection

- `camera_id`
- `entity_id`
- `detected_at`
- `event_type`

### Alert

- `status`
- `severity`
- `camera_id`
- `created_at`

### Event

- `camera_id`
- `entity_id`
- `occurred_at`
- `event_type`

Typical queries should be optimized around:

```text
camera_id + timestamp
entity_id + timestamp
status
severity
region
```

### Large-scale database architecture

```text
                  Application
                       |
                 DB Proxy
                       |
             +---------+---------+
             |                   |
             v                   v
       Primary Database     Read Replicas
             |
             v
         Replication
```

For high event volumes, event tables can be partitioned by time and/or region.

Example:

```text
events_2026_09
events_2026_10
events_2026_11
```

Older partitions can be moved to cheaper storage.

---

# 5. Caching and Message Queues

A message queue prevents the API from becoming a bottleneck.

Instead of processing every operation synchronously:

```text
Camera
   |
   v
API
   |
   v
AI
   |
   v
Database
   |
   v
Alert
```

the production system can use asynchronous processing:

```text
Camera
   |
   v
Ingestion API
   |
   v
Message Queue
   |
   +----> AI Worker
   |
   +----> Watchlist Worker
   |
   +----> Database Worker
   |
   +----> Notification Worker
```

Possible technologies:

- Redis Streams / Pub/Sub
- RabbitMQ
- Apache Kafka

For the prototype, Redis is sufficient.

For very high event throughput, Kafka can provide durable distributed event streaming.

### Redis caching

Redis can cache:

- Camera status
- Dashboard statistics
- Active alerts
- Frequently searched entities
- Short-lived stream information
- Session-related data where appropriate

This reduces repeated database queries.

---

# 6. GPU and Accelerator Requirements

AI inference is one of the main areas where GPU resources become important.

The API layer should be separated from AI inference workers.

```text
                API / Event Ingestion
                         |
                         v
                  Inference Queue
                         |
             +-----------+-----------+
             |           |           |
             v           v           v
          GPU #1      GPU #2      GPU #N
          Worker      Worker      Worker
```

The required GPU capacity depends on:

- Camera resolution
- Frames per second
- Number of AI models
- Detection frequency
- Number of objects per frame
- Required detection latency
- Amount of edge processing

Not every camera needs continuous centralized GPU inference.

Edge processing can reduce central GPU requirements by sending only inference results.

Example event:

```json
{
  "camera_id": "CAM-001",
  "vehicle_number": "GJ01XX0001",
  "confidence": 0.96,
  "timestamp": "2026-09-28T10:02:00Z"
}
```

---

# 7. Hot, Warm and Cold Storage

Video should not remain on expensive high-performance storage forever.

A tiered storage strategy can be used.

```text
                    Video Data
                        |
          +-------------+-------------+
          |             |             |
          v             v             v
         HOT          WARM          COLD
       Recent        History       Archive
       Fast          Cheaper       Cheapest
```

### Hot Storage

Example retention:

```text
0-7 days
```

Used for:

- Active investigations
- Recent alerts
- Frequently accessed recordings

### Warm Storage

Example retention:

```text
7-30/90 days
```

Used for:

- Historical investigations
- Less frequently accessed recordings

### Cold Storage

Example:

```text
90+ days
```

Used for:

- Long-term archival
- Compliance requirements
- Historical investigations

Retention should be configurable based on camera, region, event severity and applicable policies.

---

# 8. Monitoring, Logging and Health Checks

At large scale, observability is critical.

## Camera Monitoring

Monitor:

- Online/offline state
- Last heartbeat
- Stream availability
- FPS
- Latency
- Packet loss
- Storage availability

## Application Monitoring

Monitor:

- API latency
- HTTP error rate
- Queue depth
- Worker utilization
- Database connections
- WebSocket connections

## Infrastructure Monitoring

Monitor:

- CPU
- Memory
- GPU utilization
- Disk usage
- Network bandwidth

Example architecture:

```text
Camera
   |
   | Heartbeat
   v
Health Service
   |
   +----> Camera Status
   |
   +----> Metrics
   |
   +----> Alerting
   |
   +----> Dashboard
```

Potential observability stack:

- Prometheus
- Grafana
- OpenTelemetry
- ELK/OpenSearch
- Cloud-native monitoring services

---

# 9. High Availability and Disaster Recovery

Production infrastructure should avoid single points of failure.

## API High Availability

```text
                 Load Balancer
                      |
             +--------+--------+
             |        |        |
             v        v        v
            API      API      API
```

If one API instance fails, traffic can be routed to another instance.

## Database High Availability

Use:

- Primary database
- Standby replica
- Read replicas
- Automated backups
- Point-in-time recovery

## Regional Failure

If a regional processing cluster becomes unavailable, cameras should be able to reconnect to another available gateway where network topology allows.

## Disaster Recovery

Important data should have:

- Automated backups
- Cross-region replication where required
- Point-in-time recovery
- Defined RPO
- Defined RTO

Example recovery priorities:

| Data | Priority |
|---|---|
| Active alerts | Very High |
| Watchlist | Very High |
| Detection metadata | High |
| Historical video | Medium |
| Temporary stream cache | Low |

---

# 10. Cybersecurity and Network Segmentation

Camera networks should not be directly exposed to the public internet.

A production network can be segmented like this:

```text
                    Internet
                       |
                  WAF / Firewall
                       |
                 Load Balancer
                       |
                   API Network
                       |
        +--------------+--------------+
        |              |              |
        v              v              v
     Database       Message         AI/GPU
      Network        Queue          Network
                       |
                       v
                 Camera Network
```

### Security controls

- HTTPS/TLS
- Authentication
- Role-based access control
- API rate limiting
- Firewall rules
- Private camera networks
- VPN/private connectivity
- Secrets management
- Encryption at rest
- Encryption in transit
- Audit logging
- Input validation
- Network segmentation
- Environment-based configuration
- No API keys or secrets committed to Git

Camera credentials and stream URLs should be stored securely and should never be exposed to the frontend unnecessarily.

---

# 11. Estimated Infrastructure and Operational Costs

Exact production costs depend heavily on:

- Camera resolution
- Video bitrate
- FPS
- AI inference frequency
- Edge vs cloud processing
- Video retention period
- Geographic distribution
- Cloud provider
- Network/data-transfer pricing

Therefore, cost estimates should be treated as planning estimates rather than fixed production pricing.

### Main cost drivers

1. Video bandwidth
2. GPU inference
3. Video storage
4. Regional compute
5. Database infrastructure
6. Network/data transfer
7. Monitoring and operational tooling

### Scaling model

| Component | Prototype | Large Deployment |
|---|---|---|
| API | 1-2 instances | Auto-scaled cluster |
| Database | Single database | HA primary + replicas |
| Redis | Single instance | Redis cluster |
| Message Queue | Redis/RabbitMQ | Kafka cluster |
| AI | Local/CPU/GPU | Regional GPU pools |
| Video | Single node | Regional media clusters |
| Storage | Local/object storage | Hot + warm + cold |
| Monitoring | Basic logs | Centralized observability |
| Networking | Low traffic | Regional/private networking |

The most important cost optimization is to avoid sending and centrally processing every raw video frame.

---

# 12. Prototype to Production Evolution

The current prototype can evolve incrementally.

## Stage 1 — Current Prototype

```text
Cameras
   |
   v
Django REST API
   |
   v
Database
   |
   v
React Dashboard
```

This stage demonstrates the core application workflow.

## Stage 2 — Small Production Deployment

```text
Cameras
   |
   v
Regional Gateway
   |
   v
Load Balancer
   |
   +----> API Server
   +----> API Server
   +----> API Server
            |
            +----> PostgreSQL
            +----> Redis
```

## Stage 3 — Distributed Production

```text
Cameras
   |
   v
Edge Processing
   |
   v
Regional Processing
   |
   v
Kafka / Message Bus
   |
   +----> AI Workers
   +----> Event Workers
   +----> Alert Workers
   |
   v
Central Services
   |
   +----> PostgreSQL
   +----> Redis
   +----> Object Storage
   +----> Watchlist
   +----> Dashboard
```

## Stage 4 — Large-Scale Architecture

```text
                         CENTRAL CLOUD
                              |
                +-------------+-------------+
                |             |             |
                v             v             v
             API/API      Global DB      Watchlist
                |
        +-------+-------+-------+
        |               |       |
        v               v       v
     REGION 1        REGION 2  REGION N
        |               |       |
     GPU Pool         GPU Pool  GPU Pool
        |               |       |
     Kafka            Kafka     Kafka
        |               |       |
     Edge Nodes       Edge Nodes
        |               |       |
     Cameras          Cameras
```

The important principle is that scaling is achieved by adding more regional processing capacity, API instances, queue consumers, database capacity and storage tiers instead of putting all 80,000 cameras onto a single server.

---

# 13. Final Architecture Principle

The prototype demonstrates the core end-to-end workflow:

```text
Camera
  ↓
Camera Registry
  ↓
Video Source
  ↓
Detection Event
  ↓
Event Validation
  ↓
Watchlist Matching
  ↓
Alert Generation
  ↓
Real-Time Dashboard
  ↓
Entity Search / History
```

At production scale, these same responsibilities are distributed across edge, regional and central infrastructure.

This approach allows the system to scale horizontally while controlling video bandwidth, GPU usage, database load and storage costs.
